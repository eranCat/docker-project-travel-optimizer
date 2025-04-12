from sqlalchemy import create_engine, event, text
import traceback

from .config import DATABASE_URL, SCHEMA
from .database import Base

engine = create_engine(DATABASE_URL, echo=True)


# Define the search_path event listener
def set_search_path(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("SET search_path TO " + SCHEMA)
    cursor.close()


# Attach the event listener
event.listen(engine, "connect", set_search_path)


def init():
    try:
        Base.metadata.drop_all(bind=engine)
        print("Dropping existing tables...")
    except Exception as e:
        print("💥 drop_all failed:")
        traceback.print_exc()
        raise

    # Remove the event listener temporarily so that schema creation uses the default search path ("public")
    event.remove(engine, "connect", set_search_path)

    # Create the schema if it doesn't exist (using default search path so that it can be created)
    with engine.connect() as conn:
        conn.execute(text("CREATE SCHEMA IF NOT EXISTS " + SCHEMA))
        conn.commit()

    # Reattach the event listener so that every new connection uses the target schema
    event.listen(engine, "connect", set_search_path)

    # Create all tables under the travel_optimizer schema
    Base.metadata.create_all(bind=engine)
    print("Database initialization complete.")
