import os
import base64
import uuid
from collections import defaultdict
from calendar import monthrange
from datetime import datetime, timedelta, date
from typing import Optional
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from sqlalchemy import extract
from sqlalchemy.orm import Session, joinedload

from models import (
    Member, Store, StoreMap, MemberRequest, StoreMembers,
    StoreTodo, Schedule, StoreCommunity,
    WorkLog, StaffContract, ScheduleChangeRequest,
    DailyClosingReport, WorkLogChangeRequest, StoreShift, Payslip,
)
from database import get_db
from schemas.employee import (
    VerifyCode, MemberRequestSchema,
    StoreIdReq, TodoModifyReq,
    ClosingReportReq, WorkTimeReq, WorkLogsReq,
    WorkLogChangeReq, ScheduleChangeReq,
)
from utils.utils import format_phone_number, get_coords_from_address
from routers.auth import get_current_member_with_refresh

router = APIRouter(prefix="/api/employee", tags=["직원"])

for _dir in ["uploads/closing/", "uploads/profile/", "uploads/documents/"]:
    os.makedirs(_dir, exist_ok=True)

CLOSING_DIR = "uploads/closing/"
PROFILE_DIR = "uploads/profile/"
DOCUMENT_DIR = "uploads/documents/"


def get_employee_or_404(db: Session, store_id: int, member_id: int) -> StoreMembers:
    emp = db.query(StoreMembers).filter(
        StoreMembers.store_id == store_id,
        StoreMembers.member_id == member_id,
    ).first()
    if not emp:
        raise HTTPException(status_code=404, detail="직원 정보를 찾을 수 없습니다.")
    return emp


def verify_store_member(store_id: int, member_id: int, db: Session) -> StoreMembers:
    """요청자가 해당 매장의 구성원(사장 또는 직원)인지 검증"""
    sm = db.query(StoreMembers).filter(
        StoreMembers.store_id == store_id,
        StoreMembers.member_id == member_id,
        StoreMembers.is_deleted == False,
    ).first()
    if not sm:
        raise HTTPException(status_code=403, detail="해당 매장의 구성원만 접근 가능합니다.")
    return sm


async def save_file(file: UploadFile, upload_dir: str) -> str:
    ext = os.path.splitext(file.filename)[1]
    filename = f"{uuid.uuid4()}{ext}"
    with open(os.path.join(upload_dir, filename), "wb") as f:
        f.write(await file.read())
    return f"/{upload_dir}{filename}"


# ======= 매장코드 조회 =======
@router.post("/verify-code",
    summary="매장코드 확인",
    description="매장 코드를 검색해 매장 정보를 반환합니다.",
    responses={200: {"content": {"application/json": {"example": {
        "id": 5,
        "name": "노량물산",
        "address": "서울 동작구 노량진로 100 2층",
        "phone": "02-1234-5678",
        "lat": 37.513,
        "lng": 126.942
    }}}}},
)
async def verify_store_code(req: VerifyCode, db: Session = Depends(get_db)):
    store = db.query(Store).filter(Store.code == req.code).first()
    if not store:
        raise HTTPException(status_code=404, detail="조회되지 않는 매장 코드에요")

    store_map = db.query(StoreMap).filter(StoreMap.store_id == store.id).first()
    full_address = " ".join(filter(None, [store.address, store.address_detail]))

    if not store_map:
        lat, lng = await get_coords_from_address(store.address)
        store_map = StoreMap(store_id=store.id, lat=lat, lng=lng)
        db.add(store_map)
        db.commit()
        db.refresh(store_map)

    return {
        "id": store.id,
        "name": store.name,
        "address": full_address,
        "phone": format_phone_number(store.phone),
        "lat": float(store_map.lat),
        "lng": float(store_map.lng),
    }


# ======= 가입신청 =======
@router.post("/member/request", summary="매장 가입 신청", description="직원이 매장 코드로 가입을 신청합니다. 요청: { store_id, bank, account_name, account_number }")
async def add_member_request(
    req: MemberRequestSchema,
    current_member: Member = Depends(get_current_member_with_refresh),
    db: Session = Depends(get_db),
):
    try:
        db.add(MemberRequest(
            store_id=req.store_id,
            member_id=current_member.id,
            bank=req.bank,
            account_name=req.account_name,
            account_number=req.account_number,
        ))
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="데이터 저장 중 오류가 발생했습니다.")


# ======= 오늘 근무일정 =======
@router.post("/work/today",
    summary="오늘 근무 일정 조회",
    description="오늘 날짜의 근무 시작/종료 시간을 반환합니다.",
    responses={200: {"content": {"application/json": {"example": {
        "work_start": "17:00",
        "work_end": "22:00"
    }}}}},
)
async def get_today_work(
    req: StoreIdReq,
    current_member: Member = Depends(get_current_member_with_refresh),
    db: Session = Depends(get_db),
):
    employee = get_employee_or_404(db, req.store_id, current_member.id)
    today = datetime.now(ZoneInfo("Asia/Seoul")).date()

    sched = db.query(Schedule).filter(
        Schedule.employee_id == employee.id,
        Schedule.work_date == today,
    ).first()

    if not sched:
        raise HTTPException(status_code=404, detail="오늘 예정된 근무 일정이 없습니다.")

    return {
        "work_start": str(sched.work_start)[:5] if sched.work_start else None,
        "work_end": str(sched.work_end)[:5] if sched.work_end else None,
    }


# ======= 근무 상태 =======
@router.post("/work/status",
    summary="오늘 근무 상태 조회",
    description="""오늘 근무 기록 상태를 반환합니다.

**status 값**:
- `working`: 근무 중 (출근 후)
- `on_break`: 휴게 중
- `off_work`: 퇴근 완료
- `null`: 출근 전""",
    responses={200: {"content": {"application/json": {"example": {"status": "working"}}}}},
)
async def get_work_status(
    req: StoreIdReq,
    current_member: Member = Depends(get_current_member_with_refresh),
    db: Session = Depends(get_db),
):
    employee = get_employee_or_404(db, req.store_id, current_member.id)
    today = datetime.now(ZoneInfo("Asia/Seoul")).date()

    log = db.query(WorkLog).filter(
        WorkLog.employee_id == employee.id,
        WorkLog.work_date == today,
    ).order_by(WorkLog.work_date.desc()).first()

    return {"status": log.status if log else None}


