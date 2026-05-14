import os
import httpx
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session, joinedload
from pathlib import Path
from dotenv import load_dotenv
import uuid

from sqlalchemy import func
from models import (
    BusinessRequest, MemberRequest, Store, StoreSetting, StoreShift,
    StoreMembers, StaffContract, Member, StoreMap,
    Schedule, WorkLog, DailyClosingReport, WorkLogChangeRequest,
    ScheduleChangeRequest, Notification, Payslip,
)
from database import get_db
from schemas.owner import (
    StoreInfoUpdateReq, NicknameUpdateReq,
    DeleteStoreReq, ShiftUpdateItem, StaffContractUpdateReq,
    ScheduleCreateReq, ScheduleUpdateReq, ScheduleBulkCreateReq,
)
from utils.utils import create_store_code, get_coords_from_address
from routers.auth import get_current_member_with_refresh

ENV_PATH = Path(__file__).resolve().parent.parent.parent / ".env"
load_dotenv(ENV_PATH)

BUSINESS_KEY = os.getenv("VITE_BUSINESS_API_KEY")

router = APIRouter(prefix="/api/owner", tags=["사장"])

UPLOAD_DIR = "uploads/business_registrations/"
PROFILE_DIR = "uploads/profile/"
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(PROFILE_DIR, exist_ok=True)


def verify_owner(store_id: int, member_id: int, db: Session):
    """요청자가 해당 매장의 사장인지 검증"""
    sm = db.query(StoreMembers).filter(
        StoreMembers.store_id == store_id,
        StoreMembers.member_id == member_id,
        StoreMembers.role == "owner",
        StoreMembers.is_deleted == False,
    ).first()
    if not sm:
        raise HTTPException(status_code=403, detail="해당 매장의 사장만 접근 가능합니다.")


# ===== 사업자등록번호 조회 =====
@router.get("/business/{bno}",
    summary="사업자등록번호 검증",
    description="""국세청 API로 사업자등록번호 유효성을 검증하고, 동시에 매장 등록 가능 여부를 반환합니다. 로그인 필수.

**`data[0].b_stt_cd`** (국세청 응답): `01`만 정상사업자
- `01`: 계속사업자 (정상)
- `02`: 휴업자
- `03`: 폐업자
- 빈 값: 국세청 미등록

**`registration_status`** (자체 추가 필드): 매장 등록 가능 여부
- `none`: 등록 가능
- `already_owner`: 본인이 이미 등록한 매장 → 등록 불가
- `registered_by_other`: 다른 사장이 이미 등록한 매장 → 등록 불가""",
    responses={200: {"content": {"application/json": {"examples": {
        "정상_등록가능": {"value": {
            "request_cnt": 1, "match_cnt": 1, "status_code": "OK",
            "data": [{
                "b_no": "1208147521", "b_stt": "계속사업자", "b_stt_cd": "01",
                "tax_type": "부가가치세 일반과세자", "tax_type_cd": "01"
            }],
            "registration_status": "none"
        }},
        "본인이_이미_등록": {"value": {
            "request_cnt": 1, "match_cnt": 1, "status_code": "OK",
            "data": [{"b_no": "1208147521", "b_stt": "계속사업자", "b_stt_cd": "01"}],
            "registration_status": "already_owner"
        }},
        "미등록번호": {"value": {
            "request_cnt": 1, "status_code": "OK",
            "data": [{
                "b_no": "0000000000", "b_stt": "", "b_stt_cd": "",
                "tax_type": "국세청에 등록되지 않은 사업자등록번호입니다."
            }],
            "registration_status": "none"
        }}
    }}}}},
)
async def verify_business(
    bno: str,
    current_member: Member = Depends(get_current_member_with_refresh),
    db: Session = Depends(get_db),
):
    if not BUSINESS_KEY:
        raise HTTPException(status_code=500, detail="VITE_BUSINESS_API_KEY 환경변수가 설정되지 않았습니다.")

    digits = "".join(ch for ch in bno if ch.isdigit())
    if len(digits) != 10:
        raise HTTPException(status_code=400, detail=f"사업자번호는 10자리 숫자여야 합니다. (입력: {bno})")

    url = f"https://api.odcloud.kr/api/nts-businessman/v1/status?serviceKey={BUSINESS_KEY}"
    payload = {"b_no": [digits]}

    async with httpx.AsyncClient() as client:
        res = await client.post(url, json=payload)

    print(f"[business-verify] req b_no={digits} status={res.status_code}")
    print(f"[business-verify] body={res.text[:500]}")

    try:
        nts_data = res.json()
    except Exception:
        raise HTTPException(status_code=502, detail=f"국세청 API 응답 파싱 실패: {res.text[:200]}")

    registration_status = "none"
    existing_store = db.query(Store).filter(
        Store.raw_digits == digits,
        Store.is_deleted == False,
    ).first()
    if existing_store:
        is_my_store = db.query(StoreMembers).filter(
            StoreMembers.store_id == existing_store.id,
            StoreMembers.member_id == current_member.id,
            StoreMembers.role == "owner",
            StoreMembers.is_deleted == False,
        ).first()
        registration_status = "already_owner" if is_my_store else "registered_by_other"

    return {**nts_data, "registration_status": registration_status}


# ===== 매장 등록 =====
@router.post("/stores",
    summary="매장 등록 신청",
    description="사장이 새 매장을 등록합니다. multipart/form-data. 필드: raw_digits(사업자번호 10자리, 하이픈 없이), store_name, address, address_detail?, business_type, owner_name, owner_phone, image(사업자등록증 파일)",
    responses={200: {"content": {"application/json": {"example": {
        "store_id": 5,
        "store_name": "노량물산",
        "code": "A1B2C3"
    }}}}},
)
async def add_store_request(
    raw_digits: str = Form(...),
    store_name: str = Form(...),
    address: str = Form(...),
    address_detail: str | None = Form(None),
    business_type: str = Form(...),
    owner_name: str = Form(...),
    owner_phone: str = Form(...),
    image: UploadFile = File(...),
    current_member: Member = Depends(get_current_member_with_refresh),
    db: Session = Depends(get_db),
):
    digits = "".join(ch for ch in raw_digits if ch.isdigit())
    existing_store = db.query(Store).filter(
        Store.raw_digits == digits,
        Store.is_deleted == False,
    ).first()
    if existing_store:
        is_my_store = db.query(StoreMembers).filter(
            StoreMembers.store_id == existing_store.id,
            StoreMembers.member_id == current_member.id,
            StoreMembers.role == "owner",
            StoreMembers.is_deleted == False,
        ).first()
        if is_my_store:
            raise HTTPException(status_code=409, detail="이미 등록한 매장이에요.")
        raise HTTPException(status_code=409, detail="이미 다른 사장님이 등록한 매장이에요.")

    ext = os.path.splitext(image.filename)[1]
    filename = f"{uuid.uuid4()}{ext}"
    content = await image.read()

    try:
        code = await create_store_code(db)

        # 어드민 감사용 신청 기록
        db.add(BusinessRequest(
            member_id=current_member.id,
            raw_digits=raw_digits,
            name=store_name,
            address=address,
            address_detail=address_detail,
            industry=business_type,
            owner_name=owner_name,
            phone=owner_phone,
            business_image=filename,
            status="approved",
        ))

        # 매장 생성
        store = Store(
            code=code,
            raw_digits=raw_digits,
            name=store_name,
            address=address,
            address_detail=address_detail,
            industry=business_type,
            owner_name=owner_name,
            phone=owner_phone,
            business_image=filename,
            radius=100,
        )
        db.add(store)
        db.flush()

        # 사장 멤버십 등록
        db.add(StoreMembers(
            store_id=store.id,
            member_id=current_member.id,
            role="owner",
        ))

        # 매장 설정 기본값
        db.add(StoreSetting(store_id=store.id))

        # 교대 슬롯 기본 3개 (오픈/미들/마감)
        for order, name in enumerate(["오픈", "미들", "마감"], start=1):
            db.add(StoreShift(store_id=store.id, sort_order=order, name=name))

        # 좌표 등록 (실패해도 매장 생성은 진행)
        try:
            lat, lng = await get_coords_from_address(address)
            db.add(StoreMap(store_id=store.id, lat=lat, lng=lng))
        except Exception:
            pass

        db.commit()

        with open(os.path.join(UPLOAD_DIR, filename), "wb") as f:
            f.write(content)

        return {
            "store_id": store.id,
            "store_name": store.name,
            "code": str(store.code),
        }

    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="매장 등록 중 오류가 발생했습니다.")


