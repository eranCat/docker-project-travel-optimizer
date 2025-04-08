from sqlalchemy import Column, Integer, String, Float, DateTime
from .db import Base
import datetime

class PathResult(Base):
    __tablename__ = "path_results"

    id = Column(Integer, primary_key=True, index=True)
    start = Column(String, index=True)
    end = Column(String, index=True)
    # Store the computed optimal path as a CSV string (or JSON if you prefer)
    computed_path = Column(String)
    total_distance = Column(Float)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