# ======= 체크리스트 조회 =======
@router.post("/todo", summary="체크리스트 조회", description="공용 체크리스트 + 개인 체크리스트를 합쳐 반환. 요청: { store_id }. 응답: [{ id, content, is_achieved }]")
async def get_todo_list(
    req: StoreIdReq,
    current_member: Member = Depends(get_current_member_with_refresh),
    db: Session = Depends(get_db),
):
    employee = get_employee_or_404(db, req.store_id, current_member.id)
    today = datetime.now(ZoneInfo("Asia/Seoul")).date()

    common = db.query(StoreTodo).filter(
        StoreTodo.store_id == req.store_id,
        StoreTodo.type == "public",
    ).order_by(StoreTodo.is_achieved).all()

    personal = db.query(StoreTodo).filter(
        StoreTodo.store_id == req.store_id,
        StoreTodo.employee_id == employee.id,
        StoreTodo.created_at == today,
    ).order_by(StoreTodo.is_achieved).all()

    all_todos = sorted(common + personal, key=lambda x: x.is_achieved)
    return [{"id": t.id, "content": t.content, "is_achieved": t.is_achieved} for t in all_todos]


# ======= 체크리스트 상태변경 =======
@router.post("/todo/modify", summary="체크리스트 완료 토글", description="체크리스트 항목의 완료 상태를 토글합니다. 요청: { store_id, id }")
async def modify_todo(
    req: TodoModifyReq,
    current_member: Member = Depends(get_current_member_with_refresh),
    db: Session = Depends(get_db),
):
    employee = get_employee_or_404(db, req.store_id, current_member.id)
    today = datetime.now(ZoneInfo("Asia/Seoul")).date()

    todo = db.query(StoreTodo).filter(
        StoreTodo.store_id == req.store_id,
        StoreTodo.id == req.id,
    ).first()
    if not todo:
        raise HTTPException(status_code=404, detail="항목을 찾을 수 없습니다.")

    todo.is_achieved = not todo.is_achieved
    db.commit()

    common = db.query(StoreTodo).filter(
        StoreTodo.store_id == req.store_id, StoreTodo.type == "public"
    ).order_by(StoreTodo.is_achieved).all()
    personal = db.query(StoreTodo).filter(
        StoreTodo.store_id == req.store_id,
        StoreTodo.employee_id == employee.id,
        StoreTodo.created_at == today,
    ).order_by(StoreTodo.is_achieved).all()

    all_todos = sorted(common + personal, key=lambda x: x.is_achieved)
    return [{"id": t.id, "content": t.content, "is_achieved": t.is_achieved} for t in all_todos]


# ======= 공지사항 =======
@router.post("/notice", summary="공지사항 목록 조회 (홈용)", description="홈 화면용 최근 공지 2개 반환. 요청: { store_id }. 응답: [{ id, writer, title, created_at }]")
async def get_notice_list(
    req: StoreIdReq,
    current_member: Member = Depends(get_current_member_with_refresh),
    db: Session = Depends(get_db),
):
    verify_store_member(req.store_id, current_member.id, db)

    notices = (
        db.query(StoreCommunity, Member.name)
        .join(StoreMembers, StoreMembers.id == StoreCommunity.employee_id)
        .join(Member, Member.id == StoreMembers.member_id)
        .filter(StoreCommunity.store_id == req.store_id, StoreCommunity.category == "공지사항")
        .order_by(StoreCommunity.created_at.desc())
        .limit(2)
        .all()
    )
    return [{"id": n.id, "writer": name, "title": n.title, "created_at": n.created_at} for n, name in notices]


# ======= 이번주 근무일정 =======
@router.post("/work", summary="이번 주 근무 일정 조회", description="이번 주 월~일 근무 스케줄을 반환합니다. 요청: { store_id }")
async def get_weekly_work(
    req: StoreIdReq,
    current_member: Member = Depends(get_current_member_with_refresh),
    db: Session = Depends(get_db),
):
    employee = get_employee_or_404(db, req.store_id, current_member.id)

    today = datetime.now(ZoneInfo("Asia/Seoul")).date()
    monday = today - timedelta(days=today.weekday())
    sunday = monday + timedelta(days=6)

    schedules = db.query(Schedule).filter(
        Schedule.employee_id == employee.id,
        Schedule.store_id == req.store_id,
        Schedule.work_date >= monday,
        Schedule.work_date <= sunday,
    ).order_by(Schedule.work_date).all()

    day_map = {}
    for s in schedules:
        key = s.work_date.isoformat()
        dow = (s.work_date.weekday() + 1) % 7   # JS 기준 0=일
        if key not in day_map:
            day_map[key] = {
                "work_date": key,
                "day_of_week": dow,
                "work_start": str(s.work_start)[:5] if s.work_start else None,
                "work_end": str(s.work_end)[:5] if s.work_end else None,
                "is_holiday": s.is_holiday,
            }
        else:
            if s.work_end and (
                day_map[key]["work_end"] is None
                or s.work_end > datetime.strptime(day_map[key]["work_end"], "%H:%M").time()
            ):
                day_map[key]["work_end"] = str(s.work_end)[:5]

    return list(day_map.values())


