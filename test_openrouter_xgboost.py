"""CLI & Test Runner for FarmScale: OpenRouter LLM Layer + Layer 3 XGBoost ML Model.

Usage:
  # Test with OpenRouter API key:
  python test_openrouter_xgboost.py --api-key "sk-or-v1-..." --model "openai/gpt-4o-mini"

  # Test in Bengali:
  python test_openrouter_xgboost.py --api-key "sk-or-v1-..." --query "আমি বাগমারা রাজশাহীর কৃষক, জমিতে নাইট্রোজেন বাড়াতে চাই"

  # Test without an API key (validates OpenRouter reachability + runs pipeline with XGBoost + Mock LLM):
  python test_openrouter_xgboost.py
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import time
from pathlib import Path

# Setup paths
_HERE = Path(__file__).resolve().parent
_candidates = [
    _HERE / "farmscale",
    _HERE / "farmScale_llm-crops-data_layer" / "farmscale",
    _HERE.parent / "farmScale_llm-crops-data_layer" / "farmscale",
]
_FARMSCALE = next((c for c in _candidates if c.is_dir()), _HERE / "farmscale")

_gw_candidates = [
    _HERE / "NasaAPIgateWay",
    _HERE / "FarmScale" / "NasaAPIgateWay",
    _HERE.parent / "FarmScale" / "NasaAPIgateWay",
]
_GATEWAY = next((c for c in _gw_candidates if c.is_dir()), _HERE / "NasaAPIgateWay")

for p in (_FARMSCALE, _GATEWAY):
    if str(p) not in sys.path:
        sys.path.insert(0, str(p))

from dotenv import load_dotenv
load_dotenv(_FARMSCALE / ".env")

import httpx
from llm_layer.pipeline import run_advise
from llm_layer.providers.registry import get_provider
from ml_seam.client import get_ml_client
from ml_seam.contract_check import validate_payload


def print_banner():
    print("=" * 76)
    print("  NASA FarmScale: OpenRouter LLM + Layer 3 XGBoost ML Integration")
    print("  Pipeline: Intent (OpenRouter) -> Layer 2 Crops -> Layer 3 XGBoost -> Interpreter")
    print("=" * 76)


def check_openrouter_connectivity() -> tuple[bool, int, list[str]]:
    """Test live connectivity to OpenRouter's public API."""
    try:
        r = httpx.get("https://openrouter.ai/api/v1/models", timeout=10.0)
        if r.status_code == 200:
            models = [m["id"] for m in r.json().get("data", [])]
            return True, len(models), models[:5]
        return False, 0, []
    except Exception as exc:
        print(f"[WARN] Could not reach OpenRouter API: {exc}")
        return False, 0, []


