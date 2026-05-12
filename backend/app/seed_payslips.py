"""
급여명세서 테스트 데이터 삽입 스크립트
실행: python seed_payslips.py  (handy_v2/app 디렉토리에서)
"""
import psycopg2
from datetime import date, datetime

conn = psycopg2.connect(
    user="udfdaf", password="00001234",
    host="localhost", port="5432", dbname="handy_v2"
)
cur = conn.cursor()

# ── 1. store_id 조회 ──────────────────────────────
cur.execute("SELECT id FROM stores WHERE code = 12345")
row = cur.fetchone()
if not row:
    print("ERROR: 매장(code=12345)이 없습니다. 먼저 서버를 한 번 실행해 DB를 초기화하세요.")
    exit()
store_id = row[0]
print(f"store_id = {store_id}")

# ── 2. 직원별 store_member_id 조회 ────────────────
target_names = ["정수민", "김정민", "문자영", "이수진", "박지훈"]
emp_id = {}  # name -> store_member_id

cur.execute("""
    SELECT m.name, sm.id
    FROM store_members sm
    JOIN members m ON sm.member_id = m.id
    WHERE sm.store_id = %s AND sm.is_deleted = false AND m.name = ANY(%s)
""", (store_id, target_names))

for name, sm_id in cur.fetchall():
    emp_id[name] = sm_id
    print(f"  {name}: store_member_id = {sm_id}")

missing = [n for n in target_names if n not in emp_id]
if missing:
    print(f"WARNING: 다음 직원이 DB에 없습니다: {missing}")

# ── 3. payslip 데이터 정의 ────────────────────────
NOW = datetime.now()

