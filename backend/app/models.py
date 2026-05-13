from sqlalchemy import (
    Column, Integer, BigInteger, String, Text, Boolean,
    DateTime, ForeignKey, func, Date, UniqueConstraint,
    Numeric, Time, JSON, ARRAY
)
from sqlalchemy.orm import relationship
from database import Base


# ==========================================
# 1. 사용자 및 계정
# ==========================================
class Member(Base):
    __tablename__ = "members"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    password = Column(String(255), nullable=True)
    phone = Column(String(20), nullable=True, unique=True)
    name = Column(String(100), nullable=True)
    birth = Column(Date, nullable=True)
    gender = Column(String(10), nullable=True)
    image_url = Column(String(255), default="default.png")
    fcm_token = Column(String(500), nullable=True)
    is_deleted = Column(Boolean, default=False)
    deleted_at = Column(DateTime(timezone=True), nullable=True)

    social_accounts = relationship("SocialAccount", back_populates="member", cascade="all, delete-orphan")
    tokens = relationship("JwtTokens", back_populates="member", cascade="all, delete-orphan")
    store_memberships = relationship("StoreMembers", back_populates="member", cascade="all, delete-orphan")
    member_requests = relationship("MemberRequest", back_populates="member", cascade="all, delete-orphan")
    feedbacks = relationship("Feedback", back_populates="member", cascade="all, delete-orphan")
    withdrawals = relationship("Withdrawal", back_populates="member", cascade="all, delete-orphan")


class SocialAccount(Base):
    __tablename__ = "social_accounts"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    member_id = Column(BigInteger, ForeignKey("members.id"), nullable=False)
    provider = Column(String(20), nullable=False)        # google / kakao / apple
    provider_id = Column(String(255), nullable=False)

    __table_args__ = (UniqueConstraint("provider", "provider_id"),)
    member = relationship("Member", back_populates="social_accounts")


class JwtTokens(Base):
    __tablename__ = "jwt_tokens"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    member_id = Column(BigInteger, ForeignKey("members.id"), nullable=False)
    refresh_token = Column(String(512), nullable=False)
    expires_at = Column(DateTime, nullable=False)
    is_revoked = Column(Boolean, server_default="false")
    created_at = Column(DateTime, server_default=func.now())

    member = relationship("Member", back_populates="tokens")


# ==========================================
# 2. 매장 관련
# ==========================================
class Store(Base):
    __tablename__ = "stores"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    code = Column(BigInteger, unique=True, nullable=False, comment="5자리 매장 코드")
    raw_digits = Column(String(30), nullable=False, comment="사업자 등록 번호")
    name = Column(String(100), nullable=False)
    address = Column(String(255), nullable=False)
    address_detail = Column(String(255), nullable=True)
    industry = Column(String(100), nullable=False)
    owner_name = Column(String(100), nullable=False, comment="대표자명")
    phone = Column(String(20), nullable=False, comment="매장 전화번호")
    business_image = Column(Text, nullable=False, comment="사업자등록증 이미지")
    radius = Column(Integer, nullable=True, comment="출퇴근 허용 거리(m)")
    created_at = Column(Date, server_default=func.now())
    is_deleted = Column(Boolean, server_default="false")

    map_info = relationship("StoreMap", back_populates="store", uselist=False, cascade="all, delete-orphan")
    setting = relationship("StoreSetting", back_populates="store", uselist=False, cascade="all, delete-orphan")
    shifts = relationship("StoreShift", back_populates="store", cascade="all, delete-orphan")
    memberships = relationship("StoreMembers", back_populates="store", cascade="all, delete-orphan")
    member_requests = relationship("MemberRequest", back_populates="store", cascade="all, delete-orphan")
    community_posts = relationship("StoreCommunity", back_populates="store", cascade="all, delete-orphan")
    todos = relationship("StoreTodo", back_populates="store", cascade="all, delete-orphan")
    closing_reports = relationship("DailyClosingReport", back_populates="store", cascade="all, delete-orphan")
    worklog_change_requests = relationship("WorkLogChangeRequest", back_populates="store", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="store", cascade="all, delete-orphan")
    payslips = relationship("Payslip", back_populates="store", cascade="all, delete-orphan")


