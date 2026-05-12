import re
import os
import httpx
import secrets
from fastapi import HTTPException
from sqlalchemy.orm import Session

from models import Store


def format_phone_number(number: str) -> str:
    clean = re.sub(r'\D', '', number)
    if clean.startswith('02'):
        return re.sub(r'(\d{2})(\d{3,4})(\d{4})', r'\1-\2-\3', clean)
    return re.sub(r'(\d{3})(\d{3,4})(\d{4})', r'\1-\2-\3', clean)


async def create_store_code(db: Session):
    while True:
        code = str(secrets.randbelow(100000)).zfill(5)
        if not db.query(Store).filter(Store.code == code).first():
            return code


async def get_coords_from_address(address: str):
    KAKAO_REST_API_KEY = os.getenv("KAKAO_CLIENT_ID")
    url = "https://dapi.kakao.com/v2/local/search/address.json"
    headers = {"Authorization": f"KakaoAK {KAKAO_REST_API_KEY}"}

    async with httpx.AsyncClient() as client:
        response = await client.get(url, headers=headers, params={"query": address})

    data = response.json()
    if not data.get("documents"):
        raise HTTPException(status_code=400, detail="유효하지 않은 주소입니다.")

    doc = data["documents"][0]
    return float(doc["y"]), float(doc["x"])   # lat, lng