payslips = [
    # ── 정수민 (시급 10,030원, 급여일 25일) ──────
    dict(name="정수민", year=2026, month=2,
         ps=date(2026,2,1), pe=date(2026,2,28), pd=date(2026,2,25),
         work_days=18, work_min=5400, ot_min=0,
         base=1504500, ot=0, night=0, holiday=0, weekly=120000, other=0,
         itax=26820, ltax=2680, pension=73800, health=55720, care=7200, emp_ins=14040,
         total=1624500, deduct=180260, net=1444240,
         published=True, transferred=True),
    dict(name="정수민", year=2026, month=3,
         ps=date(2026,3,1), pe=date(2026,3,31), pd=date(2026,3,25),
         work_days=20, work_min=6000, ot_min=60,
         base=1705100, ot=25650, night=0, holiday=0, weekly=140000, other=0,
         itax=29500, ltax=2950, pension=81450, health=61540, care=7950, emp_ins=15510,
         total=1870750, deduct=198900, net=1671850,
         published=True, transferred=True),
    dict(name="정수민", year=2026, month=4,
         ps=date(2026,4,1), pe=date(2026,4,30), pd=date(2026,4,25),
         work_days=21, work_min=6300, ot_min=90,
         base=1805400, ot=40650, night=0, holiday=0, weekly=150000, other=50000,
         itax=31270, ltax=3127, pension=86400, health=65270, care=8430, emp_ins=16416,
         total=2046050, deduct=210913, net=1835137,
         published=True, transferred=False),
    dict(name="정수민", year=2026, month=5,
         ps=date(2026,5,1), pe=date(2026,5,31), pd=date(2026,5,25),
         work_days=0, work_min=0, ot_min=0,
         base=0, ot=0, night=0, holiday=0, weekly=0, other=0,
         itax=0, ltax=0, pension=0, health=0, care=0, emp_ins=0,
         total=0, deduct=0, net=0,
         published=False, transferred=False),

    # ── 김정민 (정규직 월급, 급여일 15일) ──────────
    dict(name="김정민", year=2026, month=2,
         ps=date(2026,2,1), pe=date(2026,2,28), pd=date(2026,2,15),
         work_days=20, work_min=9600, ot_min=0,
         base=1500000, ot=45000, night=0, holiday=0, weekly=0, other=0,
         itax=17850, ltax=1785, pension=69750, health=52680, care=6806, emp_ins=13500,
         total=1545000, deduct=162371, net=1382629,
         published=True, transferred=True),
    dict(name="김정민", year=2026, month=3,
         ps=date(2026,3,1), pe=date(2026,3,31), pd=date(2026,3,15),
         work_days=22, work_min=10560, ot_min=120,
         base=1500000, ot=75000, night=0, holiday=0, weekly=0, other=0,
         itax=17850, ltax=1785, pension=69750, health=52680, care=6806, emp_ins=13500,
         total=1575000, deduct=162371, net=1412629,
         published=True, transferred=True),
    dict(name="김정민", year=2026, month=4,
         ps=date(2026,4,1), pe=date(2026,4,30), pd=date(2026,4,15),
         work_days=21, work_min=10080, ot_min=60,
         base=1500000, ot=45000, night=0, holiday=0, weekly=0, other=50000,
         itax=17850, ltax=1785, pension=69750, health=52680, care=6806, emp_ins=13500,
         total=1595000, deduct=162371, net=1432629,
         published=True, transferred=True),
    dict(name="김정민", year=2026, month=5,
         ps=date(2026,5,1), pe=date(2026,5,31), pd=date(2026,5,15),
         work_days=0, work_min=0, ot_min=0,
         base=0, ot=0, night=0, holiday=0, weekly=0, other=0,
         itax=0, ltax=0, pension=0, health=0, care=0, emp_ins=0,
         total=0, deduct=0, net=0,
         published=False, transferred=False),

    # ── 문자영 (시급 11,000원, 급여일 25일) ─────────
    dict(name="문자영", year=2026, month=2,
         ps=date(2026,2,1), pe=date(2026,2,28), pd=date(2026,2,25),
         work_days=8, work_min=2400, ot_min=0,
         base=440000, ot=0, night=16500, holiday=11000, weekly=0, other=0,
         itax=3680, ltax=368, pension=0, health=0, care=0, emp_ins=8316,
         total=467500, deduct=12364, net=455136,
         published=True, transferred=False),
    dict(name="문자영", year=2026, month=3,
         ps=date(2026,3,1), pe=date(2026,3,31), pd=date(2026,3,25),
         work_days=9, work_min=2700, ot_min=0,
         base=495000, ot=0, night=16500, holiday=0, weekly=0, other=0,
         itax=4140, ltax=414, pension=0, health=0, care=0, emp_ins=9405,
         total=511500, deduct=13959, net=497541,
         published=True, transferred=True),
    dict(name="문자영", year=2026, month=4,
         ps=date(2026,4,1), pe=date(2026,4,30), pd=date(2026,4,25),
         work_days=8, work_min=2400, ot_min=0,
         base=440000, ot=0, night=11000, holiday=0, weekly=0, other=0,
         itax=3680, ltax=368, pension=0, health=0, care=0, emp_ins=8379,
         total=451000, deduct=12427, net=438573,
         published=True, transferred=True),
    dict(name="문자영", year=2026, month=5,
         ps=date(2026,5,1), pe=date(2026,5,31), pd=date(2026,5,25),
         work_days=0, work_min=0, ot_min=0,
         base=0, ot=0, night=0, holiday=0, weekly=0, other=0,
         itax=0, ltax=0, pension=0, health=0, care=0, emp_ins=0,
         total=0, deduct=0, net=0,
         published=False, transferred=False),

    # ── 이수진 (시급 9,860원, 급여일 1일·15일) ───────
    dict(name="이수진", year=2026, month=2,
         ps=date(2026,2,1), pe=date(2026,2,28), pd=date(2026,2,15),
         work_days=7, work_min=2100, ot_min=0,
         base=345100, ot=0, night=0, holiday=0, weekly=0, other=0,
         itax=1560, ltax=156, pension=0, health=0, care=0, emp_ins=6557,
         total=345100, deduct=8273, net=336827,
         published=True, transferred=True),
    dict(name="이수진", year=2026, month=3,
         ps=date(2026,3,1), pe=date(2026,3,31), pd=date(2026,3,15),
         work_days=8, work_min=2400, ot_min=0,
         base=394400, ot=0, night=0, holiday=0, weekly=0, other=0,
         itax=1780, ltax=178, pension=0, health=0, care=0, emp_ins=7494,
         total=394400, deduct=9452, net=384948,
         published=True, transferred=True),
    dict(name="이수진", year=2026, month=4,
         ps=date(2026,4,1), pe=date(2026,4,30), pd=date(2026,4,15),
         work_days=7, work_min=2100, ot_min=0,
         base=345100, ot=0, night=0, holiday=0, weekly=0, other=0,
         itax=1560, ltax=156, pension=0, health=0, care=0, emp_ins=6557,
         total=345100, deduct=8273, net=336827,
         published=True, transferred=True),
    dict(name="이수진", year=2026, month=5,
         ps=date(2026,5,1), pe=date(2026,5,31), pd=date(2026,5,15),
         work_days=0, work_min=0, ot_min=0,
         base=0, ot=0, night=0, holiday=0, weekly=0, other=0,
         itax=0, ltax=0, pension=0, health=0, care=0, emp_ins=0,
         total=0, deduct=0, net=0,
         published=False, transferred=False),

    # ── 박지훈 (정규직 월급, 급여일 10일) ─────────────
    dict(name="박지훈", year=2026, month=3,
         ps=date(2026,3,1), pe=date(2026,3,31), pd=date(2026,3,10),
         work_days=20, work_min=9600, ot_min=0,
         base=680000, ot=0, night=0, holiday=0, weekly=0, other=0,
         itax=6120, ltax=612, pension=30600, health=23110, care=2986, emp_ins=6120,
         total=680000, deduct=69548, net=610452,
         published=True, transferred=True),
    dict(name="박지훈", year=2026, month=4,
         ps=date(2026,4,1), pe=date(2026,4,30), pd=date(2026,4,10),
         work_days=21, work_min=10080, ot_min=60,
         base=720000, ot=27000, night=0, holiday=0, weekly=0, other=0,
         itax=6480, ltax=648, pension=32400, health=24480, care=3162, emp_ins=6804,
         total=747000, deduct=73974, net=673026,
         published=True, transferred=True),
    dict(name="박지훈", year=2026, month=5,
         ps=date(2026,5,1), pe=date(2026,5,31), pd=date(2026,5,10),
         work_days=0, work_min=0, ot_min=0,
         base=0, ot=0, night=0, holiday=0, weekly=0, other=0,
         itax=0, ltax=0, pension=0, health=0, care=0, emp_ins=0,
         total=0, deduct=0, net=0,
         published=False, transferred=False),
]

