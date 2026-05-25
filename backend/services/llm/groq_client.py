import json
import logging
import time
from typing import Optional
from fastapi import HTTPException
from openai import OpenAI
from config import settings

# Setup Groq API client
client = OpenAI(
    base_url="https://api.groq.com/openai/v1",
    api_key=settings.groq_api_key,
)

# --- Constants ---
SYSTEM_PROMPT = "You are a travel assistant AI. Only respond with a JSON object."

USER_PROMPT_TEMPLATE = """
You are a travel assistant AI helping tourists discover fun and interesting places to visit.

The user will provide their interests (e.g., "music, yoga, art, fashion").

Your task is to return a JSON object with a "tags" key containing an array of OpenStreetMap tag objects that map to places tourists would enjoy visiting, exploring, or hanging out at.

RULE 1 — SPECIFICITY (most important):
If the user mentions specific venue types (bar, pub, nightclub, restaurant, cafe, gym, yoga, cycling, museum, park, etc.), generate tags ONLY for those specific types.
DO NOT add tourism=attraction, tourism=museum, tourism=gallery, or any other generic sightseeing tag unless the interests explicitly include words like "sightseeing", "tourism", "attractions", or "culture".
DO NOT add amenity=cafe unless the interests explicitly include "cafe", "coffee", or "brunch". Cafes are NOT wine venues, NOT tapas venues, NOT nightlife venues, NOT sports venues.
Example: interests="nightlife, bars, clubs" → amenity=bar, amenity=pub, amenity=nightclub. DO NOT add amenity=theatre. DO NOT add amenity=cafe. amenity=theatre is performing arts (plays, opera) — it is NEVER a nightlife venue.
Example: interests="live music, jazz, concert venues" → amenity=bar, amenity=nightclub, amenity=music_venue, shop=music. DO NOT add amenity=community_centre. DO NOT add tourism=attraction.
Example: interests="wine, tapas" → amenity=bar, amenity=restaurant, craft=winery. NOT amenity=cafe.
Example: interests="art, culture" → amenity=arts_centre, tourism=gallery, tourism=museum. tourism=attraction is OK here.
Example: interests="street food, food" → amenity=restaurant, amenity=fast_food, amenity=food_court. NOT amenity=bar.
Example: interests="outdoor, hiking, nature" → natural=wood, natural=water, natural=cliff, leisure=park, leisure=nature_reserve. NOT leisure=stadium, NOT leisure=fitness_centre, NOT leisure=sports_centre.

RULE 2 — EXCLUDE non-destinations:
- DO NOT include everyday errand places: supermarkets, pharmacies, banks, offices, hospitals, residential buildings.
- DO NOT include infrastructure: highway, railway, power, barrier, waterway, boundary, landuse.
- DO NOT include cemeteries, graves, or memorials unless interests explicitly mention history or memorials.
- DO NOT include religious sites unless interests explicitly mention religion or spirituality.
- DO NOT use key "sport" (e.g. sport=cycling) — this is a property of sports facilities, not a valid standalone POI tag.
- NEVER include amenity=theatre for nightlife, bars, clubs, or music interests. amenity=theatre is ONLY for interests that explicitly mention theatre, performing arts, opera, or shows.
- DO NOT include leisure=stadium, leisure=fitness_centre, or leisure=sports_centre unless interests explicitly mention sports, gym, or fitness.
- DO NOT include amenity=public_bookcase — this is a street book exchange for residents, not a tourist destination.
- DO NOT include amenity=community_centre unless interests explicitly mention community, social spaces, or neighbourhood activities.
- DO NOT include tourism=attraction unless interests explicitly mention sightseeing, tourism, attractions, culture, or landmarks. It is a catch-all that pollutes music, food, nightlife, and sport results.

RULE 3 — PREFER specific over generic:
Prefer: amenity (bars/restaurants), leisure (parks/nature_reserve), historic, natural landmarks, craft (brewery/winery).
Avoid: tourism=attraction as a catch-all filler tag.

Each tag object must include:
  - "key": the OSM tag key (e.g., "amenity", "leisure", "historic")
  - "value": the corresponding tag value (e.g., "bar", "park", "castle")

Only include tags from this list:
{valid_tags}

Return ONLY a JSON object in this exact format:
{{"tags": [{{"key": "...", "value": "..."}}, ...]}}
Include 3–8 tags that directly match the user's interests — quality over quantity.

{time_of_day_context}User interests: {user_interests}
""".strip()

