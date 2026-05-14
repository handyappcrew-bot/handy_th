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


app = FastAPI(
    title="Handy API",
    version="2.0.0",
    description="""
## Handy 백엔드 API 문서

### 인증 방법
이 API는 **쿠키 기반 JWT 인증**을 사용합니다.

1. `/api/auth/login` (또는 개발 환경: `/api/auth/dev/login`) 호출
2. 응답으로 `access_token` / `refresh_token` 쿠키가 자동 저장됨
3. 이후 모든 API 요청에 쿠키가 자동 포함됨 (Swagger에서도 동일하게 동작)

> **개발 환경 빠른 로그인**: `POST /api/auth/dev/login` → `{ "phone": "01012345678" }`

---

### 태그별 분류
- **인증**: 로그인, 회원가입, 소셜 로그인
- **공통**: 게시판, 비밀번호 변경, 알림
- **직원**: 근무, 스케줄, 급여, 마이페이지
- **사장**: 매장 관리, 직원 관리, 급여명세서, 마이페이지
""",
    lifespan=lifespan,
    redirect_slashes=False,
)

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
