from dotenv import load_dotenv
import os

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is not set.")

POSTGRES_USER = os.getenv("POSTGRES_USER")
if not POSTGRES_USER:
    raise ValueError("POSTGRES_USER environment variable is not set.")

POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD")
if not POSTGRES_PASSWORD:
    raise ValueError("POSTGRES_PASSWORD environment variable is not set.")

POSTGRES_DB = os.getenv("POSTGRES_DB")
if not POSTGRES_DB:
    raise ValueError("POSTGRES_DB environment variable is not set.")

SCHEMA = os.getenv("SCHEMA")
if not SCHEMA:
    raise ValueError("SCHEMA environment variable is not set.")
