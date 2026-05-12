from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime

from database import get_db
from models import Feedback, Faq, BusinessRequest, Store, StoreMembers, StoreShift, Notification
from schemas.admin import FeedbackAnswerReq, FaqAddReq
from utils.utils import create_store_code

router = APIRouter(prefix="/api/admin", tags=["관리자"])


# ===== 건의함 =====
@router.get("/feedback")
async def get_all_feedback(db: Session = Depends(get_db)):
    return db.query(Feedback).filter(Feedback.status == "pending").order_by(Feedback.created_at).all()


@router.post("/feedback/answer")
async def answer_feedback(req: FeedbackAnswerReq, db: Session = Depends(get_db)):
    feedback = db.query(Feedback).filter(Feedback.id == req.id).first()
    if not feedback:
        raise HTTPException(status_code=404, detail="건의내역을 찾을 수 없습니다.")
    feedback.answer = req.answer
    feedback.status = "completed"
    feedback.answered_at = datetime.now()
    db.commit()


# ===== FAQ =====
@router.post("/faq")
async def add_faq(req: FaqAddReq, db: Session = Depends(get_db)):
    db.add(Faq(type=req.type, question=req.question, answer=req.answer))
    db.commit()


@router.delete("/faq/{id}")
async def delete_faq(id: int, db: Session = Depends(get_db)):
    faq = db.query(Faq).filter(Faq.id == id).first()
    if not faq:
        raise HTTPException(status_code=404)
    faq.is_deleted = True
    db.commit()


# ===== 매장 승인 목록 =====
@router.get("/business-requests")
async def get_business_requests(db: Session = Depends(get_db)):
    from models import Member
    rows = (
        db.query(BusinessRequest, Member)
        .join(Member, Member.id == BusinessRequest.member_id)
        .filter(BusinessRequest.status == "pending")
        .order_by(BusinessRequest.created_at)
        .all()
    )
    return [{
        "id": br.id,
        "member_id": br.member_id,
        "applicant_name": m.name,
        "applicant_phone": m.phone,
        "raw_digits": br.raw_digits,
        "name": br.name,
        "address": br.address,
        "address_detail": br.address_detail,
        "industry": br.industry,
        "owner_name": br.owner_name,
        "phone": br.phone,
        "business_image": br.business_image,
        "status": br.status,
        "created_at": str(br.created_at),
    } for br, m in rows]


# ===== 매장 승인 =====
@router.post("/business-requests/{req_id}/approve")
async def approve_business_request(req_id: int, db: Session = Depends(get_db)):
    br = db.query(BusinessRequest).filter(BusinessRequest.id == req_id).first()
    if not br:
        raise HTTPException(status_code=404, detail="신청을 찾을 수 없습니다.")
    if br.status != "pending":
        raise HTTPException(status_code=400, detail="이미 처리된 신청입니다.")
    if not br.member_id:
        raise HTTPException(status_code=400, detail="신청자 정보가 없습니다. 해당 신청은 재신청이 필요합니다.")

    store_code = await create_store_code(db)

    store = Store(
        code=store_code,
        raw_digits=br.raw_digits,
        name=br.name,
        address=br.address,
        address_detail=br.address_detail,
        industry=br.industry,
        owner_name=br.owner_name,
        phone=br.phone,
        business_image=br.business_image,
    )
    db.add(store)
    db.flush()

    for order, name in [(1, "오픈"), (2, "미들"), (3, "마감")]:
        db.add(StoreShift(store_id=store.id, sort_order=order, name=name, is_active=True))

    db.add(StoreMembers(store_id=store.id, member_id=br.member_id, role="owner"))

    br.status = "approved"
    br.checked_at = datetime.now()

    db.commit()

    return {"store_id": store.id, "code": store_code}


# ===== 매장 승인 거절 =====
@router.post("/business-requests/{req_id}/reject")
async def reject_business_request(req_id: int, data: dict, db: Session = Depends(get_db)):
    br = db.query(BusinessRequest).filter(BusinessRequest.id == req_id).first()
    if not br:
        raise HTTPException(status_code=404)
    br.status = "rejected"
    br.reject_reason = data.get("reason")
    br.checked_at = datetime.now()
    db.commit()