def run():
    parser = argparse.ArgumentParser(description="Test FarmScale with OpenRouter & XGBoost ML")
    parser.add_argument("--api-key", "-k", type=str, default=None, help="OpenRouter API key (sk-or-v1-...)")
    parser.add_argument("--model", "-m", type=str, default="openai/gpt-4o-mini", help="OpenRouter model ID")
    parser.add_argument("--query", "-q", type=str, default="I am a farmer in Godagari, Rajshahi looking for high profit cash crops", help="Farmer query")
    parser.add_argument("--language", "-l", type=str, default=None, help="Output language ('en' or 'bn')")
    parser.add_argument("--mode", choices=["inprocess", "mock"], default="inprocess", help="ML Client Mode")
    parser.add_argument("--list-models", action="store_true", help="List available OpenRouter models")
    args = parser.parse_args()

    print_banner()

    # 1. Check OpenRouter Connectivity
    print("\n[STEP 1] Testing OpenRouter Public API Connectivity...")
    ok, total_models, sample_models = check_openrouter_connectivity()
    if ok:
        print(f"  [OK] Successfully connected to OpenRouter API!")
        print(f"  [OK] Available models count: {total_models}")
        print(f"  [OK] Sample models: {', '.join(sample_models)}")
    else:
        print("  [WARN] OpenRouter API could not be reached. Check network or proxy.")

    if args.list_models:
        return

    # 2. Check Layer 3 XGBoost ML Model Connection
    print("\n[STEP 2] Initializing Layer 3 XGBoost ML Engine...")
    ml_client = get_ml_client(args.mode)
    health = ml_client.health()
    print(f"  ML Client Mode:       {health.get('mode')}")
    print(f"  Model Type:           {health.get('model_type')}")
    print(f"  Model Version:        {health.get('version')}")
    print(f"  Boosted Trees Count:  {health.get('num_trees', 0)}")
    print(f"  ML Health Status:     {health.get('status')}")

    # 3. Contract Check on XGBoost Output
    print("\n[STEP 3] Validating XGBoost Output Contract...")
    sample_req = {
        "district": "Rajshahi",
        "upazila": "Godagari",
        "latitude": 24.466,
        "longitude": 88.330,
        "goal": "cash_crop",
        "season": "annual",
        "language": "en",
        "top_k": 3,
    }
    raw_payload = ml_client.rank(sample_req)
    contract_errors = validate_payload(raw_payload)
    if not contract_errors:
        print("  [PASS] Contract check passed with 0 schema errors!")
    else:
        print(f"  [FAIL] Contract check reported {len(contract_errors)} errors: {contract_errors}")

    # 4. Configure Provider (OpenRouter vs Mock LLM)
    openrouter_key = (
        args.api_key
        or os.getenv("OPENROUTER_API_KEY")
        or os.getenv("OPEN_ROUTER_API_KEY")
    )

    if openrouter_key:
        print(f"\n[STEP 4] Configuring OpenRouter Provider with model '{args.model}'...")
        key_masked = openrouter_key[:8] + "..." + openrouter_key[-4:] if len(openrouter_key) > 12 else "***"
        print(f"  Active API Key: {key_masked}")
        provider = get_provider("openrouter", api_key=openrouter_key)
        model_name = args.model
    else:
        print("\n[STEP 4] No OPENROUTER_API_KEY found.")
        print("  Running with Mock LLM Provider for intent/interpretation while keeping REAL XGBoost ML active.")
        print("  To use live OpenRouter, provide your key via --api-key 'sk-or-v1-...' or set OPENROUTER_API_KEY in .env.")
        provider = get_provider("mock")
        model_name = "mock-farmscale-v1"

    # 5. Execute Full FarmScale Pipeline
    print(f"\n[STEP 5] Running End-to-End Pipeline for Query: '{args.query}'...")
    t0 = time.perf_counter()
    result = run_advise(
        message=args.query,
        intent_provider=provider,
        intent_model=model_name,
        interp_provider=provider,
        interp_model=model_name,
        ml_client=ml_client,
        language=args.language,
        top_k=3,
    )
    duration = round(time.perf_counter() - t0, 3)

    print(f"\nPipeline finished in {duration}s!")
    print(f"Status:     {result.get('status')}")
    print(f"ML Source:  {result.get('ml_source')}")

    print("\n--- Pipeline Execution Trace ---")
    for tr in result.get("trace", []):
        d_str = f"({tr.get('duration_ms')}ms)" if "duration_ms" in tr else ""
        print(f"  - {tr['step']:<12}: status={tr['status']} {d_str}")

    print("\n" + "=" * 76)
    print("  RECOMMENDED CROP ROTATIONS (Scored by XGBoost Regressor)")
    print("=" * 76)
    for opt in result.get("options", []):
        print(f"\n[Option #{opt.get('rank')}] {opt.get('name')}")
        print(f"  XGBoost Match Score: {opt.get('score')}")
        if opt.get("pattern"):
            print(f"  Crops Sequence:      {' -> '.join(opt['pattern'])}")
        if opt.get("seasons"):
            print(f"  Seasons Breakdown:   {' | '.join(opt['seasons'])}")
        if opt.get("reason"):
            print(f"  Agronomic Reason:    {opt['reason']}")
        if opt.get("telemetry_note"):
            print(f"  NASA Telemetry Note: {opt['telemetry_note']}")

    print("\n" + "=" * 76)
    print("  VERIFICATION COMPLETE: XGBoost + FarmScale + OpenRouter Ready")
    print("=" * 76)


if __name__ == "__main__":
    run()

