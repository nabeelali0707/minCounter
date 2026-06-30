import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_read_problems():
    response = client.get("/api/problems/")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 5
    assert data[0]["title"] == "Chromatic K4 Conjecture"

def test_read_problem_detail():
    response = client.get("/api/problems/1")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == 1
    assert data["title"] == "Chromatic K4 Conjecture"
    assert "contains K4" in data["statement_text"]
