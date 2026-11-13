"""Tests for ml_seam: contract schema, MockMLClient, InProcessMLClient stub, and contract_check."""

import copy

from ml_seam.client import get_ml_client
from ml_seam.contract_check import main as contract_check_main, validate_payload


def test_contract_check_mock_passes():
    exit_code = contract_check_main(["--mode", "mock"])
    assert exit_code == 0


def test_missing_required_field_fails_validation():
    client = get_ml_client("mock")
    payload = client.rank(
        {
            "district": "Rajshahi",
            "upazila": "Godagari",
            "latitude": 24.466,
            "longitude": 88.33,
            "goal": "cash_crop",
            "season": "annual",
            "language": "en",
            "top_k": 3,
        }
    )
    broken = copy.deepcopy(payload)
    del broken["telemetry_used"]["nasa_power_weather"]["temp_mean_c"]
    errors = validate_payload(broken)
    assert len(errors) > 0
    assert any("temp_mean_c" in e for e in errors)


def test_extra_unknown_fields_and_missing_optional_fields_pass():
    client = get_ml_client("mock")
    payload = client.rank(
        {
            "district": "Rajshahi",
            "upazila": "Godagari",
            "latitude": 24.466,
            "longitude": 88.33,
            "goal": "cash_crop",
            "season": "annual",
            "language": "en",
            "top_k": 3,
        }
    )
    modified = copy.deepcopy(payload)
    for opt in ("plain_language_answer", "llm_prompt_context", "instruction_for_llm", "query_analysis"):
        modified.pop(opt, None)
    for rot in modified["ranked_rotations"]:
        rot.pop("bengali_name", None)
        rot.pop("primary_fit", None)
        rot["extra_unknown_metric"] = 999
    modified["extra_top_level_field"] = {"note": "should be tolerated"}
    errors = validate_payload(modified)
    assert errors == []


def test_mock_deterministic_for_other_upazila():
    client = get_ml_client("mock")
    payload = client.rank(
        {
            "district": "Natore",
            "upazila": "Singra",
            "latitude": 24.499,
            "longitude": 89.146,
            "goal": "land_preservation",
            "season": "annual",
            "language": "en",
            "top_k": 3,
        }
    )
    assert payload["ml_metadata"]["model_type"] == "MOCK"
    assert len(payload["ranked_rotations"]) == 3
    assert validate_payload(payload) == []


def test_inprocess_client_connected_and_valid():
    client = get_ml_client("inprocess")
    health = client.health()
    assert health["status"] == "ok"
    assert health["mode"] == "inprocess"
    assert "xgboost" in health["model_type"].lower()
    exit_code = contract_check_main(["--mode", "inprocess"])
    assert exit_code == 0
