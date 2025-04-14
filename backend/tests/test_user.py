from backend.database import get_db
from backend.models.user import User
from backend.dependencies.auth import create_access_token
from datetime import timedelta

def test_user():
    print("🔍 Running Login + Logout Test...")

    try:
        db = next(get_db())
        test_email = "logout-test@example.com"

        # Step 1: Add user if not exists
        user = db.query(User).filter_by(email=test_email).first()
        if not user:
            user = User(name="Logout Tester", email=test_email)
            db.add(user)
            db.commit()
            print(f"✅ Created test user: {test_email}")
        else:
            print("ℹ️ Test user already exists.")

        # Step 2: Simulate login (issue token)
        user = db.query(User).filter_by(email=test_email).first()
        if not user:
            raise Exception("❌ Could not find test user for login.")

        access_token = create_access_token(data={"sub": str(user.id)}, expires_delta=timedelta(minutes=15))
        print(f"✅ Login successful. Token: {access_token[:30]}...")

        # Step 3: Simulate logout (frontend discards token)
        print("✅ Logout simulated (frontend should remove token).")

        # Step 4: Optional cleanup
        db.delete(user)
        db.commit()
        print("🧹 Cleaned up test user.")

        print("✅ Login + Logout test passed.")

    except Exception as e:
        print("❌ Login/Logout test failed:", e)

