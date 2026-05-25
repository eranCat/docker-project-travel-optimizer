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
    ("amenity", "restaurant"): {"restaurant", "food", "eat", "eating", "dining", "dinner", "lunch", "brunch", "tapas", "cuisine", "street food", "snack", "bistro", "steakhouse"},
    ("amenity", "bar"): {"bar", "bars", "pub", "pubs", "beer", "ale", "nightlife", "drinks", "cocktail", "cocktails", "wine", "spirits", "drinking", "tapas", "craft beer", "brewery", "distillery"},
    ("amenity", "pub"): {"pub", "pubs", "bar", "bars", "beer", "ale", "nightlife", "drinks", "tapas", "brewery", "brunch"},
    ("amenity", "nightclub"): {"nightlife", "club", "clubs", "nightclub", "nightclubs", "dancing", "dance", "bar", "bars"},
    ("amenity", "biergarten"): {"beer", "biergarten", "beer garden", "ale", "bar", "bars", "nightlife"},
    ("craft", "winery"): {"wine", "winery", "vineyard", "vino", "tapas"},
    ("amenity", "community_centre"): {"community", "social", "local", "neighbourhood", "neighborhood", "centre", "center"},
    ("tourism", "attraction"): {"sightseeing", "tourism", "tourist", "attraction", "attractions", "culture", "cultural", "landmark", "landmarks", "sight", "sights"},
}

# Deterministic keyword→tag mapping. Runs before LLM; results merged with LLM output.
# Keys are lowercased substrings to match against user interests.
_KEYWORD_TAGS: dict[str, list[tuple[str, str]]] = {
    # Food & drink
    "restaurant":    [("amenity", "restaurant")],
    "food":          [("amenity", "restaurant"), ("amenity", "food_court")],
    "street food":   [("amenity", "restaurant"), ("amenity", "fast_food"), ("amenity", "food_court")],
    "fast food":     [("amenity", "fast_food")],
    "cafe":          [("amenity", "cafe")],
    "coffee":        [("amenity", "cafe")],
    "brunch":        [("amenity", "cafe"), ("amenity", "restaurant")],
    "bakery":        [("shop", "bakery"), ("amenity", "cafe")],
    "ice cream":     [("amenity", "ice_cream")],
    "market":        [("amenity", "marketplace")],
    "food court":    [("amenity", "food_court")],
    # Drinks / nightlife
    "bar":           [("amenity", "bar")],
    "bars":          [("amenity", "bar")],
    "pub":           [("amenity", "pub")],
    "pubs":          [("amenity", "pub")],
    "beer":          [("amenity", "bar"), ("amenity", "pub"), ("amenity", "biergarten"), ("craft", "brewery")],
    "biergarten":    [("amenity", "biergarten")],
    "beer garden":   [("amenity", "biergarten")],
    "wine":          [("amenity", "bar"), ("craft", "winery")],
    "winery":        [("craft", "winery")],
    "brewery":       [("craft", "brewery")],
    "distillery":    [("craft", "distillery")],
    "cocktail":      [("amenity", "bar")],
    "nightlife":     [("amenity", "bar"), ("amenity", "pub"), ("amenity", "nightclub")],
    "nightclub":     [("amenity", "nightclub")],
    "club":          [("amenity", "nightclub")],
    "clubs":         [("amenity", "nightclub")],
    # Music / live entertainment
    "live music":    [("amenity", "music_venue"), ("amenity", "bar"), ("amenity", "nightclub")],
    "jazz":          [("amenity", "music_venue"), ("amenity", "bar")],
    "jazz bar":      [("amenity", "music_venue"), ("amenity", "bar")],
    "jazz bars":     [("amenity", "music_venue"), ("amenity", "bar")],
    "concert":       [("amenity", "music_venue"), ("amenity", "nightclub")],
    "concerts":      [("amenity", "music_venue")],
    "music venue":   [("amenity", "music_venue")],
    "music venues":  [("amenity", "music_venue")],
    "music":         [("amenity", "music_venue"), ("shop", "music")],
    "gig":           [("amenity", "music_venue"), ("amenity", "bar")],
    # Culture / arts
    "museum":        [("tourism", "museum")],
    "museums":       [("tourism", "museum")],
    "gallery":       [("tourism", "gallery")],
    "art":           [("tourism", "gallery"), ("amenity", "arts_centre"), ("shop", "art")],
    "arts":          [("amenity", "arts_centre"), ("tourism", "gallery")],
    "theatre":       [("amenity", "theatre")],
    "theater":       [("amenity", "theatre")],
    "opera":         [("amenity", "theatre")],
    "cinema":        [("amenity", "cinema")],
    "movie":         [("amenity", "cinema")],
    "film":          [("amenity", "cinema")],
    "culture":       [("tourism", "museum"), ("tourism", "gallery"), ("amenity", "arts_centre"), ("tourism", "attraction")],
    "cultural":      [("tourism", "museum"), ("tourism", "gallery"), ("amenity", "arts_centre")],
    "sightseeing":   [("tourism", "attraction"), ("tourism", "museum"), ("tourism", "viewpoint")],
    "attraction":    [("tourism", "attraction")],
    "landmark":      [("tourism", "attraction"), ("tourism", "viewpoint")],
    "viewpoint":     [("tourism", "viewpoint")],
    "aquarium":      [("tourism", "aquarium")],
    "zoo":           [("tourism", "zoo")],
    "theme park":    [("tourism", "theme_park")],
    # History
    "history":       [("historic", "monument"), ("historic", "castle"), ("historic", "ruins"), ("historic", "archaeological_site"), ("tourism", "attraction")],
    "historic":      [("historic", "monument"), ("historic", "castle"), ("historic", "ruins")],
    "castle":        [("historic", "castle")],
    "ruins":         [("historic", "ruins")],
    "monument":      [("historic", "monument")],
    "heritage":      [("historic", "monument"), ("historic", "castle"), ("historic", "archaeological_site")],
    "archaeology":   [("historic", "archaeological_site")],
    # Nature / outdoor
    "park":          [("leisure", "park")],
    "nature":        [("leisure", "park"), ("leisure", "nature_reserve"), ("natural", "wood")],
    "hiking":        [("leisure", "nature_reserve"), ("natural", "wood"), ("natural", "cliff")],
    "outdoor":       [("leisure", "park"), ("leisure", "nature_reserve"), ("natural", "wood")],
    "beach":         [("natural", "beach"), ("leisure", "beach_resort")],
    "forest":        [("natural", "wood")],
    "waterfall":     [("natural", "waterfall")],
    "cave":          [("natural", "cave_entrance")],
    "cliff":         [("natural", "cliff")],
    "hot spring":    [("natural", "hot_spring")],
    # Sport
    "sport":         [("leisure", "sports_centre")],
    "sports":        [("leisure", "sports_centre")],
    "gym":           [("leisure", "fitness_centre")],
    "fitness":       [("leisure", "fitness_centre")],
    "swimming":      [("leisure", "sports_centre")],
    "cycling":       [("leisure", "sports_centre")],
    "climbing":      [("leisure", "sports_centre")],
    "golf":          [("leisure", "sports_centre")],
    "tennis":        [("leisure", "sports_centre")],
    "football":      [("leisure", "stadium"), ("leisure", "sports_centre")],
    "soccer":        [("leisure", "stadium"), ("leisure", "sports_centre")],
    "basketball":    [("leisure", "sports_centre")],
    "yoga":          [("leisure", "fitness_centre")],
    "surfing":       [("natural", "beach"), ("leisure", "sports_centre")],
    "diving":        [("natural", "beach"), ("leisure", "sports_centre")],
    "skating":       [("leisure", "sports_centre")],
    # Leisure / entertainment
    "spa":           [("amenity", "spa")],
    "dance":         [("leisure", "dance")],
    "bowling":       [("leisure", "bowling_alley")],
    "escape room":   [("leisure", "escape_game")],
    "arcade":        [("leisure", "amusement_arcade")],
    # Shopping
    "shopping":      [("shop", "department_store"), ("shop", "mall")],
    "antiques":      [("shop", "antiques")],
    "vintage":       [("shop", "antiques"), ("shop", "second_hand")],
    "books":         [("shop", "books")],
    "bookshop":      [("shop", "books")],
    "jewelry":       [("shop", "jewelry")],
    "craft":         [("shop", "craft")],
    "gift":          [("shop", "gift")],
    # Aerial
    "cable car":     [("aerialway", "cable_car")],
    "gondola":       [("aerialway", "gondola")],
}


