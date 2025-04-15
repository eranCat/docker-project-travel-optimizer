from fastapi import APIRouter
from services.llm.interest_parser import get_interest_tags_from_ollama
from schemas.interests import InterestInput, InterestTagsResponse

router = APIRouter()

@router.post("/extract-interest-tags", response_model=InterestTagsResponse)
def extract_tags(payload: InterestInput):
    tags = get_interest_tags_from_ollama(payload.interests)
    return {"tags": tags}
