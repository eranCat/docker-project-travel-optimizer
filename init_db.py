from sqlalchemy import create_engine, event, text
from config import DATABASE_URL
from database import Base  # Your Base with proper metadata
from models import User, POI  # Import your models
from config import SCHEMA

engine = create_engine(DATABASE_URL, echo=True)

# Define the search_path event listener
def set_search_path(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("SET search_path TO "+SCHEMA)  # Ensure this matches your schema
    cursor.close()

# Attach the event listener so that every new connection uses travel_optimizer
event.listen(engine, "connect", set_search_path)

# Create the schema if it doesn't exist
with engine.connect() as conn:
    conn.execute(text("CREATE SCHEMA IF NOT EXISTS "+SCHEMA))  # Ensure schema creation
    conn.commit()  # Commit the transaction if necessary

# Create all tables under travel_optimizer schema
Base.metadata.create_all(bind=engine)
print("Database initialization complete.")