class StoreMap(Base):
    __tablename__ = "store_maps"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    store_id = Column(BigInteger, ForeignKey("stores.id"), nullable=False, unique=True)
    lat = Column(Numeric(10, 7), nullable=False)
    lng = Column(Numeric(11, 7), nullable=False)

    store = relationship("Store", back_populates="map_info")


class StoreSetting(Base):
    __tablename__ = "store_settings"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    store_id = Column(BigInteger, ForeignKey("stores.id"), nullable=False, unique=True)

    # 운영 기본
    open_time = Column(Time, nullable=True)
    close_time = Column(Time, nullable=True)
    late_minutes = Column(Integer, nullable=True, comment="지각 기준(분), NULL=지각 없음")

    # 고정 휴무
    is_fixed_holiday = Column(Boolean, default=False)
    holiday_cycle = Column(String(20), nullable=True)       # 매주 / 격주
    holiday_days = Column(ARRAY(String), nullable=True)     # ["월","수"] 등

    # 연장수당
    has_overtime_pay = Column(Boolean, default=False)
    overtime_after_daily_8h = Column(Boolean, default=True, comment="일 8시간 초과 시 연장")
    overtime_after_weekly_40h = Column(Boolean, default=True, comment="주 40시간 초과 시 연장")
    overtime_threshold_minutes = Column(Integer, default=30, comment="연장 인정 기준(분)")
    overtime_multiplier = Column(Numeric(3, 2), default=1.50)

    # 야간수당
    has_night_pay = Column(Boolean, default=False)
    night_start = Column(Time, nullable=True, comment="야간 시작 시각")
    night_end = Column(Time, nullable=True, comment="야간 종료 시각")
    night_threshold_minutes = Column(Integer, default=30)
    night_multiplier = Column(Numeric(3, 2), default=1.50)

    # 휴일수당
    has_holiday_pay = Column(Boolean, default=False)
    holiday_threshold_minutes = Column(Integer, default=30)
    holiday_multiplier_under_8h = Column(Numeric(3, 2), default=1.50)
    holiday_multiplier_over_8h = Column(Numeric(3, 2), default=2.00)

    store = relationship("Store", back_populates="setting")


class StoreShift(Base):
    """
    매장 교대 슬롯 (최대 3개).
    sort_order=1/2/3 → 기획 내부 개념(오픈/미들/마감).
    name은 사장이 직접 커스터마이징 가능.
    매장 생성 시 3개 row가 기본값(오픈/미들/마감)으로 자동 삽입됨.
    """
    __tablename__ = "store_shifts"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    store_id = Column(BigInteger, ForeignKey("stores.id"), nullable=False)
    sort_order = Column(Integer, nullable=False, comment="슬롯 순서 1=오픈 2=미들 3=마감")
    name = Column(String(20), nullable=False, comment="사장이 커스터마이징한 이름")
    start_time = Column(Time, nullable=True)
    end_time = Column(Time, nullable=True)
    is_active = Column(Boolean, default=True, comment="해당 교대 슬롯 사용 여부")

    __table_args__ = (UniqueConstraint("store_id", "sort_order"),)

    store = relationship("Store", back_populates="shifts")


# ==========================================
# 3. 가입 및 승인 프로세스
# ==========================================
class BusinessRequest(Base):
    __tablename__ = "business_requests"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    member_id = Column(BigInteger, ForeignKey("members.id"), nullable=False, comment="신청한 사장 member_id")
    raw_digits = Column(String(30), nullable=False, comment="사업자 등록 번호")
    name = Column(String(100), nullable=False)
    address = Column(String(255), nullable=False)
    address_detail = Column(String(255), nullable=True)
    industry = Column(String(100), nullable=False)
    owner_name = Column(String(100), nullable=False)
    phone = Column(String(20), nullable=False)
    business_image = Column(Text, nullable=False, comment="사업자등록증 이미지 파일명")
    status = Column(String(10), server_default="pending", comment="pending/approved/rejected")
    reject_reason = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    checked_at = Column(DateTime, nullable=True)