_TIME_OF_DAY_HINTS = {
    "morning": "CONTEXT: User is planning a morning trip. Prefer venues open early (cafes, bakeries, parks, markets, museums).\n",
    "afternoon": "CONTEXT: User is planning an afternoon trip. Most venues are open — include a broad mix.\n",
    "evening": "CONTEXT: User is planning an evening trip. Prefer venues active in the evening (restaurants, bars, night markets, viewpoints).\n",
    "night": "CONTEXT: User is planning a night out. Strongly prefer nightlife venues (bars, pubs, clubs, late-night restaurants, live music).\n",
}


# Tags that require specific interest keywords to be included; absent keywords → tag filtered out.
# Key: (osm_key, osm_value). Value: set of lowercased interest words that justify the tag.
# Empty set means always exclude.
_REQUIRE_KEYWORDS: dict[tuple[str, str | None], set[str]] = {
    ("amenity", "theatre"): {"theatre", "theater", "performing arts", "opera", "show", "play", "shows"},
    ("amenity", "cinema"): {"cinema", "movie", "movies", "film", "films"},
    ("amenity", "public_bookcase"): set(),  # always exclude — street book exchange, not tourist
    ("leisure", "stadium"): {"stadium", "sport", "sports", "football", "soccer", "game", "match"},
    ("leisure", "fitness_centre"): {"gym", "fitness", "workout", "exercise", "sport", "sports"},
    ("leisure", "sports_centre"): {"sport", "sports", "gym", "fitness"},
    ("shop", "art"): {"art", "gallery", "craft", "shopping", "shop"},
    ("shop", "books"): {"book", "books", "bookshop", "bookstore", "reading", "shopping", "shop"},
    ("shop", "antiques"): {"antiques", "vintage", "shopping", "shop"},
    ("shop", "music"): {"music", "shopping", "shop"},
    ("shop", "musical_instrument"): {"music", "instrument", "shopping", "shop"},
    ("amenity", "community_centre"): {"community", "social", "local", "neighbourhood", "neighborhood", "centre", "center"},
    ("tourism", "attraction"): {"sightseeing", "tourism", "tourist", "attraction", "attractions", "culture", "cultural", "landmark", "landmarks", "sight", "sights"},
}


def _post_filter_tags(tags: list[dict], user_interests: str) -> list[dict]:
    interests_lower = user_interests.lower()
    seen: set[tuple[str, str]] = set()
    result = []
    for tag in tags:
        key, value = tag.get("key", ""), tag.get("value", "")
        if not key or not value:
            continue
        # Always exclude sport=* — not a valid standalone POI key in Overpass
        if key == "sport":
            continue
        # Contextual exclusions
        required = _REQUIRE_KEYWORDS.get((key, value))
        if required is not None:
            if not any(kw in interests_lower for kw in required):
                continue
        # Deduplicate
        pair = (key, value)
        if pair in seen:
            continue
        seen.add(pair)
        result.append(tag)
    return result


# --- Main Groq Call ---
def call_groq_for_tags(user_interests: str, valid_tags: dict, time_of_day: Optional[str] = None) -> list[dict]:
    """Generate Overpass tags from user interests using Groq LLM."""

    formatted_tags = [
        f"{key}={val}" for key, values in valid_tags.items() for val in values
    ]
    readable_tag_list = "\n- ".join(formatted_tags)

    time_of_day_context = _TIME_OF_DAY_HINTS.get(time_of_day or "", "") if time_of_day else ""

    prompt = USER_PROMPT_TEMPLATE.format(
        valid_tags=json.dumps(readable_tag_list, indent=2),
        user_interests=user_interests,
        time_of_day_context=time_of_day_context,
    )

    last_exc: Exception | None = None
    for attempt in range(2):
        try:
            response = client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": prompt},
                ],
                temperature=0.2,
                max_tokens=200,
                response_format={"type": "json_object"},
            )

            raw_output = response.choices[0].message.content
            parsed = json.loads(raw_output)
            tags = parsed.get("tags", [])
            if not isinstance(tags, list):
                raise ValueError(f"Expected 'tags' list, got {type(tags)}")
            raw_tags = [t for t in tags if isinstance(t, dict) and t.get("key") and t.get("value")]
            return _post_filter_tags(raw_tags, user_interests)

        except Exception as e:
            last_exc = e
            if attempt == 0:
                logging.warning(f"Groq attempt 1 failed ({e}), retrying")
                time.sleep(0.5)

    logging.error("❌ Groq call failed after 2 attempts", exc_info=True)
    raise HTTPException(
        status_code=500, detail=f"Groq tag parsing failed: {str(last_exc)}"
    )
