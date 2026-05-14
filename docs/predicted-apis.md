# 미구현 페이지 기반 API 예측 백로그

> 작성: 2026-05-14
> 목적: 기획자 UI가 아직 API 안 부르는 페이지들을 미리 분석. 나중에 기획자가 작업할 때 빠르게 대응하기 위한 사전 준비.

## 요약 통계

| 구분 | 개수 |
|------|------|
| ✅ 백엔드 이미 구현됨 (UI만 붙이면 됨) | 약 30개+ |
| ❌ 백엔드 신규 구현 필요 | 약 7개 |
| 🟡 보류/판단 필요 | 약 3개 |

---

## 1. 사장 - 스케줄 관리 🔴

**페이지**: `pages/owner/ScheduleManagement.tsx`
**상태**: UI 있음, 전부 Mock 데이터. API 미연결.

| 메서드 | 엔드포인트 | 백엔드 상태 | 확률 |
|--------|-----------|-------------|------|
| GET | `/api/owner/store/{id}/schedules?year&month` | ✅ 있음 | 100% |
| POST | `/api/owner/store/{id}/schedules` | ✅ 있음 | 100% |
| POST | `/api/owner/store/{id}/schedules/bulk` | ✅ 있음 | 90% |
| PUT | `/api/owner/store/{id}/schedules/{sid}` | ✅ 있음 | 100% |
| DELETE | `/api/owner/store/{id}/schedules/{sid}` | ✅ 있음 | 100% |
| GET | `/api/owner/store/{id}/schedule-requests` | ✅ 있음 | 90% |
| PUT | `/api/owner/store/{id}/schedule-requests/{rid}` | ✅ 있음 | 90% |

→ **백엔드는 완비, 프론트가 연결만 하면 됨**

---

## 2. 사장 - 마감 보고 관리 🔴

**페이지**: 직원 측 `pages/employee/ClosingReport.tsx`는 API 연결됨. 사장 측 조회/수정 UI는 미구현.

| 메서드 | 엔드포인트 | 백엔드 상태 | 확률 |
|--------|-----------|-------------|------|
| GET | `/api/owner/store/{id}/closing-reports?year&month` | ✅ 있음 | 100% |
| PUT | `/api/owner/store/{id}/closing-reports/{rid}` | ✅ 있음 | 80% |

→ **백엔드 완비**

---

## 3. 사장 - 매출 관리 🔴 (백엔드 신규 필요)

**페이지**: `SalesManagement.tsx`, `SalesDailyDetail.tsx`, `SalesDailyEdit.tsx`, `SalesMonthlyDetail.tsx`
**상태**: 전부 Mock. localStorage만 사용.

| 메서드 | 엔드포인트 | 백엔드 상태 | 확률 |
|--------|-----------|-------------|------|
| GET | `/api/owner/store/{id}/sales/monthly?year&month` | ❌ 없음 | 90% |
| GET | `/api/owner/store/{id}/sales/daily?year&month` | ❌ 없음 | 90% |
| GET | `/api/owner/store/{id}/sales/daily/{date}` | ❌ 없음 | 85% |
| PUT | `/api/owner/store/{id}/sales/daily/{date}` | ❌ 없음 | 70% |

**상황 메모**:
- 매출 데이터 = 마감보고에 입력된 카드/현금/이체/상품권 매출
- 즉, 별도 DB 테이블 안 만들고 `DailyClosingReport`를 집계/조회하는 형태로 구현 가능
- "월간 매출 = 해당 월 마감보고들의 합계", "일별 매출 = 그 날짜 마감보고"
- 매출 정정(PUT)은 마감보고 수정과 동일한 동작일 수 있음

→ **새 엔드포인트 추가하되, 내부 로직은 `DailyClosingReport` 재사용 가능**

---

## 4. 사장 - 급여 관리 🔴