class MemberRequest(Base):
    __tablename__ = "member_requests"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    store_id = Column(BigInteger, ForeignKey("stores.id"), nullable=False)
    member_id = Column(BigInteger, ForeignKey("members.id"), nullable=False)
    bank = Column(String(50), nullable=True)
    account_name = Column(String(100), nullable=True)
    account_number = Column(String(100), nullable=True)
    status = Column(String(10), server_default="pending")
    created_at = Column(DateTime, server_default=func.now())

    store = relationship("Store", back_populates="member_requests")
    member = relationship("Member", back_populates="member_requests")


# ==========================================
# 4. 소속 직원 및 계약
# ==========================================
class StoreMembers(Base):
    __tablename__ = "store_members"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    store_id = Column(BigInteger, ForeignKey("stores.id"), nullable=False)
    member_id = Column(BigInteger, ForeignKey("members.id"), nullable=False)
    role = Column(String(10), server_default="employee", comment="owner / employee")
    nickname = Column(String(50), nullable=True)
    bank = Column(String(50), nullable=True)
    account_name = Column(String(100), nullable=True)
    account_number = Column(String(100), nullable=True)
    image_url = Column(String(500), nullable=True)
    joined_at = Column(DateTime, server_default=func.now())
    is_deleted = Column(Boolean, server_default="false")

    __table_args__ = (UniqueConstraint("store_id", "member_id"),)

    member = relationship("Member", back_populates="store_memberships")
    store = relationship("Store", back_populates="memberships")
    contract = relationship("StaffContract", back_populates="store_member", uselist=False, cascade="all, delete-orphan")
    todos = relationship("StoreTodo", back_populates="employee", cascade="all, delete-orphan")
    schedules = relationship("Schedule", back_populates="employee", cascade="all, delete-orphan")
    work_logs = relationship("WorkLog", back_populates="employee", cascade="all, delete-orphan")
    schedule_change_requests = relationship("ScheduleChangeRequest", back_populates="employee", cascade="all, delete-orphan")
    community_posts = relationship("StoreCommunity", back_populates="author")
    comments = relationship("StoreCommunityComment", back_populates="author")
    closing_reports = relationship("DailyClosingReport", back_populates="employee", cascade="all, delete-orphan")
    worklog_change_requests = relationship("WorkLogChangeRequest", back_populates="employee", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="employee", cascade="all, delete-orphan")
    payslips = relationship("Payslip", back_populates="employee", cascade="all, delete-orphan")


class StaffContract(Base):
    """
    직원 근로 계약 정보.
    StoreMembers 1:1 관계.
    """
    __tablename__ = "staff_contracts"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    store_member_id = Column(BigInteger, ForeignKey("store_members.id"), nullable=False, unique=True)

    employee_type = Column(String(20), nullable=True, comment="알바 / 정직원 / 계약직")
    working_status = Column(String(10), server_default="재직", comment="재직 / 퇴직")

    # 급여
    hourly_rate = Column(Integer, nullable=True, comment="시급(원)")
    monthly_salary = Column(Integer, nullable=True, comment="월급(원)")
    salary_cycle = Column(String(10), nullable=True, comment="매월 / 격주 / 매주")
    salary_day = Column(String(20), nullable=True, comment="급여일 (예: 15, 말일)")
    is_probation = Column(Boolean, server_default="false", comment="수습 여부")

    # 4대보험 / 세금
    deduction_type = Column(String(10), server_default="percent", comment="percent(비율) / amount(고정금액)")
    income_tax = Column(Numeric(8, 4), nullable=True)
    local_income_tax = Column(Numeric(8, 4), nullable=True)
    national_pension = Column(Numeric(8, 4), nullable=True)
    health_insurance = Column(Numeric(8, 4), nullable=True)
    long_term_care = Column(Numeric(8, 4), nullable=True)
    employment_insurance = Column(Numeric(8, 4), nullable=True)
    industrial_accident = Column(Numeric(8, 4), nullable=True)

    # 서류
    memo = Column(Text, nullable=True)
    resume = Column(String(255), nullable=True)
    employment_contract = Column(String(255), nullable=True)
    health_certificate = Column(String(255), nullable=True)

    store_member = relationship("StoreMembers", back_populates="contract")