# ===== 매장 정보 조회 =====
@router.get("/store/{store_id}", summary="매장 상세 정보 조회", description="매장 기본정보 + 설정(StoreSetting) + shift 목록을 반환합니다. 사장만 접근 가능.")
async def get_store_info(
    store_id: int,
    db: Session = Depends(get_db),
    current_member: Member = Depends(get_current_member_with_refresh),
):
    verify_owner(store_id, current_member.id, db)

    store = (
        db.query(Store)
        .options(joinedload(Store.setting), joinedload(Store.shifts))
        .filter(Store.id == store_id)
        .first()
    )
    if not store:
        raise HTTPException(status_code=404, detail="매장을 찾을 수 없습니다.")

    return {
        "id": store.id,
        "code": store.code,
        "name": store.name,
        "address": store.address,
        "address_detail": store.address_detail,
        "industry": store.industry,
        "owner_name": store.owner_name,
        "phone": store.phone,
        "radius": store.radius,
        "setting": {
            "open_time": str(store.setting.open_time)[:5] if store.setting and store.setting.open_time else None,
            "close_time": str(store.setting.close_time)[:5] if store.setting and store.setting.close_time else None,
            "late_minutes": store.setting.late_minutes if store.setting else None,
            "has_overtime_pay": store.setting.has_overtime_pay if store.setting else False,
            "overtime_after_daily_8h": store.setting.overtime_after_daily_8h if store.setting else True,
            "overtime_after_weekly_40h": store.setting.overtime_after_weekly_40h if store.setting else True,
            "overtime_threshold_minutes": store.setting.overtime_threshold_minutes if store.setting else 30,
            "overtime_multiplier": float(store.setting.overtime_multiplier) if store.setting and store.setting.overtime_multiplier else 1.5,
            "has_night_pay": store.setting.has_night_pay if store.setting else False,
            "night_multiplier": float(store.setting.night_multiplier) if store.setting and store.setting.night_multiplier else 1.5,
            "has_holiday_pay": store.setting.has_holiday_pay if store.setting else False,
        } if store.setting else None,
        "shifts": [
            {
                "id": sh.id,
                "sort_order": sh.sort_order,
                "name": sh.name,
                "start_time": str(sh.start_time)[:5] if sh.start_time else None,
                "end_time": str(sh.end_time)[:5] if sh.end_time else None,
                "is_active": sh.is_active,
            }
            for sh in sorted(store.shifts, key=lambda x: x.sort_order)
        ],
    }


# ===== 매장 정보 수정 =====
@router.put("/store/update", summary="매장 정보 수정", description="매장 이름, 주소, 업종 등 기본 정보를 수정합니다.")
async def update_store_info(
    req: StoreInfoUpdateReq,
    current_member: Member = Depends(get_current_member_with_refresh),
    db: Session = Depends(get_db),
):
    verify_owner(req.id, current_member.id, db)

    store = db.query(Store).filter(Store.id == req.id).first()
    if not store:
        raise HTTPException(status_code=404, detail="해당 매장을 찾을 수 없습니다.")
    store.name = req.name
    store.address = req.address
    store.address_detail = req.address_detail
    store.industry = req.industry
    store.owner_name = req.owner_name
    store.phone = req.phone
    db.commit()


# ===== 매장 설정 수정 =====
@router.put("/store/{store_id}/setting", summary="매장 설정 수정", description="반경, 공지사항 설정 등 매장 세부 설정을 수정합니다.")
async def update_store_setting(
    store_id: int,
    data: dict,
    current_member: Member = Depends(get_current_member_with_refresh),
    db: Session = Depends(get_db),
):
    verify_owner(store_id, current_member.id, db)

    setting = db.query(StoreSetting).filter(StoreSetting.store_id == store_id).first()
    if not setting:
        setting = StoreSetting(store_id=store_id)
        db.add(setting)
    for key, val in data.items():
        if hasattr(setting, key):
            setattr(setting, key, val)
    db.commit()
    return {"ok": True}


# ===== 출퇴근 기준 수정 =====
@router.put("/store/{store_id}/attendance-standard", summary="출퇴근 기준 시간 수정", description="매장의 출근 인정 기준 시간(분)을 수정합니다.")
async def update_attendance_standard(
    store_id: int,
    data: dict,
    current_member: Member = Depends(get_current_member_with_refresh),
    db: Session = Depends(get_db),
):
    verify_owner(store_id, current_member.id, db)

    store = db.query(Store).filter(Store.id == store_id).first()
    if not store:
        raise HTTPException(status_code=404)
    store.radius = data.get("radius")

    setting = db.query(StoreSetting).filter(StoreSetting.store_id == store_id).first()
    if not setting:
        setting = StoreSetting(store_id=store_id)
        db.add(setting)

    fields = [
        "late_minutes", "has_overtime_pay",
        "overtime_after_daily_8h", "overtime_after_weekly_40h",
        "overtime_threshold_minutes", "overtime_multiplier",
        "has_night_pay", "night_multiplier", "night_threshold_minutes",
        "has_holiday_pay", "holiday_multiplier_under_8h", "holiday_multiplier_over_8h",
        "holiday_threshold_minutes",
    ]
    for f in fields:
        if f in data:
            setattr(setting, f, data[f])

    db.commit()
    return {"ok": True}


# ===== 교대 슬롯 수정 =====
@router.put("/store/{store_id}/shifts", summary="매장 근무타입(shift) 수정", description="오픈/미들/마감 등 shift 목록을 일괄 업데이트합니다. 요청: { shifts: [{ id?, name, start_time, end_time, sort_order }] }")
async def update_store_shifts(
    store_id: int,
    data: dict,
    current_member: Member = Depends(get_current_member_with_refresh),
    db: Session = Depends(get_db),
):
    verify_owner(store_id, current_member.id, db)

    shifts_data = data.get("shifts", [])
    existing = {sh.sort_order: sh for sh in
                db.query(StoreShift).filter(StoreShift.store_id == store_id).all()}

    for item in shifts_data:
        order = item.get("sort_order")
        if order in existing:
            sh = existing[order]
            sh.name = item.get("name", sh.name)
            sh.start_time = item.get("start_time")
            sh.end_time = item.get("end_time")
            sh.is_active = item.get("is_active", True)
        else:
            db.add(StoreShift(
                store_id=store_id,
                sort_order=order,
                name=item.get("name", f"슬롯{order}"),
                start_time=item.get("start_time"),
                end_time=item.get("end_time"),
                is_active=item.get("is_active", True),
            ))

    db.commit()
    return {"ok": True}


