from langdetect import detect
from backend.models.poi import POI


from backend.schemas.poi_query import POIInterestQuery

def build_poi_prompt(query: POIInterestQuery, pois: list[POI]) -> str:
    from langdetect import detect

    user_lang = detect(query.interests)
    lang_map = {"en": "English", "he": "Hebrew", "fr": "French"}
    lang_label = lang_map.get(user_lang, "English")

    poi_descriptions = "\n".join(
        f"{i+1}. {p.name} - {p.description or ''} ({', '.join(p.categories or [])})"
        for i, p in enumerate(pois)
    )

    return f"""
You are a multilingual travel assistant. Respond in {lang_label}.

The user is planning a trip to **{query.location}** and is interested in: "{query.interests}"

Here is a list of real POIs near {query.location}:
{poi_descriptions}

Based on the user's interests, return a JSON array of {query.num_results} POIs you recommend, each with:
- name
- description
- address
- latitude
- longitude
- categories (as a list of tags)

Only return valid JSON — no explanations.
"""
