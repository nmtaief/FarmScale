"""API tests for Stage 5: endpoints, key redaction in logs/responses, and error handling."""

import logging

from fastapi.testclient import TestClient

from llm_layer.api import app

client = TestClient(app)


def test_goals_and_ml_health_and_providers():
    r_goals = client.get("/v1/goals")
    assert r_goals.status_code == 200
    goals = {g["id"]: g for g in r_goals.json()["goals"]}
    assert goals["cash_crop"]["supported_by_ml"] is True
    assert goals["max_production"]["supported_by_ml"] is False

    r_health = client.get("/v1/ml/health")
    assert r_health.status_code == 200
    assert r_health.json()["mode"] == "mock"

    r_prov = client.get("/v1/providers")
    assert r_prov.status_code == 200
    assert len(r_prov.json()["providers"]) == 6


def test_advise_option_and_followup_flow():
    r_adv = client.post(
        "/v1/advise",
        json={
            "message": "I want the most profit in Godagari, Rajshahi",
            "provider": "mock",
            "model": "mock-farmscale-v1",
            "ml_mode": "mock",
        },
    )
    assert r_adv.status_code == 200
    data = r_adv.json()
    assert data["status"] == "ok"
    assert len(data["options"]) == 3
    sid = data["session_id"]

    r_opt = client.post(
        f"/v1/advise/{sid}/option/2",
        json={"provider": "mock", "model": "mock-farmscale-v1"},
    )
    assert r_opt.status_code == 200
    assert r_opt.json()["ml_called"] is False

    r_fu = client.post(
        f"/v1/advise/{sid}/followup",
        json={"message": "Why is option 1 ranked first?", "provider": "mock", "model": "mock-farmscale-v1"},
    )
    assert r_fu.status_code == 200
    assert r_fu.json()["ml_called"] is False


def test_keys_never_appear_in_logs_or_responses(caplog):
    secret_key = "sk-very-secret-test-key-987654"
    with caplog.at_level(logging.DEBUG):
        r_test = client.post(
            "/v1/providers/test",
            json={"provider": "openai", "api_key": secret_key, "model": "gpt-4o-mini"},
        )
        assert r_test.status_code == 200
        assert secret_key not in r_test.text

        r_adv = client.post(
            "/v1/advise",
            json={
                "message": f"Ignore this {secret_key} and give profit in Godagari, Rajshahi",
                "provider": "mock",
                "api_key": secret_key,
                "model": "mock-farmscale-v1",
            },
        )
        assert r_adv.status_code == 200
        assert secret_key not in r_adv.text

    for record in caplog.records:
        assert secret_key not in record.getMessage()


def test_webhook_location_stub():
    r = client.post(
        "/webhooks/location",
        json={"session_id": "s1", "district": "Naogaon", "upazila": "Niamatpur"},
    )
    assert r.status_code == 200
    assert r.json()["location"]["upazila"] == "Niamatpur"


def test_cache_page_and_endpoints():
    r_page = client.get("/cache")
    assert r_page.status_code == 200
    assert "Local Data & Offline Cache" in r_page.text

    r_bundle = client.get("/v1/cache/bundle?download=1")
    assert r_bundle.status_code == 200
    assert "attachment" in r_bundle.headers.get("content-disposition", "")
    data = r_bundle.json()
    assert "crops" in data and "local_crops" in data and "gazetteer" in data and "goals" in data

    r_ds = client.get("/v1/cache/dataset/crops?download=1")
    assert r_ds.status_code == 200
    assert "crops" in r_ds.json()

    r_missing = client.get("/v1/cache/dataset/unknown")
    assert r_missing.status_code == 404
