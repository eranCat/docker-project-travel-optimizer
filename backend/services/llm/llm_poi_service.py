# backend/services/llm/llm_poi_service.py

import requests
import re
import json
from typing import List
from fastapi import HTTPException
from schemas.poi import POICreate
from config import settings
import time

OLLAMA_URL = settings.ollama_url
OLLAMA_MODEL = settings.ollama_model

SYSTEM_PROMPT = """
You are a travel assistant AI. Given a user's interests and current location, return 5-10 relevant Points of Interest (POIs) in JSON array format.

Each POI should contain:
- name
- description
- address
- latitude
- longitude
- categories (a list of tags)

Respond only with the JSON array. Do not include explanations or markdown.
"""

def build_poi_prompt(interests: str, location: str, nearby_locations: List[POICreate], num_results: int = 5) -> str:
    pois = json.dumps([poi.model_dump() for poi in nearby_locations], indent=2)
    return (
        f"You are a travel assistant AI. The user is currently located in '{location}' "
        f"and interested in: {interests}.\n\n"
        f"Here is a list of nearby places:\n{pois}\n\n"
        f"Based on the user's interests, return a JSON array of **exactly {num_results}** recommended POIs ONLY from the above list. "
        "Each POI should include: name, description, address, latitude, longitude, and categories (as a list). "
        "Do not invent new POIs. Only choose and rank from the list above. Respond only with the JSON array."
    )



def get_pois_from_ollama(interests: str, location: str,nearby_locations:List[POICreate],num_results: int = 5) -> List[POICreate]:
    prompt = build_poi_prompt(interests, location, nearby_locations,num_results)
    full_prompt = SYSTEM_PROMPT.strip() + "\n" + prompt
    print(f"📤 Sending prompt to Ollama:\n{full_prompt}")

    try:
        start = time.time()

        response = requests.post(
            OLLAMA_URL,
            json={
                "model": OLLAMA_MODEL,
                "prompt": full_prompt,
                "stream": False
            },
            timeout=90
        )
        response.raise_for_status()
        duration = round(time.time() - start, 2)
        print(f"✅ Ollama responded in {duration}s")
    except requests.RequestException as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to contact Ollama: {str(e)}"
        )

    try:
        response_json = response.json()
        print("📦 Full Ollama response:\n", response_json)

        raw_output = response_json.get("response", "")
        print("🧠 Ollama raw output:\n", raw_output)

        # Extract the JSON array from the string
        match = re.search(r"\[\s*{.*?}\s*]", raw_output, re.DOTALL)
        if not match:
            raise ValueError("No JSON array found in LLM response.")

        parsed = json.loads(match.group(0))

        valid_pois = []
        for poi in parsed:
            try:
                poi.setdefault("description", "No description available.")
                poi.setdefault("address", "Unknown location.")
                valid_pois.append(POICreate(**poi))
            except Exception as e:
                print(f"⚠️ Skipping invalid POI: {poi} — Reason: {e}")

        if not valid_pois:
            raise HTTPException(
                status_code=500,
                detail="LLM returned only invalid POIs. Check your prompt or input."
            )

        return valid_pois

    except Exception as e:
        print("⚠️ Failed to parse POIs from LLM response:", e)
        raise HTTPException(
            status_code=500,
            detail=f"LLM response error: {str(e)}"
        )
