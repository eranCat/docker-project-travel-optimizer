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

RULE 1 — SPECIFICITY (most important):
If the user mentions specific venue types (bar, pub, nightclub, restaurant, cafe, gym, yoga, cycling, museum, park, etc.), generate tags ONLY for those specific types.
DO NOT add tourism=attraction, tourism=museum, tourism=gallery, or any other generic sightseeing tag unless the interests explicitly include words like "sightseeing", "tourism", "attractions", or "culture".
Example: interests="bar, nightclub" → ONLY amenity=bar, amenity=nightclub, amenity=pub. NOT tourism=attraction.
Example: interests="art, culture" → amenity=arts_centre, tourism=gallery, tourism=museum. tourism=attraction is OK here.

RULE 2 — EXCLUDE non-destinations:
- DO NOT include everyday errand places: supermarkets, pharmacies, banks, offices, hospitals, residential buildings.
- DO NOT include infrastructure: highway, railway, power, barrier, waterway, boundary, landuse.
- DO NOT include cemeteries, graves, or memorials unless interests explicitly mention history or memorials.
- DO NOT include religious sites unless interests explicitly mention religion or spirituality.

RULE 3 — PREFER specific over generic:
Prefer: amenity (bars/restaurants/theatres), leisure, historic, natural landmarks, craft (brewery/winery).
Avoid: tourism=attraction as a catch-all filler tag.

Each tag object must include:
  - "key": the OSM tag key (e.g., "amenity", "leisure", "historic")
  - "value": the corresponding tag value (e.g., "bar", "park", "castle")

Only include tags from this list:
{valid_tags}

Return ONLY a JSON array of objects. Include 3–8 tags that directly match the user's interests — quality over quantity.

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
