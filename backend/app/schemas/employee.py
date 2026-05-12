from pydantic import BaseModel
from datetime import time, datetime, date
from typing import Optional


class VerifyCode(BaseModel):
    code: str


class MemberRequestSchema(BaseModel):
    store_id: int
    bank: str
    account_name: str
    account_number: str


class StoreIdReq(BaseModel):
    store_id: int


class TodoModifyReq(BaseModel):
    store_id: int
    id: int


class ClosingReportReq(BaseModel):
    store_id: int
    report_date: str
    card_sales: int
    cash_sales: int
    transfer_sales: int
    gift_sales: int
    discount_amount: int
    refund_amount: int
    cash_on_hand: int
    receipt_image_url: Optional[str] = None
    manager_note: Optional[str] = None


class WorkTimeReq(BaseModel):
    store_id: int


class WorkLogsReq(BaseModel):
    store_id: int
    year: int
    month: int


class WorkLogChangeReq(BaseModel):
    store_id: int
    type: str
    date: date
    origin_start: Optional[str] = None
    origin_end: Optional[str] = None
    desired_start: Optional[str] = None
    desired_end: Optional[str] = None
    desired_break_minutes: Optional[int] = None
    reason: str


class ScheduleChangeReq(BaseModel):
    store_id: int
    type: str = "schedule_change"
    origin_date: Optional[date] = None
    origin_start: Optional[str] = None
    origin_end: Optional[str] = None
    desired_date: date
    desired_start: Optional[str] = None
    desired_end: Optional[str] = None
    reason: Optional[str] = None