# ===== 출근 현황 (사장 홈 / 근태 관리) =====
@router.get("/store/{store_id}/attendance/today", summary="오늘 출퇴근 현황 조회", description="사장이 오늘 또는 특정 날짜의 전체 직원 출퇴근 상태를 조회합니다. query: date(선택, 기본값=오늘)")
def get_today_attendance(
    store_id: int,
    date: str = None,
    db: Session = Depends(get_db),
    current_member: Member = Depends(get_current_member_with_refresh),
):
    verify_owner(store_id, current_member.id, db)

    from datetime import date as date_cls
    from zoneinfo import ZoneInfo
    from datetime import datetime as dt
    if date:
        try:
            today = date_cls.fromisoformat(date)
        except ValueError:
            today = dt.now(ZoneInfo("Asia/Seoul")).date()
    else:
        today = dt.now(ZoneInfo("Asia/Seoul")).date()

    staffs = (
        db.query(StoreMembers)
        .options(joinedload(StoreMembers.member))
        .filter(StoreMembers.store_id == store_id, StoreMembers.role == "employee", StoreMembers.is_deleted == False)
        .all()
    )

    result = []
    for s in staffs:
        if not s.member or s.member.is_deleted:
            continue

        log = db.query(WorkLog).filter(
            WorkLog.store_id == store_id,
            WorkLog.employee_id == s.id,
            WorkLog.work_date == today,
        ).first()

        sched = db.query(Schedule).filter(
            Schedule.store_id == store_id,
            Schedule.employee_id == s.id,
            Schedule.work_date == today,
        ).first()

        shift_name = sched.shift.name if sched and sched.shift else None

        if not sched:
            continue

        if log:
            if log.status == "working":
                status = "working"
            elif log.status == "on_break":
                status = "on_break"
            else:
                status = "off_work"
            clock_in = log.start_time.astimezone(ZoneInfo("Asia/Seoul")).strftime("%H:%M") if log.start_time else None
            clock_out = log.end_time.astimezone(ZoneInfo("Asia/Seoul")).strftime("%H:%M") if log.end_time else None
        else:
            status = "absent"
            clock_in = None
            clock_out = None

        work_start = sched.work_start.strftime("%H:%M") if sched and sched.work_start else None
        work_end = sched.work_end.strftime("%H:%M") if sched and sched.work_end else None

        result.append({
            "id": s.id,
            "name": s.member.name,
            "shift": shift_name,
            "status": status,
            "clock_in": clock_in,
            "clock_out": clock_out,
            "work_start": work_start,
            "work_end": work_end,
        })

    return result


# ===== 직원 목록 =====
@router.get("/store/{store_id}/staffs",
    summary="직원 목록 조회",
    description="매장의 전체 직원 목록과 계약정보, 스케줄 요약을 반환합니다.",
    responses={200: {"content": {"application/json": {"example": [
        {
            "id": 10, "name": "홍길동", "gender": "male",
            "birth": "1995-03-15", "phone": "01012345678",
            "joined_at": "2025-01-10T09:00:00",
            "image_url": "/uploads/profile/abc.jpg",
            "contract": {
                "employee_type": "정직원",
                "working_status": "재직",
                "hourly_rate": 11000,
                "monthly_salary": None,
                "salary_cycle": "월 1회 (월급)",
                "salary_day": "25일"
            }
        }
    ]}}}},
)
async def get_staff_list(
    store_id: int,
    db: Session = Depends(get_db),
    current_member: Member = Depends(get_current_member_with_refresh),
):
    verify_owner(store_id, current_member.id, db)

    staff = (
        db.query(StoreMembers)
        .options(joinedload(StoreMembers.contract), joinedload(StoreMembers.member))
        .filter(StoreMembers.store_id == store_id, StoreMembers.role == "employee")
        .all()
    )

    return [{
        "id": s.id,
        "store_id": s.store_id,
        "member_id": s.member_id,
        "role": s.role,
        "bank": s.bank,
        "account_number": s.account_number,
        "image_url": s.image_url,
        "joined_at": s.joined_at,
        "name": s.member.name if s.member else None,
        "phone": s.member.phone if s.member else None,
        "birth": str(s.member.birth) if s.member and s.member.birth else None,
        "gender": s.member.gender if s.member else None,
        "is_deleted": s.member.is_deleted if s.member else None,
        "contract": {
            "employee_type": s.contract.employee_type if s.contract else None,
            "working_status": s.contract.working_status if s.contract else None,
            "hourly_rate": s.contract.hourly_rate if s.contract else None,
            "monthly_salary": s.contract.monthly_salary if s.contract else None,
            "salary_cycle": s.contract.salary_cycle if s.contract else None,
            "salary_day": s.contract.salary_day if s.contract else None,
            "is_probation": s.contract.is_probation if s.contract else False,
            "income_tax": float(s.contract.income_tax) if s.contract and s.contract.income_tax else None,
            "local_income_tax": float(s.contract.local_income_tax) if s.contract and s.contract.local_income_tax else None,
            "national_pension": float(s.contract.national_pension) if s.contract and s.contract.national_pension else None,
            "health_insurance": float(s.contract.health_insurance) if s.contract and s.contract.health_insurance else None,
            "long_term_care": float(s.contract.long_term_care) if s.contract and s.contract.long_term_care else None,
            "employment_insurance": float(s.contract.employment_insurance) if s.contract and s.contract.employment_insurance else None,
            "industrial_accident": float(s.contract.industrial_accident) if s.contract and s.contract.industrial_accident else None,
            "memo": s.contract.memo if s.contract else None,
            "resume": s.contract.resume if s.contract else None,
            "employment_contract": s.contract.employment_contract if s.contract else None,
            "health_certificate": s.contract.health_certificate if s.contract else None,
        } if s.contract else None,
    } for s in staff]


# ===== 직원 상세 =====
@router.get("/store/{store_id}/staff/{staff_id}", summary="직원 상세 조회", description="특정 직원의 상세 정보(계약, 스케줄, 출근기록, 급여명세서 등)를 반환합니다.")
async def get_staff_detail(
    store_id: int,
    staff_id: int,
    db: Session = Depends(get_db),
    current_member: Member = Depends(get_current_member_with_refresh),
):
    verify_owner(store_id, current_member.id, db)

    staff = (
        db.query(StoreMembers)
        .options(joinedload(StoreMembers.contract), joinedload(StoreMembers.member))
        .filter(StoreMembers.store_id == store_id, StoreMembers.id == staff_id)
        .first()
    )
    if not staff:
        raise HTTPException(status_code=404, detail="직원을 찾을 수 없습니다.")

    return {
        "id": staff.id,
        "name": staff.member.name if staff.member else None,
        "phone": staff.member.phone if staff.member else None,
        "birth": str(staff.member.birth) if staff.member and staff.member.birth else None,
        "gender": staff.member.gender if staff.member else None,
        "image_url": staff.image_url,
        "bank": staff.bank,
        "account_number": staff.account_number,
        "joined_at": str(staff.joined_at),
        "contract": {
            "employee_type": staff.contract.employee_type if staff.contract else None,
            "working_status": staff.contract.working_status if staff.contract else None,
            "hourly_rate": staff.contract.hourly_rate if staff.contract else None,
            "salary_cycle": staff.contract.salary_cycle if staff.contract else None,
            "salary_day": staff.contract.salary_day if staff.contract else None,
            "is_probation": staff.contract.is_probation if staff.contract else False,
            "deduction_type": staff.contract.deduction_type if staff.contract else "percent",
            "income_tax": float(staff.contract.income_tax) if staff.contract and staff.contract.income_tax else None,
            "local_income_tax": float(staff.contract.local_income_tax) if staff.contract and staff.contract.local_income_tax else None,
            "national_pension": float(staff.contract.national_pension) if staff.contract and staff.contract.national_pension else None,
            "health_insurance": float(staff.contract.health_insurance) if staff.contract and staff.contract.health_insurance else None,
            "long_term_care": float(staff.contract.long_term_care) if staff.contract and staff.contract.long_term_care else None,
            "employment_insurance": float(staff.contract.employment_insurance) if staff.contract and staff.contract.employment_insurance else None,
            "industrial_accident": float(staff.contract.industrial_accident) if staff.contract and staff.contract.industrial_accident else None,
            "memo": staff.contract.memo if staff.contract else None,
            "resume": staff.contract.resume if staff.contract else None,
            "employment_contract": staff.contract.employment_contract if staff.contract else None,
            "health_certificate": staff.contract.health_certificate if staff.contract else None,
        } if staff.contract else None,
    }


