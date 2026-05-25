from typing import List, Dict, Optional
from pydantic import BaseModel, Field
from collections import defaultdict


class OverpassElement(BaseModel):
    id: int
    type: str
    tags: Optional[Dict[str, str]] = {}
    lat: Optional[float] = None
    lon: Optional[float] = None
    center: Optional[Dict[str, float]] = None


class OverpassTag(BaseModel):
    key: str = Field(..., min_length=1)
    value: str = Field(..., min_length=1)

    def __hash__(self):
        return hash((self.key, self.value))


class OverpassQueryParams(BaseModel):
    tags: List[OverpassTag]
    lat: float
    lon: float
    radius_m: int = Field(..., gt=0)
    # Optional bounding box (south, west, north, east). When set, the query uses
    # a bbox filter instead of `around:` — used for A→B corridor searches that
    # must cover the rectangle spanning both endpoints.
    bbox: Optional[tuple[float, float, float, float]] = None

    def to_query(self) -> str:
        grouped_tags: Dict[str, set[str]] = defaultdict(set)
        for tag in self.tags:
            grouped_tags[tag.key].add(tag.value)

        if self.bbox is not None:
            south, west, north, east = self.bbox
            spatial = f"({south},{west},{north},{east})"
        else:
            spatial = f"(around:{self.radius_m},{self.lat},{self.lon})"

        # Anchored alternation: "^(v1|v2|v3)$" — avoid accidental substring matches
        # Relations omitted — they are almost never tourist POIs (admin boundaries, routes).
        filters = [
            f'{element}["{key}"~"^({"|".join(sorted(values))})$"]{spatial};'
            for key, values in grouped_tags.items()
            for element in ("node", "way")
        ]

        filter_block = "\n  ".join(filters)

        return f"""[out:json][timeout:18];
            (
            {filter_block}
            );
            out center qt tags;""".strip()
