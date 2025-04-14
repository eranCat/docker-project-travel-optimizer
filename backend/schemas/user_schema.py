from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class UserSchema(BaseModel):
    id: int
    name: str
    email: str
    created_at: datetime

    model_config = {
    "from_attributes": True
}

class UserUpdateRequest(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None