# ===== 직원 계약 수정 =====
@router.patch(
    "/store/{store_id}/staff/{staff_id}/memo",
    summary="직원 메모 수정 (사장용)",
    description="직원에 대한 사장 메모만 빠르게 수정합니다. 요청: { memo: string }",
    responses={200: {"content": {"application/json": {"example": {"memo": "성실하고 책임감 강함"}}}}},
)
def update_staff_memo(
    store_id: int,
    staff_id: int,
    body: dict,
    current_member: Member = Depends(get_current_member_with_refresh),
    db: Session = Depends(get_db),
):
    verify_owner(store_id, current_member.id, db)

    staff = db.query(StoreMembers).filter(
        StoreMembers.store_id == store_id,
        StoreMembers.id == staff_id,
    ).first()
    if not staff:
        raise HTTPException(status_code=404, detail="직원을 찾을 수 없습니다.")

    contract = db.query(StaffContract).filter(StaffContract.store_member_id == staff.id).first()
    if not contract:
        contract = StaffContract(store_member_id=staff.id)
        db.add(contract)
        db.flush()

    contract.memo = body.get("memo")
    db.commit()
    return {"memo": contract.memo}


@router.put("/store/{store_id}/staff/{staff_id}/contract", summary="직원 계약정보 수정", description="직원의 계약 정보(시급, 월급, 고용형태, 급여일, 세금 등)를 수정합니다.")
async def update_staff_contract(
    store_id: int, staff_id: int,
    req: StaffContractUpdateReq,
    current_member: Member = Depends(get_current_member_with_refresh),
    db: Session = Depends(get_db),
):
    verify_owner(store_id, current_member.id, db)

    staff = db.query(StoreMembers).filter(
        StoreMembers.store_id == store_id, StoreMembers.id == staff_id
    ).first()
    if not staff:
        raise HTTPException(status_code=404, detail="직원을 찾을 수 없습니다.")

    contract = db.query(StaffContract).filter(StaffContract.store_member_id == staff.id).first()
    if not contract:
        contract = StaffContract(store_member_id=staff.id)
        db.add(contract)

    member_fields = {"bank", "account_name", "account_number"}
    contract_data = req.model_dump(exclude_unset=True)

    for field, value in contract_data.items():
        if field in member_fields:
            setattr(staff, field, value)
        else:
            setattr(contract, field, value)

    db.commit()
    return {"ok": True}


# ===== 사장 마이페이지 - 내 매장 목록 =====
@router.get("/mypage/{member_id}/stores",
    summary="사장 소유 매장 목록",
    description="사장이 owner 역할로 등록된 매장 목록과 직원 수를 반환합니다.",
    responses={200: {"content": {"application/json": {"example": [
        {
            "id": 5, "code": "A1B2C3", "industry": "음식점 / 카페",
            "address": "서울 동작구 노량진로 100", "address_detail": "2층",
            "name": "노량물산", "owner_name": "김사장", "phone": "02-1234-5678",
            "employee_count": 7, "created_at": "2024-12-01T10:30:00"
        }
    ]}}}},
)
async def get_my_stores(
    member_id: int,
    store_id: int = None,
    current_member: Member = Depends(get_current_member_with_refresh),
    db: Session = Depends(get_db),
):
    if current_member.id != member_id:
        raise HTTPException(status_code=403, detail="권한이 없습니다.")
    q = db.query(StoreMembers).filter(
        StoreMembers.role == "owner",
        StoreMembers.member_id == member_id,
    )
    if store_id:
        q = q.filter(StoreMembers.store_id == store_id)

    store_ids = [sm.store_id for sm in q.all()]
    stores = db.query(Store).filter(Store.id.in_(store_ids), Store.is_deleted == False).all()

    emp_counts = dict(
        db.query(StoreMembers.store_id, func.count(StoreMembers.id))
        .filter(
            StoreMembers.store_id.in_(store_ids),
            StoreMembers.role == "employee",
            StoreMembers.is_deleted == False,
        )
        .group_by(StoreMembers.store_id)
        .all()
    )

    return [{
        "id": store.id,
        "code": store.code,
        "industry": store.industry,
        "address": store.address,
        "address_detail": store.address_detail,
        "name": store.name,
        "owner_name": store.owner_name,
        "phone": store.phone,
        "employee_count": emp_counts.get(store.id, 0),
        "created_at": store.created_at,
    } for store in stores]


# ===== 사장 마이페이지 - 인적사항 =====
@router.get("/mypage/{member_id}/info",
    summary="사장 내 정보 조회",
    description="사장 마이페이지 정보. query: store_id 필수.",
    responses={200: {"content": {"application/json": {"example": {
        "id": 11,
        "name": "김사장",
        "nickname": "노량물산 대표",
        "birth": "1980-05-20",
        "gender": "남자",
        "phone": "01098765432",
        "joined_at": "2024-12-01 10:30:00",
        "store_name": "노량물산",
        "image": "/uploads/profile/owner.jpg"
    }}}}},
)
async def get_owner_info(
    member_id: int,
    store_id: int,
    current_member: Member = Depends(get_current_member_with_refresh),
    db: Session = Depends(get_db),
):
    if current_member.id != member_id:
        raise HTTPException(status_code=403, detail="권한이 없습니다.")
    result = (
        db.query(StoreMembers, Member, Store)
        .join(Member, Member.id == StoreMembers.member_id)
        .join(Store, Store.id == StoreMembers.store_id)
        .filter(StoreMembers.member_id == member_id, StoreMembers.store_id == store_id)
        .first()
    )
    if not result:
        raise HTTPException(status_code=404, detail="정보를 찾을 수 없습니다.")

    sm, member, store = result
    return {
        "id": sm.id,
        "name": member.name,
        "nickname": sm.nickname,
        "birth": str(member.birth) if member.birth else None,
        "gender": "여자" if member.gender == "female" else "남자",
        "phone": member.phone,
        "joined_at": str(sm.joined_at),
        "store_name": store.name,
        "image": sm.image_url,
    }


# ===== 사장 프로필 이미지 업로드/변경 =====
@router.post("/mypage/{store_id}/profile-image", summary="사장 프로필 이미지 업로드", description="multipart/form-data. 필드: store_member_id(int), image(파일). 기존 이미지 자동 삭제. 응답: { image_url }")
async def update_owner_profile_image(
    store_id: int,
    store_member_id: int = Form(...),
    image: UploadFile = File(...),
    current_member: Member = Depends(get_current_member_with_refresh),
    db: Session = Depends(get_db),
):
    verify_owner(store_id, current_member.id, db)

    sm = db.query(StoreMembers).filter(
        StoreMembers.store_id == store_id,
        StoreMembers.id == store_member_id,
    ).first()
    if not sm:
        raise HTTPException(status_code=404, detail="매장 멤버 정보를 찾을 수 없습니다.")

    if sm.image_url:
        old_path = sm.image_url.lstrip("/")
        if os.path.exists(old_path):
            try:
                os.remove(old_path)
            except OSError:
                pass

    raw_name = image.filename or ""
    ext = os.path.splitext(raw_name)[1].lower() or ".jpg"
    if ext not in (".jpg", ".jpeg", ".png", ".gif", ".webp"):
        ext = ".jpg"
    filename = f"{uuid.uuid4()}{ext}"
    data = await image.read()
    with open(os.path.join(PROFILE_DIR, filename), "wb") as f:
        f.write(data)

    sm.image_url = f"/{PROFILE_DIR}{filename}"
    db.commit()
    return {"image_url": sm.image_url}


