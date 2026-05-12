import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

load_dotenv()

DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT")
DB_NAME = os.getenv("DB_NAME")

DB_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
engine = create_engine(DB_URL)

SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_tables():
    import models  # noqa: F401
    _run_migrations()
    Base.metadata.create_all(bind=engine)
    print("DB 연결 성공")
    _insert_seed_data()


def _run_migrations():
    """Alembic 마이그레이션을 프로그래밍 방식으로 최신 상태까지 적용"""
    from pathlib import Path
    from alembic.config import Config
    from alembic import command

    backend_dir = Path(__file__).resolve().parent.parent
    # ini 파일을 읽지 않고 직접 옵션 설정 (Windows 인코딩 문제 회피)
    alembic_cfg = Config()
    alembic_cfg.set_main_option("script_location", str(backend_dir / "alembic"))
    alembic_cfg.set_main_option(
        "sqlalchemy.url",
        f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}",
    )
    try:
        command.upgrade(alembic_cfg, "head")
        print("Migration complete")
    except Exception as e:
        print(f"Migration error: {e}")


def _insert_seed_data():
    if os.getenv("ENV") == "production":
        return
    from models import Store, Member, StoreMembers, StoreShift, StoreSetting, StaffContract
    from utils.auth_utils import password_encode
    from sqlalchemy import update as sa_update
    db = SessionLocal()
    try:
        # 기존 한국어 role → 영어 마이그레이션
        db.execute(sa_update(StoreMembers).where(StoreMembers.role == "직원").values(role="employee"))
        db.execute(sa_update(StoreMembers).where(StoreMembers.role == "사장").values(role="owner"))
        db.commit()

        # 직원 이름/성별 실제 이름으로 업데이트
        name_map = [
            ("01011111111", "정수민", "female"),
            ("01033333333", "김정민", "male"),
            ("01044444444", "문자영", "female"),
            ("01055555555", "이수진", "female"),
            ("01066666666", "박지훈", "male"),
        ]
        for phone, name, gender in name_map:
            db.execute(sa_update(Member).where(Member.phone == phone).values(name=name, gender=gender))
        db.commit()

        # 직원 계정 (정수민) — 항상 비밀번호 초기화
        member = db.query(Member).filter(Member.phone == "01011111111").first()
        if not member:
            member = Member(password=password_encode("1111"), phone="01011111111", name="정수민", gender="female")
            db.add(member)
            db.commit()
            db.refresh(member)
            print("정수민 계정 생성")
        else:
            member.password = password_encode("1111")
            member.is_deleted = False
            member.deleted_at = None
            db.commit()
            db.refresh(member)

        # 사장 계정 — 항상 비밀번호 초기화
        owner = db.query(Member).filter(Member.phone == "01022222222").first()
        if not owner:
            owner = Member(password=password_encode("2222"), phone="01022222222", name="테스트사장", gender="male")
            db.add(owner)
            db.commit()
            db.refresh(owner)
            print("사장 계정 생성")
        else:
            owner.password = password_encode("2222")
            owner.is_deleted = False
            owner.deleted_at = None
            db.commit()
            db.refresh(owner)

        # 매장
        store = db.query(Store).filter(Store.code == 12345).first()
        if not store:
            store = Store(
                code=12345, raw_digits="1234567890", name="노량물산",
                address="서울특별시 동작구 노량진로 151", industry="음식/카페",
                owner_name="테스트사장", phone="027272112",
                business_image="default.png", radius=200,
            )
            db.add(store)
            db.commit()
            db.refresh(store)
            for order, sname in [(1, "오픈"), (2, "미들"), (3, "마감")]:
                db.add(StoreShift(store_id=store.id, sort_order=order, name=sname, is_active=True))
            db.add(StoreSetting(store_id=store.id))
            db.commit()
            print("매장 생성 완료")
        else:
            db.refresh(store)

        # 직원→매장 연결 + 계약 생성
        def ensure_member_in_store(m, role, contract_data=None):
            sm = db.query(StoreMembers).filter(
                StoreMembers.store_id == store.id, StoreMembers.member_id == m.id
            ).first()
            if not sm:
                sm = StoreMembers(store_id=store.id, member_id=m.id, role=role)
                db.add(sm)
                db.commit()
                db.refresh(sm)
                print(f"{m.name} → 매장 연결")
            if contract_data and role == "employee":
                existing = db.query(StaffContract).filter(StaffContract.store_member_id == sm.id).first()
                if not existing:
                    db.add(StaffContract(store_member_id=sm.id, **contract_data))
                    db.commit()
                    print(f"{m.name} 계약 생성")

        ensure_member_in_store(member, "employee", {
            "employee_type": "알바생", "working_status": "재직",
            "hourly_rate": 10030, "salary_cycle": "월 1회 (월급)", "salary_day": "25일",
        })
        ensure_member_in_store(owner, "owner")

        # 추가 직원
        extra_employees = [
            {"phone": "01033333333", "password": "3333", "name": "김정민", "gender": "male",
             "contract": {"employee_type": "정규직", "working_status": "재직", "hourly_rate": None, "salary_cycle": "월 1회 (월급)", "salary_day": "15일"}},
            {"phone": "01044444444", "password": "4444", "name": "문자영", "gender": "female",
             "contract": {"employee_type": "알바생", "working_status": "재직", "hourly_rate": 11000, "salary_cycle": "월 1회 (월급)", "salary_day": "25일"}},
            {"phone": "01055555555", "password": "5555", "name": "이수진", "gender": "female",
             "contract": {"employee_type": "알바생", "working_status": "재직", "hourly_rate": 9860, "salary_cycle": "월 2회", "salary_day": "1일, 15일"}},
            {"phone": "01066666666", "password": "6666", "name": "박지훈", "gender": "male",
             "contract": {"employee_type": "정규직", "working_status": "재직", "hourly_rate": None, "salary_cycle": "월 1회 (월급)", "salary_day": "10일"}},
        ]
        for emp in extra_employees:
            m = db.query(Member).filter(Member.phone == emp["phone"]).first()
            if not m:
                m = Member(password=password_encode(emp["password"]), phone=emp["phone"], name=emp["name"], gender=emp["gender"])
                db.add(m)
                db.commit()
                db.refresh(m)
                print(f"계정 생성: {emp['name']}")
            else:
                m.password = password_encode(emp["password"])
                m.is_deleted = False
                m.deleted_at = None
                db.commit()
                db.refresh(m)
            ensure_member_in_store(m, "employee", emp["contract"])

        # 노량전자·강서물산 계정 비밀번호 초기화 (매장 연결은 init_data.sql에서 처리)
        extra_reset = [
            {"phone": "01077777777", "password": "7777", "name": "한지수"},
            {"phone": "01088888888", "password": "8888", "name": "김태훈"},
            {"phone": "01099999999", "password": "9999", "name": "김민형"},
            {"phone": "01000000001", "password": "0001", "name": "김재욱"},
        ]
        for emp in extra_reset:
            m = db.query(Member).filter(Member.phone == emp["phone"]).first()
            if m:
                m.password = password_encode(emp["password"])
                m.is_deleted = False
                m.deleted_at = None
                db.commit()

    except Exception as e:
        print(f"시드 데이터 생성 중 오류: {e}")
        db.rollback()
    finally:
        db.close()
