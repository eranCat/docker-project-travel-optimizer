from pydantic import BaseModel
from typing import List

class InterestInput(BaseModel):
    interests: str

class InterestTagsResponse(BaseModel):
    tags: List[str]
