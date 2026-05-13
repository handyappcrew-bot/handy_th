import os
import httpx
import uuid
import logging
import jwt
import time
import json
from jwt.algorithms import RSAAlgorithm
from fastapi import APIRouter, Depends, Cookie, HTTPException, Response, Form, Request
from pydantic import BaseModel
from fastapi.responses import RedirectResponse, JSONResponse
from sqlalchemy.orm import Session
from pathlib import Path
from dotenv import load_dotenv
from datetime import datetime
from zoneinfo import ZoneInfo

from models import Member, SocialAccount, JwtTokens, StoreMembers, Store, Withdrawal, BusinessRequest, MemberRequest
from database import get_db
from utils.auth_utils import (
    normalize_phone, normalize_birth, convert_gender,
    password_encode, password_decode,
    generate_code, save_code, send_code_to_user, verify_code, check_daily_limit,
    add_token_for_cookie, encode_temp_signup_token, decode_temp_signup_token,
    verify_token, create_access_token,
    save_oauth_state, consume_oauth_state,
)
from schemas.auth import ValidLogin, Signup, PhoneReq, VerifyReq, WithdrawalReq

logger = logging.getLogger(__name__)

ENV_PATH = Path(__file__).resolve().parent.parent.parent / ".env"
load_dotenv(ENV_PATH)

KAKAO_CLIENT_ID = os.getenv("KAKAO_CLIENT_ID")
KAKAO_CLIENT_SECRET = os.getenv("KAKAO_CLIENT_SECRET")
KAKAO_REDIRECT_URI = os.getenv("KAKAO_REDIRECT_URI")

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI")

APPLE_CLIENT_ID = os.getenv("APPLE_CLIENT_ID")
APPLE_TEAM_ID = os.getenv("APPLE_TEAM_ID")
APPLE_KEY_ID = os.getenv("APPLE_KEY_ID")
APPLE_PRIVATE_KEY = os.getenv("APPLE_PRIVATE_KEY")
APPLE_REDIRECT_URI = os.getenv("APPLE_REDIRECT_URI")

FRONTEND_URL = os.getenv("VITE_API_URL")

router = APIRouter(prefix="/api/auth", tags=["인증"])


