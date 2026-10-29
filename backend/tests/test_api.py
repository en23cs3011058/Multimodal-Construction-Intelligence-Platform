"""Run with:  cd backend && MOCK_LLM=true pytest -q
Covers functional flows, strict-schema output, and edge cases (bad/missing images, bad input)."""
import io
import os

os.environ["MOCK_LLM"] = "true"

import pytest
from fastapi.testclient import TestClient

import config
config.DB_PATH = config.DATA_DIR / "test.db"

import schemas
from main import app
from mocks import MOCKS
from services import storage

PNG = b"\x89PNG\r\n\x1a\n" + b"\x00" * 64


@pytest.fixture(scope="module")
def client():
    storage.init_db()
    with TestClient(app) as c:
        yield c
    config.DB_PATH.unlink(missing_ok=True)


def test_health(client):
    assert client.get("/api/health").json()["mock_mode"] is True


def test_mocks_match_schemas():
    for name, data in MOCKS.items():
        getattr(schemas, name).model_validate(data)


@pytest.mark.parametrize("path,model", [("/api/safety/analyze", schemas.SafetyResult), ("/api/crack/analyze", schemas.CrackResult)])
def test_image_features(client, path, model):
    r = client.post(path, files=[("images", ("a.png", io.BytesIO(PNG), "image/png"))], data={"description": "wall"})
    assert r.status_code == 200
    model.model_validate(r.json()["result"])


def test_no_image(client):
    r = client.post("/api/crack/analyze", data={"description": "x"})
    assert r.status_code == 400 and "image" in r.json()["error"].lower()


def test_wrong_type(client):
    r = client.post("/api/safety/analyze", files=[("images", ("a.txt", io.BytesIO(b"hello"), "text/plain"))])
    assert r.status_code == 415


def test_corrupt_image(client):
    r = client.post("/api/safety/analyze", files=[("images", ("a.png", io.BytesIO(b"not a png"), "image/png"))])
    assert r.status_code == 400


def test_empty_image(client):
    r = client.post("/api/safety/analyze", files=[("images", ("a.png", io.BytesIO(b""), "image/png"))])
    assert r.status_code == 400


def test_too_many_images(client):
    files = [("images", (f"{i}.png", io.BytesIO(PNG), "image/png")) for i in range(config.MAX_IMAGES + 1)]
    assert client.post("/api/safety/analyze", files=files).status_code == 400


def test_valuation_and_validation(client):
    ok = {"location": "Indore", "property_type": "apartment", "area_sqft": 1200}
    assert client.post("/api/valuation/estimate", json=ok).status_code == 200
    bad = client.post("/api/valuation/estimate", json={**ok, "area_sqft": -5})
    assert bad.status_code == 422 and "error" in bad.json()


def test_planning_budget_flag_computed_server_side(client):
    r = client.post("/api/planning/generate", json={"built_up_area_sqft": 2000, "location": "Bhopal", "budget": 1000})
    assert r.json()["result"]["within_budget"] is False


def test_daily_and_knowledge(client):
    assert client.post("/api/daily/advise", json={"site_location": "Indore", "activities": ["Concrete pour"]}).status_code == 200
    assert client.post("/api/daily/advise", json={"site_location": "Indore", "activities": []}).status_code == 422
    assert client.post("/api/knowledge/ask", json={"question": "How long to cure concrete?"}).status_code == 200


def test_history(client):
    items = client.get("/api/history").json()["items"]
    assert items
    assert client.get(f"/api/history/{items[0]['id']}").status_code == 200
    assert client.get("/api/history/nope").status_code == 404
