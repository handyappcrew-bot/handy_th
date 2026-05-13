"""
핸디 초기 데이터 스크립트
사용법: python init_db.py
- 기존 데이터를 모두 삭제하고 테스트용 초기 데이터를 새로 삽입합니다.
- DB 접속 정보는 app/.env 를 읽습니다.
"""
import sys
import os
from pathlib import Path

# app 디렉터리를 모듈 탐색 경로에 추가
APP_DIR = Path(__file__).resolve().parent / "app"
sys.path.insert(0, str(APP_DIR))

from dotenv import load_dotenv
load_dotenv(APP_DIR / ".env")

from sqlalchemy import create_engine, text
from utils.auth_utils import password_encode

DB_URL = (
    f"postgresql://{os.getenv('DB_USER')}:{os.getenv('DB_PASSWORD')}"
    f"@{os.getenv('DB_HOST')}:{os.getenv('DB_PORT')}/{os.getenv('DB_NAME')}"
)
engine = create_engine(DB_URL)

PW = password_encode("1234")   # 모든 계정 공통 비밀번호: 1234


# ──────────────────────────────────────────────
# 테이블 초기화 (FK 순서 역방향)
# ──────────────────────────────────────────────
TRUNCATE_SQL = """
TRUNCATE TABLE
    store_community_comments,
    store_community,
    notifications,
    payslips,
    daily_closing_reports,
    worklog_change_requests,
    schedule_change_requests,
    work_logs,
    schedules,
    store_todos,
    staff_contracts,
    store_members,
    store_shifts,
    store_settings,
    store_maps,
    stores,
    business_requests,
    member_requests,
    feedbacks,
    jwt_tokens,
    social_accounts,
    withdrawals,
    members
RESTART IDENTITY CASCADE;
"""

# ──────────────────────────────────────────────
# 데이터 정의
# ──────────────────────────────────────────────

MEMBERS = [
    # id, phone, name, birth, gender
    (1,  "01011111111", "정수민", "2000-07-15", "female"),
    (2,  "01022222222", "김다힌", "1990-04-20", "male"),
    (3,  "01033333333", "김정민", "1998-02-28", "male"),
    (4,  "01044444444", "문자영", "2002-09-10", "female"),
    (5,  "01055555555", "이수진", "1997-12-03", "female"),
    (6,  "01066666666", "박지훈", "1995-06-17", "male"),
    (7,  "01077777777", "한지수", "1999-03-15", "female"),
    (8,  "01088888888", "김태훈", "1985-07-22", "male"),
    (9,  "01099999999", "김민형", "2001-11-08", "male"),
    (10, "01000000001", "김재욱", "2000-05-30", "male"),
]

STORES = [
    # id, code, raw_digits, name, address, address_detail, industry, owner_name, phone
    (1, 123456, "1234567890", "노량물산",
     "서울특별시 동작구 노량진로 151", None,       "카페",     "김다힌", "027272112"),
    (2, 234567, "2345678901", "노량전자",
     "서울특별시 동작구 노량진로 160", "2층",      "판매/매장", "김다힌", "027272200"),
    (3, 345678, "3456789012", "강서물산",
     "서울특별시 강서구 강서로 123",   "1층",      "서비스업",  "김태훈", "027272300"),
]

STORE_MAPS = [
    (1, 1, "37.5705490", "126.8442340"),
    (2, 2, "37.5705490", "126.8442340"),
    (3, 3, "37.5705490", "126.8442340"),
]

# store_members: id, store_id, member_id, role, nickname, bank, account_name, account_number
STORE_MEMBERS = [
    (1,  1, 1, "employee", None,    "국민",   "정수민", "123456-78-901234"),
    (2,  1, 2, "owner",    None,    None,     None,    None),
    (3,  1, 3, "employee", None,    "신한",   "김정민", "110-123-456789"),
    (4,  1, 4, "employee", None,    "카카오", "문자영", "3333-01-1234567"),
    (5,  1, 5, "employee", None,    "하나",   "이수진", "123-456789-01234"),
    (6,  1, 6, "employee", None,    "농협",   "박지훈", "301-1234-5678-91"),
    (7,  2, 2, "owner",    "김다힌", None,    None,    None),
    (8,  2, 1, "employee", "정수민", "국민",  "정수민", "123456-78-901234"),
    (9,  2, 7, "employee", "한지수", "토스",  "한지수", "100-1234-5678"),
    (10, 3, 8, "owner",    "김태훈", None,    None,    None),
    (11, 3, 9, "employee", "김민형", "우리",  "김민형", "1002-123-456789"),
    (12, 3, 10,"employee", "김재욱", "신한",  "김재욱", "110-987-654321"),
    (13, 3, 2, "employee", "김다힌", "기업",  "김다힌", "080-123456-01-012"),
]

