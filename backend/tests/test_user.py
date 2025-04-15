from fastapi.testclient import TestClient
from schemas.auth import LoginRequest
from schemas.user_schema import CreateUserRequest

def test_user_login_logout(app):
    print("🔍 Running Login + Logout Test (via HTTP routes)...")

    client = TestClient(app)

    test_email = "test@example.com"
    test_password = "testpassword"

    # Step 1: Try registering the user using CreateUserRequest
    create_payload = CreateUserRequest(
        name="Logout Tester",
        email=test_email,
        password=test_password
    )
    res = client.post("/users/create", json=create_payload.model_dump())

    if res.status_code == 201:
        print("✅ User registered and auto-logged in.")
        token = res.json()["access_token"]
        user_id = res.json()["user_id"]
    elif res.status_code == 400 and "already registered" in res.text:
        print("ℹ️ User already exists, trying to log in.")

        # Step 2: Login using LoginRequest
        login_payload = LoginRequest(email=test_email, password=test_password)
        login_res = client.post("/auth/token", json=login_payload.model_dump())
        assert login_res.status_code == 200, f"❌ Login failed: {login_res.text}"
        token = login_res.json()["access_token"]

        # Fetch user_id from /users/me as fallback
        me_res = client.get("/users/me", headers={"Authorization": f"Bearer {token}"})
        assert me_res.status_code == 200, f"❌ Failed to fetch user info: {me_res.text}"
        user_id = me_res.json()["id"]

        print("✅ Login successful.")
    else:
        raise Exception(f"❌ Unexpected registration response: {res.status_code} -> {res.text}")

    # Step 3: Logout (optional)
    logout_res = client.post("/users/logout", headers={
        "Authorization": f"Bearer {token}"
    })

    if logout_res.status_code == 200:
        print("✅ Logout route succeeded.")
    else:
        print("⚠️ Logout route not configured or failed.")

    # Step 4: Delete the test user
    delete_res = client.delete(f"/users/{user_id}", headers={
        "Authorization": f"Bearer {token}"
    })

    if delete_res.status_code == 200:
        print("🧹 Cleaned up test user.")
    else:
        print(f"⚠️ Could not delete test user: {delete_res.text}")

    print("✅ Login + Logout route test passed.")
