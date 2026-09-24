"""Public dashboard API no-auth regression coverage for overview/expo/voc-static modules."""
import os
import requests


BASE_URL = os.environ.get("REACT_APP_BACKEND_URL")
if BASE_URL:
    BASE_URL = BASE_URL.rstrip("/")


def _api(path: str) -> str:
    assert BASE_URL, "REACT_APP_BACKEND_URL is required for public endpoint testing"
    return f"{BASE_URL}/api{path}"


def test_health_ok_public():
    response = requests.get(_api("/health"), timeout=20)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "qlub-api"


def test_restaurants_public_payload_shape():
    response = requests.get(_api("/restaurants"), timeout=30)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data["restaurants"], list)
    assert data["count"] == len(data["restaurants"])
    first = data["restaurants"][0]
    assert isinstance(first["id"], str) and first["id"]
    assert isinstance(first["name"], str) and first["name"]
    assert isinstance(first["lat"], float)
    assert isinstance(first["lng"], float)
    assert "_id" not in first


def test_neighborhoods_public_payload_shape():
    response = requests.get(_api("/neighborhoods"), timeout=30)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data["neighborhoods"], list)
    assert len(data["neighborhoods"]) > 0
    first = data["neighborhoods"][0]
    assert isinstance(first["name"], str) and first["name"]
    assert isinstance(first["count"], int)


def test_expo_restaurants_public_payload_shape():
    response = requests.get(_api("/expo/restaurants"), timeout=30)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data["source"], dict)
    assert isinstance(data["restaurants"], list)
    assert len(data["restaurants"]) > 0
    assert isinstance(data["source"].get("prospects_total"), int)


def test_voc_filters_and_reviews_public_flow():
    filters_response = requests.get(_api("/voc-static/filters"), timeout=30)
    assert filters_response.status_code == 200
    filters_data = filters_response.json()
    assert isinstance(filters_data["regions"], list)
    assert isinstance(filters_data["issues"], list)
    assert len(filters_data["issues"]) > 0

    reviews_response = requests.get(_api("/voc-static/reviews"), timeout=30)
    assert reviews_response.status_code == 200
    reviews_data = reviews_response.json()
    assert isinstance(reviews_data["reviews"], list)
    assert reviews_data["count"] == len(reviews_data["reviews"])


def test_voc_reviews_filter_by_issue_and_location():
    filters_data = requests.get(_api("/voc-static/filters"), timeout=30).json()
    first_issue = filters_data["issues"][0]["id"]
    first_region = filters_data["regions"][0]["region"]

    response = requests.get(
        _api(f"/voc-static/reviews?location={first_region}&issue={first_issue}"),
        timeout=30,
    )
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data["reviews"], list)
    if data["reviews"]:
        first = data["reviews"][0]
        assert first["region"] == first_region
        assert first["issue"] == first_issue


def test_voc_restaurant_detail_by_id():
    filters_data = requests.get(_api("/voc-static/filters"), timeout=30).json()
    first_restaurant = filters_data["regions"][0]["restaurants"][0]
    restaurant_id = first_restaurant["id"]

    response = requests.get(_api(f"/voc-static/restaurant/{restaurant_id}"), timeout=30)
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == restaurant_id
    assert isinstance(data["name"], str) and data["name"]
    assert isinstance(data["reviews"], list)


def test_invalid_token_header_does_not_block_public_endpoint():
    response = requests.get(
        _api("/restaurants"),
        headers={"Authorization": "Bearer invalid_legacy_qlub_token"},
        timeout=30,
    )
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data["restaurants"], list)
    assert len(data["restaurants"]) > 0