# ==========================================
# 5. 근태 (스케줄 / 출퇴근 기록)
# ==========================================
class StoreTodo(Base):
    __tablename__ = "store_todos"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    store_id = Column(BigInteger, ForeignKey("stores.id"), nullable=False)
    employee_id = Column(BigInteger, ForeignKey("store_members.id"), nullable=True)
    type = Column(String(10), nullable=False, comment="public(공통) / personal(개인)")
    content = Column(String(100), nullable=False)
    created_at = Column(Date, server_default=func.now())
    is_achieved = Column(Boolean, server_default="false")

    store = relationship("Store", back_populates="todos")
    employee = relationship("StoreMembers", back_populates="todos")


class Schedule(Base):
    """
    확정 스케줄 (날짜 기준).
    shift_id → StoreShift FK (오픈/미들/마감 슬롯).
    is_substitution=True → 대타 근무.
    """
    __tablename__ = "schedules"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    store_id = Column(BigInteger, ForeignKey("stores.id"), nullable=False)
    employee_id = Column(BigInteger, ForeignKey("store_members.id"), nullable=False)
    shift_id = Column(BigInteger, ForeignKey("store_shifts.id"), nullable=True)
    work_date = Column(Date, nullable=False)
    work_start = Column(Time, nullable=True)
    work_end = Column(Time, nullable=True)
    is_holiday = Column(Boolean, server_default="false")
    is_substitution = Column(Boolean, server_default="false", comment="대타 여부")

    employee = relationship("StoreMembers", back_populates="schedules")
    shift = relationship("StoreShift")


class WorkLog(Base):
    """
    실제 출퇴근 기록.
    휴게는 1회(break_start / break_end).
    """
    __tablename__ = "work_logs"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    store_id = Column(BigInteger, ForeignKey("stores.id"), nullable=False)
    employee_id = Column(BigInteger, ForeignKey("store_members.id"), nullable=False)
    work_date = Column(Date, nullable=False)
    start_time = Column(DateTime(timezone=True), nullable=False)
    end_time = Column(DateTime(timezone=True), nullable=True)
    break_start_time = Column(DateTime(timezone=True), nullable=True)
    break_end_time = Column(DateTime(timezone=True), nullable=True)
    status = Column(String(20), server_default="working", comment="working / on_break / off_work")

    employee = relationship("StoreMembers", back_populates="work_logs")


class ScheduleChangeRequest(Base):
    __tablename__ = "schedule_change_requests"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    store_id = Column(BigInteger, ForeignKey("stores.id"), nullable=False)
    employee_id = Column(BigInteger, ForeignKey("store_members.id"), nullable=False)
    type = Column(String(20), nullable=False, comment="schedule_change / vacation")
    origin_date = Column(Date, nullable=True)
    origin_start = Column(Time, nullable=True)
    origin_end = Column(Time, nullable=True)
    desired_date = Column(Date, nullable=False)
    desired_start = Column(Time, nullable=True)
    desired_end = Column(Time, nullable=True)
    reason = Column(Text, nullable=False)
    status = Column(String(10), server_default="pending", comment="pending / approved / rejected")
    created_at = Column(DateTime, server_default=func.now())
    is_deleted = Column(Boolean, server_default="false")

    employee = relationship("StoreMembers", back_populates="schedule_change_requests")


