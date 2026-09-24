"""Public no-auth access regression tests for dashboard data endpoints."""
import os
import requests


BASE_URL = os.environ.get("REACT_APP_BACKEND_URL")
if BASE_URL:
    BASE_URL = BASE_URL.rstrip("/")


def _api(path: str) -> str:
    assert BASE_URL, "REACT_APP_BACKEND_URL is required for public endpoint testing"
    return f"{BASE_URL}/api{path}"


# ---------- Public health and overview data ----------
def test_health_public_ok():
    r = requests.get(_api("/health"), timeout=20)
    assert r.status_code == 200
    data = r.json()
    assert data["status"] == "ok"
    assert data["service"] == "qlub-api"


def test_restaurants_public_schema():
    r = requests.get(_api("/restaurants"), timeout=30)
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data["count"], int)
    assert isinstance(data["restaurants"], list)
    assert data["count"] == len(data["restaurants"])
    first = data["restaurants"][0]
    assert first["id"]
    assert first["name"]
    assert isinstance(first["lat"], float)
    assert isinstance(first["lng"], float)


def test_neighborhoods_public_schema():
    r = requests.get(_api("/neighborhoods"), timeout=30)
    assert r.status_code == 200
    data = r.json()
    assert "neighborhoods" in data
    assert isinstance(data["neighborhoods"], list)
    assert len(data["neighborhoods"]) > 0
    first = data["neighborhoods"][0]
    assert isinstance(first["name"], str) and first["name"]
    assert isinstance(first["count"], int)


# ---------- Expo and VoC static filters ----------
def test_expo_restaurants_public_payload():
    r = requests.get(_api("/expo/restaurants"), timeout=30)
    assert r.status_code == 200
    data = r.json()
    assert "source" in data
    assert "restaurants" in data
    assert isinstance(data["restaurants"], list)
    assert len(data["restaurants"]) > 0


def test_voc_static_filters_public_payload():
    r = requests.get(_api("/voc-static/filters"), timeout=30)
    assert r.status_code == 200
    data = r.json()
    assert "regions" in data
    assert "issues" in data
    assert isinstance(data["regions"], list)
    assert isinstance(data["issues"], list)
    assert len(data["issues"]) >= 1


def test_voc_static_reviews_public_payload():
    r = requests.get(_api("/voc-static/reviews"), timeout=30)
    assert r.status_code == 200
    data = r.json()
    assert "count" in data
    assert "reviews" in data
    assert isinstance(data["reviews"], list)
    assert data["count"] == len(data["reviews"])


# ---------- Legacy token should not block public access ----------
def test_invalid_token_header_does_not_block_public_data():
    headers = {"Authorization": "Bearer invalid_or_expired_legacy_qlub_token"}
    r = requests.get(_api("/restaurants"), headers=headers, timeout=30)
    assert r.status_code == 200
    data = r.json()
    assert "restaurants" in data
    assert len(data["restaurants"]) > 0
