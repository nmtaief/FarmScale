"""Acceptance criteria tests covering Section 14 (items 1-11)."""

from fastapi.testclient import TestClient

from llm_layer.api import app
from llm_layer.pipeline import run_advise
from llm_layer.providers.mock_provider import MockProvider
from llm_layer.session import SessionStore
from ml_seam.client import get_ml_client

client = TestClient(app)


def test_5_switching_provider_and_wrong_key_error():
    # Switch provider to openai with a wrong key -> friendly invalid_key message
    res = client.post(
        "/v1/providers/test",
        json={"provider": "openai", "api_key": "", "model": "gpt-4o-mini"},
    )
    assert res.status_code == 200
    body = res.json()
    assert body["ok"] is False
    assert body["error_code"] == "invalid_key"

    # Switching provider in advise changes provider shown in trace
    r_adv = client.post(
        "/v1/advise",
        json={
            "message": "I want the most profit in Godagari, Rajshahi",
            "provider": "mock",
            "model": "mock-farmscale-v1",
        },
    )
    trace = r_adv.json()["trace"]
    assert any(t["detail"].get("provider") == "mock" for t in trace if t["step"] == "intent")


def test_7_demo_mode_and_mock_banner_in_ui():
    r_html = client.get("/")
    assert r_html.status_code == 200
    assert "MOCK ML ACTIVE" in r_html.text

    r_adv = client.post(
        "/v1/advise",
        json={"message": "I want the most profit in Godagari, Rajshahi", "provider": "mock", "model": "mock-farmscale-v1"},
    )
    assert r_adv.status_code == 200
    assert r_adv.json()["ml_source"] == "MOCK"


def test_11_extra_unknown_fields_and_missing_optional_fields_in_pipeline():
    class MinimalExtraML:
        def health(self):
            return {"status": "ok", "mode": "mock"}

        def rank(self, request):
            base = get_ml_client("mock").rank(request)
            for opt in ("plain_language_answer", "llm_prompt_context", "instruction_for_llm", "query_analysis"):
                base.pop(opt, None)
            base["unknown_new_field"] = "tolerated"
            for r in base["ranked_rotations"]:
                r.pop("bengali_name", None)
                r.pop("primary_fit", None)
                r["custom_ml_debug"] = 42
            return base

    res = run_advise(
        message="I want the most profit in Godagari, Rajshahi",
        intent_provider=MockProvider(),
        intent_model="mock-farmscale-v1",
        interp_provider=MockProvider(),
        interp_model="mock-farmscale-v1",
        ml_client=MinimalExtraML(),
        session_store=SessionStore(),
    )
    assert res["status"] == "ok"
    assert len(res["options"]) == 3