# ======= 이번달 급여 미리보기 =======
@router.post("/salary/preview", summary="이번 달 급여 미리보기", description="이번 달 근무 기록 기반 예상 급여를 반환합니다. 요청: { store_id }")
async def get_salary_preview(
    req: StoreIdReq,
    current_member: Member = Depends(get_current_member_with_refresh),
    db: Session = Depends(get_db),
):
    employee = get_employee_or_404(db, req.store_id, current_member.id)
    now = datetime.now(ZoneInfo("Asia/Seoul"))
    year, month = now.year, now.month

    logs = db.query(WorkLog).filter(
        WorkLog.employee_id == employee.id,
        WorkLog.store_id == req.store_id,
        WorkLog.end_time.isnot(None),
        extract("year", WorkLog.work_date) == year,
        extract("month", WorkLog.work_date) == month,
    ).all()

    contract = db.query(StaffContract).filter(StaffContract.store_member_id == employee.id).first()
    if not contract or not contract.hourly_rate:
        raise HTTPException(status_code=404, detail="시급 정보가 없습니다.")

    hourly_rate = contract.hourly_rate
    total_seconds = overtime_seconds = 0

    for log in logs:
        # 해당 날짜 스케줄로 예정 시간 계산
        sched = db.query(Schedule).filter(
            Schedule.employee_id == employee.id,
            Schedule.store_id == req.store_id,
            Schedule.work_date == log.work_date,
        ).first()
        if not sched or not sched.work_start or not sched.work_end:
            continue

        kst = ZoneInfo("Asia/Seoul")
        sched_start = datetime.combine(log.work_date, sched.work_start, tzinfo=kst)
        sched_end = datetime.combine(log.work_date, sched.work_end, tzinfo=kst)
        actual_end = log.end_time.astimezone(kst) if log.end_time else None
        if not actual_end:
            continue

        ot_threshold = sched_end + timedelta(minutes=30)
        total_seconds += (sched_end - sched_start).total_seconds()
        if actual_end > ot_threshold:
            overtime_seconds += (actual_end - ot_threshold).total_seconds()

    total_hours = total_seconds / 3600
    overtime_hours = overtime_seconds / 3600
    estimated_salary = int(total_hours * hourly_rate) + int(overtime_hours * hourly_rate * 0.5)

    return {"total_hours": round(total_hours, 2), "estimated_salary": estimated_salary}


# ======= 특정 스케줄 변경 요청 조회 (알림 클릭용) =======
@router.get("/schedule-change/{id}", summary="스케줄 변경 요청 단건 조회", description="알림 클릭 시 특정 스케줄 변경 요청 상세 조회. 응답: id, type, status, origin_date, desired_date 등")
def get_schedule_change_by_id(
    id: int,
    current_member: Member = Depends(get_current_member_with_refresh),
    db: Session = Depends(get_db),
):
    change = db.query(ScheduleChangeRequest).filter(ScheduleChangeRequest.id == id).first()
    if not change:
        raise HTTPException(status_code=404, detail="요청을 찾을 수 없습니다.")
    return {
        "id": change.id,
        "type": change.type,
        "status": change.status,
        "origin_date": str(change.origin_date) if change.origin_date else None,
        "origin_start": str(change.origin_start)[:5] if change.origin_start else None,
        "origin_end": str(change.origin_end)[:5] if change.origin_end else None,
        "desired_date": str(change.desired_date),
        "desired_start": str(change.desired_start)[:5] if change.desired_start else None,
        "desired_end": str(change.desired_end)[:5] if change.desired_end else None,
        "reason": change.reason,
        "created_at": str(change.created_at),
    }


# ======= 특정 추가 스케줄 조회 (알림 클릭용) =======
@router.get("/schedule-work/{id}", summary="스케줄 단건 조회", description="알림 클릭용. 스케줄 id로 특정 근무 일정을 조회합니다.")
def get_schedule_work_by_id(
    id: int,
    current_member: Member = Depends(get_current_member_with_refresh),
    db: Session = Depends(get_db),
):
    sched = db.query(Schedule).options(joinedload(Schedule.shift)).filter(Schedule.id == id).first()
    if not sched:
        raise HTTPException(status_code=404, detail="스케줄을 찾을 수 없습니다.")
    return {
        "id": sched.id,
        "work_date": str(sched.work_date),
        "work_start": str(sched.work_start)[:5] if sched.work_start else None,
        "work_end": str(sched.work_end)[:5] if sched.work_end else None,
        "shift_name": sched.shift.name if sched.shift else None,
        "is_holiday": sched.is_holiday,
        "is_substitution": sched.is_substitution,
    }


# ======= 일정변경 요청 내역 =======
@router.get("/schedule/change", summary="스케줄 변경 요청 목록 조회", description="내 스케줄 변경 요청 전체 이력을 반환합니다. query: store_id")
def get_schedule_changes(
    store_id: int,
    current_member: Member = Depends(get_current_member_with_refresh),
    db: Session = Depends(get_db),
):
    employee = get_employee_or_404(db, store_id, current_member.id)
    requests = db.query(ScheduleChangeRequest).filter(
        ScheduleChangeRequest.store_id == store_id,
        ScheduleChangeRequest.employee_id == employee.id,
        ScheduleChangeRequest.is_deleted == False,
    ).order_by(ScheduleChangeRequest.created_at.desc()).all()

    return [{
        "id": r.id,
        "type": r.type,
        "status": r.status,
        "origin_date": str(r.origin_date) if r.origin_date else None,
        "origin_start": str(r.origin_start)[:5] if r.origin_start else None,
        "origin_end": str(r.origin_end)[:5] if r.origin_end else None,
        "desired_date": str(r.desired_date),
        "desired_start": str(r.desired_start)[:5] if r.desired_start else None,
        "desired_end": str(r.desired_end)[:5] if r.desired_end else None,
        "reason": r.reason,
        "created_at": str(r.created_at),
    } for r in requests]


@router.post("/schedule/change", summary="스케줄 변경 요청 생성", description="직원이 스케줄 변경/추가/삭제를 사장에게 요청합니다. 요청: { store_id, type, origin_date?, desired_date, reason }")
async def create_schedule_change(
    req: ScheduleChangeReq,
    current_member: Member = Depends(get_current_member_with_refresh),
    db: Session = Depends(get_db),
):
    from datetime import time as time_type
    employee = get_employee_or_404(db, req.store_id, current_member.id)
    def parse_time(s): return time_type.fromisoformat(s) if s else None
    change = ScheduleChangeRequest(
        store_id=req.store_id,
        employee_id=employee.id,
        type=req.type,
        origin_date=req.origin_date,
        origin_start=parse_time(req.origin_start),
        origin_end=parse_time(req.origin_end),
        desired_date=req.desired_date,
        desired_start=parse_time(req.desired_start),
        desired_end=parse_time(req.desired_end),
        reason=req.reason,
        status="pending",
    )
    db.add(change)
    db.commit()
    db.refresh(change)
    return {"id": change.id}


