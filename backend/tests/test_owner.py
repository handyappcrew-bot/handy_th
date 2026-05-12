"""5단계 — 사장 전용 엔드포인트: 권한 검증"""
from conftest import BASE, STORE_1, OWNER_ID


def test_staff_list(owner):
    r = owner.get(f"{BASE}/api/owner/store/{STORE_1}/staffs")
    assert r.status_code == 200
    assert isinstance(r.json(), list)


def test_today_attendance(owner):
    r = owner.get(f"{BASE}/api/owner/store/{STORE_1}/attendance/today")
    assert r.status_code == 200
    assert isinstance(r.json(), list)


def test_payslip_months(owner):
    r = owner.get(f"{BASE}/api/owner/store/{STORE_1}/payslips/months")
    assert r.status_code in (200, 404)  # 데이터 없어도 OK


def test_closing_reports(owner):
    r = owner.get(f"{BASE}/api/owner/store/{STORE_1}/closing-reports")
    assert r.status_code == 200


def test_worklog_requests(owner):
    r = owner.get(f"{BASE}/api/owner/store/{STORE_1}/worklog-requests")
    assert r.status_code == 200


def test_schedule_requests(owner):
    r = owner.get(f"{BASE}/api/owner/store/{STORE_1}/schedule-requests")
    assert r.status_code == 200


def test_mypage_info_own(owner):
    r = owner.get(f"{BASE}/api/owner/mypage/{OWNER_ID}/info", params={"store_id": STORE_1})
    assert r.status_code == 200


def test_mypage_info_other_returns_403(owner):
    """다른 사람의 마이페이지는 403이어야 함"""
    other_id = 999
    r = owner.get(f"{BASE}/api/owner/mypage/{other_id}/info", params={"store_id": STORE_1})
    assert r.status_code == 403


def test_owner_endpoints_require_auth(anon):
    """미인증으로 사장 전용 API 호출 시 401"""
    protected = [
        f"{BASE}/api/owner/store/{STORE_1}/staffs",
        f"{BASE}/api/owner/store/{STORE_1}/attendance/today",
        f"{BASE}/api/owner/store/{STORE_1}/closing-reports",
        f"{BASE}/api/owner/store/{STORE_1}/worklog-requests",
    ]
    for url in protected:
        r = anon.get(url)
        assert r.status_code == 401, f"{url} → {r.status_code} (401이어야 함)"
