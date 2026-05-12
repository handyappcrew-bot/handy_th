# 백엔드 개선 사항 기록

> 실제 테스트 과정에서 발견하고 직접 수정한 백엔드 이슈 목록입니다.

---

## 1. 중복 출근 방지 로직 추가

**파일:** `app/routers/employee.py` — `POST /work/clock-in`

**문제:**
출근 버튼을 두 번 누르면 `work_logs` 테이블에 같은 날짜의 출근 레코드가 중복 생성됐습니다.
퇴근 처리나 급여 계산 시 어느 레코드를 기준으로 해야 할지 모호해지는 데이터 정합성 문제입니다.

**수정 내용:**
```python
# 수정 전
db.add(WorkLog(...))
db.commit()

# 수정 후 — 당일 로그 존재 여부 먼저 확인
existing = db.query(WorkLog).filter(
    WorkLog.employee_id == employee.id,
    WorkLog.work_date == now.date(),
).first()
if existing:
    raise HTTPException(status_code=409, detail="이미 오늘 출근 처리되었습니다.")
```

---

## 2. 겸직 직원 정보 수정 버그 수정

**파일:** `app/routers/employee.py` — `POST /mypage/edit`, `DELETE /profile/document`

**문제:**
한 명의 직원이 여러 가게에 등록된 경우(겸직), `store_id` 없이 요청이 들어오면
SQLAlchemy `.first()`가 임의의 첫 번째 가게 레코드를 반환했습니다.
노량전자 직원이 자기 정보를 수정하면 노량물산 레코드가 수정되는 상황이 발생 가능했습니다.

**수정 내용:**
```python
# 수정 전
employee = db.query(StoreMembers).filter(
    StoreMembers.member_id == current_member.id
).first()  # 겸직이면 어느 가게인지 알 수 없음

# 수정 후
all_employees = db.query(StoreMembers).filter(
    StoreMembers.member_id == current_member.id
).all()
if len(all_employees) > 1:
    raise HTTPException(status_code=400, detail="가게가 여러 개인 경우 store_id를 전달해주세요.")
employee = all_employees[0] if all_employees else None
```

---

## 3. 공지사항 정렬 오류 수정

**파일:** `app/routers/employee.py` — `POST /notice`

**문제:**
홈 화면에 표시할 최신 공지사항 2건을 조회할 때 `order_by(created_at.asc())`로 정렬하고 있어
가장 오래된 공지 2건이 노출되고 있었습니다.

**수정 내용:**
```python
# 수정 전
.order_by(StoreCommunity.created_at.asc()).limit(2)

# 수정 후
.order_by(StoreCommunity.created_at.desc()).limit(2)
```

---

## 4. owner.py 인증(Auth) 누락 엔드포인트 전수 수정

**파일:** `app/routers/owner.py`

**문제:**
사장 전용 기능 대부분에 `Depends(get_current_member_with_refresh)` 인증이 빠져 있었습니다.
로그인하지 않은 사용자가 `store_id`만 알면 아래 작업이 가능했습니다:

| 엔드포인트 | 위험 |
|---|---|
| `PUT /store/update` | 매장명, 주소, 전화번호 무단 변경 |
| `DELETE /store/delete` | 매장 무단 삭제 |
| `GET /mypage/{member_id}/stores` | 타인의 매장 목록 조회 |
| `GET /mypage/{member_id}/info` | 타인의 인적사항 조회 |
| `PUT /store/{id}/setting` | 매장 설정 무단 변경 |
| `PUT /store/{id}/shifts` | 교대 슬롯 무단 수정 |
| `PUT /store/{id}/staff/{id}/contract` | 직원 계약 무단 수정 |
| `POST /payslips/{id}/publish` | 급여명세서 무단 발행 |
| `GET /store/{id}/closing-reports` | 매출 데이터 무단 조회 |
| `GET/PUT /worklog-requests` | 근태 수정 요청 무단 열람/처리 |

**수정 내용:**
전체 엔드포인트에 인증 의존성 추가, `mypage/{member_id}` 계열은 URL의 `member_id`와 JWT에서 추출한 `current_member.id` 일치 여부 검증 추가:
```python
if current_member.id != member_id:
    raise HTTPException(status_code=403, detail="권한이 없습니다.")
```

---

## 5. N+1 쿼리 문제 해결

**파일:** `app/routers/owner.py` — `GET /worklog-requests`, `GET /schedule-requests`

**문제:**
근태 수정 요청 목록을 가져올 때 요청 건수(N)만큼 추가 쿼리가 발생했습니다.
요청이 100건이면 StoreMembers 조회 100번 + Member 조회 100번 = 200번 추가 쿼리.

```python
# 수정 전 — N+1
for req in requests:
    sm = db.query(StoreMembers).filter(StoreMembers.id == req.employee_id).first()
    member = db.query(Member).filter(Member.id == sm.member_id).first()
```

**수정 내용:**
JOIN으로 한 번의 쿼리로 해결:
```python
# 수정 후 — JOIN
rows = (
    db.query(WorkLogChangeRequest, Member)
    .join(StoreMembers, StoreMembers.id == WorkLogChangeRequest.employee_id)
    .join(Member, Member.id == StoreMembers.member_id)
    .filter(...)
    .all()
)
for req, member in rows:
    ...
```

---

## 6. Pydantic 스키마 타입 안전성 개선

**파일:** `app/schemas/employee.py`

**문제 1:** `WorkLogChangeReq.date`가 `str` 타입이었습니다.
DB 컬럼은 `Date` 타입인데 Pydantic 검증 없이 임의의 문자열이 들어올 수 있었습니다.

**문제 2:** `POST /schedule/change`가 `req: dict`로 요청을 받아 Pydantic 검증이 전혀 없었습니다.
`desired_date`가 누락되면 `date_type.fromisoformat(None)` → `TypeError`로 500 에러 발생.

**수정 내용:**
```python
# 수정 전
class WorkLogChangeReq(BaseModel):
    date: str  # 검증 없음

# 수정 후
class WorkLogChangeReq(BaseModel):
    date: date  # Pydantic이 ISO 형식 자동 검증 및 파싱

# ScheduleChangeReq 스키마 신규 추가
class ScheduleChangeReq(BaseModel):
    store_id: int
    type: str = "schedule_change"
    origin_date: Optional[date] = None
    desired_date: date  # 필수값 명시
    ...
```

---

## 7. 마감 보고 체크 인증 추가

**파일:** `app/routers/employee.py` — `GET /closing-report/check`

**문제:**
로그인 없이 `store_id`만 알면 어느 가게의 오늘 마감 완료 여부를 조회할 수 있었습니다.

**수정 내용:**
`Depends(get_current_member_with_refresh)` 인증 추가.