# ===== 사장 프로필 이미지 삭제 =====
@router.delete("/mypage/{store_id}/profile-image", summary="사장 프로필 이미지 삭제", description="사장의 프로필 이미지를 기본 이미지로 초기화합니다. query: store_member_id 필수.")
async def delete_owner_profile_image(
    store_id: int,
    store_member_id: int,
    current_member: Member = Depends(get_current_member_with_refresh),
    db: Session = Depends(get_db),
):
    verify_owner(store_id, current_member.id, db)

    sm = db.query(StoreMembers).filter(
        StoreMembers.store_id == store_id,
        StoreMembers.id == store_member_id,
    ).first()
    if not sm:
        raise HTTPException(status_code=404, detail="매장 멤버 정보를 찾을 수 없습니다.")

    if sm.image_url:
        old_path = sm.image_url.lstrip("/")
        if os.path.exists(old_path):
            try:
                os.remove(old_path)
            except OSError:
                pass
    sm.image_url = None
    db.commit()
    return {"image_url": None}


# ===== 사장 닉네임 수정 =====
@router.put("/mypage/{store_id}/nickname", summary="사장 닉네임 변경", description="매장별 닉네임을 변경합니다. 요청: { member_id, nickname }")
async def update_nickname(
    store_id: int,
    body: NicknameUpdateReq,
    current_member: Member = Depends(get_current_member_with_refresh),
    db: Session = Depends(get_db),
):
    verify_owner(store_id, current_member.id, db)

    sm = db.query(StoreMembers).filter(
        StoreMembers.store_id == store_id, StoreMembers.id == body.member_id
    ).first()
    if not sm:
        raise HTTPException(status_code=404)
    sm.nickname = body.nickname
    db.commit()
    return {"nickname": sm.nickname}


# ===== 매장 삭제 =====
@router.delete("/store/delete", summary="매장 삭제", description="매장을 소프트 삭제합니다. 요청: { store_id }")
async def delete_store(
    body: DeleteStoreReq,
    current_member: Member = Depends(get_current_member_with_refresh),
    db: Session = Depends(get_db),
):
    verify_owner(body.store_id, current_member.id, db)

    store = db.query(Store).filter(Store.id == body.store_id).first()
    if not store:
        raise HTTPException(status_code=404, detail="일치하는 매장 정보를 찾을 수 없습니다.")
    store.is_deleted = True
    db.commit()


# ===== 매출 조회 (사장) =====
@router.get(
    "/store/{store_id}/sales/monthly",
    summary="월간 매출 조회 (사장용)",
    description="해당 월의 일별 매출(순매출/총매출)과 월 합계를 반환합니다. 마감보고 데이터를 집계합니다. query: year, month 필수.",
    responses={200: {"content": {"application/json": {"example": {
        "year": 2026, "month": 5,
        "daily": {
            "13": {"net": 405000, "gross": 420000},
            "14": {"net": 380000, "gross": 395000}
        },
        "total_net": 785000,
        "total_gross": 815000,
        "report_count": 2
    }}}}},
)
def get_monthly_sales(
    store_id: int,
    year: int,
    month: int,
    current_member: Member = Depends(get_current_member_with_refresh),
    db: Session = Depends(get_db),
):
    verify_owner(store_id, current_member.id, db)
    from sqlalchemy import extract

    reports = db.query(DailyClosingReport).filter(
        DailyClosingReport.store_id == store_id,
        extract("year", DailyClosingReport.report_date) == year,
        extract("month", DailyClosingReport.report_date) == month,
    ).all()

    daily = {}
    total_net = 0
    total_gross = 0
    for r in reports:
        gross = (r.card_sales or 0) + (r.cash_sales or 0) + (r.transfer_sales or 0) + (r.gift_sales or 0)
        net = gross - (r.discount_amount or 0) - (r.refund_amount or 0)
        daily[str(r.report_date.day)] = {"net": net, "gross": gross}
        total_net += net
        total_gross += gross

    return {
        "year": year, "month": month,
        "daily": daily,
        "total_net": total_net,
        "total_gross": total_gross,
        "report_count": len(reports),
    }


@router.get(
    "/store/{store_id}/sales/daily",
    summary="일별 매출 상세 조회 (사장용)",
    description="특정 날짜의 매출 상세를 반환합니다. query: date(YYYY-MM-DD) 필수. 해당 일자에 마감보고가 없으면 404.",
    responses={200: {"content": {"application/json": {"example": {
        "date": "2026-05-13",
        "card_sales": 200000, "cash_sales": 150000,
        "transfer_sales": 50000, "gift_sales": 20000,
        "gross_sales": 420000,
        "discount_amount": 10000, "refund_amount": 5000,
        "net_sales": 405000,
        "cash_on_hand": 145000, "cash_shortage": 5000,
        "receipt_image_url": None,
        "manager_note": "이상 없음"
    }}}}},
)
def get_daily_sales(
    store_id: int,
    date: str,
    current_member: Member = Depends(get_current_member_with_refresh),
    db: Session = Depends(get_db),
):
    verify_owner(store_id, current_member.id, db)
    from datetime import date as date_cls

    try:
        target = date_cls.fromisoformat(date)
    except ValueError:
        raise HTTPException(status_code=400, detail="date는 YYYY-MM-DD 형식이어야 합니다.")

    r = db.query(DailyClosingReport).filter(
        DailyClosingReport.store_id == store_id,
        DailyClosingReport.report_date == target,
    ).first()
    if not r:
        raise HTTPException(status_code=404, detail="해당 날짜의 마감 보고가 없습니다.")

    gross = (r.card_sales or 0) + (r.cash_sales or 0) + (r.transfer_sales or 0) + (r.gift_sales or 0)
    net = gross - (r.discount_amount or 0) - (r.refund_amount or 0)

    return {
        "date": str(r.report_date),
        "card_sales": r.card_sales,
        "cash_sales": r.cash_sales,
        "transfer_sales": r.transfer_sales,
        "gift_sales": r.gift_sales,
        "gross_sales": gross,
        "discount_amount": r.discount_amount,
        "refund_amount": r.refund_amount,
        "net_sales": net,
        "cash_on_hand": r.cash_on_hand,
        "cash_shortage": (r.cash_sales or 0) - (r.cash_on_hand or 0),
        "receipt_image_url": r.receipt_image_url,
        "manager_note": r.manager_note,
    }


# ===== 마감 보고 조회 (사장) =====
@router.get("/store/{store_id}/closing-reports", summary="마감 보고 목록 조회", description="query: year, month(선택). 해당 월의 마감 보고 목록을 반환합니다.")
def get_closing_reports(
    store_id: int,
    year: int = None,
    month: int = None,
    current_member: Member = Depends(get_current_member_with_refresh),
    db: Session = Depends(get_db),
):
    verify_owner(store_id, current_member.id, db)

    from sqlalchemy import extract
    q = db.query(DailyClosingReport).filter(DailyClosingReport.store_id == store_id)
    if year:
        q = q.filter(extract("year", DailyClosingReport.report_date) == year)
    if month:
        q = q.filter(extract("month", DailyClosingReport.report_date) == month)

    reports = q.order_by(DailyClosingReport.report_date.desc()).all()

    return [{
        "id": r.id,
        "report_date": str(r.report_date),
        "card_sales": r.card_sales,
        "cash_sales": r.cash_sales,
        "transfer_sales": r.transfer_sales,
        "gift_sales": r.gift_sales,
        "gross_sales": (r.card_sales or 0) + (r.cash_sales or 0) + (r.transfer_sales or 0) + (r.gift_sales or 0),
        "discount_amount": r.discount_amount,
        "refund_amount": r.refund_amount,
        "net_sales": (
            (r.card_sales or 0) + (r.cash_sales or 0) + (r.transfer_sales or 0) + (r.gift_sales or 0)
            - (r.discount_amount or 0) - (r.refund_amount or 0)
        ),
        "cash_on_hand": r.cash_on_hand,
        "cash_shortage": (r.cash_sales or 0) - (r.cash_on_hand or 0),
        "receipt_image_url": r.receipt_image_url,
        "manager_note": r.manager_note,
        "created_at": str(r.created_at),
        "employee_id": r.employee_id,
    } for r in reports]


