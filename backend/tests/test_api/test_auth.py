import pytest
from fastapi.testclient import TestClient
from app.main import app
import uuid

client = TestClient(app)

def test_auth_flow():
    # Use a unique username so multiple test runs don't conflict in SQLite
    unique_id = str(uuid.uuid4())[:8]
    username = f"testuser_{unique_id}"
    email = f"test_{unique_id}@example.com"
    password = "securepassword123"

    # 1. Register
    signup_response = client.post(
        "/api/auth/register",
        json={"username": username, "email": email, "password": password}
    )
    assert signup_response.status_code == 201
    signup_data = signup_response.json()
    assert signup_data["username"] == username
    assert signup_data["email"] == email

    # 2. Login
    login_response = client.post(
        "/api/auth/login",
        json={"username_or_email": username, "password": password}
    )
    assert login_response.status_code == 200
    token_data = login_response.json()
    assert "access_token" in token_data
    assert token_data["token_type"] == "bearer"
    access_token = token_data["access_token"]

    # 3. Read Current User
    headers = {"Authorization": f"Bearer {access_token}"}
    me_response = client.get("/api/auth/me", headers=headers)
    assert me_response.status_code == 200
    me_data = me_response.json()
    assert me_data["username"] == username
