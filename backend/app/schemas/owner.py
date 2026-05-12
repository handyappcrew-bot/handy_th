from pydantic import BaseModel
from datetime import date
from typing import Optional


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
