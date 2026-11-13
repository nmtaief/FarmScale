"""End-to-end integration tests connecting FarmScale Layer 1/2 with Layer 3 XGBoost ML model."""

import pytest
import os
import httpx
from ml_seam.client import get_ml_client
from ml_seam.contract_check import validate_payload
from llm_layer.pipeline import run_advise
from llm_layer.providers.mock_provider import MockProvider
from llm_layer.providers.registry import get_provider


def test_inprocess_ml_client_health():
    client = get_ml_client("inprocess")
    health = client.health()
    assert health["status"] == "ok"
    assert health["mode"] == "inprocess"
    assert "xgboost" in health["model_type"].lower()
    assert health.get("num_trees", 0) > 0


def test_inprocess_ml_client_rank_godagari_cash_crop():
    client = get_ml_client("inprocess")
    req = {
        "district": "Rajshahi",
        "upazila": "Godagari",
        "latitude": 24.466,
        "longitude": 88.330,
        "goal": "cash_crop",
        "season": "annual",
        "language": "en",
        "top_k": 3,
    }
    payload = client.rank(req)
    assert payload["status"] == "success"
    assert payload["ml_metadata"]["model_type"] == "XGBoost Regressor (Layer 3)"
    assert len(payload["ranked_rotations"]) == 3
    # Contract validation
    errors = validate_payload(payload)
    assert errors == [], f"Contract validation failed: {errors}"
    # Verify continuous scores and ranks
    scores = [r["score"] for r in payload["ranked_rotations"]]
    assert scores == sorted(scores, reverse=True)


def test_inprocess_ml_client_rank_niamatpur_soil_fertility():
    client = get_ml_client("inprocess")
    req = {
        "district": "Naogaon",
        "upazila": "Niamatpur",
        "latitude": 24.855,
        "longitude": 88.575,
        "goal": "soil_fertility",
        "season": "annual",
        "language": "bn",
        "top_k": 3,
    }
    payload = client.rank(req)
    assert payload["status"] == "success"
    assert len(payload["ranked_rotations"]) == 3
    errors = validate_payload(payload)
    assert errors == [], f"Contract validation failed: {errors}"


def test_advise_pipeline_with_xgboost():
    client = get_ml_client("inprocess")
    prov = MockProvider()
    result = run_advise(
        message="Farmer in Godagari, Rajshahi looking for maximum cash profit crops",
        intent_provider=prov,
        intent_model="mock-farmscale-v1",
        interp_provider=prov,
        interp_model="mock-farmscale-v1",
        ml_client=client,
        language="en",
    )
    assert result["status"] == "ok"
    assert result["ml_source"] == "XGBoost Regressor (Layer 3)"
    assert len(result["options"]) == 3
    steps = [t["step"] for t in result["trace"]]
    assert "ml" in steps
    assert "interpret" in steps


def test_openrouter_provider_config_and_live_models():
    # Verify OpenRouter provider instantiation
    prov = get_provider("openrouter", api_key="sk-or-v1-dummy-key-for-config-test")
    assert prov.name == "openrouter"
    assert prov.base_url == "https://openrouter.ai/api/v1"

    # Test live OpenRouter API reachability (public models endpoint)
    resp = httpx.get("https://openrouter.ai/api/v1/models", timeout=10)
    assert resp.status_code == 200
    data = resp.json()
    model_ids = [m["id"] for m in data.get("data", [])]
    assert len(model_ids) > 100
    assert any("gpt-4o" in m for m in model_ids)

