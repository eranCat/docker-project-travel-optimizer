# tests/test_user.py
from backend.database import get_db
from backend.models.user import User

def run():
    print("🔍 Running User Test...")

    try:
        db = next(get_db())
        test_email = "plain-test@example.com"

        user = db.query(User).filter_by(email=test_email).first()
        if not user:
            user = User(name="Plain Tester", email=test_email)
            db.add(user)
            db.commit()
            print("✅ Created test user.")
        else:
            print("ℹ️ Test user already exists.")

        assert db.query(User).filter_by(email=test_email).first()
        print("✅ User test passed.")

    except Exception as e:
        print("❌ User test failed:", e)

    finally:
        # Clean up: remove test user after test
        try:
            deleted = db.query(User).filter_by(email=test_email).delete()
            db.commit()
            if deleted:
                print("🧹 Test user deleted.")
        except Exception as cleanup_error:
            print("⚠️ Failed to clean up test user:", cleanup_error)

if __name__ == "__main__":
    run()