@router.delete("/schedule/change/{id}", summary="스케줄 변경 요청 취소", description="pending 상태인 내 스케줄 변경 요청을 취소(소프트 삭제)합니다.")
def delete_schedule_change(
    id: int,
    current_member: Member = Depends(get_current_member_with_refresh),
    db: Session = Depends(get_db),
):
    change = db.query(ScheduleChangeRequest).filter(ScheduleChangeRequest.id == id).first()
    if not change:
        raise HTTPException(status_code=404, detail="요청을 찾을 수 없습니다.")

    emp = db.query(StoreMembers).filter(
        StoreMembers.id == change.employee_id,
        StoreMembers.member_id == current_member.id,
    ).first()
    if not emp:
        raise HTTPException(status_code=403, detail="삭제 권한이 없습니다.")

    change.is_deleted = True
    db.commit()
    return {"success": True}


# ======= 월별 개인 스케줄 =======
@router.get("/schedule/{store_id}", summary="월별 내 스케줄 조회", description="해당 월의 내 근무 일정을 날짜별로 반환합니다. query: year, month. 응답: { '2025-5-1': { work_start, work_end, is_holiday, shift_name } }")
async def get_schedule(
    store_id: int,
    year: int,
    month: int,
    current_member: Member = Depends(get_current_member_with_refresh),
    db: Session = Depends(get_db),
):
    employee = get_employee_or_404(db, store_id, current_member.id)
    start = date(year, month, 1)
    end = date(year, month, monthrange(year, month)[1])

    schedules = db.query(Schedule).options(joinedload(Schedule.shift)).filter(
        Schedule.store_id == store_id,
        Schedule.employee_id == employee.id,
        Schedule.work_date >= start,
        Schedule.work_date <= end,
    ).all()

    return {
        f"{s.work_date.year}-{s.work_date.month}-{s.work_date.day}": {
            "work_start": str(s.work_start)[:5] if s.work_start else None,
            "work_end": str(s.work_end)[:5] if s.work_end else None,
            "is_holiday": s.is_holiday,
            "shift_name": s.shift.name if s.shift else None,
        }
        for s in schedules
    }


# ======= 날짜별 전체 직원 스케줄 =======
@router.get("/schedule/{store_id}/detail", summary="특정 날짜 전체 직원 스케줄 (shift별)", description="특정 날짜에 해당 매장의 모든 직원 스케줄을 shift별로 그룹핑해 반환합니다. query: year, month, day")
def get_schedule_detail(
    store_id: int, year: int, month: int, day: int,
    current_member: Member = Depends(get_current_member_with_refresh),
    db: Session = Depends(get_db),
):
    verify_store_member(store_id, current_member.id, db)
    target = date(year, month, day)
    schedules = db.query(Schedule).options(
        joinedload(Schedule.shift),
        joinedload(Schedule.employee).joinedload(StoreMembers.member),
    ).filter(
        Schedule.store_id == store_id,
        Schedule.work_date == target,
        Schedule.is_holiday == False,
    ).all()

    shift_map: dict = {}
    for s in schedules:
        if not s.shift:
            continue
        sid = s.shift.id
        if sid not in shift_map:
            shift_map[sid] = {
                "shift_id": sid,
                "shift_name": s.shift.name,
                "sort_order": s.shift.sort_order,
                "start_time": str(s.shift.start_time)[:5] if s.shift.start_time else None,
                "end_time": str(s.shift.end_time)[:5] if s.shift.end_time else None,
                "employees": [],
            }
        shift_map[sid]["employees"].append({"id": s.employee.id, "name": s.employee.member.name})

    return sorted(shift_map.values(), key=lambda x: x["sort_order"])


# ======= 월별 전체 직원 스케줄 요약 =======
@router.get("/schedule/{store_id}/all", summary="월별 전체 직원 스케줄 요약", description="달력용. 날짜별로 shift_name: 인원수 형태로 반환. query: year, month")
def get_all_schedule(
    store_id: int, year: int, month: int,
    current_member: Member = Depends(get_current_member_with_refresh),
    db: Session = Depends(get_db),
):
    verify_store_member(store_id, current_member.id, db)
    start = date(year, month, 1)
    end = date(year, month, monthrange(year, month)[1])

    schedules = db.query(Schedule).options(joinedload(Schedule.shift)).filter(
        Schedule.store_id == store_id,
        Schedule.is_holiday == False,
        Schedule.work_date >= start,
        Schedule.work_date <= end,
    ).all()

    summary: dict = {}
    for s in schedules:
        key = f"{s.work_date.year}-{s.work_date.month}-{s.work_date.day}"
        if key not in summary:
            summary[key] = {}
        if s.shift:
            summary[key][s.shift.name] = summary[key].get(s.shift.name, 0) + 1

    return summary


# ======= 마감 보고 =======
@router.post("/closing-report", summary="마감 보고 제출", description="직원이 마감 보고를 제출합니다. 카드/현금/이체/상품권 매출, 할인/환불/실시갈, 영수증 이미지, 메모 포함.")
def add_closing_report(
    req: ClosingReportReq,
    current_member: Member = Depends(get_current_member_with_refresh),
    db: Session = Depends(get_db),
):
    employee = get_employee_or_404(db, req.store_id, current_member.id)
    saved_image_path = None

    if req.receipt_image_url and req.receipt_image_url.startswith("data:image"):
        try:
            header, encoded = req.receipt_image_url.split(",", 1)
            ext = header.split("/")[1].split(";")[0]
            filename = f"{uuid.uuid4()}.{ext}"
            with open(os.path.join(CLOSING_DIR, filename), "wb") as f:
                f.write(base64.b64decode(encoded))
            saved_image_path = f"/uploads/closing/{filename}"
        except Exception as e:
            print(f"이미지 저장 실패: {e}")

    db.add(DailyClosingReport(
        store_id=req.store_id,
        employee_id=employee.id,
        report_date=req.report_date,
        card_sales=req.card_sales,
        cash_sales=req.cash_sales,
        transfer_sales=req.transfer_sales,
        gift_sales=req.gift_sales,
        discount_amount=req.discount_amount,
        refund_amount=req.refund_amount,
        cash_on_hand=req.cash_on_hand,
        receipt_image_url=saved_image_path,
        manager_note=req.manager_note,
    ))
    db.commit()
    return {"message": "마감 보고가 완료되었습니다."}


