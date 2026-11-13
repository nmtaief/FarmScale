"""Tests for Stage 4: pipeline, intent, interpreter, grounding, and follow-up."""

import copy

from llm_layer.interpreter import interpret_rotations, verify_number_grounding
from llm_layer.pipeline import run_advise, run_followup, run_option_detail
from llm_layer.providers.mock_provider import MockProvider
from llm_layer.session import SessionStore
from ml_seam.client import get_ml_client


def test_golden_case_godagari_cash_crop_en():
    store = SessionStore()
    mock_llm = MockProvider()
    ml = get_ml_client("mock")

    res = run_advise(
        message="I want the most profit in Godagari, Rajshahi",
        intent_provider=mock_llm,
        intent_model="mock-farmscale-v1",
        interp_provider=mock_llm,
        interp_model="mock-farmscale-v1",
        ml_client=ml,
        session_store=store,
    )
    assert res["status"] == "ok"
    assert res["intent"]["goal"] == "cash_crop"
    assert res["location"]["district"] == "Rajshahi"
    assert res["location"]["upazila"] == "Godagari"
    assert res["ml_source"] == "MOCK"
    ml_rots = res["ml_payload"]["ranked_rotations"]
    out_opts = res["options"]
    assert len(out_opts) == 3
    assert [o["id"] for o in out_opts] == [r["id"] for r in ml_rots]
    assert [o["score"] for o in out_opts] == [r["score"] for r in ml_rots]
    assert res["interpretation"]["grounding_passed"] is True


def test_golden_case_niamatpur_soil_fertility_bn():
    store = SessionStore()
    mock_llm = MockProvider()
    ml = get_ml_client("mock")

    res = run_advise(
        message="নিয়ামতপুর, নওগাঁয় আমার জমির উর্বরতা বাড়াতে চাই",
        intent_provider=mock_llm,
        intent_model="mock-farmscale-v1",
        interp_provider=mock_llm,
        interp_model="mock-farmscale-v1",
        ml_client=ml,
        session_store=store,
    )
    assert res["status"] == "ok"
    assert res["intent"]["goal"] == "soil_fertility"
    assert res["intent"]["language"] == "bn"
    assert res["location"]["upazila"] == "Niamatpur"
    assert any("আমন" in o["name"] or "ছোলা" in o["name"] for o in res["options"])
    assert res["interpretation"]["grounding_passed"] is True


def test_option_2_detail_has_no_ml_call():
    store = SessionStore()
    mock_llm = MockProvider()
    ml = get_ml_client("mock")

    adv = run_advise(
        message="I want the most profit in Godagari, Rajshahi",
        intent_provider=mock_llm,
        intent_model="mock-farmscale-v1",
        interp_provider=mock_llm,
        interp_model="mock-farmscale-v1",
        ml_client=ml,
        session_store=store,
    )
    det = run_option_detail(
        session_id=adv["session_id"],
        option_n=2,
        provider=mock_llm,
        model="mock-farmscale-v1",
        session_store=store,
    )
    assert det["ml_called"] is False
    assert det["trace"][0]["detail"]["ml_called"] is False
    assert det["detail"]["rank"] == 2


def test_number_grounding_detects_injected_number():
    ml = get_ml_client("mock")
    payload = ml.rank(
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
    interp, _ = interpret_rotations(
        provider=MockProvider(),
        model="mock-farmscale-v1",
        ml_payload=payload,
        layer2_summary=None,
        language="en",
    )
    assert interp["grounding_passed"] is True

    tampered = copy.deepcopy(interp)
    tampered["summary"] += " Expected profit is 99999 BDT."
    ok, bad = verify_number_grounding(tampered, payload, None)
    assert ok is False
    assert "99999" in bad


def test_unsupported_goal_returns_clear_message():
    store = SessionStore()
    mock_llm = MockProvider()
    ml = get_ml_client("mock")
    res = run_advise(
        message="I want the most production in Godagari, Rajshahi",
        intent_provider=mock_llm,
        intent_model="mock-farmscale-v1",
        interp_provider=mock_llm,
        interp_model="mock-farmscale-v1",
        ml_client=ml,
        session_store=store,
    )
    assert res["status"] == "unsupported_goal"
    assert res["options"] == []
    assert "max_production" in res["message"]


def test_ml_failure_returns_partial_result():
    class BrokenML:
        def health(self):
            return {"status": "unavailable", "mode": "http"}

        def rank(self, request):
            raise ConnectionError("ML service down")

    store = SessionStore()
    mock_llm = MockProvider()
    res = run_advise(
        message="I want the most profit in Godagari, Rajshahi",
        intent_provider=mock_llm,
        intent_model="mock-farmscale-v1",
        interp_provider=mock_llm,
        interp_model="mock-farmscale-v1",
        ml_client=BrokenML(),
        session_store=store,
    )
    assert res["status"] == "partial_result"
    assert "ml_ranking" in res["missing"]
    assert res["layer2_summary"] is not None
    assert res["options"] == []


def test_followup_out_of_scope_and_explain_option():
    store = SessionStore()
    mock_llm = MockProvider()
    ml = get_ml_client("mock")
    adv = run_advise(
        message="I want the most profit in Godagari, Rajshahi",
        intent_provider=mock_llm,
        intent_model="mock-farmscale-v1",
        interp_provider=mock_llm,
        interp_model="mock-farmscale-v1",
        ml_client=ml,
        session_store=store,
    )
    oos = run_followup(adv["session_id"], "What is the bitcoin price?", mock_llm, "mock-farmscale-v1", session_store=store)
    assert oos["action"] == "out_of_scope"
    assert oos["ml_called"] is False
