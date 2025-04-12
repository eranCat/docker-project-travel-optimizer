# backend/models/saved_path_entry.py
from sqlalchemy import Table, Column, Integer, ForeignKey
from ..base import Base
from ..config import SCHEMA

saved_path_entry = Table(
    "saved_path_entries",
    Base.metadata,
    Column("saved_path_id", Integer, ForeignKey(SCHEMA+".saved_paths.id"), primary_key=True),
    Column("poi_id", Integer, ForeignKey(SCHEMA+".pois.id"), primary_key=True),
    Column("order", Integer, nullable=False),
    schema=SCHEMA,
)
