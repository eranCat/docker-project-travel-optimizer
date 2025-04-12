# backend/models/saved_path.py
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSONB
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
from sqlalchemy.sql import func
from ..base import Base
from ..config import SCHEMA

from .saved_path_entry import saved_path_entry


# Define an item representing one point in the path
class POIItem(BaseModel):
    poi_id: int
    name: str
    order: int


# Schema for reading a SavedPath (response model)
class SavedPathSchema(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    created_at: datetime
    path: List[POIItem]

    model_config = {
    "from_attributes": True
}


# Schema for creating a new SavedPath (request model)
class SavedPathCreate(BaseModel):
    name: str
    description: Optional[str] = None
    path: List[POIItem]


class SavedPath(Base):
    __tablename__ = "saved_paths"
    __table_args__ = {"schema": SCHEMA}
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    # Foreign key to the user table
    user_id = Column(Integer, ForeignKey(SCHEMA+".users.id"))

    # Relationship to the User model
    user = relationship("User", back_populates="saved_paths")

    # JSONB field to store the path information. For example, a list of POI IDs or objects.
    path = Column(JSONB, nullable=False)