# ===== 마감 보고 수정 (사장) =====
@router.put("/store/{store_id}/closing-reports/{report_id}", summary="마감 보고 수정", description="사장이 직원의 마감 보고 내용을 수정합니다.")
def update_closing_report(
    store_id: int,
    report_id: int,
    data: dict,
    current_member: Member = Depends(get_current_member_with_refresh),
    db: Session = Depends(get_db),
):
    verify_owner(store_id, current_member.id, db)

    report = db.query(DailyClosingReport).filter(
        DailyClosingReport.id == report_id,
        DailyClosingReport.store_id == store_id,
    ).first()
    if not report:
        raise HTTPException(status_code=404, detail="마감 보고를 찾을 수 없습니다.")

    editable = [
        "card_sales", "cash_sales", "transfer_sales", "gift_sales",
        "discount_amount", "refund_amount", "cash_on_hand",
        "receipt_image_url", "manager_note",
    ]
    for field in editable:
        if field in data:
            setattr(report, field, data[field])

    db.commit()
    return {"ok": True}


# ===== 출근기록 수정 요청 목록 (사장) =====
@router.get("/store/{store_id}/worklog-requests", summary="출근기록 수정 요청 목록 (사장용)", description="직원들이 신청한 출퇴근 수정 요청 목록을 반환합니다.")
def get_worklog_requests(
    store_id: int,
    current_member: Member = Depends(get_current_member_with_refresh),
    db: Session = Depends(get_db),
):
    verify_owner(store_id, current_member.id, db)

    rows = (
        db.query(WorkLogChangeRequest, Member)
        .join(StoreMembers, StoreMembers.id == WorkLogChangeRequest.employee_id)
        .join(Member, Member.id == StoreMembers.member_id)
        .filter(
            WorkLogChangeRequest.store_id == store_id,
            WorkLogChangeRequest.status == "pending",
        )
        .order_by(WorkLogChangeRequest.created_at.desc())
        .all()
    )

    return [{
        "id": req.id,
        "employee_name": member.name,
        "type": req.type,
        "date": str(req.date),
        "origin_start": str(req.origin_start)[:5] if req.origin_start else None,
        "origin_end": str(req.origin_end)[:5] if req.origin_end else None,
        "desired_start": str(req.desired_start)[:5] if req.desired_start else None,
        "desired_end": str(req.desired_end)[:5] if req.desired_end else None,
        "desired_break_minutes": req.desired_break_minutes,
        "reason": req.reason,
        "status": req.status,
        "created_at": str(req.created_at),
    } for req, member in rows]


@router.put("/store/{store_id}/worklog-requests/{req_id}", summary="출근기록 수정 요청 처리 (사장용)", description="사장이 요청을 승인/거절합니다. 요청: { status: 'approved'|'rejected' }")
def handle_worklog_request(
    store_id: int, req_id: int,
    data: dict,
    current_member: Member = Depends(get_current_member_with_refresh),
    db: Session = Depends(get_db),
):
    verify_owner(store_id, current_member.id, db)

    req = db.query(WorkLogChangeRequest).filter(
        WorkLogChangeRequest.id == req_id, WorkLogChangeRequest.store_id == store_id
    ).first()
    if not req:
        raise HTTPException(status_code=404)

    new_status = data.get("status")
    if new_status not in ("approved", "rejected"):
        raise HTTPException(status_code=400, detail="status는 approved 또는 rejected만 가능합니다.")
    req.status = new_status
    db.commit()
    return {"ok": True}


# ===== 스케줄 변경 요청 목록 (사장) =====
@router.get("/store/{store_id}/schedule-requests", summary="스케줄 변경 요청 목록 (사장용)", description="직원들이 신청한 스케줄 변경 요청 목록을 반환합니다.")
def get_schedule_requests(
    store_id: int,
    current_member: Member = Depends(get_current_member_with_refresh),
    db: Session = Depends(get_db),
):
    verify_owner(store_id, current_member.id, db)

    rows = (
        db.query(ScheduleChangeRequest, Member)
        .join(StoreMembers, StoreMembers.id == ScheduleChangeRequest.employee_id)
        .join(Member, Member.id == StoreMembers.member_id)
        .filter(
            ScheduleChangeRequest.store_id == store_id,
            ScheduleChangeRequest.status == "pending",
            ScheduleChangeRequest.is_deleted == False,
        )
        .order_by(ScheduleChangeRequest.created_at.desc())
        .all()
    )

    return [{
        "id": req.id,
        "employee_name": member.name,
        "type": req.type,
        "status": req.status,
        "origin_date": str(req.origin_date) if req.origin_date else None,
        "origin_start": str(req.origin_start)[:5] if req.origin_start else None,
        "origin_end": str(req.origin_end)[:5] if req.origin_end else None,
        "desired_date": str(req.desired_date),
        "desired_start": str(req.desired_start)[:5] if req.desired_start else None,
        "desired_end": str(req.desired_end)[:5] if req.desired_end else None,
        "reason": req.reason,
        "created_at": str(req.created_at),
    } for req, member in rows]


@router.put("/store/{store_id}/schedule-requests/{req_id}", summary="스케줄 변경 요청 처리 (사장용)", description="사장이 요청을 승인/거절합니다. 요청: { status: 'approved'|'rejected' }")
def handle_schedule_request(
    store_id: int, req_id: int,
    data: dict,
    current_member: Member = Depends(get_current_member_with_refresh),
    db: Session = Depends(get_db),
):
    verify_owner(store_id, current_member.id, db)

    req = db.query(ScheduleChangeRequest).filter(
        ScheduleChangeRequest.id == req_id, ScheduleChangeRequest.store_id == store_id
    ).first()
    if not req:
        raise HTTPException(status_code=404)

    new_status = data.get("status")
    if new_status not in ("approved", "rejected"):
        raise HTTPException(status_code=400)
    req.status = new_status
    db.commit()
    return {"ok": True}


# ===== 급여명세서 =====

@router.get("/store/{store_id}/payslips", summary="급여명세서 목록 (사장용)", description="해당 월의 전체 직원 급여명세서 목록을 반환합니다. query: year, month 필수.")
def get_payslips(
    store_id: int,
    year: int,
    month: int,
    current_member: Member = Depends(get_current_member_with_refresh),
    db: Session = Depends(get_db),
):
    verify_owner(store_id, current_member.id, db)

    rows = (
        db.query(Payslip, StoreMembers, Member, StaffContract)
        .join(StoreMembers, Payslip.employee_id == StoreMembers.id)
        .join(Member, StoreMembers.member_id == Member.id)
        .outerjoin(StaffContract, StaffContract.store_member_id == StoreMembers.id)
        .filter(
            Payslip.store_id == store_id,
            Payslip.year == year,
            Payslip.month == month,
            StoreMembers.is_deleted == False,
        )
        .all()
    )
    result = []
    for p, sm, m, c in rows:
        result.append({
            "id": p.id,
            "employee_id": sm.id,
            "name": m.name,
            "year": p.year,
            "month": p.month,
            "pay_period_start": str(p.pay_period_start),
            "pay_period_end": str(p.pay_period_end),
            "pay_date": str(p.pay_date) if p.pay_date else None,
            "salary_day": c.salary_day if c else None,
            "employee_type": c.employee_type if c else None,
            "work_days": p.work_days,
            "actual_work_minutes": p.actual_work_minutes,
            "overtime_minutes": p.overtime_minutes,
            "base_pay": p.base_pay,
            "overtime_pay": p.overtime_pay,
            "night_pay": p.night_pay,
            "holiday_pay": p.holiday_pay,
            "weekly_leave_pay": p.weekly_leave_pay,
            "other_allowance": p.other_allowance,
            "income_tax": p.income_tax,
            "local_income_tax": p.local_income_tax,
            "national_pension": p.national_pension,
            "health_insurance": p.health_insurance,
            "long_term_care": p.long_term_care,
            "employment_insurance": p.employment_insurance,
            "total_pay": p.total_pay,
            "total_deduction": p.total_deduction,
            "net_pay": p.net_pay,
            "is_published": p.is_published,
            "published_at": str(p.published_at) if p.published_at else None,
            "is_transferred": p.is_transferred,
            "transferred_at": str(p.transferred_at) if p.transferred_at else None,
        })
    return result


