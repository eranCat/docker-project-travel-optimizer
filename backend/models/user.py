from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func

from ..base_model import Base
from ..config import SCHEMA


class User(Base):
    __tablename__ = "users"
    __table_args__ = {"schema": SCHEMA}
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    created_at = Column(DateTime, server_default=func.now())
