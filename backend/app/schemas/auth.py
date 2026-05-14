import re
from pydantic import BaseModel, field_validator
from fastapi import UploadFile, File, Form
from typing import Optional


class ValidLogin(BaseModel):
    phone: str
    password: str


class Signup(BaseModel):
    phone: str
    password: Optional[str] = None
    name: str
    birth: str
    gender: str
    imageUrl: Optional[str] = None
    type: str   # "general" | "social"

    @field_validator("password")
    @classmethod
    def validate_password(cls, v, info):
        if info.data.get("type") == "social":
            return v
        if not v:
            raise ValueError("비밀번호를 입력해주세요.")
        if len(v) < 8 or len(v) > 16:
            raise ValueError("비밀번호는 8~16자여야 합니다.")
        if not re.search(r"[A-Za-z]", v) or not re.search(r"\d", v):
            raise ValueError("비밀번호는 영문과 숫자를 모두 포함해야 합니다.")
        return v


class PhoneReq(BaseModel):
    phone: str


class VerifyReq(BaseModel):
    phone: str
    code: str


class AppleCallbackRequest(BaseModel):
    code: str
    id_token: Optional[str] = None


class WithdrawalReq(BaseModel):
    reason: Optional[str] = None


class PasswordResetReq(BaseModel):
    phone: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def validate_new_password(cls, v):
        if not v:
            raise ValueError("새 비밀번호를 입력해주세요.")
        if len(v) < 8 or len(v) > 16:
            raise ValueError("비밀번호는 8~16자여야 합니다.")
        if not re.search(r"[A-Za-z]", v) or not re.search(r"\d", v):
            raise ValueError("비밀번호는 영문과 숫자를 모두 포함해야 합니다.")
        return v
