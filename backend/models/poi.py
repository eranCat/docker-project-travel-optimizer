from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from .association import user_poi_association
from ..base import Base
from ..config import SCHEMA


class POI(Base):
    __tablename__ = "pois"
    __table_args__ = {"schema": SCHEMA}
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    description = Column(String, nullable=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    # Define relationship back to users who favorited this POI
    users = relationship(
        "User", secondary=user_poi_association, back_populates="favorite_pois"
    )
