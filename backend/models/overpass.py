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


    def to_query(self) -> str:
        grouped_tags: Dict[str, set[str]] = defaultdict(set)
        for tag in self.tags:
            grouped_tags[tag.key].add(tag.value)

        filters = [
            f'{element}["{key}"~"{ "|".join(sorted(values)) }"](around:{self.radius_m},{self.lat},{self.lon});'
            for key, values in grouped_tags.items()
            for element in ("node", "way", "relation")
        ]

        filter_block = "\n  ".join(filters)  # 🛠️ Fix: move this out of the f-string

        return f"""[out:json][timeout:40];
            (
            {filter_block}
            );
            out center tags;""".strip()
