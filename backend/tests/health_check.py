import unittest
from sqlalchemy.orm import Session
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from config import settings
from database import get_db
from models.user import User
from models.poi import POI
from core.security import hash_password


class TestStartupDatabaseState(unittest.TestCase):

    def setUp(self):
        self.db: Session = next(get_db())

    def test_create_admin_and_test_poi(self):
        try:
            self.db.execute(text("SELECT 1"))

            # Admin setup
            test_email = settings.admin_email
            test_pass = hash_password(settings.admin_password)
            user = self.db.query(User).filter(User.email == test_email).first()
            if not user:
                user = User(name="Admin", email=test_email, hashed_password=test_pass)
                self.db.add(user)
                self.db.commit()

            # POI check
            poi = self.db.query(POI).filter_by(name="Startup Test POI").first()
            if not poi:
                poi = POI(name="Startup Test POI", latitude=0.0, longitude=0.0)
                user.favorite_pois.append(poi)
                self.db.add(poi)
                self.db.commit()

            # Verify presence
            self.assertIsNotNone(self.db.query(User).filter(User.email == test_email).first())
            self.assertIsNotNone(self.db.query(POI).filter_by(name="Startup Test POI").first())

        except SQLAlchemyError as e:
            self.fail(f"Startup test failed: {str(e)}")

    def tearDown(self):
        # Clean up test data
        test_email = settings.admin_email
        user = self.db.query(User).filter(User.email == test_email).first()
        if user:
            self.db.delete(user)
            self.db.commit()


