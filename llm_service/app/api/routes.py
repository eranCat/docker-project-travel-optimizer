from fastapi import APIRouter
from app.services.groq_client import call_groq_for_tags
from models.tag_request import TagRequest

router = APIRouter()


@router.post("/generate-tags")
async def generate_tags(req: TagRequest):
    return call_groq_for_tags(req.interests, req.valid_tags)
