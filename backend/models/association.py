# backend/models/association.py
from sqlalchemy import Table, Column, Integer, ForeignKey
from backend.config import SCHEMA
from ..base import Base

user_poi_association = Table(
    "user_poi_association",
    Base.metadata,
    Column("user_id", Integer, ForeignKey(SCHEMA+".users.id"), primary_key=True),
    Column("poi_id", Integer, ForeignKey(SCHEMA+".pois.id"), primary_key=True),
    schema=SCHEMA,
)
