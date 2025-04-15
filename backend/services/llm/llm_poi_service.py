import requests
import json
import re
from typing import List, Dict
from fastapi import HTTPException
from config import settings
from pathlib import Path

OLLAMA_URL = settings.ollama_url
OLLAMA_MODEL = settings.ollama_model
OSM_TAGS_CACHE_FILE = Path(__file__).parent.parent / "maps" / "osm_tags_cache.json"

def load_osm_tag_reference() -> Dict[str, List[str]]:
    try:
        with open(OSM_TAGS_CACHE_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"⚠️ Failed to load OSM tags cache: {e}")
        return {}

def get_overpass_tags_from_interests(interests: str) -> List[dict]:
    # Load pre-cached valid OSM tags
    osm_tags = load_osm_tag_reference()

    # Build tag info section for the prompt
    tag_info = "\n".join(
        f'- "{key}": {", ".join(values[:10])}'  # limit to 10 values per key for clarity
        for key, values in osm_tags.items() if values
    )

    prompt = f"""
    You are a travel assistant AI. The user will provide their interests (e.g., "food and sports").
    Your job is to return a JSON array of OpenStreetMap-compatible tags that can be used with Overpass API.

    Each item in the array should be an object with:
    - "key": the OSM tag key (e.g., "amenity", "leisure")
    - "value": the corresponding tag value (e.g., "restaurant", "stadium")

    Only include key-value tags that exist in OpenStreetMap's documented tagging conventions.
    Avoid any tag with an empty value or unknown keys.

    Here are valid tag examples:
    {tag_info}

    Respond ONLY with a JSON array of key-value objects.

    User interests: {interests}
    """.strip()

    print("🧠 Sending Overpass tag prompt to Ollama:\n", prompt)

    try:
        response = requests.post(
            OLLAMA_URL,
            json={
                "model": OLLAMA_MODEL,
                "prompt": prompt,
                "stream": False
            },
            timeout=60
        )
        response.raise_for_status()
        data = response.json()
        raw_output = data.get("response", "")
        print("📥 Ollama Overpass tag response:\n", raw_output)

        match = re.search(r"\[\s*.*?\s*\]", raw_output, re.DOTALL)
        if not match:
            raise ValueError("No JSON array found in LLM response.")

        parsed = json.loads(match.group(0))
        print("🔍 Parsed Overpass tags:\n", parsed)

        # Permissive mode: accept all syntactically valid tags
        valid_tags = [
            tag for tag in parsed
            if isinstance(tag, dict)
            and tag.get("key")
            and tag.get("value")
        ]

        return valid_tags

    except requests.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Ollama request failed: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse Overpass tags: {str(e)}")
