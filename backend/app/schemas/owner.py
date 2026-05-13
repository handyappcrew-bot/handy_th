from pydantic import BaseModel
from datetime import date
from typing import Optional, List


class StoreInfoUpdateReq(BaseModel):
    id: int
    name: str
    address: str
    address_detail: Optional[str] = None
    industry: str
    owner_name: str
    phone: str


class NicknameUpdateReq(BaseModel):
    member_id: int
    nickname: str


class DeleteStoreReq(BaseModel):
    store_id: int


class ShiftUpdateItem(BaseModel):
    sort_order: int
    name: str
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    is_active: bool = True


class StaffContractUpdateReq(BaseModel):
    employee_type: Optional[str] = None
    working_status: Optional[str] = None
    hourly_rate: Optional[int] = None
    monthly_salary: Optional[int] = None
    salary_cycle: Optional[str] = None
    salary_day: Optional[str] = None
    is_probation: Optional[bool] = None
    deduction_type: Optional[str] = None   # "percent" | "amount"
    income_tax: Optional[float] = None
    local_income_tax: Optional[float] = None
    national_pension: Optional[float] = None
    health_insurance: Optional[float] = None
    long_term_care: Optional[float] = None
    employment_insurance: Optional[float] = None
    industrial_accident: Optional[float] = None
    memo: Optional[str] = None
    # StoreMembers 필드
    bank: Optional[str] = None
    account_name: Optional[str] = None
    account_number: Optional[str] = None


class ScheduleCreateReq(BaseModel):
    employee_id: int          # store_members.id
    shift_id: Optional[int] = None
    work_date: date
    work_start: Optional[str] = None   # "HH:MM"
    work_end: Optional[str] = None     # "HH:MM"
    is_holiday: bool = False
    is_substitution: bool = False


class ScheduleUpdateReq(BaseModel):
    shift_id: Optional[int] = None
    work_start: Optional[str] = None
    work_end: Optional[str] = None
    is_holiday: Optional[bool] = None
    is_substitution: Optional[bool] = None


class ScheduleBulkCreateReq(BaseModel):
    schedules: List[ScheduleCreateReq]
