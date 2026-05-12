import os
import httpx
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session, joinedload
from pathlib import Path
from dotenv import load_dotenv
import uuid

from sqlalchemy import func
from models import (
    BusinessRequest, Store, StoreSetting, StoreShift,
    StoreMembers, StaffContract, Member, StoreMap,
    Schedule, WorkLog, DailyClosingReport, WorkLogChangeRequest,
    ScheduleChangeRequest, Notification, Payslip,
)
from database import get_db
from schemas.owner import (
    StoreInfoUpdateReq, NicknameUpdateReq,
    DeleteStoreReq, ShiftUpdateItem, StaffContractUpdateReq,
)
from utils.utils import create_store_code, get_coords_from_address
from routers.auth import get_current_member_with_refresh

ENV_PATH = Path(__file__).resolve().parent.parent.parent / ".env"
load_dotenv(ENV_PATH)

BUSINESS_KEY = os.getenv("VITE_BUSINESS_API_KEY")

router = APIRouter(prefix="/api/owner", tags=["사장"])

UPLOAD_DIR = "uploads/business_registrations/"
os.makedirs(UPLOAD_DIR, exist_ok=True)


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
@router.get("/business/{bno}")
async def verify_business(bno: str):
    async with httpx.AsyncClient() as client:
        res = await client.post(
            "https://api.odcloud.kr/api/nts-businessman/v1/status",
            params={"serviceKey": BUSINESS_KEY},
            json={"b_no": [bno]},
        )
    return res.json()


# ===== 매장 등록 신청 =====
@router.post("/stores")
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
    ext = os.path.splitext(image.filename)[1]
    filename = f"{uuid.uuid4()}{ext}"
    content = await image.read()

    try:
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
        ))
        db.commit()
        with open(os.path.join(UPLOAD_DIR, filename), "wb") as f:
            f.write(content)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="데이터 저장 중 오류가 발생했습니다.")


# ===== 매장 정보 조회 =====
@router.get("/store/{store_id}")
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
@router.put("/store/update")
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
@router.put("/store/{store_id}/setting")
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
@router.put("/store/{store_id}/attendance-standard")
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
@router.put("/store/{store_id}/shifts")
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
@router.get("/store/{store_id}/attendance/today")
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
@router.get("/store/{store_id}/staffs")
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
            "salary_cycle": s.contract.salary_cycle if s.contract else None,
            "salary_day": s.contract.salary_day if s.contract else None,
            "hourly_rate": s.contract.hourly_rate if s.contract else None,
            "memo": s.contract.memo if s.contract else None,
            "resume": s.contract.resume if s.contract else None,
            "employment_contract": s.contract.employment_contract if s.contract else None,
            "health_certificate": s.contract.health_certificate if s.contract else None,
        } if s.contract else None,
    } for s in staff]


# ===== 직원 상세 =====
@router.get("/store/{store_id}/staff/{staff_id}")
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
@router.put("/store/{store_id}/staff/{staff_id}/contract")
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

    for field, value in req.model_dump(exclude_none=True).items():
        setattr(contract, field, value)

    db.commit()
    return {"ok": True}


# ===== 사장 마이페이지 - 내 매장 목록 =====
@router.get("/mypage/{member_id}/stores")
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
@router.get("/mypage/{member_id}/info")
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
        "nickname": sm.nickname,
        "birth": str(member.birth) if member.birth else None,
        "gender": "여자" if member.gender == "female" else "남자",
        "phone": member.phone,
        "joined_at": str(sm.joined_at),
        "store_name": store.name,
        "image": sm.image_url,
    }


# ===== 사장 닉네임 수정 =====
@router.put("/mypage/{store_id}/nickname")
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
@router.delete("/store/delete")
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


# ===== 마감 보고 조회 (사장) =====
@router.get("/store/{store_id}/closing-reports")
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
@router.put("/store/{store_id}/closing-reports/{report_id}")
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
@router.get("/store/{store_id}/worklog-requests")
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


@router.put("/store/{store_id}/worklog-requests/{req_id}")
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
@router.get("/store/{store_id}/schedule-requests")
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


@router.put("/store/{store_id}/schedule-requests/{req_id}")
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

@router.get("/store/{store_id}/payslips")
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


@router.post("/store/{store_id}/payslips/{payslip_id}/publish")
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


@router.post("/store/{store_id}/payslips/{payslip_id}/transfer")
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


@router.get("/store/{store_id}/payslips/months")
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


@router.get("/store/{store_id}/payslips/{payslip_id}")
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


@router.patch("/store/{store_id}/payslips/{payslip_id}")
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
