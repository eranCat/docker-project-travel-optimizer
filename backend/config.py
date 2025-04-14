from dotenv import load_dotenv
import os

load_dotenv()

ENV=os.getenv("ENV", "dev")
if ENV not in ["dev", "prod"]:
    raise ValueError("ENV must be either 'dev' or 'prod'.")

CLEAR_TABLES = os.getenv("CLEAR_TABLES", "false")

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is not set.")

print("DATABASE_URL:", DATABASE_URL)

POSTGRES_DB = os.getenv("POSTGRES_DB")
if not POSTGRES_DB:
    raise ValueError("POSTGRES_DB environment variable is not set.")

SCHEMA = os.getenv("SCHEMA")
if not SCHEMA:
    raise ValueError("SCHEMA environment variable is not set.")

ADMIN_EMAIL = os.getenv("ADMIN_EMAIL")
if not ADMIN_EMAIL:
    raise ValueError("ADMIN_EMAIL environment variable is not set.")

ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD")
if not ADMIN_PASSWORD:
    raise ValueError("ADMIN_PASSWORD environment variable is not set.")

SECRET_KEY = os.getenv("SECRET_KEY", "changeme")
if not SECRET_KEY:
    raise ValueError("SECRET_KEY environment variable is not set.")

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60