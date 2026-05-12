"""2단계 — 출퇴근: 핵심 비즈니스 로직"""
import pytest
from conftest import BASE, STORE_1, STORE_2


def _clock_in(session, store_id=STORE_1):
    return session.post(f"{BASE}/api/employee/work/clock-in", json={"store_id": store_id})


def _clock_out(session, store_id=STORE_1):
    return session.post(f"{BASE}/api/employee/work/clock-out", json={"store_id": store_id})


def test_clock_in_success(emp):
    r = _clock_in(emp)
    assert r.status_code == 200, f"출근 실패: {r.text}"


def test_duplicate_clock_in_returns_409(emp):
    _clock_in(emp)
    r = _clock_in(emp)
    assert r.status_code == 409, "중복 출근 시 409여야 함"
    assert "이미" in r.text


def test_clock_out_after_clock_in(emp):
    _clock_in(emp)
    r = _clock_out(emp)
    assert r.status_code == 200, f"퇴근 실패: {r.text}"


def test_clock_out_without_clock_in_returns_404(emp):
    # cleanup_worklog fixture가 이미 오늘 log 지운 상태
    r = _clock_out(emp)
    assert r.status_code == 404, "출근 없이 퇴근 시 404여야 함"


def test_clock_in_store2(emp):
    """겸직: 노량전자(store 2)에서도 출근 가능"""
    r = _clock_in(emp, store_id=STORE_2)
    assert r.status_code == 200, f"store2 출근 실패: {r.text}"


def test_today_attendance_shows_clocked_in_employee(emp, owner):
    _clock_in(emp)
    r = owner.get(f"{BASE}/api/owner/store/{STORE_1}/attendance/today")
    assert r.status_code == 200
    data = r.json()
    clocked = [e for e in data if e.get("clock_in")]
    assert len(clocked) > 0, "출근한 직원이 근태현황에 보여야 함"


def test_today_attendance_clock_out_time_shown(emp, owner):
    """퇴근 후에는 실제 퇴근 시간이 표시돼야 함"""
    _clock_in(emp)
    _clock_out(emp)
    r = owner.get(f"{BASE}/api/owner/store/{STORE_1}/attendance/today")
    assert r.status_code == 200
    data = r.json()
    done = [e for e in data if e.get("status") == "off_work"]
    assert len(done) > 0
    for e in done:
        assert e.get("clock_out") is not None, "퇴근 완료 직원의 clock_out이 null이면 안 됨"