class WorkLogChangeRequest(Base):
    __tablename__ = "worklog_change_requests"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    store_id = Column(BigInteger, ForeignKey("stores.id"), nullable=False)
    employee_id = Column(BigInteger, ForeignKey("store_members.id"), nullable=False)
    type = Column(String(50), nullable=False, comment="근무 누락 / 휴게 시간 변경 / 출퇴근 수정")
    date = Column(Date, nullable=False)
    origin_start = Column(Time, nullable=True)
    origin_end = Column(Time, nullable=True)
    desired_start = Column(Time, nullable=True)
    desired_end = Column(Time, nullable=True)
    desired_break_minutes = Column(Integer, nullable=True, comment="요청 휴게 시간(분)")
    reason = Column(Text, nullable=False)
    status = Column(String(10), server_default="pending")
    created_at = Column(DateTime, server_default=func.now())

    store = relationship("Store", back_populates="worklog_change_requests")
    employee = relationship("StoreMembers", back_populates="worklog_change_requests")


# ==========================================
# 6. 마감 보고 (매출)
# ==========================================
class DailyClosingReport(Base):
    """
    직원이 작성하는 마감 보고.
    gross_sales / net_sales 같은 계산값은 API에서 계산, DB에 저장 안 함.
    cash_shortage = cash_sales - cash_on_hand (API 계산).
    """
    __tablename__ = "daily_closing_reports"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    store_id = Column(BigInteger, ForeignKey("stores.id"), nullable=False)
    employee_id = Column(BigInteger, ForeignKey("store_members.id"), nullable=False)
    report_date = Column(Date, nullable=False)

    # 매출
    card_sales = Column(BigInteger, default=0)
    cash_sales = Column(BigInteger, default=0)
    transfer_sales = Column(BigInteger, default=0)
    gift_sales = Column(BigInteger, default=0)

    # 차감
    discount_amount = Column(BigInteger, default=0)
    refund_amount = Column(BigInteger, default=0)

    # 시제 (실제 현금 보유액)
    cash_on_hand = Column(BigInteger, default=0)

    # 영수증 이미지 / 전달 사항
    receipt_image_url = Column(String(500), nullable=True)
    manager_note = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    store = relationship("Store", back_populates="closing_reports")
    employee = relationship("StoreMembers", back_populates="closing_reports")


# ==========================================
# 7. 급여 명세서
# ==========================================
class Payslip(Base):
    __tablename__ = "payslips"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    store_id = Column(BigInteger, ForeignKey("stores.id"), nullable=False)
    employee_id = Column(BigInteger, ForeignKey("store_members.id"), nullable=False)

    year = Column(Integer, nullable=False)
    month = Column(Integer, nullable=False)
    pay_period_start = Column(Date, nullable=False)
    pay_period_end = Column(Date, nullable=False)
    pay_date = Column(Date, nullable=True)

    # 근무 내역 (분)
    work_days = Column(Integer, default=0)
    actual_work_minutes = Column(Integer, default=0)
    overtime_minutes = Column(Integer, default=0)
    night_minutes = Column(Integer, default=0)
    holiday_minutes = Column(Integer, default=0)
    weekly_leave_minutes = Column(Integer, default=0)

    # 지급
    base_pay = Column(BigInteger, default=0)
    overtime_pay = Column(BigInteger, default=0)
    night_pay = Column(BigInteger, default=0)
    holiday_pay = Column(BigInteger, default=0)
    weekly_leave_pay = Column(BigInteger, default=0)
    other_allowance = Column(BigInteger, default=0, comment="인센티브 등")

    # 공제
    income_tax = Column(BigInteger, default=0)
    local_income_tax = Column(BigInteger, default=0)
    national_pension = Column(BigInteger, default=0)
    health_insurance = Column(BigInteger, default=0)
    long_term_care = Column(BigInteger, default=0)
    employment_insurance = Column(BigInteger, default=0)

    # 합계
    total_pay = Column(BigInteger, default=0)
    total_deduction = Column(BigInteger, default=0)
    net_pay = Column(BigInteger, default=0)

    # 상태
    is_published = Column(Boolean, default=False)
    published_at = Column(DateTime, nullable=True)
    is_transferred = Column(Boolean, default=False)
    transferred_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, server_default=func.now())

    __table_args__ = (UniqueConstraint("store_id", "employee_id", "year", "month"),)

    store = relationship("Store", back_populates="payslips")
    employee = relationship("StoreMembers", back_populates="payslips")


