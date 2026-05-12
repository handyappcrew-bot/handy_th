"""3단계 — 급여명세서 조회"""
from conftest import BASE, STORE_1


def test_employee_payslips_list(emp):
    r = emp.get(f"{BASE}/api/employee/payslips", params={"store_id": STORE_1})
    assert r.status_code == 200
    assert isinstance(r.json(), list)


def test_owner_payslips_list(owner):
    from datetime import date
    today = date.today()
    r = owner.get(f"{BASE}/api/owner/store/{STORE_1}/payslips",
                  params={"year": today.year, "month": today.month})
    assert r.status_code == 200


def test_payslip_detail_invalid_id(emp):
    r = emp.get(f"{BASE}/api/employee/payslips/99999",
                params={"store_id": STORE_1})
    assert r.status_code in (404, 403)
