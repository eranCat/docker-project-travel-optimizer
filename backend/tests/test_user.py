import pytest

@pytest.mark.integration
def test_login_invalid_user(client):
    response = client.post("/auth/token", data={"username": "fake@example.com", "password": "wrong"})
    assert response.status_code == 401