@router.get("/closing-report/check", summary="오늘 마감 보고 여부 확인", description="오늘 날짜 마감 보고가 이미 제출됐는지 확인. query: store_id. 응답: { is_completed: bool }")
def check_closing_status(
    store_id: int,
    current_member: Member = Depends(get_current_member_with_refresh),
    db: Session = Depends(get_db),
):
    today = datetime.now(ZoneInfo("Asia/Seoul")).date()
    exists = db.query(DailyClosingReport).filter(
        DailyClosingReport.store_id == store_id,
        DailyClosingReport.report_date == today,
    ).first()
    return {"is_completed": bool(exists)}


# ======= 마이페이지 =======
@router.get("/mypage",
    summary="직원 내 정보 조회",
    description="직원 마이페이지 정보. query: store_id 필수.",
    responses={200: {"content": {"application/json": {"example": {
        "name": "홍길동",
        "birth": "1995.03.15",
        "age": 30,
        "gender": "남자",
        "phone": "01012345678",
        "image_url": "/uploads/profile/abc.jpg",
        "bank": "국민은행",
        "account_number": "123-456-789012",
        "joined_at": "2025.01.10",
        "days_since_joined": 125,
        "store_name": "노량물산",
        "role": "employee",
        "employee_type": "정직원",
        "salary_cycle": "월 1회 (월급)",
        "salary_day": "25일",
        "hourly_rate": 11000,
        "is_probation": False,
        "deduction_type": "percent",
        "income_tax": 3.3,
        "national_pension": 4.5,
        "health_insurance": 3.545,
        "resume": "/uploads/documents/resume.pdf",
        "employment_contract": None,
        "health_certificate": None,
        "schedule": [
            {"day": "화", "time": "17:00 ~ 22:00", "tags": ["마감"]},
            {"day": "목", "time": "08:00 ~ 14:00", "tags": ["오픈"]}
        ]
    }}}}},
)
def get_my_info(
    store_id: int,
    current_member: Member = Depends(get_current_member_with_refresh),
    db: Session = Depends(get_db),
):
    employee = get_employee_or_404(db, store_id, current_member.id)

    result = (
        db.query(StoreMembers, Member, StaffContract)
        .join(Member, StoreMembers.member_id == Member.id)
        .outerjoin(StaffContract, StaffContract.store_member_id == StoreMembers.id)
        .filter(StoreMembers.id == employee.id)
        .first()
    )
    if not result:
        raise HTTPException(status_code=404, detail="직원 정보를 찾을 수 없습니다.")

    sm, member, contract = result
    store = db.query(Store).filter(Store.id == store_id).first()

    age = None
    if member.birth:
        today = date.today()
        age = today.year - member.birth.year - (
            (today.month, today.day) < (member.birth.month, member.birth.day)
        )

    days_since_joined = (date.today() - sm.joined_at.date()).days + 1
    day_names = {1: "월", 2: "화", 3: "수", 4: "목", 5: "금", 6: "토", 7: "일"}

    shifts = db.query(StoreShift).filter(
        StoreShift.store_id == store_id, StoreShift.is_active == True
    ).order_by(StoreShift.sort_order).all()

    schedules = (
        db.query(Schedule, StoreShift)
        .outerjoin(StoreShift, Schedule.shift_id == StoreShift.id)
        .filter(
            Schedule.employee_id == employee.id,
            Schedule.store_id == store_id,
            Schedule.is_holiday == False,
        )
        .order_by(Schedule.work_date)
        .all()
    )

    day_map = defaultdict(lambda: {"day": "", "time": "", "tags": []})
    for work, shift in schedules:
        if not work.work_start or not work.work_end:
            continue
        key = work.work_date.weekday() + 1
        if not day_map[key]["day"]:
            day_map[key]["day"] = day_names[key]
            day_map[key]["time"] = f"{work.work_start.strftime('%H:%M')} ~ {work.work_end.strftime('%H:%M')}"
        else:
            cur_end = day_map[key]["time"].split(" ~ ")[1]
            new_end = work.work_end.strftime("%H:%M")
            if new_end > cur_end:
                start = day_map[key]["time"].split(" ~ ")[0]
                day_map[key]["time"] = f"{start} ~ {new_end}"

        if shift and shift.name not in day_map[key]["tags"]:
            day_map[key]["tags"].append(shift.name)

    return {
        "name": member.name,
        "birth": member.birth.strftime("%Y.%m.%d") if member.birth else None,
        "age": age,
        "gender": "남자" if member.gender == "male" else "여자",
        "phone": member.phone,
        "image_url": sm.image_url or member.image_url,
        "bank": sm.bank,
        "account_number": sm.account_number,
        "joined_at": sm.joined_at.strftime("%Y.%m.%d"),
        "days_since_joined": days_since_joined,
        "store_name": store.name if store else None,
        "role": sm.role,
        "employee_type": contract.employee_type if contract else None,
        "salary_cycle": contract.salary_cycle if contract else None,
        "salary_day": contract.salary_day if contract else None,
        "hourly_rate": contract.hourly_rate if contract else None,
        "is_probation": contract.is_probation if contract else False,
        "deduction_type": contract.deduction_type if contract else "percent",
        "income_tax": float(contract.income_tax) if contract and contract.income_tax else None,
        "local_income_tax": float(contract.local_income_tax) if contract and contract.local_income_tax else None,
        "national_pension": float(contract.national_pension) if contract and contract.national_pension else None,
        "health_insurance": float(contract.health_insurance) if contract and contract.health_insurance else None,
        "long_term_care": float(contract.long_term_care) if contract and contract.long_term_care else None,
        "employment_insurance": float(contract.employment_insurance) if contract and contract.employment_insurance else None,
        "industrial_accident": float(contract.industrial_accident) if contract and contract.industrial_accident else None,
        "resume": contract.resume if contract else None,
        "employment_contract": contract.employment_contract if contract else None,
        "health_certificate": contract.health_certificate if contract else None,
        "schedule": [day_map[k] for k in sorted(day_map.keys())],
    }