def get_current_member_with_refresh(
    request: Request,
    response: Response,
    access_token: str = Cookie(None),
    refresh_token: str = Cookie(None),
    db: Session = Depends(get_db),
):
    is_prod = os.getenv("ENV") == "production"

    if access_token:
        member_id, error = verify_token(access_token, "access")
        if not error and member_id:
            member = db.query(Member).filter(Member.id == member_id).first()
            if member:
                return member

    if not refresh_token:
        raise HTTPException(status_code=401, detail="로그인이 필요합니다.")

    member_id, error = verify_token(refresh_token, "refresh")
    if error or not member_id:
        raise HTTPException(status_code=401, detail="세션이 만료됐습니다. 다시 로그인해주세요.")

    stored = db.query(JwtTokens).filter(
        JwtTokens.member_id == member_id,
        JwtTokens.refresh_token == refresh_token,
        JwtTokens.is_revoked == False,
        JwtTokens.expires_at > datetime.now(ZoneInfo("Asia/Seoul")),
    ).first()
    if not stored:
        raise HTTPException(status_code=401, detail="세션이 만료됐습니다. 다시 로그인해주세요.")

    new_access = create_access_token(member_id)
    response.set_cookie(
        key="access_token", value=new_access,
        httponly=True, secure=is_prod,
        samesite="none" if is_prod else "lax",
    )

    member = db.query(Member).filter(Member.id == member_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다.")
    return member


# ===== 내 정보 =====
@router.get("/me")
def get_me(access_token: str = Cookie(None), db: Session = Depends(get_db)):
    if not access_token:
        raise HTTPException(status_code=401, detail="로그인이 필요합니다.")

    member_id, error = verify_token(access_token, "access")
    if error == "expired":
        raise HTTPException(status_code=401, detail="토큰이 만료됐습니다.")
    if error or not member_id:
        raise HTTPException(status_code=401, detail="유효하지 않은 토큰입니다.")

    member = db.query(Member).filter(Member.id == member_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다.")

    return {
        "id": member.id,
        "name": member.name,
        "phone": member.phone,
        "birth": str(member.birth) if member.birth else None,
        "gender": member.gender,
        "image_url": member.image_url,
    }


@router.get("/my/stores")
def get_my_stores(
    current_member: Member = Depends(get_current_member_with_refresh),
    db: Session = Depends(get_db),
):
    memberships = (
        db.query(StoreMembers, Store)
        .join(Store, StoreMembers.store_id == Store.id)
        .filter(
            StoreMembers.member_id == current_member.id,
            StoreMembers.is_deleted == False,
            Store.is_deleted == False,
        )
        .all()
    )
    return [
        {
            "store_member_id": sm.id,
            "store_id": store.id,
            "store_name": store.name,
            "role": sm.role,
            "employee_type": sm.contract.employee_type if sm.contract else None,
        }
        for sm, store in memberships
    ]


# ===== 온보딩 상태 조회 =====
@router.get("/onboarding/status")
def get_onboarding_status(
    current_member: Member = Depends(get_current_member_with_refresh),
    db: Session = Depends(get_db),
):
    stores = db.query(StoreMembers).filter(
        StoreMembers.member_id == current_member.id,
        StoreMembers.is_deleted == False,
    ).first()
    if stores:
        return {"status": "ready"}

    biz = db.query(BusinessRequest).filter(
        BusinessRequest.member_id == current_member.id,
        BusinessRequest.status == "pending",
    ).first()
    if biz:
        return {"status": "owner_pending", "store_name": biz.name}

    req = db.query(MemberRequest).filter(
        MemberRequest.member_id == current_member.id,
        MemberRequest.status == "pending",
    ).first()
    if req:
        store = db.query(Store).filter(Store.id == req.store_id).first()
        return {"status": "employee_pending", "store_name": store.name if store else ""}

    req_rejected = db.query(MemberRequest).filter(
        MemberRequest.member_id == current_member.id,
        MemberRequest.status == "rejected",
    ).first()
    if req_rejected:
        return {"status": "employee_rejected"}

    return {"status": "no_store"}


# ===== 일반 로그인 =====
@router.post("/login")
def login(req: ValidLogin, response: Response, db: Session = Depends(get_db)):
    user = db.query(Member).filter(Member.phone == req.phone, Member.is_deleted == False).first()
    if not user:
        raise HTTPException(status_code=401, detail="아직 가입된 계정이 없어요. 회원가입을 진행해 주세요.")
    if not password_decode(req.password, user.password):
        raise HTTPException(status_code=401, detail="전화번호 또는 비밀번호가 올바르지 않아요.")

    add_token_for_cookie(user.id, db, response)
    stores = db.query(StoreMembers).filter(StoreMembers.member_id == user.id).all()
    return {
        "stores": [{"store_member_id": sm.id, "store_id": sm.store_id, "role": sm.role} for sm in stores]
    }


# ===== 개발 전용 빠른 로그인 =====
@router.post("/dev/login")
def dev_login(
    req: dict,
    response: Response,
    db: Session = Depends(get_db),
):
    import os as _os
    if _os.getenv("ENV") == "production":
        raise HTTPException(status_code=404)

    phone = normalize_phone(req.get("phone", ""))
    if not phone:
        raise HTTPException(status_code=400, detail="phone 필수")

    member = db.query(Member).filter(Member.phone == phone, Member.is_deleted == False).first()
    if not member:
        member = Member(
            phone=phone,
            name=req.get("name", "테스트유저"),
            birth=normalize_birth(req.get("birth", "1999-01-01")),
            gender=convert_gender(req.get("gender", "남자")),
        )
        db.add(member)
        db.commit()
        db.refresh(member)

    add_token_for_cookie(member.id, db, response)
    stores = db.query(StoreMembers).filter(StoreMembers.member_id == member.id).all()
    return {
        "id": member.id,
        "name": member.name,
        "stores": [{"store_member_id": sm.id, "store_id": sm.store_id, "role": sm.role} for sm in stores],
    }


# ===== 인증번호 =====
@router.post("/signup/code/send")
def send_sms(req: PhoneReq, db: Session = Depends(get_db)):
    import os as _os
    phone = normalize_phone(req.phone)
    if db.query(Member).filter(Member.phone == phone).first():
        raise HTTPException(status_code=400, detail="이미 가입된 회원이에요")

    if _os.getenv("ENV") != "production":
        save_code(phone, "00000")
        return {"message": "인증번호 발송 완료"}

    if not check_daily_limit(phone):
        raise HTTPException(status_code=400, detail="인증번호는 하루 최대 5번까지 발송 가능해요")
    code = generate_code()
    send_code_to_user(phone, code)
    save_code(phone, code)
    return {"message": "인증번호 발송 완료"}


@router.post("/signup/code/verify")
def verify_sms(req: VerifyReq):
    phone = normalize_phone(req.phone)
    valid, msg = verify_code(phone, req.code)
    if not valid:
        raise HTTPException(400, msg)
    return {"message": msg}


# ===== 회원가입 =====
@router.post("/signup")
def signup(
    req: Signup,
    res: Response,
    db: Session = Depends(get_db),
    signup_token: dict = Depends(decode_temp_signup_token),
):
    member_id, error = signup_token

    if db.query(Member).filter(Member.phone == req.phone, Member.is_deleted == False).first():
        raise HTTPException(status_code=400, detail="이미 가입된 번호입니다.")

    phone = normalize_phone(req.phone)
    birth = normalize_birth(req.birth)
    gender = convert_gender(req.gender)
    image_url = str(uuid.uuid4()) + req.imageUrl if req.imageUrl else "default.png"

    if req.type == "social":
        member = db.query(Member).filter(Member.id == member_id).first()
        member.phone = phone
        member.name = req.name
        member.birth = birth
        member.gender = gender
        member.image_url = image_url
    else:
        member = Member(
            phone=phone,
            password=password_encode(req.password),
            name=req.name,
            birth=birth,
            gender=gender,
            image_url=image_url,
        )
        db.add(member)

    db.commit()
    db.refresh(member)
    res.delete_cookie(key="signup_token")

    # 회원가입 즉시 자동 로그인
    add_token_for_cookie(member.id, db, res)
    return {"id": member.id, "name": member.name}


# ===== 로그아웃 =====
@router.post("/logout")
def logout(
    res: Response,
    refresh_token: str = Cookie(None),
    db: Session = Depends(get_db),
):
    if refresh_token:
        token = db.query(JwtTokens).filter(
            JwtTokens.refresh_token == refresh_token,
            JwtTokens.is_revoked == False,
        ).first()
        if token:
            token.is_revoked = True
            db.commit()

    is_prod = os.getenv("ENV") == "production"
    cookie_opts = dict(httponly=True, secure=is_prod, samesite="none" if is_prod else "lax")
    res.delete_cookie(key="access_token", **cookie_opts)
    res.delete_cookie(key="refresh_token", **cookie_opts)


# ===== FCM 토큰 저장 =====
class FcmTokenReq(BaseModel):
    token: str

@router.post("/fcm-token")
def save_fcm_token(
    req: FcmTokenReq,
    current_member: Member = Depends(get_current_member_with_refresh),
    db: Session = Depends(get_db),
):
    current_member.fcm_token = req.token
    db.commit()
    return {"success": True}


# ===== 회원탈퇴 =====
@router.delete("/withdrawal")
def delete_user(
    body: WithdrawalReq,
    res: Response,
    current_member: Member = Depends(get_current_member_with_refresh),
    db: Session = Depends(get_db),
):
    now = datetime.now(ZoneInfo("Asia/Seoul"))

    current_member.is_deleted = True
    current_member.deleted_at = now

    # 모든 활성 토큰 revoke
    db.query(JwtTokens).filter(
        JwtTokens.member_id == current_member.id,
        JwtTokens.is_revoked == False,
    ).update({"is_revoked": True})

    db.add(Withdrawal(member_id=current_member.id, reason=body.reason))
    db.commit()

    is_prod = os.getenv("ENV") == "production"
    cookie_opts = dict(httponly=True, secure=is_prod, samesite="none" if is_prod else "lax")
    res.delete_cookie(key="access_token", **cookie_opts)
    res.delete_cookie(key="refresh_token", **cookie_opts)


# ===== 카카오 로그인 =====
@router.get("/kakao/login")
def kakao_login():
    state = str(uuid.uuid4())
    save_oauth_state(state)
    url = (
        f"https://kauth.kakao.com/oauth/authorize"
        f"?response_type=code&client_id={KAKAO_CLIENT_ID}"
        f"&redirect_uri={KAKAO_REDIRECT_URI}&state={state}&prompt=login"
    )
    return RedirectResponse(url=url)


@router.get("/kakao/callback")
async def kakao_callback(code: str, state: str, db: Session = Depends(get_db)):
    if not consume_oauth_state(state):
        return JSONResponse(status_code=400, content={"error": "유효하지 않은 요청입니다."})
    try:
        async with httpx.AsyncClient() as client:
            token_res = await client.post(
                "https://kauth.kakao.com/oauth/token",
                data={
                    "grant_type": "authorization_code",
                    "client_id": KAKAO_CLIENT_ID,
                    "redirect_uri": KAKAO_REDIRECT_URI,
                    "client_secret": KAKAO_CLIENT_SECRET,
                    "code": code,
                },
                timeout=10,
            )
        if token_res.status_code != 200:
            return JSONResponse(status_code=400, content={"error": "토큰 발급 실패"})
        kakao_access = token_res.json().get("access_token")
        if not kakao_access:
            return JSONResponse(status_code=400, content={"error": "토큰 없음"})

        async with httpx.AsyncClient() as client:
            user_res = await client.get(
                "https://kapi.kakao.com/v2/user/me",
                headers={"Authorization": f"Bearer {kakao_access}"},
                timeout=10,
            )
        if user_res.status_code != 200:
            return JSONResponse(status_code=400, content={"error": "사용자 정보 조회 실패"})
        user_json = user_res.json()
    except Exception:
        logger.exception("카카오 API 오류")
        return JSONResponse(status_code=502, content={"error": "카카오 서버 오류"})

    provider_id = str(user_json.get("id"))
    return await _handle_social_login(db, "kakao", provider_id)


# ===== 구글 로그인 =====
@router.get("/google/login")
def google_login():
    state = str(uuid.uuid4())
    save_oauth_state(state)
    url = (
        f"https://accounts.google.com/o/oauth2/auth"
        f"?response_type=code&client_id={GOOGLE_CLIENT_ID}"
        f"&redirect_uri={GOOGLE_REDIRECT_URI}"
        f"&scope=openid%20email%20profile&prompt=select_account&state={state}"
    )
    return RedirectResponse(url=url)


@router.get("/google/callback")
async def google_callback(code: str, state: str, db: Session = Depends(get_db)):
    if not consume_oauth_state(state):
        return JSONResponse(status_code=400, content={"error": "유효하지 않은 요청입니다."})

    try:
        async with httpx.AsyncClient() as client:
            token_res = await client.post(
                "https://oauth2.googleapis.com/token",
                data={
                    "grant_type": "authorization_code",
                    "client_id": GOOGLE_CLIENT_ID,
                    "client_secret": GOOGLE_CLIENT_SECRET,
                    "redirect_uri": GOOGLE_REDIRECT_URI,
                    "code": code,
                },
                timeout=10,
            )
        if token_res.status_code != 200:
            return JSONResponse(status_code=400, content={"error": "토큰 발급 실패"})
        google_access = token_res.json().get("access_token")
        if not google_access:
            return JSONResponse(status_code=400, content={"error": "토큰 없음"})

        async with httpx.AsyncClient() as client:
            user_res = await client.get(
                "https://www.googleapis.com/oauth2/v3/userinfo",
                headers={"Authorization": f"Bearer {google_access}"},
                timeout=10,
            )
        if user_res.status_code != 200:
            return JSONResponse(status_code=400, content={"error": "사용자 정보 조회 실패"})
        user_json = user_res.json()
    except Exception:
        logger.exception("구글 API 오류")
        return JSONResponse(status_code=502, content={"error": "구글 서버 오류"})

    provider_id = str(user_json.get("sub"))
    return await _handle_social_login(db, "google", provider_id)


# ===== 애플 로그인 =====
@router.get("/apple/login")
def apple_login():
    state = str(uuid.uuid4())
    save_oauth_state(state)
    url = (
        f"https://appleid.apple.com/auth/authorize"
        f"?response_type=code&client_id={APPLE_CLIENT_ID}"
        f"&redirect_uri={APPLE_REDIRECT_URI}"
        f"&scope=name%20email&response_mode=form_post&state={state}"
    )
    return RedirectResponse(url=url)


@router.post("/apple/callback")
async def apple_callback(
    code: str = Form(...),
    id_token: str = Form(None),
    state: str = Form(None),
    db: Session = Depends(get_db),
):
    if not state or not consume_oauth_state(state):
        return JSONResponse(status_code=400, content={"error": "유효하지 않은 요청입니다."})
    client_secret = _create_apple_client_secret()
    try:
        async with httpx.AsyncClient() as client:
            token_res = await client.post(
                "https://appleid.apple.com/auth/token",
                data={
                    "grant_type": "authorization_code",
                    "client_id": APPLE_CLIENT_ID,
                    "client_secret": client_secret,
                    "redirect_uri": APPLE_REDIRECT_URI,
                    "code": code,
                },
                headers={"Content-Type": "application/x-www-form-urlencoded"},
                timeout=10,
            )
        if token_res.status_code != 200:
            return JSONResponse(status_code=400, content={"error": "토큰 발급 실패"})
        id_token = token_res.json().get("id_token")
        if not id_token:
            return JSONResponse(status_code=400, content={"error": "토큰 없음"})
    except Exception:
        logger.exception("애플 API 오류")
        return JSONResponse(status_code=502, content={"error": "Apple 서버 오류"})

    try:
        user_info = await _verify_apple_token(id_token)
    except Exception:
        return JSONResponse(status_code=400, content={"error": "사용자 정보 조회 실패"})

    provider_id = str(user_info.get("sub"))
    return await _handle_social_login(db, "apple", provider_id, json_response=True)


def _create_apple_client_secret() -> str:
    payload = {
        "iss": APPLE_TEAM_ID,
        "iat": int(time.time()),
        "exp": int(time.time()) + 86400 * 180,
        "aud": "https://appleid.apple.com",
        "sub": APPLE_CLIENT_ID,
    }
    return jwt.encode(payload, APPLE_PRIVATE_KEY, algorithm="ES256", headers={"kid": APPLE_KEY_ID})


async def _verify_apple_token(id_token: str) -> dict:
    async with httpx.AsyncClient() as client:
        res = await client.get("https://appleid.apple.com/auth/keys")
    keys = res.json()["keys"]
    header = jwt.get_unverified_header(id_token)
    for key in keys:
        if key["kid"] == header["kid"]:
            public_key = RSAAlgorithm.from_jwk(json.dumps(key))
            return jwt.decode(id_token, public_key, algorithms=["RS256"], audience=APPLE_CLIENT_ID)
    raise ValueError("Apple public key not found")


async def _handle_social_login(db: Session, provider: str, provider_id: str, json_response: bool = False):
    """소셜 로그인 공통 처리: 신규→회원가입 리다이렉트, 기존→로그인"""
    try:
        social = db.query(SocialAccount).filter(
            SocialAccount.provider == provider,
            SocialAccount.provider_id == provider_id,
        ).first()

        if not social:
            member = Member()
            db.add(member)
            db.flush()
            db.add(SocialAccount(member_id=member.id, provider=provider, provider_id=provider_id))
            db.commit()

            temp_token = encode_temp_signup_token(member.id)
            if json_response:
                res = JSONResponse(content={"success": True, "redirect": "signup"})
            else:
                res = RedirectResponse(url=f"{FRONTEND_URL}/#/signup?type=social")
            res.set_cookie(key="signup_token", value=temp_token, httponly=True, max_age=300)
            return res

        member = db.query(Member).filter(
            Member.id == social.member_id, Member.is_deleted == False
        ).first()

        if not member or (member.phone is None and member.name is None):
            temp_token = encode_temp_signup_token(social.member_id)
            if json_response:
                res = JSONResponse(content={"success": True, "redirect": "signup"})
            else:
                res = RedirectResponse(url=f"{FRONTEND_URL}/#/signup?type=social")
            res.set_cookie(key="signup_token", value=temp_token, httponly=True, max_age=300)
            return res

        if json_response:
            res = JSONResponse(content={"success": True, "redirect": "onboarding"})
        else:
            res = RedirectResponse(url=f"{FRONTEND_URL}/#/onboarding/member-type")
        add_token_for_cookie(social.member_id, db, res)
        return res

    except Exception:
        db.rollback()
        logger.exception("소셜 로그인 DB 오류")
        return JSONResponse(status_code=500, content={"error": "DB 오류"})
