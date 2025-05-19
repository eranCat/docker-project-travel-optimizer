from pydantic import BaseModel

class TagRequest(BaseModel):
    interests: str
    valid_tags: dict
