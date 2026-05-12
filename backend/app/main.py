import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from fastapi.staticfiles import StaticFiles
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo
import os

from database import create_tables, SessionLocal
from routers import auth, owner, employee, public, admin

try:
    import firebase_init
except Exception as e:
    print(f"⚠️  Firebase 초기화 실패: {e}")

scheduler = AsyncIOScheduler(timezone="Asia/Seoul")


async def hard_delete_withdrawn_members():
    """탈퇴 후 30일 경과된 회원 데이터 영구 삭제 (매일 새벽 3시 실행)"""
    from models import Member
    db = SessionLocal()
    try:
        cutoff = datetime.now(ZoneInfo("Asia/Seoul")) - timedelta(days=30)
        expired = db.query(Member).filter(
            Member.is_deleted == True,
            Member.deleted_at.isnot(None),
            Member.deleted_at <= cutoff,
        ).all()

        for member in expired:
            db.delete(member)

        db.commit()
        if expired:
            print(f"[cleanup] 탈퇴 회원 {len(expired)}명 영구 삭제 완료")
    except Exception as e:
        db.rollback()
        print(f"[cleanup] 영구 삭제 오류: {e}")
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("서버 시작 중...")
    try:
        create_tables()
    except Exception as e:
        print(f"DB 연결 에러: {e}")

    scheduler.add_job(hard_delete_withdrawn_members, "cron", hour=3, minute=0)
    scheduler.start()

    yield

    scheduler.shutdown()
    print("서버 종료 중...")


app = FastAPI(title="handy_v2", lifespan=lifespan, redirect_slashes=False)

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.include_router(auth.router)
app.include_router(owner.router)
app.include_router(employee.router)
app.include_router(public.router)
app.include_router(admin.router)

origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://localhost:8000",
    "https://local.handy.com",
    "https://handy-frontend-dev.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if __name__ == "__main__":
    BASE_DIR = os.path.dirname(__file__)
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
