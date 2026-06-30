import pytest
from fastapi.testclient import TestClient
from app.main import app
import uuid

client = TestClient(app)

def test_submit_valid_counterexample():
    unique_id = str(uuid.uuid4())[:8]
    username = f"submitter_{unique_id}"
    email = f"sub_{unique_id}@example.com"
    password = "securepassword123"

    # Register & Login
    client.post(
        "/api/auth/register",
        json={"username": username, "email": email, "password": password}
    )
    login_response = client.post(
        "/api/auth/login",
        json={"username_or_email": username, "password": password}
    )
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Problem 4: Tree Leaves (Every tree has exactly 2 leaves)
    # Counterexample: Star graph K1,3 (4 nodes: 0 is center, 1, 2, 3 are leaves)
    star_graph = {
        "nodes": [{"id": 0}, {"id": 1}, {"id": 2}, {"id": 3}],
        "edges": [
            {"source": 0, "target": 1},
            {"source": 0, "target": 2},
            {"source": 0, "target": 3}
        ]
    }

    # Submit graph
    response = client.post(
        "/api/submissions/",
        json={"problem_id": 4, "object_data": star_graph},
        headers=headers
    )
    assert response.status_code == 201
    sub_data = response.json()
    submission_id = sub_data["id"]
    
    # Check status (in TestClient, background tasks run synchronously during/after request)
    status_response = client.get(f"/api/submissions/{submission_id}/status")
    assert status_response.status_code == 200
    status_data = status_response.json()
    
    assert status_data["status"] == "passed"
    assert status_data["size"] == 4
    assert status_data["is_record"] is True