# staff_contracts: id, store_member_id, employee_type, working_status, hourly_rate, salary_cycle, salary_day
CONTRACTS = [
    (1,  1,  "알바생", "재직", 10030, "월 1회 (월급)", "25일"),
    (2,  3,  "정규직", "재직", None,  "월 1회 (월급)", "15일"),
    (3,  4,  "알바생", "재직", 11000, "월 1회 (월급)", "25일"),
    (4,  5,  "알바생", "재직", 9860,  "월 2회",         "1일, 15일"),
    (5,  6,  "정규직", "재직", None,  "월 1회 (월급)", "10일"),
    (6,  8,  "알바생", "재직", 10030, "월 1회 (월급)", "25일"),
    (7,  9,  "알바생", "재직", 10500, "월 1회 (월급)", "25일"),
    (8,  11, "알바생", "재직", 10500, "월 1회 (월급)", "25일"),
    (9,  12, "알바생", "재직", 9900,  "월 1회 (월급)", "25일"),
    (10, 13, "알바생", "재직", 15000, "월 1회 (월급)", "25일"),
]

# schedules: id, store_id, employee_id, shift_id, work_date, work_start, work_end
SCHEDULES = [
    (1,  1, 1, 1,  "2026-05-07","08:00","14:00"),
    (2,  1, 3, 2,  "2026-05-07","12:00","17:00"),
    (3,  1, 4, 3,  "2026-05-07","17:00","22:00"),
    (4,  1, 5, 1,  "2026-05-07","08:00","14:00"),
    (5,  1, 6, 3,  "2026-05-07","17:00","22:00"),
    (6,  1, 3, 1,  "2026-05-08","08:00","14:00"),
    (7,  1, 4, 1,  "2026-05-08","08:00","14:00"),
    (8,  1, 5, 2,  "2026-05-08","12:00","17:00"),
    (9,  1, 6, 2,  "2026-05-08","12:00","17:00"),
    (10, 1, 1, 2,  "2026-05-09","12:00","17:00"),
    (11, 1, 3, 3,  "2026-05-09","17:00","22:00"),
    (12, 1, 4, 2,  "2026-05-09","12:00","17:00"),
    (13, 1, 6, 1,  "2026-05-09","08:00","14:00"),
    (14, 1, 1, 1,  "2026-05-10","08:00","14:00"),
    (15, 1, 3, 2,  "2026-05-10","12:00","17:00"),
    (16, 1, 4, 3,  "2026-05-10","17:00","22:00"),
    (17, 1, 5, 1,  "2026-05-10","08:00","14:00"),
    (18, 1, 6, 3,  "2026-05-10","17:00","22:00"),
    (19, 1, 4, 1,  "2026-05-11","08:00","14:00"),
    (20, 1, 5, 3,  "2026-05-11","17:00","22:00"),
    (21, 1, 6, 2,  "2026-05-11","12:00","17:00"),
    (22, 1, 1, 3,  "2026-05-12","17:00","22:00"),
    (23, 1, 3, 1,  "2026-05-12","08:00","14:00"),
    (24, 1, 4, 2,  "2026-05-12","12:00","17:00"),
    (25, 1, 6, 2,  "2026-05-12","12:00","17:00"),
    (26, 1, 3, 3,  "2026-05-13","17:00","22:00"),
    (27, 1, 5, 1,  "2026-05-13","08:00","14:00"),
    (28, 1, 6, 1,  "2026-05-13","08:00","14:00"),
    (29, 1, 1, 1,  "2026-05-14","08:00","14:00"),
    (30, 1, 3, 2,  "2026-05-14","12:00","17:00"),
    (31, 1, 4, 3,  "2026-05-14","17:00","22:00"),
    (32, 1, 5, 2,  "2026-05-14","12:00","17:00"),
    # 노량전자 (store 2)
    (33, 2, 8, 4,  "2026-05-07","08:00","14:00"),
    (34, 2, 9, 6,  "2026-05-07","17:00","22:00"),
    (35, 2, 9, 4,  "2026-05-08","08:00","14:00"),
    (36, 2, 8, 5,  "2026-05-09","12:00","17:00"),
    (37, 2, 9, 6,  "2026-05-09","17:00","22:00"),
    (38, 2, 8, 4,  "2026-05-10","08:00","14:00"),
    (39, 2, 9, 5,  "2026-05-10","12:00","17:00"),
    (40, 2, 9, 4,  "2026-05-11","08:00","14:00"),
    (41, 2, 8, 6,  "2026-05-12","17:00","22:00"),
    (42, 2, 9, 5,  "2026-05-12","12:00","17:00"),
    (43, 2, 8, 4,  "2026-05-13","08:00","14:00"),
    (44, 2, 9, 6,  "2026-05-13","17:00","22:00"),
    # 강서물산 (store 3)
    (45, 3, 11, 7, "2026-05-07","08:00","14:00"),
    (46, 3, 12, 8, "2026-05-07","12:00","17:00"),
    (47, 3, 13, 9, "2026-05-07","17:00","22:00"),
    (48, 3, 11, 8, "2026-05-08","12:00","17:00"),
    (49, 3, 12, 9, "2026-05-08","17:00","22:00"),
    (50, 3, 11, 7, "2026-05-09","08:00","14:00"),
    (51, 3, 13, 8, "2026-05-09","12:00","17:00"),
    (52, 3, 11, 9, "2026-05-10","17:00","22:00"),
    (53, 3, 12, 7, "2026-05-10","08:00","14:00"),
    (54, 3, 13, 7, "2026-05-10","08:00","14:00"),
    (55, 3, 12, 9, "2026-05-11","17:00","22:00"),
    (56, 3, 13, 8, "2026-05-11","12:00","17:00"),
    (57, 3, 11, 7, "2026-05-12","08:00","14:00"),
    (58, 3, 12, 8, "2026-05-12","12:00","17:00"),
    (59, 3, 13, 9, "2026-05-12","17:00","22:00"),
    (60, 3, 11, 9, "2026-05-13","17:00","22:00"),
    (61, 3, 12, 7, "2026-05-13","08:00","14:00"),
]