**페이지**: `SalaryManagement.tsx`, `SalaryDetail.tsx`, `SalaryDetailEdit.tsx`, `PayslipPublish.tsx`, `PayslipEdit.tsx`, `PayslipDetail.tsx`
**상태**: API 일부 호출됨. 급여 계산 로직은 Mock 데이터 기반.

| 메서드 | 엔드포인트 | 백엔드 상태 | 확률 |
|--------|-----------|-------------|------|
| GET | `/api/owner/store/{id}/payslips?year&month` | ✅ 있음 | 100% |
| GET | `/api/owner/store/{id}/payslips/{pid}` | ✅ 있음 | 100% |
| POST | `/api/owner/store/{id}/payslips/{pid}/publish` | ✅ 있음 | 100% |
| POST | `/api/owner/store/{id}/payslips/{pid}/transfer` | ✅ 있음 | 100% |
| PATCH | `/api/owner/store/{id}/payslips/{pid}` | ✅ 있음 | 85% |
| GET | `/api/owner/store/{id}/payslips/months` | ✅ 있음 | 95% |

**잠재 추가 항목**:
- 급여명세서 자동 생성/계산 트리거 (현재는 수동 생성?)
- `POST /api/owner/store/{id}/payslips/generate?year&month` 같은 일괄 생성 API → ❌ 없음, 60% 확률

→ **백엔드 대부분 완비, 자동 계산 트리거만 검토**

---

## 5. 사장 - 직원 관리 (상세) 🔴

**페이지**: `StaffManagement.tsx`, `StaffDetail.tsx`, `StaffEdit.tsx`

| 메서드 | 엔드포인트 | 백엔드 상태 | 확률 |
|--------|-----------|-------------|------|
| GET | `/api/owner/store/{id}/staffs` | ✅ 있음 | 100% |
| GET | `/api/owner/store/{id}/staff/{sid}` | ✅ 있음 | 100% |
| PUT | `/api/owner/store/{id}/staff/{sid}/contract` | ✅ 있음 | 90% |
| POST/PATCH | `/api/owner/store/{id}/staff/{sid}/memo` | ❌ 없음 (현재 localStorage만) | 60% |
| DELETE | `/api/owner/store/{id}/staff/{sid}` (직원 강퇴) | ❌ 없음 | 70% |
| POST | `/api/owner/store/{id}/staff/{sid}/leave` (휴직 처리) | ❌ 없음 | 50% |
| POST | `/api/owner/store/{id}/staff/{sid}/return` (복직 처리) | ❌ 없음 | 50% |

**상황 메모**:
- 메모는 현재 로컬에만 저장. 영구 저장하려면 백엔드 필요
- 강퇴/휴직은 `StoreMembers.is_deleted` 또는 별도 status 필드 필요

---

## 6. 사장 - 출퇴근 관리 🔴

**페이지**: `AttendanceManagement.tsx`, `AttendanceDetail.tsx`, `AttendanceEdit.tsx`, `AttendanceStandard.tsx`
**상태**: 오늘 출퇴근 조회만 구현. 다른 날짜/직원별 상세는 Mock.

| 메서드 | 엔드포인트 | 백엔드 상태 | 확률 |
|--------|-----------|-------------|------|
| GET | `/api/owner/store/{id}/attendance/today?date=` | ✅ 있음 (date 파라미터 있음) | 100% |
| GET | `/api/owner/store/{id}/attendance/staff/{sid}?year&month` | ❌ 없음 | 80% |
| GET | `/api/owner/store/{id}/worklog-requests` | ✅ 있음 | 100% |
| PUT | `/api/owner/store/{id}/worklog-requests/{rid}` | ✅ 있음 | 100% |
| PUT | `/api/owner/store/{id}/attendance-standard` | ✅ 있음 | 90% |

**상황 메모**:
- `/attendance/today?date=특정날짜` 형태로 이미 지원 가능 (현재 백엔드 코드 확인 시 date 파라미터 옵셔널)
- 직원별 월별 출퇴근 상세는 직원 API의 `/work/logs`를 사장 권한으로 호출 가능하게 별도 엔드포인트 필요할 수도

