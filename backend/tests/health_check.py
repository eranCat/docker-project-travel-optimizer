import os
from backend.config import ADMIN_EMAIL, ADMIN_PASSWORD
from backend.core.security import hash_password
from backend.models.poi import POI
from sqlalchemy import text
from backend.database import get_db
from backend.models.user import User
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError


def run_startup_tests():
    print("✅ Running startup checks...")

    db: Session = next(get_db())
    try:
        db.execute(text("SELECT 1"))

        # Get email from env or fallback
        test_email = ADMIN_EMAIL
        test_pass = hash_password(ADMIN_PASSWORD)
        user = db.query(User).filter(User.email == test_email).first()
        if not user:
            user = User(name="Admin", email=test_email,hashed_password=test_pass)
            db.add(user)
            db.commit()
            print(f"🧪 Created admin test user ({test_email})")

        # Check if POIs exist or insert one
        poi = db.query(POI).filter_by(name="Startup Test POI").first()
        if not poi:
            poi = POI(name="Startup Test POI", latitude=0.0, longitude=0.0)
            user.favorite_pois.append(poi)
            db.add(poi)
            db.commit()
            print("🧪 Inserted test POI linked to admin")
        db.delete(user)
        db.commit()
        print("✅ Startup tests passed.")
    except SQLAlchemyError as e:
        print("❌ Startup check failed:", e)
        raise
