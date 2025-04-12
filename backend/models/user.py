from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..base import Base
from .association import user_poi_association
from .saved_path import SavedPath
from ..config import SCHEMA


class User(Base):
    __tablename__ = "users"
    __table_args__ = {"schema": SCHEMA}
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    # Relationship for favorite POIs and saved paths
    favorite_pois = relationship(
        "POI", secondary=user_poi_association, back_populates="users"
    )
    saved_paths = relationship(
        "SavedPath", back_populates="user", cascade="all, delete-orphan"
    )