@router.post("/mypage/edit",
    summary="직원 내 정보 수정",
    description="multipart/form-data. 필드: bank, account_number, store_id(필수-겸직대응), name?, image?(파일), original_image_url?, resume?, employment_contract?, health_certificate?",
    responses={200: {"content": {"application/json": {"examples": {
        "이미지 포함": {"value": {"message": "수정되었습니다.", "image_url": "/uploads/profile/abc.jpg"}},
        "이미지 없음": {"value": {"message": "수정되었습니다."}},
    }}}}},
)
async def edit_my_info(
    bank: str = Form(...),
    account_number: str = Form(...),
    store_id: Optional[int] = Form(None),
    name: Optional[str] = Form(None),
    image: Optional[UploadFile] = File(None),
    original_image_url: Optional[str] = Form(None),
    resume: Optional[UploadFile] = File(None),
    employment_contract: Optional[UploadFile] = File(None),
    health_certificate: Optional[UploadFile] = File(None),
    current_member: Member = Depends(get_current_member_with_refresh),
    db: Session = Depends(get_db),
):
    if store_id is not None:
        employee = db.query(StoreMembers).filter(
            StoreMembers.member_id == current_member.id,
            StoreMembers.store_id == store_id,
        ).first()
    else:
        all_employees = db.query(StoreMembers).filter(
            StoreMembers.member_id == current_member.id,
            StoreMembers.is_deleted == False,
        ).all()
        if len(all_employees) > 1:
            raise HTTPException(status_code=400, detail="가게가 여러 개인 경우 store_id를 전달해주세요.")
        employee = all_employees[0] if all_employees else None
    if not employee:
        raise HTTPException(status_code=404, detail="사용자 정보를 찾을 수 없습니다.")

    if name:
        current_member.name = name

    contract = db.query(StaffContract).filter(StaffContract.store_member_id == employee.id).first()

    employee.bank = bank
    employee.account_number = account_number

    if image:
        if original_image_url:
            old_path = original_image_url.lstrip("/")
            if os.path.exists(old_path):
                os.remove(old_path)
        employee.image_url = await save_file(image, PROFILE_DIR)

    if contract:
        if resume:
            contract.resume = await save_file(resume, DOCUMENT_DIR)
        if employment_contract:
            contract.employment_contract = await save_file(employment_contract, DOCUMENT_DIR)
        if health_certificate:
            contract.health_certificate = await save_file(health_certificate, DOCUMENT_DIR)

    try:
        db.commit()
        result: dict = {"message": "수정되었습니다."}
        if image:
            result["image_url"] = employee.image_url
        return result
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="서버 오류로 인해 정보 수정에 실패했습니다.")


@router.delete("/mypage/profile-image", summary="직원 프로필 이미지 삭제", description="직원의 프로필 이미지를 기본 이미지로 초기화합니다. query: store_id(겸직 시 필수). 기존 파일도 서버에서 삭제됩니다.")
async def delete_employee_profile_image(
    store_id: Optional[int] = Query(None),
    current_member: Member = Depends(get_current_member_with_refresh),
    db: Session = Depends(get_db),
):
    if store_id is not None:
        employee = db.query(StoreMembers).filter(
            StoreMembers.member_id == current_member.id,
            StoreMembers.store_id == store_id,
        ).first()
    else:
        all_employees = db.query(StoreMembers).filter(
            StoreMembers.member_id == current_member.id,
            StoreMembers.is_deleted == False,
        ).all()
        if len(all_employees) > 1:
            raise HTTPException(status_code=400, detail="가게가 여러 개인 경우 store_id를 전달해주세요.")
        employee = all_employees[0] if all_employees else None
    if not employee:
        raise HTTPException(status_code=404, detail="사용자 정보를 찾을 수 없습니다.")

    if employee.image_url:
        old_path = employee.image_url.lstrip("/")
        if os.path.exists(old_path):
            try:
                os.remove(old_path)
            except OSError:
                pass
        employee.image_url = None

    try:
        db.commit()
        return {"message": "프로필 이미지가 삭제되었습니다."}
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="서버 오류가 발생했습니다.")


@router.delete("/profile/document", summary="직원 서류 삭제", description="이력서/근로계약서/보건증 중 하나를 삭제합니다. body: { field: 'resume'|'employment_contract'|'health_certificate', store_id? }")
async def delete_document(
    data: dict,
    current_member: Member = Depends(get_current_member_with_refresh),
    db: Session = Depends(get_db),
):
    field = data.get("field")
    store_id = data.get("store_id")
    if field not in {"resume", "employment_contract", "health_certificate"}:
        raise HTTPException(status_code=400, detail="잘못된 필드입니다.")

    if store_id:
        sm = db.query(StoreMembers).filter(
            StoreMembers.member_id == current_member.id,
            StoreMembers.store_id == store_id,
        ).first()
    else:
        all_sm = db.query(StoreMembers).filter(StoreMembers.member_id == current_member.id).all()
        if len(all_sm) > 1:
            raise HTTPException(status_code=400, detail="가게가 여러 개인 경우 store_id를 전달해주세요.")
        sm = all_sm[0] if all_sm else None
    if not sm:
        raise HTTPException(status_code=404)

    contract = db.query(StaffContract).filter(StaffContract.store_member_id == sm.id).first()
    if not contract:
        raise HTTPException(status_code=404)

    setattr(contract, field, None)
    db.commit()
    return {"ok": True}


# ======= 출퇴근 헬퍼 =======
def _get_active_worklog(db: Session, employee_id: int, status: str = None):
    today = datetime.now(ZoneInfo("Asia/Seoul")).date()
    q = db.query(WorkLog).filter(
        WorkLog.employee_id == employee_id,
        WorkLog.work_date == today,
        WorkLog.end_time.is_(None),
    )
    if status:
        q = q.filter(WorkLog.status == status)
    return q.first()


