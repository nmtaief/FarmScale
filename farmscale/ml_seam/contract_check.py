"""Contract checker CLI for validating MLClient responses against ml_payload.schema.json."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

from jsonschema import Draft202012Validator

from ml_seam.client import get_ml_client

SCHEMA_PATH = Path(__file__).resolve().parent / "contract" / "ml_payload.schema.json"


def load_schema() -> dict[str, Any]:
    with SCHEMA_PATH.open("r", encoding="utf-8") as f:
        return json.load(f)


def validate_payload(payload: dict[str, Any]) -> list[str]:
    """Validate an ML payload against ml_payload.schema.json and return a list of error strings."""
    schema = load_schema()
    validator = Draft202012Validator(schema)
    errors = sorted(validator.iter_errors(payload), key=lambda e: list(e.path))
    messages: list[str] = []
    for err in errors:
        loc = ".".join(str(p) for p in err.path) or "<root>"
        messages.append(f"{loc}: {err.message}")
    return messages


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Validate FarmScale ML client output against the ML contract.")
    parser.add_argument("--mode", choices=["mock", "http", "inprocess"], default="mock")
    parser.add_argument("--http-url", default=None)
    args = parser.parse_args(argv)

    client = get_ml_client(mode=args.mode, http_url=args.http_url)
    sample_requests = [
        {
            "district": "Rajshahi",
            "upazila": "Godagari",
            "latitude": 24.466,
            "longitude": 88.330,
            "goal": "cash_crop",
            "season": "annual",
            "language": "en",
            "top_k": 3,
        },
        {
            "district": "Naogaon",
            "upazila": "Niamatpur",
            "latitude": 24.855,
            "longitude": 88.575,
            "goal": "soil_fertility",
            "season": "annual",
            "language": "bn",
            "top_k": 3,
        },
    ]

    all_ok = True
    for idx, req in enumerate(sample_requests, start=1):
        try:
            payload = client.rank(req)
        except Exception as exc:
            print(f"[FAIL] Case {idx} ({req['upazila']}): client.rank() raised {type(exc).__name__}: {exc}")
            all_ok = False
            continue

        errs = validate_payload(payload)
        if errs:
            all_ok = False
            print(f"[FAIL] Case {idx} ({req['upazila']}): {len(errs)} contract mismatch(es):")
            for e in errs:
                print(f"  - {e}")
        else:
            print(f"[PASS] Case {idx} ({req['upazila']}, {req['goal']}, {req['language']}): valid against ml_payload.schema.json")

    return 0 if all_ok else 1


if __name__ == "__main__":
    sys.exit(main())
