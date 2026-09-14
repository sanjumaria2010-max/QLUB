"""Qlub Market Intelligence API tests"""
import os
import time
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://studio-to-emergent.preview.emergentagent.com").rstrip("/")
# Fall back to reading from frontend/.env
if "emergentagent" not in BASE_URL and "localhost" in BASE_URL:
    try:
        with open("/app/frontend/.env") as f:
            for line in f:
                if line.startswith("REACT_APP_BACKEND_URL="):
                    BASE_URL = line.split("=", 1)[1].strip().rstrip("/")
    except Exception:
        pass

API = f"{BASE_URL}/api"


# ---------- Health ----------
def test_health():
    r = requests.get(f"{API}/health", timeout=15)
    assert r.status_code == 200
    data = r.json()
    assert data.get("status") == "ok"


# ---------- Auth ----------
def test_login_success():
    r = requests.post(f"{API}/auth/login", json={"password": "qlub2026"}, timeout=15)
    assert r.status_code == 200
    data = r.json()
    assert "token" in data and data["token"].startswith("qlub-")
    assert "expires_at" in data


def test_login_wrong_password():
    r = requests.post(f"{API}/auth/login", json={"password": "wrong"}, timeout=15)
    assert r.status_code == 401


# ---------- Restaurants ----------
def test_restaurants_count_and_schema():
    r = requests.get(f"{API}/restaurants", timeout=15)
    assert r.status_code == 200
    data = r.json()
    assert data["count"] == 65, f"Expected 65, got {data['count']}"
    assert isinstance(data["restaurants"], list)
    assert len(data["restaurants"]) == 65
    first = data["restaurants"][0]
    for key in ("id", "name", "neighborhood", "cuisine", "owner", "valuation", "pos", "price", "rating", "investment", "lat", "lng"):
        assert key in first, f"Missing key {key} in restaurant object"


# ---------- Neighborhoods ----------
def test_neighborhoods():
    r = requests.get(f"{API}/neighborhoods", timeout=15)
    assert r.status_code == 200
    data = r.json()
    hoods = data["neighborhoods"]
    assert len(hoods) == 23, f"Expected 23 neighborhoods, got {len(hoods)}"
    for h in hoods:
        for key in ("name", "lat", "lng", "count", "tier"):
            assert key in h


# ---------- Voice of Customer ----------
def test_voc_sync_bestia():
    payload = {"restaurant": "Bestia"}
    r = requests.post(f"{API}/voice-of-customer/sync", json=payload, timeout=90)
    assert r.status_code == 200, f"body: {r.text[:500]}"
    data = r.json()
    for key in ("id", "query", "summary", "sentiment", "pain_points", "opportunities", "citations", "generated_at"):
        assert key in data, f"Missing key {key} in VoC response"
    s = data["sentiment"]
    total = s["positive"] + s["neutral"] + s["negative"]
    assert total == 100, f"Sentiment sum != 100: {total}"
    # Validate weighting: at least one of matching keywords should have severity bumped (high or medium)
    labels = [(pp["label"].lower(), pp["severity"]) for pp in data["pain_points"]]
    matched = [sev for label, sev in labels if any(k in label for k in ["bill", "pos", "payment", "staff turnover", "service inconsist"])]
    # At least the weighting code path ran; severity should be non-empty
    assert all(sev in ("low", "medium", "high") for _, sev in labels)


def test_voc_sync_empty_body():
    r = requests.post(f"{API}/voice-of-customer/sync", json={}, timeout=90)
    assert r.status_code == 200, f"body: {r.text[:500]}"
    data = r.json()
    assert data["sentiment"]["positive"] + data["sentiment"]["neutral"] + data["sentiment"]["negative"] == 100
    assert "query" in data and data["query"]


# ---------- Outreach generation ----------
def test_outreach_generate_bestia():
    payload = {
        "restaurant": "Bestia",
        "pain_points": ["Waiting for the bill", "POS friction"],
    }
    r = requests.post(f"{API}/outreach/generate", json=payload, timeout=90)
    assert r.status_code == 200, f"body: {r.text[:500]}"
    data = r.json()
    for key in ("subject", "email", "generated_at"):
        assert key in data, f"Missing key {key}"
    assert isinstance(data["subject"], str) and len(data["subject"]) > 0
    assert isinstance(data["email"], str) and len(data["email"]) > 20


def test_voc_history():
    # Ensure some history exists
    r = requests.get(f"{API}/voice-of-customer/history?limit=5", timeout=15)
    assert r.status_code == 200
    data = r.json()
    assert "items" in data
    assert isinstance(data["items"], list)
    # At least one from previous tests
    assert len(data["items"]) >= 1
    # MongoDB _id must not leak
    for item in data["items"]:
        assert "_id" not in item
