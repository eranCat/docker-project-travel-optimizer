from typing import List, Dict
from pydantic import BaseModel, Field
from collections import defaultdict


class OverpassTag(BaseModel):
    key: str = Field(..., min_length=1)
    value: str = Field(..., min_length=1)


class OverpassQueryParams(BaseModel):
    tags: List[OverpassTag]
    lat: float
    lon: float
    radius_m: int = Field(..., gt=0)

    def to_query(self) -> str:
        grouped_tags: Dict[str, set[str]] = defaultdict(set)
        for tag in self.tags:
            grouped_tags[tag.key].add(tag.value)

        filters = [
            f'{element}["{key}"~"{ "|".join(sorted(values)) }"](around:{self.radius_m},{self.lat},{self.lon});'
            for key, values in grouped_tags.items()
            for element in ("node", "way", "relation")
        ]

        return f"""
[out:json][timeout:25];
(
  {'\n  '.join(filters)}
);
out center tags;
""".strip()
