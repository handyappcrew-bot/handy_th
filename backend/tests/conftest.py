import sys, os

ROOT = os.path.join(os.path.dirname(__file__), "..")
APP  = os.path.join(ROOT, "app")
sys.path.insert(0, ROOT)
sys.path.insert(0, APP)
os.environ.setdefault("ENV", "development")

from dotenv import load_dotenv
load_dotenv(os.path.join(APP, ".env"))

import pytest
import requests
from sqlalchemy import text
from database import SessionLocal
from utils.auth_utils import create_access_token

BASE = "http://localhost:8000"

# ── 테스트 계정 ──────────────────────────────────────────
EMPLOYEE_ID  = 1   # 정수민 (store 1 · store 2 겸직)
OWNER_ID     = 2   # 김다힌 (owner store 1 · store 2)
STORE_1      = 1   # 노량물산
STORE_2      = 2   # 노량전자
EMPLOYEE_SM1 = 1   # store_members.id (정수민 @ 노량물산)
EMPLOYEE_SM2 = 8   # store_members.id (정수민 @ 노량전자)


def _make_session(member_id: int) -> requests.Session:
    token = create_access_token(member_id)
    s = requests.Session()
    # requests의 쿠키 도메인 매칭 우회 → 모든 요청에 Cookie 헤더 직접 삽입
    s.headers.update({"Cookie": f"access_token={token}"})
    return s


@pytest.fixture(scope="session")
def emp():
    """직원(정수민) 인증 세션"""
    return _make_session(EMPLOYEE_ID)


@pytest.fixture(scope="session")
def owner():
    """사장(김다힌) 인증 세션"""
    return _make_session(OWNER_ID)


@pytest.fixture(scope="session")
def anon():
    """미인증 세션"""
    return requests.Session()


@pytest.fixture
def db():
    session = SessionLocal()
    yield session
    session.close()


@pytest.fixture(autouse=True)
def cleanup_worklog(db):
    """각 테스트 후 오늘 work_log 삭제 (중복 출근 방지 우회)"""
    yield
    db.execute(text(
        "DELETE FROM work_logs WHERE employee_id IN (:sm1, :sm2)"
        " AND work_date = CURRENT_DATE"
    ), {"sm1": EMPLOYEE_SM1, "sm2": EMPLOYEE_SM2})
    db.commit()