# ==========================================
# 8. 커뮤니티 (게시판)
# ==========================================
class StoreCommunity(Base):
    __tablename__ = "store_community"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    store_id = Column(BigInteger, ForeignKey("stores.id"), nullable=False)
    employee_id = Column(BigInteger, ForeignKey("store_members.id", ondelete="SET NULL"), nullable=True)
    category = Column(String(20), nullable=False, index=True)
    title = Column(String(100), nullable=False)
    content = Column(Text, nullable=False)
    image = Column(JSON, nullable=True)
    view_count = Column(Integer, default=0)
    created_at = Column(DateTime, server_default=func.now())
    is_deleted = Column(Boolean, server_default="false")

    store = relationship("Store", back_populates="community_posts")
    author = relationship("StoreMembers", back_populates="community_posts")
    comments = relationship("StoreCommunityComment", back_populates="post", cascade="all, delete-orphan")


class StoreCommunityComment(Base):
    __tablename__ = "store_community_comments"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    post_id = Column(BigInteger, ForeignKey("store_community.id", ondelete="CASCADE"), nullable=False)
    employee_id = Column(BigInteger, ForeignKey("store_members.id", ondelete="SET NULL"), nullable=True)
    parent_id = Column(BigInteger, ForeignKey("store_community_comments.id"), nullable=True)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    is_deleted = Column(Boolean, server_default="false")

    post = relationship("StoreCommunity", back_populates="comments")
    author = relationship("StoreMembers", back_populates="comments")
    parent = relationship("StoreCommunityComment", remote_side=[id], back_populates="replies")
    replies = relationship("StoreCommunityComment", back_populates="parent", cascade="all, delete-orphan")


class StoreCommunityView(Base):
    __tablename__ = "store_community_views"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    post_id = Column(BigInteger, ForeignKey("store_community.id", ondelete="CASCADE"), nullable=False)
    employee_id = Column(BigInteger, ForeignKey("store_members.id", ondelete="CASCADE"), nullable=False)
    viewed_at = Column(DateTime, server_default=func.now())

    __table_args__ = (UniqueConstraint("post_id", "employee_id"),)


# ==========================================
# 9. 서비스 공지 / FAQ / 건의함
# ==========================================
class Notice(Base):
    __tablename__ = "notices"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=False)
    image = Column(JSON, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    is_deleted = Column(Boolean, server_default="false")


class Faq(Base):
    __tablename__ = "faqs"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    type = Column(String(20), nullable=False)
    question = Column(String(500), nullable=False)
    answer = Column(Text, nullable=False)
    is_deleted = Column(Boolean, server_default="false")


class Feedback(Base):
    __tablename__ = "feedbacks"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    member_id = Column(BigInteger, ForeignKey("members.id"), nullable=False)
    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=False)
    image = Column(JSON, nullable=True)
    status = Column(String(20), server_default="pending", comment="pending / completed")
    answer = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    answered_at = Column(DateTime, nullable=True)

    member = relationship("Member", back_populates="feedbacks")


# ==========================================
# 10. 알림 / 탈퇴
# ==========================================
class Notification(Base):
    __tablename__ = "notifications"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    store_id = Column(BigInteger, ForeignKey("stores.id"), nullable=False)
    employee_id = Column(BigInteger, ForeignKey("store_members.id"), nullable=False)
    type = Column(String(30), nullable=False, comment="schedule_added / schedule_changed / payslip / etc.")
    message = Column(String(200), nullable=False)
    reference_id = Column(BigInteger, nullable=True)
    is_read = Column(Boolean, server_default="false")
    created_at = Column(DateTime, server_default=func.now())

    store = relationship("Store", back_populates="notifications")
    employee = relationship("StoreMembers", back_populates="notifications")


class Withdrawal(Base):
    __tablename__ = "withdrawals"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    member_id = Column(BigInteger, ForeignKey("members.id", ondelete="CASCADE"), nullable=False)
    reason = Column(String(300), nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    member = relationship("Member", back_populates="withdrawals")
