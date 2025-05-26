import logging
from fastapi import APIRouter, HTTPException
from app.services.groq_client import call_groq_for_tags
from models.tag_request import TagRequest

router = APIRouter()


@router.post("/generate-tags")
async def generate_tags(req: TagRequest):
    try:
        tags = call_groq_for_tags(req.interests, req.valid_tags)
        return tags
    except Exception as e:
        logging.error(f"🧠 Groq tag generation failed: {str(e)}", exc_info=True)
        raise HTTPException(status_code=502, detail="Tag generation service error.")