# work_logs: id, store_id, employee_id, work_date, start_time, end_time, break_start, break_end, status
WORK_LOGS = [
    (1,  1,1, "2026-05-07","2026-05-07 08:00+09","2026-05-07 14:00+09","2026-05-07 10:00+09","2026-05-07 10:30+09","off_work"),
    (2,  1,3, "2026-05-07","2026-05-07 12:00+09","2026-05-07 17:00+09","2026-05-07 14:00+09","2026-05-07 14:30+09","off_work"),
    (3,  1,4, "2026-05-07","2026-05-07 17:00+09","2026-05-07 22:00+09","2026-05-07 19:00+09","2026-05-07 19:30+09","off_work"),
    (4,  1,5, "2026-05-07","2026-05-07 08:00+09","2026-05-07 14:00+09","2026-05-07 10:00+09","2026-05-07 10:30+09","off_work"),
    (5,  1,6, "2026-05-07","2026-05-07 17:00+09","2026-05-07 22:00+09","2026-05-07 19:00+09","2026-05-07 19:30+09","off_work"),
    (6,  1,3, "2026-05-08","2026-05-08 08:00+09","2026-05-08 14:00+09","2026-05-08 10:00+09","2026-05-08 10:30+09","off_work"),
    (7,  1,4, "2026-05-08","2026-05-08 08:00+09","2026-05-08 14:00+09","2026-05-08 10:00+09","2026-05-08 10:30+09","off_work"),
    (8,  1,5, "2026-05-08","2026-05-08 12:00+09","2026-05-08 17:00+09","2026-05-08 14:00+09","2026-05-08 14:30+09","off_work"),
    (9,  1,6, "2026-05-08","2026-05-08 12:00+09","2026-05-08 17:00+09","2026-05-08 14:00+09","2026-05-08 14:30+09","off_work"),
    (10, 1,1, "2026-05-09","2026-05-09 12:00+09","2026-05-09 17:00+09","2026-05-09 14:00+09","2026-05-09 14:30+09","off_work"),
    (11, 1,3, "2026-05-09","2026-05-09 17:00+09","2026-05-09 22:00+09","2026-05-09 19:00+09","2026-05-09 19:30+09","off_work"),
    (12, 1,4, "2026-05-09","2026-05-09 12:00+09","2026-05-09 17:00+09","2026-05-09 14:00+09","2026-05-09 14:30+09","off_work"),
    (13, 1,6, "2026-05-09","2026-05-09 08:00+09","2026-05-09 14:00+09","2026-05-09 10:00+09","2026-05-09 10:30+09","off_work"),
    (14, 1,1, "2026-05-10","2026-05-10 08:00+09","2026-05-10 14:00+09","2026-05-10 10:00+09","2026-05-10 10:30+09","off_work"),
    (15, 1,3, "2026-05-10","2026-05-10 12:00+09","2026-05-10 17:00+09","2026-05-10 14:00+09","2026-05-10 14:30+09","off_work"),
    (16, 1,4, "2026-05-10","2026-05-10 17:00+09","2026-05-10 22:00+09","2026-05-10 19:00+09","2026-05-10 19:30+09","off_work"),
    (17, 1,5, "2026-05-10","2026-05-10 08:00+09","2026-05-10 14:05+09","2026-05-10 10:00+09","2026-05-10 10:30+09","off_work"),
    (18, 1,6, "2026-05-10","2026-05-10 17:00+09","2026-05-10 21:55+09","2026-05-10 19:00+09","2026-05-10 19:30+09","off_work"),
    (19, 1,4, "2026-05-11","2026-05-11 08:00+09","2026-05-11 14:00+09","2026-05-11 10:00+09","2026-05-11 10:30+09","off_work"),
    (20, 1,5, "2026-05-11","2026-05-11 17:00+09","2026-05-11 22:00+09","2026-05-11 19:00+09","2026-05-11 19:30+09","off_work"),
    (21, 1,6, "2026-05-11","2026-05-11 12:00+09","2026-05-11 17:00+09","2026-05-11 14:00+09","2026-05-11 14:30+09","off_work"),
    # 노량전자
    (22, 2,8, "2026-05-07","2026-05-07 08:00+09","2026-05-07 14:00+09","2026-05-07 10:00+09","2026-05-07 10:30+09","off_work"),
    (23, 2,9, "2026-05-07","2026-05-07 17:00+09","2026-05-07 22:00+09","2026-05-07 19:00+09","2026-05-07 19:30+09","off_work"),
    (24, 2,9, "2026-05-08","2026-05-08 08:00+09","2026-05-08 14:05+09","2026-05-08 10:00+09","2026-05-08 10:30+09","off_work"),
    (25, 2,8, "2026-05-09","2026-05-09 12:00+09","2026-05-09 17:00+09","2026-05-09 14:00+09","2026-05-09 14:30+09","off_work"),
    (26, 2,9, "2026-05-09","2026-05-09 17:00+09","2026-05-09 22:00+09","2026-05-09 19:00+09","2026-05-09 19:30+09","off_work"),
    (27, 2,8, "2026-05-10","2026-05-10 08:00+09","2026-05-10 14:00+09","2026-05-10 10:00+09","2026-05-10 10:30+09","off_work"),
    (28, 2,9, "2026-05-10","2026-05-10 12:00+09","2026-05-10 17:00+09","2026-05-10 14:00+09","2026-05-10 14:30+09","off_work"),
    (29, 2,9, "2026-05-11","2026-05-11 08:00+09","2026-05-11 14:00+09","2026-05-11 10:00+09","2026-05-11 10:30+09","off_work"),
    # 강서물산
    (30, 3,11,"2026-05-07","2026-05-07 08:00+09","2026-05-07 14:00+09","2026-05-07 10:00+09","2026-05-07 10:30+09","off_work"),
    (31, 3,12,"2026-05-07","2026-05-07 12:00+09","2026-05-07 17:00+09","2026-05-07 14:00+09","2026-05-07 14:30+09","off_work"),
    (32, 3,13,"2026-05-07","2026-05-07 17:00+09","2026-05-07 22:00+09","2026-05-07 19:00+09","2026-05-07 19:30+09","off_work"),
    (33, 3,11,"2026-05-08","2026-05-08 12:00+09","2026-05-08 17:00+09","2026-05-08 14:00+09","2026-05-08 14:30+09","off_work"),
    (34, 3,12,"2026-05-08","2026-05-08 17:00+09","2026-05-08 22:00+09","2026-05-08 19:00+09","2026-05-08 19:30+09","off_work"),
    (35, 3,11,"2026-05-09","2026-05-09 08:00+09","2026-05-09 14:00+09","2026-05-09 10:00+09","2026-05-09 10:30+09","off_work"),
    (36, 3,13,"2026-05-09","2026-05-09 12:00+09","2026-05-09 17:00+09","2026-05-09 14:00+09","2026-05-09 14:30+09","off_work"),
    (37, 3,11,"2026-05-10","2026-05-10 17:00+09","2026-05-10 22:00+09","2026-05-10 19:00+09","2026-05-10 19:30+09","off_work"),
    (38, 3,12,"2026-05-10","2026-05-10 08:00+09","2026-05-10 14:00+09","2026-05-10 10:00+09","2026-05-10 10:30+09","off_work"),
    (39, 3,13,"2026-05-10","2026-05-10 08:05+09","2026-05-10 14:00+09","2026-05-10 10:00+09","2026-05-10 10:30+09","off_work"),
    (40, 3,12,"2026-05-11","2026-05-11 17:00+09","2026-05-11 22:00+09","2026-05-11 19:00+09","2026-05-11 19:30+09","off_work"),
    (41, 3,13,"2026-05-11","2026-05-11 12:00+09","2026-05-11 17:00+09","2026-05-11 14:00+09","2026-05-11 14:30+09","off_work"),
]

