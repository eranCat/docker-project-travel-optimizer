import json
import logging
import re
from fastapi import HTTPException
from openai import OpenAI
from app.config import settings

# Setup Groq API client
client = OpenAI(
    base_url="https://api.groq.com/openai/v1",
    api_key=settings.groq_api_key,
)

# --- Constants ---
SYSTEM_PROMPT = "You are a travel assistant AI. Only respond with a JSON array."

USER_PROMPT_TEMPLATE = """
You are a travel assistant AI. The user will provide their interests (e.g., "music, yoga, art, fashion").

Your task is to analyze the interests and return a JSON array of OpenStreetMap tag objects. Each tag object must include:
- "key": the OSM tag key (e.g., "tourism", "leisure")
- "value": the corresponding tag value (e.g., "museum", "gallery")

Only include tags from this list:
{valid_tags}

Only select tag values that represent places people can visit, explore, or hang out in.

Return ONLY a JSON array of objects.

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
            model="llama3-8b-8192",
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
