from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.sql import func
from ..base_model import Base


class POI(Base):
    __tablename__ = "pois"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    description = Column(String, nullable=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    created_at = Column(DateTime, server_default=func.now())
