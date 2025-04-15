# backend/models/saved_path_entry.py
from sqlalchemy import Table, Column, Integer, ForeignKey
from base import Base
from config import settings

saved_path_entry = Table(
    "saved_path_entries",
    Base.metadata,
    Column("saved_path_id", Integer, ForeignKey(settings.db_schema+".saved_paths.id"), primary_key=True),
    Column("poi_id", Integer, ForeignKey(settings.db_schema+".pois.id"), primary_key=True),
    Column("order", Integer, nullable=False),
    schema=settings.db_schema,
)