def _keyword_match_tags(user_interests: str) -> list[dict]:
    """Deterministic pass: map known interest keywords to OSM tags."""
    interests_lower = user_interests.lower()
    seen: set[tuple[str, str]] = set()
    result = []
    # Longest keys first so "live music" matches before "music"
    for keyword in sorted(_KEYWORD_TAGS, key=len, reverse=True):
        if keyword in interests_lower:
            for key, value in _KEYWORD_TAGS[keyword]:
                pair = (key, value)
                if pair not in seen:
                    seen.add(pair)
                    result.append({"key": key, "value": value})
    return result



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
    """Generate Overpass tags from user interests using Groq LLM.

    Pipeline:
      1. Deterministic keyword match → seed tags
      2. LLM (llama-3.3-70b, constrained JSON schema) → additional tags
      3. Merge + deduplicate
      4. Post-filter (contextual exclusions)
    """
    # 1. Deterministic keyword pass
    keyword_tags = _keyword_match_tags(user_interests)
    keyword_pairs: set[tuple[str, str]] = {(t["key"], t["value"]) for t in keyword_tags}

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

    # Build valid-pair lookup for LLM output validation
    valid_pairs: set[tuple[str, str]] = {
        (key, val) for key, values in valid_tags.items() for val in values
    }

    last_exc: Exception | None = None
    for attempt in range(2):
        try:
            response = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": prompt},
                ],
                temperature=0.2,
                max_tokens=300,
                response_format={"type": "json_object"},
            )
            raw_output = response.choices[0].message.content
            parsed = json.loads(raw_output)
            llm_tags = parsed.get("tags", [])
            if not isinstance(llm_tags, list):
                raise ValueError(f"Expected 'tags' list, got {type(llm_tags)}")

            # Validate LLM tags against known-valid OSM tag list
            llm_tags = [
                t for t in llm_tags
                if isinstance(t, dict) and t.get("key") and t.get("value")
                and (t["key"], t["value"]) in valid_pairs
            ]

            # 3. Merge: keyword tags first, then LLM additions not already covered
            merged = list(keyword_tags)
            for t in llm_tags:
                pair = (t["key"], t["value"])
                if pair not in keyword_pairs:
                    merged.append(t)
                    keyword_pairs.add(pair)

            # 4. Post-filter contextual exclusions
            result = _post_filter_tags(merged, user_interests)
            logging.debug(f"Tags: {len(keyword_tags)} keyword + {len(llm_tags)} LLM → {len(result)} final")
            return result

        except Exception as e:
            last_exc = e
            if attempt == 0:
                logging.warning(f"Groq attempt 1 failed ({e}), retrying")

    logging.error("❌ Groq call failed after 2 attempts", exc_info=True)
    raise HTTPException(
        status_code=500, detail=f"Groq tag parsing failed: {str(last_exc)}"
    )