@router.post("/store/{store_id}/payslips/{payslip_id}/publish", summary="급여명세서 발행", description="급여명세서를 직원에게 발행합니다(is_published=True). 발행 후 직원 앱에 노출됩니다.")
def publish_payslip(
    store_id: int,
    payslip_id: int,
    current_member: Member = Depends(get_current_member_with_refresh),
    db: Session = Depends(get_db),
):
    verify_owner(store_id, current_member.id, db)

    from datetime import datetime
    p = db.query(Payslip).filter(Payslip.id == payslip_id, Payslip.store_id == store_id).first()
    if not p:
        raise HTTPException(status_code=404)
    p.is_published = True
    p.published_at = datetime.now()
    db.commit()
    return {"ok": True}


@router.post("/store/{store_id}/payslips/{payslip_id}/transfer", summary="급여 이체 완료 처리", description="급여 이체 완료로 표시합니다(is_transferred=True).")
def transfer_payslip(
    store_id: int,
    payslip_id: int,
    current_member: Member = Depends(get_current_member_with_refresh),
    db: Session = Depends(get_db),
):
    verify_owner(store_id, current_member.id, db)

    from datetime import datetime
    p = db.query(Payslip).filter(Payslip.id == payslip_id, Payslip.store_id == store_id).first()
    if not p:
        raise HTTPException(status_code=404)
    p.is_transferred = True
    p.transferred_at = datetime.now()
    db.commit()
    return {"ok": True}


@router.get("/store/{store_id}/payslips/months", summary="급여명세서 보유 월 목록", description="급여명세서가 존재하는 연월 목록을 반환합니다. 응답: [{ year, month }]")
def get_payslip_months(
    store_id: int,
    current_member: Member = Depends(get_current_member_with_refresh),
    db: Session = Depends(get_db),
):
    verify_owner(store_id, current_member.id, db)

    from sqlalchemy import distinct
    rows = (
        db.query(distinct(Payslip.year), Payslip.month)
        .filter(Payslip.store_id == store_id)
        .order_by(Payslip.year.desc(), Payslip.month.desc())
        .all()
    )
    return [{"year": r[0], "month": r[1]} for r in rows]


@router.get("/store/{store_id}/payslips/{payslip_id}", summary="급여명세서 단건 조회 (사장용)", description="특정 직원의 급여명세서 상세 정보를 반환합니다.")
def get_payslip(
    store_id: int,
    payslip_id: int,
    current_member: Member = Depends(get_current_member_with_refresh),
    db: Session = Depends(get_db),
):
    verify_owner(store_id, current_member.id, db)

    row = (
        db.query(Payslip, StoreMembers, Member, StaffContract)
        .join(StoreMembers, Payslip.employee_id == StoreMembers.id)
        .join(Member, StoreMembers.member_id == Member.id)
        .outerjoin(StaffContract, StaffContract.store_member_id == StoreMembers.id)
        .filter(Payslip.id == payslip_id, Payslip.store_id == store_id)
        .first()
    )
    if not row:
        raise HTTPException(status_code=404)
    p, sm, m, c = row
    return {
        "id": p.id,
        "employee_id": sm.id,
        "name": m.name,
        "birth": str(m.birth) if m.birth else None,
        "phone": m.phone,
        "bank": sm.bank,
        "account_number": sm.account_number,
        "year": p.year,
        "month": p.month,
        "pay_period_start": str(p.pay_period_start),
        "pay_period_end": str(p.pay_period_end),
        "pay_date": str(p.pay_date) if p.pay_date else None,
        "salary_day": c.salary_day if c else None,
        "employee_type": c.employee_type if c else None,
        "hourly_rate": c.hourly_rate if c else None,
        "work_days": p.work_days,
        "actual_work_minutes": p.actual_work_minutes,
        "overtime_minutes": p.overtime_minutes,
        "night_minutes": p.night_minutes if hasattr(p, 'night_minutes') else 0,
        "holiday_minutes": p.holiday_minutes if hasattr(p, 'holiday_minutes') else 0,
        "weekly_leave_minutes": p.weekly_leave_minutes if hasattr(p, 'weekly_leave_minutes') else 0,
        "base_pay": p.base_pay,
        "overtime_pay": p.overtime_pay,
        "night_pay": p.night_pay,
        "holiday_pay": p.holiday_pay,
        "weekly_leave_pay": p.weekly_leave_pay,
        "other_allowance": p.other_allowance,
        "income_tax": p.income_tax,
        "local_income_tax": p.local_income_tax,
        "national_pension": p.national_pension,
        "health_insurance": p.health_insurance,
        "long_term_care": p.long_term_care,
        "employment_insurance": p.employment_insurance,
        "total_pay": p.total_pay,
        "total_deduction": p.total_deduction,
        "net_pay": p.net_pay,
        "is_published": p.is_published,
        "published_at": str(p.published_at) if p.published_at else None,
        "is_transferred": p.is_transferred,
        "transferred_at": str(p.transferred_at) if p.transferred_at else None,
    }


@router.patch("/store/{store_id}/payslips/{payslip_id}", summary="급여명세서 수정", description="급여 항목(수당, 공제 등)을 수정합니다. body에 변경할 필드만 전달하면 됩니다.")
def update_payslip(
    store_id: int,
    payslip_id: int,
    body: dict,
    current_member: Member = Depends(get_current_member_with_refresh),
    db: Session = Depends(get_db),
):
    verify_owner(store_id, current_member.id, db)

    p = db.query(Payslip).filter(Payslip.id == payslip_id, Payslip.store_id == store_id).first()
    if not p:
        raise HTTPException(status_code=404)
    int_fields = [
        'base_pay', 'overtime_pay', 'night_pay', 'holiday_pay', 'weekly_leave_pay',
        'other_allowance', 'income_tax', 'local_income_tax', 'national_pension',
        'health_insurance', 'long_term_care', 'employment_insurance',
        'total_pay', 'total_deduction', 'net_pay',
    ]
    for f in int_fields:
        if f in body:
            setattr(p, f, int(body[f]))
    db.commit()
    return {"ok": True}


# ===== 스케줄 조회 (사장) =====
@router.get("/store/{store_id}/schedules", summary="월별 스케줄 조회 (사장용)", description="전체 직원의 월별 스케줄을 반환합니다. query: year, month 필수.")
def get_schedules(
    store_id: int,
    year: int,
    month: int,
    current_member: Member = Depends(get_current_member_with_refresh),
    db: Session = Depends(get_db),
):
    from datetime import date as date_cls
    from calendar import monthrange
    verify_owner(store_id, current_member.id, db)

    start = date_cls(year, month, 1)
    end = date_cls(year, month, monthrange(year, month)[1])

    rows = (
        db.query(Schedule, StoreMembers, Member, StoreShift)
        .join(StoreMembers, Schedule.employee_id == StoreMembers.id)
        .join(Member, StoreMembers.member_id == Member.id)
        .outerjoin(StoreShift, Schedule.shift_id == StoreShift.id)
        .filter(
            Schedule.store_id == store_id,
            Schedule.work_date >= start,
            Schedule.work_date <= end,
        )
        .order_by(Schedule.work_date, Schedule.employee_id)
        .all()
    )

    return [{
        "id": s.id,
        "work_date": str(s.work_date),
        "employee_id": sm.id,
        "employee_name": m.name,
        "shift_id": s.shift_id,
        "shift_name": sh.name if sh else None,
        "work_start": str(s.work_start)[:5] if s.work_start else None,
        "work_end": str(s.work_end)[:5] if s.work_end else None,
        "is_holiday": s.is_holiday,
        "is_substitution": s.is_substitution,
    } for s, sm, m, sh in rows]


