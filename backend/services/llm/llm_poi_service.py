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
    # Load known OSM tags
    osm_tags = load_osm_tag_reference()

    # Add tag info section for LLM context
    tag_info = "\n".join(
        f'- "{key}": {", ".join(values[:10])}'
        for key, values in osm_tags.items() if values
    )

    # Add inference instructions to loosen mapping
    prompt = f"""
You are a travel assistant AI. The user will provide their interests (e.g., "food, yoga, fashion").
Your task is to return a JSON array of OpenStreetMap-compatible tags (key-value pairs) that can be used with the Overpass API.

Each item in the array must be an object with:
- "key": the OSM tag key (e.g., "amenity", "leisure")
- "value": the corresponding tag value (e.g., "restaurant", "stadium")

Only include tags that are valid according to OpenStreetMap tagging conventions.

You may also infer mappings from user interests to the closest available tags.
Examples:
- "yoga" → "leisure" = "fitness_centre"
- "sports" → "leisure" = "pitch", "sport" = "soccer"
- "fashion" → "shop" = "clothes" or "shop" = "boutique"
- "shopping" → "shop" = "mall", "supermarket", "clothes"

Here are valid OpenStreetMap tag examples you can choose from:
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

        # Optional: log unexpected values
        for tag in parsed:
            if tag.get("key") not in osm_tags or tag.get("value") not in osm_tags.get(tag["key"], []):
                print(f"⚠️ Unexpected tag (not in cache): {tag}")

        # Allow all key-value pairs for now — rely on Overpass to fail silently if needed
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
