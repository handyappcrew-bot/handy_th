import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from fastapi.staticfiles import StaticFiles
import os

from database import create_tables
from routers import auth, owner, employee, public, admin

try:
    import firebase_init
except Exception as e:
    print(f"⚠️  Firebase 초기화 실패: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("서버 시작 중...")
    try:
        create_tables()
    except Exception as e:
        print(f"DB 연결 에러: {e}")
    yield
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