# ===== 스케줄 단건 추가 =====
@router.post("/store/{store_id}/schedules", summary="스케줄 단건 생성 (사장용)", description="직원 한 명의 특정 날짜 스케줄을 생성합니다.")
def create_schedule(
    store_id: int,
    req: ScheduleCreateReq,
    current_member: Member = Depends(get_current_member_with_refresh),
    db: Session = Depends(get_db),
):
    from datetime import time as time_cls
    verify_owner(store_id, current_member.id, db)

    def parse_time(s):
        return time_cls.fromisoformat(s) if s else None

    schedule = Schedule(
        store_id=store_id,
        employee_id=req.employee_id,
        shift_id=req.shift_id,
        work_date=req.work_date,
        work_start=parse_time(req.work_start),
        work_end=parse_time(req.work_end),
        is_holiday=req.is_holiday,
        is_substitution=req.is_substitution,
    )
    db.add(schedule)
    db.commit()
    db.refresh(schedule)
    return {"id": schedule.id}


# ===== 스케줄 일괄 추가 =====
@router.post("/store/{store_id}/schedules/bulk", summary="스케줄 일괄 생성 (사장용)", description="여러 직원의 스케줄을 한번에 생성합니다. 월간 스케줄 등록 시 사용.")
def create_schedules_bulk(
    store_id: int,
    req: ScheduleBulkCreateReq,
    current_member: Member = Depends(get_current_member_with_refresh),
    db: Session = Depends(get_db),
):
    from datetime import time as time_cls
    verify_owner(store_id, current_member.id, db)

    def parse_time(s):
        return time_cls.fromisoformat(s) if s else None

    created_ids = []
    for item in req.schedules:
        schedule = Schedule(
            store_id=store_id,
            employee_id=item.employee_id,
            shift_id=item.shift_id,
            work_date=item.work_date,
            work_start=parse_time(item.work_start),
            work_end=parse_time(item.work_end),
            is_holiday=item.is_holiday,
            is_substitution=item.is_substitution,
        )
        db.add(schedule)
        db.flush()
        created_ids.append(schedule.id)

    db.commit()
    return {"ids": created_ids, "count": len(created_ids)}


# ===== 스케줄 수정 =====
@router.put("/store/{store_id}/schedules/{schedule_id}", summary="스케줄 수정 (사장용)", description="특정 스케줄의 날짜/시간/shift를 수정합니다.")
def update_schedule(
    store_id: int,
    schedule_id: int,
    req: ScheduleUpdateReq,
    current_member: Member = Depends(get_current_member_with_refresh),
    db: Session = Depends(get_db),
):
    from datetime import time as time_cls
    verify_owner(store_id, current_member.id, db)

    schedule = db.query(Schedule).filter(
        Schedule.id == schedule_id,
        Schedule.store_id == store_id,
    ).first()
    if not schedule:
        raise HTTPException(status_code=404, detail="스케줄을 찾을 수 없습니다.")

    def parse_time(s):
        return time_cls.fromisoformat(s) if s else None

    if req.shift_id is not None:
        schedule.shift_id = req.shift_id
    if req.work_start is not None:
        schedule.work_start = parse_time(req.work_start)
    if req.work_end is not None:
        schedule.work_end = parse_time(req.work_end)
    if req.is_holiday is not None:
        schedule.is_holiday = req.is_holiday
    if req.is_substitution is not None:
        schedule.is_substitution = req.is_substitution

    db.commit()
    return {"ok": True}


# ===== 스케줄 삭제 =====
@router.delete("/store/{store_id}/schedules/{schedule_id}", summary="스케줄 삭제 (사장용)", description="특정 스케줄을 삭제합니다.")
def delete_schedule(
    store_id: int,
    schedule_id: int,
    current_member: Member = Depends(get_current_member_with_refresh),
    db: Session = Depends(get_db),
):
    verify_owner(store_id, current_member.id, db)

    schedule = db.query(Schedule).filter(
        Schedule.id == schedule_id,
        Schedule.store_id == store_id,
    ).first()
    if not schedule:
        raise HTTPException(status_code=404, detail="스케줄을 찾을 수 없습니다.")

    db.delete(schedule)
    db.commit()
    return {"ok": True}


# ===== 직원 가입신청 목록 조회 =====
@router.get("/store/{store_id}/member-requests", summary="직원 가입 요청 목록 (사장용)", description="매장 가입을 신청한 직원 목록을 반환합니다. 대기(pending) 상태 위주.")
def get_member_requests(
    store_id: int,
    current_member: Member = Depends(get_current_member_with_refresh),
    db: Session = Depends(get_db),
):
    verify_owner(store_id, current_member.id, db)

    rows = (
        db.query(MemberRequest, Member)
        .join(Member, Member.id == MemberRequest.member_id)
        .filter(
            MemberRequest.store_id == store_id,
            MemberRequest.status == "pending",
        )
        .order_by(MemberRequest.created_at.desc())
        .all()
    )
    return [{
        "id": req.id,
        "member_id": member.id,
        "name": member.name,
        "phone": member.phone,
        "gender": member.gender,
        "birth": str(member.birth) if member.birth else None,
        "bank": req.bank,
        "account_name": req.account_name,
        "account_number": req.account_number,
        "created_at": str(req.created_at),
    } for req, member in rows]


# ===== 직원 가입신청 승인/거절 =====
def _process_member_request(store_id: int, req_id: int, new_status: str, current_member: Member, db: Session):
    """가입 신청 승인/거절 공통 로직"""
    verify_owner(store_id, current_member.id, db)

    req = db.query(MemberRequest).filter(
        MemberRequest.id == req_id,
        MemberRequest.store_id == store_id,
    ).first()
    if not req:
        raise HTTPException(status_code=404, detail="가입신청을 찾을 수 없습니다.")

    if new_status not in ("approved", "rejected"):
        raise HTTPException(status_code=400, detail="status는 approved 또는 rejected만 가능합니다.")

    req.status = new_status

    if new_status == "approved":
        existing = db.query(StoreMembers).filter(
            StoreMembers.store_id == store_id,
            StoreMembers.member_id == req.member_id,
        ).first()
        if existing:
            existing.is_deleted = False
            existing.bank = req.bank
            existing.account_name = req.account_name
            existing.account_number = req.account_number
        else:
            sm = StoreMembers(
                store_id=store_id,
                member_id=req.member_id,
                role="employee",
                bank=req.bank,
                account_name=req.account_name,
                account_number=req.account_number,
            )
            db.add(sm)
            db.flush()
            db.add(StaffContract(store_member_id=sm.id))

    db.commit()
    return {"ok": True}


@router.put("/store/{store_id}/member-requests/{req_id}", summary="직원 가입 요청 승인/거절 (사장용) - 레거시", description="요청: { status: 'approved'|'rejected' }. 신규는 /accept, /reject 사용 권장.")
def handle_member_request(
    store_id: int,
    req_id: int,
    body: dict,
    current_member: Member = Depends(get_current_member_with_refresh),
    db: Session = Depends(get_db),
):
    return _process_member_request(store_id, req_id, body.get("status"), current_member, db)


@router.post("/store/{store_id}/member-requests/{req_id}/accept", summary="직원 가입 요청 승인 (사장용)", description="가입 신청을 승인합니다. 승인 시 StoreMembers 레코드 + StaffContract 생성됩니다.")
def accept_member_request(
    store_id: int,
    req_id: int,
    current_member: Member = Depends(get_current_member_with_refresh),
    db: Session = Depends(get_db),
):
    return _process_member_request(store_id, req_id, "approved", current_member, db)


@router.post("/store/{store_id}/member-requests/{req_id}/reject", summary="직원 가입 요청 거절 (사장용)", description="가입 신청을 거절합니다.")
def reject_member_request(
    store_id: int,
    req_id: int,
    current_member: Member = Depends(get_current_member_with_refresh),
    db: Session = Depends(get_db),
):
    return _process_member_request(store_id, req_id, "rejected", current_member, db)
