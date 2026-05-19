import json
import logging
import re
from fastapi import HTTPException
from openai import OpenAI
from config import settings

# Setup Groq API client
client = OpenAI(
    base_url="https://api.groq.com/openai/v1",
    api_key=settings.groq_api_key,
)

# --- Constants ---
SYSTEM_PROMPT = "You are a travel assistant AI. Only respond with a JSON array."

USER_PROMPT_TEMPLATE = """
You are a travel assistant AI helping tourists discover fun and interesting places to visit.

The user will provide their interests (e.g., "music, yoga, art, fashion").

Your task is to return a JSON array of OpenStreetMap tag objects that map to places tourists would enjoy visiting, exploring, or hanging out at.

Rules:
- ONLY include tags that represent destinations a tourist would actively seek out for fun, culture, sightseeing, dining, or entertainment.
- DO NOT include everyday errand places like supermarkets, convenience stores, pharmacies, banks, offices, hospitals, or residential buildings.
- DO NOT include infrastructure tags (highway, railway, power, barrier, waterway, boundary, landuse, etc.).
- Prefer: tourism, leisure, historic, amenity (bars/restaurants/theatres), natural landmarks, man_made landmarks, craft (brewery/winery), aerialway.
- Each tag object must include:
  - "key": the OSM tag key (e.g., "tourism", "leisure", "historic")
  - "value": the corresponding tag value (e.g., "museum", "castle", "park")

Only include tags from this list:
{valid_tags}

Return ONLY a JSON array of objects. Aim for 5–10 tags that best match the user's interests.

User interests: {user_interests}
""".strip()


# --- Main Groq Call ---
def call_groq_for_tags(user_interests: str, valid_tags: dict) -> list[dict]:
    """Generate Overpass tags from user interests using Groq LLM."""

    formatted_tags = [
        f"{key}={val}" for key, values in valid_tags.items() for val in values
    ]
    readable_tag_list = "\n- ".join(formatted_tags)

    prompt = USER_PROMPT_TEMPLATE.format(
        valid_tags=json.dumps(readable_tag_list, indent=2),
        user_interests=user_interests,
    )

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": prompt},
            ],
            temperature=0.2,
            max_tokens=512,
        )

        raw_output = response.choices[0].message.content
        # logging.debug(f"📥 Groq raw output:\n{raw_output}")

        try:
            parsed = json.loads(raw_output)
        except json.JSONDecodeError:
            logging.warning("Direct JSON decoding failed. Trying regex fallback.")
            match = re.search(r"\[\s*.*?\s*\]", raw_output, re.DOTALL)
            if not match:
                raise ValueError("No JSON array found in LLM response.")
            parsed = json.loads(match.group(0))
            logging.debug("Groq parsed tags from LLM response:\n{parsed}")
        return [
            tag
            for tag in parsed
            if isinstance(tag, dict) and tag.get("key") and tag.get("value")
        ]

    except Exception as e:
        logging.error("❌ Error in Groq call", exc_info=True)
        raise HTTPException(
            status_code=500, detail=f"Groq tag parsing failed: {str(e)}"
        )
