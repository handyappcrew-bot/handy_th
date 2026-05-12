import os
import hmac
import hashlib
import base64
import secrets
import redis
import requests
from fastapi import Cookie, Response, HTTPException
from sqlalchemy.orm import Session
from dotenv import load_dotenv
from passlib.context import CryptContext
from cryptography.fernet import Fernet
from datetime import date, datetime, timezone, timedelta
from jose import jwt, JWTError, ExpiredSignatureError
from models import JwtTokens
from solapi import SolapiMessageService
from solapi.model import RequestMessage
from zoneinfo import ZoneInfo

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")
BCRYPT = CryptContext(schemes=["bcrypt"], deprecated="auto")
FERNET = Fernet(base64.urlsafe_b64encode(hashlib.sha256(SECRET_KEY.encode()).digest()))

r = redis.Redis(host="localhost", port=6379, db=0)

SMS_KEY = os.getenv("SMS_CLIENT_ID")
SMS_SECRET_KEY = os.getenv("SMS_CLIENT_SECRET")
message_service = SolapiMessageService(api_key=SMS_KEY, api_secret=SMS_SECRET_KEY)


# ===== 정규화 =====
def normalize_phone(phone: str) -> str:
    if not phone:
        return None
    phone = phone.replace(" ", "").replace("-", "")
    if phone.startswith("+82"):
        phone = "0" + phone[3:]
    return phone


def normalize_birth(birth_str: str) -> date:
    for fmt in ["%Y-%m-%d", "%Y.%m.%d", "%Y/%m/%d"]:
        try:
            return datetime.strptime(birth_str, fmt).date()
        except ValueError:
            continue


def convert_gender(gender: str) -> str:
    return "male" if gender == "남자" else "female"


# ===== 비밀번호 =====
def password_encode(password: str):
    return BCRYPT.hash(password)


def password_decode(password: str, hashed_password: str):
    return BCRYPT.verify(password, hashed_password)


# ===== 인증번호 (Solapi SMS) =====
def generate_code():
    return str(secrets.randbelow(90000) + 10000)


def send_code_to_user(phone: str, code: str):
    message = RequestMessage(
        to=phone,
        from_=os.getenv("SMS_SENDER"),
        text=f"[HANDY] 인증번호는 {code} 입니다. (3분 이내 입력)",
    )
    return message_service.send(message)


def save_code(phone: str, code: str):
    r.setex(f"sms:code:{phone}", 180, code)


def verify_code(phone: str, input_code: str):
    stored = r.get(f"sms:code:{phone}")
    if not stored:
        return False, "인증번호가 만료되었어요"
    if stored.decode() != input_code:
        return False, "올바르지 않은 인증번호에요"
    r.delete(f"sms:code:{phone}")
    r.setex(f"sms:verified:{phone}", 600, "true")
    return True, "인증 되었습니다."


def check_daily_limit(phone: str):
    key = f"sms:count:{phone}"
    cnt = r.get(key)
    if cnt and int(cnt) >= 5:
        return False
    pipe = r.pipeline()
    pipe.incr(key)
    pipe.ttl(key)
    count, ttl = pipe.execute()
    if ttl == -1:
        r.expire(key, 86400)
    return True


# ===== 임시 회원가입 토큰 =====
def encode_temp_signup_token(member_id: int):
    payload = {
        "member_id": member_id,
        "type": "signup",
        "exp": datetime.now(timezone.utc) + timedelta(minutes=5),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_temp_signup_token(signup_token: str | None = Cookie(None)):
    if signup_token is None:
        return None, None
    try:
        payload = jwt.decode(signup_token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "signup":
            return None, "invalid"
        return payload.get("member_id"), None
    except ExpiredSignatureError:
        return None, "expired"
    except JWTError:
        return None, "invalid"


# ===== JWT 토큰 =====
ACCESS_TOKEN_EXPIRE = timedelta(hours=24)
REFRESH_TOKEN_EXPIRE = timedelta(days=7)


def create_access_token(member_id: int):
    payload = {
        "member_id": member_id,
        "type": "access",
        "exp": datetime.now(timezone.utc) + ACCESS_TOKEN_EXPIRE,
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def create_refresh_token(member_id: int):
    exp = datetime.now(timezone.utc) + REFRESH_TOKEN_EXPIRE
    payload = {"member_id": member_id, "type": "refresh", "exp": exp}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM), exp


def verify_token(token: str, token_type: str = "access"):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != token_type:
            return None, "invalid"
        return payload.get("member_id"), None
    except ExpiredSignatureError:
        return None, "expired"
    except JWTError:
        return None, "invalid"


def add_token_for_cookie(member_id: int, db: Session, response: Response):
    access_token = create_access_token(member_id)
    refresh_token, expire = create_refresh_token(member_id)

    now = datetime.now(ZoneInfo("Asia/Seoul"))
    old = db.query(JwtTokens).filter(
        JwtTokens.member_id == member_id,
        JwtTokens.expires_at > now,
        JwtTokens.is_revoked == False,
    ).first()
    if old:
        old.is_revoked = True
        db.commit()

    db.add(JwtTokens(member_id=member_id, refresh_token=refresh_token, expires_at=expire))
    db.commit()

    is_prod = os.getenv("ENV") == "production"
    cookie_opts = dict(httponly=True, secure=is_prod, samesite="none" if is_prod else "lax")
    response.set_cookie(key="access_token", value=access_token, **cookie_opts)
    response.set_cookie(key="refresh_token", value=refresh_token, **cookie_opts)
