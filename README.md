# Handy 프로젝트

프론트엔드(React + Vite) + 백엔드(FastAPI) 모노레포입니다.

---

## 폴더 구조

```
handy_th/
├── frontend/   # React 18 + Vite
└── backend/    # FastAPI + PostgreSQL
```

---

## 실행 방법

### 사전 준비
- Python 3.11+
- Node.js 18+
- PostgreSQL 14+

---

### 1. 백엔드 설정

```bash
cd backend

# 패키지 설치
pip install -r requirements.txt

# .env 파일 생성 (app/.env)
# 아래 내용으로 app/.env 파일을 만드세요
```

**`backend/app/.env` 내용:**
```
DB_USER=postgres
DB_PASSWORD=본인DB비밀번호
DB_HOST=localhost
DB_PORT=5432
DB_NAME=handy_v2

SECRET_KEY=1fb6677256b5a85dc87b0411e5e07ae4df011a7f87d31a8c4549ddfc85fa4692
ALGORITHM=HS256
ENV=development
```

```bash
# PostgreSQL에서 DB 생성
createdb handy_v2

# 테이블 생성 (백엔드 서버 첫 실행 시 자동 생성)
cd app
python -c "from database import Base, engine; from models import *; Base.metadata.create_all(engine)"

# 초기 데이터 삽입
psql -U postgres -d handy_v2 -f ../init_data.sql

# 서버 실행
uvicorn main:app --reload --port 8000
```

---

### 2. 프론트엔드 설정

```bash
cd frontend

# 패키지 설치
npm install

# 개발 서버 실행
npm run dev
```

브라우저에서 `http://localhost:5173` 접속

---

## 테스트 계정 (비밀번호 공통: `1234`)

| 이름 | 전화번호 | 역할 |
|---|---|---|
| 김다힌 | 010-2222-2222 | 사장 (노량물산 · 노량전자) |
| 정수민 | 010-1111-1111 | 직원 (노량물산 · 노량전자) |
| 김정민 | 010-3333-3333 | 직원 (노량물산) |
| 문자영 | 010-4444-4444 | 직원 (노량물산) |
| 박지훈 | 010-6666-6666 | 직원 (노량물산) |
