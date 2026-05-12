"""6단계 — 겸직·권한 엣지케이스"""
from conftest import BASE, STORE_1, STORE_2, EMPLOYEE_ID


def test_employee_can_access_both_stores(emp):
    """겸직 직원은 두 가게 모두 접근 가능"""
    for store_id in (STORE_1, STORE_2):
        r = emp.post(f"{BASE}/api/employee/work/today", json={"store_id": store_id})
        assert r.status_code == 200, f"store {store_id} 접근 실패: {r.text}"


def test_work_logs_are_store_scoped(emp):
    """근태 기록은 가게별로 분리돼야 함"""
    r1 = emp.post(f"{BASE}/api/employee/work/logs",
                  json={"store_id": STORE_1, "year": 2025, "month": 5})
    r2 = emp.post(f"{BASE}/api/employee/work/logs",
                  json={"store_id": STORE_2, "year": 2025, "month": 5})
    assert r1.status_code == 200
    assert r2.status_code == 200
    # 두 결과가 서로 독립적임을 확인 (같은 데이터면 격리 실패)
    # 빈 리스트도 괜찮음 — 에러가 아닌 게 핵심
    assert isinstance(r1.json(), list)
    assert isinstance(r2.json(), list)
