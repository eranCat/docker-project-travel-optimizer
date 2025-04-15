import json
from pathlib import Path
from typing import Dict, List

OSM_TAGS_CACHE_FILE = Path(__file__).parent / "osm_tags_cache.json"

def load_osm_tag_reference() -> Dict[str, List[str]]:
    try:
        with open(OSM_TAGS_CACHE_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"⚠️ Failed to load OSM tags cache: {e}")
        return {}