---

## 7. 사장 - 매장 관리 🔴

**페이지**: `StoreInfo.tsx`, `StoreInfoEdit.tsx`, `StoreHours.tsx`, `StoreHoursParts.tsx`, `StoreDelete.tsx`

| 메서드 | 엔드포인트 | 백엔드 상태 | 확률 |
|--------|-----------|-------------|------|
| GET | `/api/owner/store/{id}` | ✅ 있음 | 100% |
| PUT | `/api/owner/store/update` | ✅ 있음 | 90% |
| PUT | `/api/owner/store/{id}/setting` | ✅ 있음 | 85% |
| PUT | `/api/owner/store/{id}/attendance-standard` | ✅ 있음 | 85% |
| PUT | `/api/owner/store/{id}/shifts` | ✅ 있음 | 80% |
| DELETE | `/api/owner/store/delete` | ✅ 있음 | 100% |

→ **백엔드 완비**

---

## 8. 직원 - 스케줄 변경 요청 🔴

**페이지**: `pages/employee/ScheduleChangeRequest.tsx`
**상태**: 전부 Mock 데이터.

| 메서드 | 엔드포인트 | 백엔드 상태 | 확률 |
|--------|-----------|-------------|------|
| GET | `/api/employee/schedule/{store_id}?year&month` | ✅ 있음 | 100% |
| POST | `/api/employee/schedule/change` | ✅ 있음 | 100% |
| GET | `/api/employee/schedule/change` | ✅ 있음 | 90% |
| DELETE | `/api/employee/schedule/change/{id}` | ✅ 있음 | 90% |

→ **백엔드 완비**

---

## 9. 잠재 누락 기능 (확률 낮음)

| 기능 | 백엔드 | 확률 |
|------|--------|------|
| 비밀번호 찾기/재설정 | ❌ 없음 | 80% (장기적으로 필요) |
| 알림 전체 읽음 처리 | ❌ 없음 | 70% |
| 푸시 알림 발송 실제 동작 검증 | ⚠️ 부실 | 60% |
| FCM 토큰 삭제/비활성화 | ❌ 없음 | 40% |
| 계약 문서 만료 추적 | ❌ 없음 | 30% |

---

## 우선순위별 정리 (실행 순서 추천)

### 🔴 백엔드 신규 구현 필요 (높음)
1. **매출 조회 API** (`/sales/monthly`, `/sales/daily`) — 마감보고 데이터로 집계
2. **직원 메모 영구 저장** (`/staff/{sid}/memo`)
3. **직원 강퇴/휴직** (`/staff/{sid}` DELETE 또는 status 변경)

### 🟠 비교적 작은 추가 (중간)
4. **비밀번호 찾기 플로우** (회원가입 SMS 로직 재활용)
5. **알림 전체 읽음** (`PATCH /api/common/notification/read-all`)
6. **직원별 월간 출퇴근 조회** (사장용)

### 🟡 백엔드는 이미 완비 (UI 작업 대기)
모든 스케줄/마감보고/매장설정/급여명세서/매장관리 — **백엔드는 가만히 있어도 됨**. 기획자가 UI 만들면서 호출만 하면 됨.

---

## 핵심 결론

> **88.7% API 커버리지** + **이미 백엔드 앞서가있는 영역 많음**.
>
> 본인이 미리 뭘 해두려면:
> 1. **매출 조회 API** (마감보고 데이터 집계) — 임팩트 크고 신규 구현 필요
> 2. **비밀번호 찾기** — 사용자 락아웃 방지
> 3. **알림 전체 읽음** — 작고 자주 쓰는 기능
>
> 나머지(스케줄/매장설정/직원 상세 등)는 **기획자 UI 작업 시작 후 같이 진행**해도 충분함.