# ── 4. INSERT ─────────────────────────────────────
inserted = 0
skipped = 0

for p in payslips:
    name = p["name"]
    if name not in emp_id:
        print(f"  SKIP {name} (store_member 없음)")
        skipped += 1
        continue

    sm_id = emp_id[name]
    pub_at = NOW if p["published"] else None
    tra_at = NOW if p["transferred"] else None

    try:
        cur.execute("""
            INSERT INTO payslips (
                store_id, employee_id,
                year, month, pay_period_start, pay_period_end, pay_date,
                work_days, actual_work_minutes, overtime_minutes,
                base_pay, overtime_pay, night_pay, holiday_pay, weekly_leave_pay, other_allowance,
                income_tax, local_income_tax, national_pension, health_insurance, long_term_care, employment_insurance,
                total_pay, total_deduction, net_pay,
                is_published, published_at, is_transferred, transferred_at
            ) VALUES (
                %s, %s,
                %s, %s, %s, %s, %s,
                %s, %s, %s,
                %s, %s, %s, %s, %s, %s,
                %s, %s, %s, %s, %s, %s,
                %s, %s, %s,
                %s, %s, %s, %s
            )
            ON CONFLICT (store_id, employee_id, year, month) DO NOTHING
        """, (
            store_id, sm_id,
            p["year"], p["month"], p["ps"], p["pe"], p["pd"],
            p["work_days"], p["work_min"], p["ot_min"],
            p["base"], p["ot"], p["night"], p["holiday"], p["weekly"], p["other"],
            p["itax"], p["ltax"], p["pension"], p["health"], p["care"], p["emp_ins"],
            p["total"], p["deduct"], p["net"],
            p["published"], pub_at, p["transferred"], tra_at,
        ))
        if cur.rowcount:
            print(f"  ✓ {name} {p['year']}/{p['month']:02d} 삽입")
            inserted += 1
        else:
            print(f"  - {name} {p['year']}/{p['month']:02d} 이미 존재 (SKIP)")
            skipped += 1
    except Exception as e:
        print(f"  ERROR {name} {p['year']}/{p['month']:02d}: {e}")
        conn.rollback()
        skipped += 1
        continue

conn.commit()
cur.close()
conn.close()
print(f"\n완료: 삽입 {inserted}건 / 스킵 {skipped}건")