# ======= 출근 =======
@router.post("/work/clock-in", summary="출근 처리", description="현재 시각으로 출근 처리합니다. 오늘 이미 출근한 경우 409. 요청: { store_id }")
def clock_in(
    body: WorkTimeReq,
    current_member: Member = Depends(get_current_member_with_refresh),
    db: Session = Depends(get_db),
):
    employee = get_employee_or_404(db, body.store_id, current_member.id)
    now = datetime.now(ZoneInfo("Asia/Seoul"))

    existing = db.query(WorkLog).filter(
        WorkLog.employee_id == employee.id,
        WorkLog.work_date == now.date(),
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="이미 오늘 출근 처리되었습니다.")

    db.add(WorkLog(
        store_id=body.store_id,
        employee_id=employee.id,
        work_date=now.date(),
        start_time=now,
        status="working",
    ))
    db.commit()


# ======= 퇴근 =======
@router.post("/work/clock-out", summary="퇴근 처리", description="현재 시각으로 퇴근 처리합니다. 휴게 중인 경우 자동으로 휴게 종료 처리됩니다. 요청: { store_id }")
def clock_out(
    body: WorkTimeReq,
    current_member: Member = Depends(get_current_member_with_refresh),
    db: Session = Depends(get_db),
):
    employee = get_employee_or_404(db, body.store_id, current_member.id)
    log = _get_active_worklog(db, employee.id)
    if not log:
        raise HTTPException(status_code=404, detail="출근 정보를 찾을 수 없습니다.")

    now = datetime.now(ZoneInfo("Asia/Seoul"))
    log.end_time = now
    log.status = "off_work"
    if log.break_end_time is None and log.break_start_time is not None:
        log.break_end_time = now
    db.commit()


# ======= 휴게 시작 =======
@router.post("/work/break-start", summary="휴게 시작", description="출근 중인 직원의 휴게 시간을 시작합니다. 요청: { store_id }")
def break_start(
    body: WorkTimeReq,
    current_member: Member = Depends(get_current_member_with_refresh),
    db: Session = Depends(get_db),
):
    employee = get_employee_or_404(db, body.store_id, current_member.id)
    log = _get_active_worklog(db, employee.id, status="working")
    if not log:
        raise HTTPException(status_code=404, detail="출근 정보를 찾을 수 없습니다.")

    log.break_start_time = datetime.now(ZoneInfo("Asia/Seoul"))
    log.status = "on_break"
    db.commit()


# ======= 휴게 종료 =======
@router.post("/work/break-end", summary="휴게 종료", description="휴게 중인 직원의 휴게 시간을 종료합니다. 요청: { store_id }")
def break_end(
    body: WorkTimeReq,
    current_member: Member = Depends(get_current_member_with_refresh),
    db: Session = Depends(get_db),
):
    employee = get_employee_or_404(db, body.store_id, current_member.id)
    today = datetime.now(ZoneInfo("Asia/Seoul")).date()

    log = db.query(WorkLog).filter(
        WorkLog.employee_id == employee.id,
        WorkLog.work_date == today,
        WorkLog.status == "on_break",
        WorkLog.end_time.is_(None),
        WorkLog.break_end_time.is_(None),
    ).first()
    if not log:
        raise HTTPException(status_code=404, detail="휴게 중인 출근 정보를 찾을 수 없습니다.")

    log.break_end_time = datetime.now(ZoneInfo("Asia/Seoul"))
    log.status = "working"
    db.commit()


# ======= 출근 기록 조회 =======
@router.post("/work/logs", summary="월별 출근 기록 조회", description="해당 월의 출퇴근 기록을 스케줄과 함께 반환합니다. 요청: { store_id, year, month }. 응답: [{ work_date, start_time, end_time, status, sched_start, sched_end, tags[], is_holiday }]")
async def get_work_logs(
    req: WorkLogsReq,
    current_member: Member = Depends(get_current_member_with_refresh),
    db: Session = Depends(get_db),
):
    employee = get_employee_or_404(db, req.store_id, current_member.id)
    today = datetime.now(ZoneInfo("Asia/Seoul")).date()

    logs = db.query(WorkLog).filter(
        WorkLog.employee_id == employee.id,
        WorkLog.store_id == req.store_id,
        extract("year", WorkLog.work_date) == req.year,
        extract("month", WorkLog.work_date) == req.month,
    ).all()

    schedules_raw = db.query(Schedule).filter(
        Schedule.employee_id == employee.id,
        Schedule.store_id == req.store_id,
        extract("year", Schedule.work_date) == req.year,
        extract("month", Schedule.work_date) == req.month,
    ).all()

    shifts = db.query(StoreShift).filter(
        StoreShift.store_id == req.store_id, StoreShift.is_active == True
    ).all()

    def get_tags(start_dt, end_dt):
        if not start_dt or not end_dt:
            return []
        s = start_dt.time() if hasattr(start_dt, 'time') else start_dt
        e = end_dt.time() if hasattr(end_dt, 'time') else end_dt
        return [sh.name for sh in shifts if s < sh.end_time and e > sh.start_time]

    sched_map = {}
    for s in schedules_raw:
        key = str(s.work_date)
        if key not in sched_map:
            sched_map[key] = {"work_date": s.work_date, "is_holiday": s.is_holiday or False,
                              "work_start": s.work_start, "work_end": s.work_end}
        else:
            if s.work_start and (not sched_map[key]["work_start"] or s.work_start < sched_map[key]["work_start"]):
                sched_map[key]["work_start"] = s.work_start
            if s.work_end and (not sched_map[key]["work_end"] or s.work_end > sched_map[key]["work_end"]):
                sched_map[key]["work_end"] = s.work_end

    log_map = {str(l.work_date): l for l in logs}
    result = []

    for key, sched in sched_map.items():
        if sched["work_date"] > today:
            continue
        log = log_map.get(key)
        sched_start = str(sched["work_start"]) if sched["work_start"] else None
        sched_end = str(sched["work_end"]) if sched["work_end"] else None

        if log:
            result.append({
                "work_date": sched["work_date"],
                "start_time": str(log.start_time) if log.start_time else None,
                "end_time": str(log.end_time) if log.end_time else None,
                "break_start_time": str(log.break_start_time) if log.break_start_time else None,
                "break_end_time": str(log.break_end_time) if log.break_end_time else None,
                "status": log.status,
                "is_holiday": sched["is_holiday"],
                "sched_start": sched_start,
                "sched_end": sched_end,
                "tags": get_tags(log.start_time, log.end_time),
            })
        else:
            result.append({
                "work_date": sched["work_date"],
                "start_time": None, "end_time": None,
                "break_start_time": None, "break_end_time": None,
                "status": "absent" if not sched["is_holiday"] else None,
                "is_holiday": sched["is_holiday"],
                "sched_start": sched_start,
                "sched_end": sched_end,
                "tags": [],
            })
    return result