# store_community: id, store_id, employee_id, category, title, content, created_at, is_deleted
POSTS = [
    (1,  1, 3, "비품관리",    "데이터 확인",          "dd",            "2026-05-11 22:13:49", False),
    (2,  1, 1, "일반 게시글", "테스트 제목",          "테스트 내용sx", "2026-05-12 15:39:42", False),
    (3,  1, 1, "일반 게시글", "테스트 제목",          "테스트 내용",   "2026-05-12 15:39:43", False),
    (4,  1, 1, "건의사항",    "근무 변경 건의",        "근무 시간 조정 부탁드려요.", "2026-05-12 16:00:00", False),
    (5,  1, 1, "대타요청",    "5/14 대타 구해요",      "14일 오픈 대타 가능하신 분 연락 주세요!", "2026-05-12 17:00:00", False),
    # 공지사항 (사장 작성, store_member_id=2)
    (6,  1, 2, "공지사항",    "5월 근무 일정 안내",    "이번 달 근무 일정을 확인해 주세요. 변경이 필요하신 분은 사전에 말씀 부탁드립니다.", "2026-05-12 09:00:00", False),
    (7,  1, 2, "공지사항",    "매장 위생 점검 안내",   "다음 주 수요일 위생 점검이 예정되어 있습니다. 청결 상태를 미리 점검해 주세요.",    "2026-05-13 10:30:00", False),
    # 강서물산 공지 (store_member_id=10)
    (8,  3, 10,"공지사항",    "신규 직원 입사 안내",   "이번 주부터 새로운 직원이 합류합니다. 잘 부탁드립니다.",                          "2026-05-13 11:00:00", False),
]


