# backend/models/association.py
from sqlalchemy import Table, Column, Integer, ForeignKey
from config import settings
from base import Base

user_poi_association = Table(
    "user_poi_association",
    Base.metadata,
    Column("user_id", Integer, ForeignKey(settings.db_schema+".users.id"), primary_key=True),
    Column("poi_id", Integer, ForeignKey(settings.db_schema+".pois.id"), primary_key=True),
    schema=settings.db_schema,
)