# ======= 출근기록 수정 요청 =======
@router.post("/worklog/request", summary="출근 기록 수정 요청", description="직원이 출근 기록 수정을 사장에게 요청합니다. 요청: { store_id, type('출퇴근 시간 변경'|'휴게 시간 변경'|'근무 누락'), date, reason, origin_start?, origin_end?, desired_start?, desired_end?, desired_break_minutes? }")
async def worklog_change_request(
    req: WorkLogChangeReq,
    current_member: Member = Depends(get_current_member_with_refresh),
    db: Session = Depends(get_db),
):
    employee = get_employee_or_404(db, req.store_id, current_member.id)
    is_break = req.type == "휴게 시간 변경"
    is_missing = req.type == "근무 누락"

    if is_break and db.query(WorkLogChangeRequest).filter(
        WorkLogChangeRequest.employee_id == employee.id,
        WorkLogChangeRequest.date == req.date,
        WorkLogChangeRequest.type == "휴게 시간 변경",
        WorkLogChangeRequest.status == "pending",
    ).first():
        raise HTTPException(status_code=409, detail="이미 해당 날짜에 휴게 시간 변경 요청이 존재합니다.")

    if is_missing and db.query(WorkLogChangeRequest).filter(
        WorkLogChangeRequest.employee_id == employee.id,
        WorkLogChangeRequest.date == req.date,
        WorkLogChangeRequest.type == "근무 누락",
        WorkLogChangeRequest.status == "pending",
    ).first():
        raise HTTPException(status_code=409, detail="이미 해당 날짜에 근무 누락 수정 요청이 존재합니다.")

    db.add(WorkLogChangeRequest(
        store_id=req.store_id,
        employee_id=employee.id,
        type=req.type,
        date=req.date,
        origin_start=None if is_break else req.origin_start,
        origin_end=None if is_break else req.origin_end,
        desired_start=None if is_break else req.desired_start,
        desired_end=None if is_break else req.desired_end,
        desired_break_minutes=req.desired_break_minutes,
        reason=req.reason,
    ))
    db.commit()


@router.get("/worklog/request", summary="출근 기록 수정 요청 목록", description="내 출근 기록 수정 요청 전체 이력을 반환합니다. query: store_id")
async def get_worklog_requests(
    store_id: int,
    current_member: Member = Depends(get_current_member_with_refresh),
    db: Session = Depends(get_db),
):
    employee = get_employee_or_404(db, store_id, current_member.id)
    return db.query(WorkLogChangeRequest).filter(
        WorkLogChangeRequest.employee_id == employee.id,
        WorkLogChangeRequest.store_id == store_id,
    ).order_by(WorkLogChangeRequest.created_at.desc()).all()


@router.get("/payslips/{payslip_id}", summary="급여명세서 단건 조회", description="발행된 내 급여명세서 상세 조회. query: store_id 필수. 응답: 근무일수, 총급여, 공제항목 등 전체 명세.")
async def get_my_payslip(
    payslip_id: int,
    store_id: int,
    current_member: Member = Depends(get_current_member_with_refresh),
    db: Session = Depends(get_db),
):
    employee = get_employee_or_404(db, store_id, current_member.id)
    row = (
        db.query(Payslip, Member, StaffContract)
        .join(StoreMembers, Payslip.employee_id == StoreMembers.id)
        .join(Member, StoreMembers.member_id == Member.id)
        .outerjoin(StaffContract, StaffContract.store_member_id == StoreMembers.id)
        .filter(
            Payslip.id == payslip_id,
            Payslip.employee_id == employee.id,
            Payslip.store_id == store_id,
            Payslip.is_published == True,
        )
        .first()
    )
    if not row:
        raise HTTPException(status_code=404)
    p, m, c = row
    return {
        "id": p.id,
        "year": p.year,
        "month": p.month,
        "name": m.name,
        "pay_period_start": str(p.pay_period_start),
        "pay_period_end": str(p.pay_period_end),
        "pay_date": str(p.pay_date) if p.pay_date else None,
        "work_days": p.work_days,
        "actual_work_minutes": p.actual_work_minutes,
        "overtime_minutes": p.overtime_minutes,
        "night_minutes": p.night_minutes,
        "holiday_minutes": p.holiday_minutes,
        "weekly_leave_minutes": p.weekly_leave_minutes,
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
        "hourly_rate": c.hourly_rate if c else None,
    }


@router.get("/payslips", summary="내 급여명세서 목록", description="발행된 내 급여명세서 전체 목록. query: store_id 필수. 최신순 반환.")
async def get_my_payslips(
    store_id: int,
    current_member: Member = Depends(get_current_member_with_refresh),
    db: Session = Depends(get_db),
):
    employee = get_employee_or_404(db, store_id, current_member.id)
    payslips = (
        db.query(Payslip)
        .filter(
            Payslip.employee_id == employee.id,
            Payslip.store_id == store_id,
            Payslip.is_published == True,
        )
        .order_by(Payslip.year.desc(), Payslip.month.desc())
        .all()
    )
    return [
        {
            "id": p.id,
            "year": p.year,
            "month": p.month,
            "net_pay": p.net_pay,
            "pay_period_start": str(p.pay_period_start),
            "pay_period_end": str(p.pay_period_end),
            "pay_date": str(p.pay_date) if p.pay_date else None,
            "published_at": str(p.published_at) if p.published_at else None,
        }
        for p in payslips
    ]
