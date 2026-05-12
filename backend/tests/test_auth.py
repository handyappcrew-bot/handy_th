"""1단계 — 인증: 보호된 엔드포인트에 쿠키 없이 요청하면 401"""
from conftest import BASE, STORE_1


PROTECTED = [
    ("POST", f"{BASE}/api/employee/work/clock-in",  {"store_id": STORE_1}),
    ("POST", f"{BASE}/api/employee/work/clock-out", {"store_id": STORE_1}),
    ("POST", f"{BASE}/api/employee/work/logs",      {"store_id": STORE_1, "year": 2025, "month": 5}),
    ("GET",  f"{BASE}/api/owner/store/{STORE_1}/staffs", None),
    ("GET",  f"{BASE}/api/owner/store/{STORE_1}/attendance/today", None),
    ("GET",  f"{BASE}/api/employee/payslips", None),
]


def test_protected_returns_401_without_cookie(anon):
    for method, url, json in PROTECTED:
        if method == "GET":
            r = anon.get(url)
        else:
            r = anon.post(url, json=json)
        assert r.status_code == 401, (
            f"{method} {url} → {r.status_code} (쿠키 없이 401이어야 함)"
        )


def test_get_me_with_valid_cookie(emp):
    r = emp.get(f"{BASE}/api/auth/me")
    assert r.status_code == 200
    data = r.json()
    assert "id" in data or "member_id" in data
