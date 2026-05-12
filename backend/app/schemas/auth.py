from pydantic import BaseModel
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
