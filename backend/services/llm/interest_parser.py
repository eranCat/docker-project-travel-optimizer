# backend/services/llm/interest_parser.py

import requests
import re
import json
from typing import List
from fastapi import HTTPException
from config import settings

OLLAMA_URL = settings.ollama_url
OLLAMA_MODEL = settings.ollama_model

SYSTEM_PROMPT = """
You are a travel assistant AI. A user will give you a free-form sentence describing their interests.
Return only a **JSON array of keywords** or tags (lowercase, no duplicates) that describe those interests.
Do not include explanations, greetings, or any markdown.

Each item in the array should be a string such as "food", "museums", "lgbtq", "surfing", "nature", etc.
"""

def get_interest_tags_from_ollama(freeform_input: str) -> List[str]:
    prompt = SYSTEM_PROMPT.strip() + "\n\nUser interests: " + freeform_input
    print("\n📤 Sending interest prompt to Ollama:\n", prompt)

    try:
        response = requests.post(
            OLLAMA_URL,
            json={
                "model": OLLAMA_MODEL,
                "prompt": prompt,
                "stream": False
            },
            timeout=30
        )
        response.raise_for_status()
    except requests.RequestException as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to contact Ollama for interest tags: {str(e)}"
        )

    try:
        response_json = response.json()
        raw_output = response_json.get("response", "")
        print("🧠 Raw tags response:\n", raw_output)

        match = re.search(r"\[.*?\]", raw_output, re.DOTALL)
        if not match:
            raise ValueError("No JSON array found in response.")

        parsed = json.loads(match.group(0))
        return [str(tag).strip().lower() for tag in parsed if isinstance(tag, str)]

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"LLM interest tag parsing error: {str(e)}"
        )
