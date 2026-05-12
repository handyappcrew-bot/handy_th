from pydantic import BaseModel


class FeedbackAnswerReq(BaseModel):
    id: int
    answer: str


class FaqAddReq(BaseModel):
    type: str
    question: str
    answer: str