def run():
    with engine.connect() as conn:
        print("── DB 초기화 중...")
        conn.execute(text(TRUNCATE_SQL))
        conn.commit()
        print("  ✓ 테이블 초기화 완료")

        # ── members
        for mid, phone, name, birth, gender in MEMBERS:
            conn.execute(text("""
                INSERT INTO members (id, password, phone, name, birth, gender, image_url, is_deleted)
                VALUES (:id, :pw, :phone, :name, :birth, :gender, 'default.png', FALSE)
            """), dict(id=mid, pw=PW, phone=phone, name=name, birth=birth, gender=gender))
        conn.execute(text("SELECT setval('members_id_seq', (SELECT MAX(id) FROM members))"))
        conn.commit()
        print(f"  ✓ members {len(MEMBERS)}명")

        # ── stores
        for sid, code, raw, name, addr, addr_d, industry, owner, phone in STORES:
            conn.execute(text("""
                INSERT INTO stores
                  (id, code, raw_digits, name, address, address_detail, industry,
                   owner_name, phone, business_image, radius, is_deleted)
                VALUES
                  (:id,:code,:raw,:name,:addr,:addr_d,:industry,
                   :owner,:phone,'default.png',500,FALSE)
            """), dict(id=sid, code=code, raw=raw, name=name, addr=addr,
                       addr_d=addr_d, industry=industry, owner=owner, phone=phone))
        conn.execute(text("SELECT setval('stores_id_seq', (SELECT MAX(id) FROM stores))"))

        for mid, sid, lat, lng in STORE_MAPS:
            conn.execute(text("""
                INSERT INTO store_maps (id, store_id, lat, lng) VALUES (:id,:sid,:lat,:lng)
            """), dict(id=mid, sid=sid, lat=lat, lng=lng))
        conn.execute(text("SELECT setval('store_maps_id_seq', (SELECT MAX(id) FROM store_maps))"))

        # store_settings (기본값)
        for i in range(1, 4):
            conn.execute(text("""
                INSERT INTO store_settings
                  (store_id, is_fixed_holiday, has_overtime_pay, overtime_after_daily_8h,
                   overtime_after_weekly_40h, overtime_threshold_minutes, overtime_multiplier,
                   has_night_pay, night_threshold_minutes, night_multiplier,
                   has_holiday_pay, holiday_threshold_minutes,
                   holiday_multiplier_under_8h, holiday_multiplier_over_8h)
                VALUES (:sid,FALSE,FALSE,TRUE,TRUE,30,1.50,FALSE,30,1.50,FALSE,30,1.50,2.00)
            """), dict(sid=i))

        # store_shifts (오픈/미들/마감 × 3 매장)
        shift_id = 1
        for sid in range(1, 4):
            for order, sname in [(1,"오픈"),(2,"미들"),(3,"마감")]:
                conn.execute(text("""
                    INSERT INTO store_shifts (id, store_id, sort_order, name, is_active)
                    VALUES (:id,:sid,:order,:name,TRUE)
                """), dict(id=shift_id, sid=sid, order=order, name=sname))
                shift_id += 1
        conn.execute(text("SELECT setval('store_shifts_id_seq', (SELECT MAX(id) FROM store_shifts))"))
        conn.commit()
        print(f"  ✓ stores {len(STORES)}개, shifts {shift_id-1}개")

        # ── store_members
        for row in STORE_MEMBERS:
            mid, sid, memid, role, nick, bank, aname, anum = row
            conn.execute(text("""
                INSERT INTO store_members
                  (id, store_id, member_id, role, nickname, bank, account_name, account_number,
                   image_url, is_deleted)
                VALUES
                  (:id,:sid,:memid,:role,:nick,:bank,:aname,:anum,NULL,FALSE)
            """), dict(id=mid, sid=sid, memid=memid, role=role, nick=nick,
                       bank=bank, aname=aname, anum=anum))
        conn.execute(text("SELECT setval('store_members_id_seq', (SELECT MAX(id) FROM store_members))"))
        conn.commit()
        print(f"  ✓ store_members {len(STORE_MEMBERS)}명")

        # ── staff_contracts
        for cid, smid, etype, wstatus, rate, cycle, day in CONTRACTS:
            conn.execute(text("""
                INSERT INTO staff_contracts
                  (id, store_member_id, employee_type, working_status,
                   hourly_rate, salary_cycle, salary_day, is_probation)
                VALUES (:id,:smid,:etype,:wstatus,:rate,:cycle,:day,FALSE)
            """), dict(id=cid, smid=smid, etype=etype, wstatus=wstatus,
                       rate=rate, cycle=cycle, day=day))
        conn.execute(text("SELECT setval('staff_contracts_id_seq', (SELECT MAX(id) FROM staff_contracts))"))
        conn.commit()
        print(f"  ✓ staff_contracts {len(CONTRACTS)}개")

        # ── schedules
        for sid, stid, empid, shiftid, wdate, wstart, wend in SCHEDULES:
            conn.execute(text("""
                INSERT INTO schedules
                  (id, store_id, employee_id, shift_id, work_date, work_start, work_end,
                   is_holiday, is_substitution)
                VALUES (:id,:stid,:empid,:shiftid,:wdate,:wstart,:wend,FALSE,FALSE)
            """), dict(id=sid, stid=stid, empid=empid, shiftid=shiftid,
                       wdate=wdate, wstart=wstart, wend=wend))
        conn.execute(text("SELECT setval('schedules_id_seq', (SELECT MAX(id) FROM schedules))"))
        conn.commit()
        print(f"  ✓ schedules {len(SCHEDULES)}개")

        # ── work_logs
        for wid, stid, empid, wdate, st, et, bst, bet, status in WORK_LOGS:
            conn.execute(text("""
                INSERT INTO work_logs
                  (id, store_id, employee_id, work_date,
                   start_time, end_time, break_start_time, break_end_time, status)
                VALUES (:id,:stid,:empid,:wdate,:st,:et,:bst,:bet,:status)
            """), dict(id=wid, stid=stid, empid=empid, wdate=wdate,
                       st=st, et=et, bst=bst, bet=bet, status=status))
        conn.execute(text("SELECT setval('work_logs_id_seq', (SELECT MAX(id) FROM work_logs))"))
        conn.commit()
        print(f"  ✓ work_logs {len(WORK_LOGS)}개")

        # ── store_community (게시판)
        for pid, stid, empid, cat, title, content, cat_at, deleted in POSTS:
            conn.execute(text("""
                INSERT INTO store_community
                  (id, store_id, employee_id, category, title, content,
                   image, view_count, created_at, is_deleted)
                VALUES (:id,:stid,:empid,:cat,:title,:content,NULL,0,:cat_at,:deleted)
            """), dict(id=pid, stid=stid, empid=empid, cat=cat, title=title,
                       content=content, cat_at=cat_at, deleted=deleted))
        conn.execute(text("SELECT setval('store_community_id_seq', (SELECT MAX(id) FROM store_community))"))
        conn.commit()
        print(f"  ✓ store_community {len(POSTS)}개 (공지사항 포함)")

        # ── 마감 보고 샘플
        conn.execute(text("""
            INSERT INTO daily_closing_reports
              (store_id, employee_id, report_date,
               card_sales, cash_sales, transfer_sales, gift_sales,
               discount_amount, refund_amount, cash_on_hand, manager_note)
            VALUES (1, 1, '2026-05-12', 850000, 120000, 30000, 0, 0, 0, 970000, '마감 이상 없음')
        """))
        conn.commit()
        print("  ✓ daily_closing_reports 1개")

    print("\n✅ 초기화 완료!")
    print("─────────────────────────────────────────")
    print("  계정 목록 (모든 비밀번호: 1234)")
    print("─────────────────────────────────────────")
    accounts = [
        ("정수민 (직원)", "010-1111-1111", "노량물산"),
        ("김다힌 (사장)", "010-2222-2222", "노량물산, 노량전자"),
        ("김정민 (직원)", "010-3333-3333", "노량물산"),
        ("문자영 (직원)", "010-4444-4444", "노량물산"),
        ("이수진 (직원)", "010-5555-5555", "노량물산"),
        ("박지훈 (직원)", "010-6666-6666", "노량물산"),
        ("한지수 (직원)", "010-7777-7777", "노량전자"),
        ("김태훈 (사장)", "010-8888-8888", "강서물산"),
        ("김민형 (직원)", "010-9999-9999", "강서물산"),
        ("김재욱 (직원)", "010-0000-0001", "강서물산"),
    ]
    for name, phone, store in accounts:
        print(f"  {name:<18} {phone}  ({store})")
    print("─────────────────────────────────────────")
    print("  매장 코드")
    print("  노량물산: 123456  |  노량전자: 234567  |  강서물산: 345678")
    print("─────────────────────────────────────────")


if __name__ == "__main__":
    confirm = input("⚠️  기존 데이터가 모두 삭제됩니다. 계속할까요? (y/N): ").strip().lower()
    if confirm == "y":
        run()
    else:
        print("취소했습니다.")
