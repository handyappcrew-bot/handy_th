from pydantic import BaseModel, Field
from datetime import datetime
from typing import List, Optional


class BoardListReq(BaseModel):
    store_id: int


class BoardResponse(BaseModel):
    id: int
    category: str
    title: str
    content: str
    created_at: datetime
    writer: str
    role: str
    comments: int

    class Config:
        from_attributes = True


class CommentResponse(BaseModel):
    id: int
    writer: str
    role: str
    content: str
    created_at: datetime
    parent_id: Optional[int] = None


class BoardDetailResponse(BaseModel):
    id: int
    category: str
    title: str
    content: str
    created_at: datetime
    writer: str
    role: str
    comment_count: int
    comments: List[CommentResponse]
    photos: List[str] = Field(default=[])

    class Config:
        from_attributes = True


class CommentCreateReq(BaseModel):
    content: str
    parent_id: Optional[int] = None


class PasswordChangeReq(BaseModel):
    old_password: str
    new_password: str


class StoreIdReq(BaseModel):
    store_id: int


class WithdrawalReq(BaseModel):
    member_id: int
    reason: str
