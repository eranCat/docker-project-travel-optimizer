from pydantic import BaseModel
from datetime import datetime


class UserSchema(BaseModel):
    id: int
    name: str
    email: str
    created_at: datetime

    class Config:
        orm_mode = True
