"""Interpreter, option-detail writer, and number-grounding verification."""

from __future__ import annotations

import re
from typing import Any

from llm_layer.config import get_precip_unit
from llm_layer.json_helper import call_json_with_retry, load_prompt
from llm_layer.providers.base import LLMProvider

INTERPRETER_SCHEMA: dict[str, Any] = {
    "type": "object",
    "required": ["summary", "options", "telemetry_summary", "caveat", "data_status_note"],
    "properties": {
        "summary": {"type": "string"},
        "options": {
            "type": "array",
            "minItems": 1,
            "items": {
                "type": "object",
                "required": ["rank", "id", "name", "score", "reason", "telemetry_note"],
                "properties": {
                    "rank": {"type": "integer"},
                    "id": {"type": "string"},
                    "name": {"type": "string"},
                    "score": {"type": "number"},
                    "reason": {"type": "string"},
                    "telemetry_note": {"type": "string"},
                },
            },
        },
        "telemetry_summary": {"type": "string"},
        "caveat": {"type": "string"},
        "data_status_note": {"type": ["string", "null"]},
    },
}

DETAIL_SCHEMA: dict[str, Any] = {
    "type": "object",
    "required": ["rank", "title", "season_breakdown", "metrics_summary", "telemetry_fit", "caveat"],
    "properties": {
        "rank": {"type": "integer"},
        "title": {"type": "string"},
        "season_breakdown": {"type": "array", "items": {"type": "string"}},
        "metrics_summary": {"type": "string"},
        "telemetry_fit": {"type": "string"},
        "caveat": {"type": "string"},
    },
}

_BN_DIGITS = str.maketrans("০১২৩৪৫৬৭৮৯", "0123456789")
_NUM_RE = re.compile(r"-?\d+(?:\.\d+)?")


def _collect_allowed_numbers(obj: Any, out: set[float]) -> None:
    if isinstance(obj, bool):
        return
    if isinstance(obj, (int, float)):
        out.add(float(obj))
    elif isinstance(obj, dict):
        for v in obj.values():
            _collect_allowed_numbers(v, out)
    elif isinstance(obj, list):
        for v in obj:
            _collect_allowed_numbers(v, out)
    elif isinstance(obj, str):
        norm = obj.translate(_BN_DIGITS)
        for m in _NUM_RE.findall(norm):
            try:
                out.add(float(m))
            except ValueError:
                pass


def _extract_text_numbers(text: str) -> list[str]:
    norm = text.translate(_BN_DIGITS)
    return _NUM_RE.findall(norm)


def _flatten_strings(obj: Any) -> list[str]:
    if isinstance(obj, str):
        return [obj]
    if isinstance(obj, dict):
        out: list[str] = []
        for v in obj.values():
            out.extend(_flatten_strings(v))
        return out
    if isinstance(obj, list):
        out = []
        for v in obj:
            out.extend(_flatten_strings(v))
        return out
    return []


def verify_number_grounding(
    response_obj: Any,
    ml_payload: dict[str, Any],
    layer2_summary: dict[str, Any] | None = None,
) -> tuple[bool, list[str]]:
    """
    Verify that every number appearing in the LLM's text output exists in the
    ML payload or Layer 2 summary (or is a rank index 1..N).
    """
    allowed: set[float] = {1.0, 2.0, 3.0}
    _collect_allowed_numbers(ml_payload, allowed)
    if layer2_summary:
        _collect_allowed_numbers(layer2_summary, allowed)

    ungrounded: list[str] = []
    for text in _flatten_strings(response_obj):
        for raw_num in _extract_text_numbers(text):
            try:
                val = float(raw_num)
            except ValueError:
                continue
            if val not in allowed and abs(val) not in allowed:
                ungrounded.append(raw_num)

    return len(ungrounded) == 0, ungrounded


def _enforce_exact_ranking(interp: dict[str, Any], ml_payload: dict[str, Any]) -> dict[str, Any]:
    """Ensure options match the exact order, IDs, ranks, and scores of ml_payload.ranked_rotations."""
    ml_rots = ml_payload.get("ranked_rotations") or []
    by_id = {o.get("id"): o for o in interp.get("options") or []}
    fixed_options = []
    for idx, rot in enumerate(ml_rots):
        orig = by_id.get(rot["id"]) or (interp["options"][idx] if idx < len(interp.get("options", [])) else {})
        fixed_options.append(
            {
                "rank": rot["rank"],
                "id": rot["id"],
                "name": orig.get("name") or rot.get("name"),
                "score": rot["score"],
                "reason": orig.get("reason", ""),
                "telemetry_note": orig.get("telemetry_note", ""),
                "pattern": rot.get("pattern", []),
                "seasons": rot.get("seasons", []),
            }
        )
    interp["options"] = fixed_options
    return interp


def interpret_rotations(
    provider: LLMProvider,
    model: str,
    ml_payload: dict[str, Any],
    layer2_summary: dict[str, Any] | None,
    language: str = "en",
    temperature: float = 0.2,
    max_tokens: int = 1200,
) -> tuple[dict[str, Any], dict[str, Any]]:
    """Interpret ML ranked_rotations into grounded option cards."""
    precip_unit = get_precip_unit()
    system_prompt = load_prompt("interpreter.txt").replace("{precip_unit}", precip_unit)
    user_payload = {
        "language": language,
        "precip_unit": precip_unit,
        "ml_payload": ml_payload,
        "layer2_summary": layer2_summary or {},
    }

    parsed, meta = call_json_with_retry(
        provider=provider,
        model=model,
        system_prompt=system_prompt,
        user_payload=user_payload,
        schema=INTERPRETER_SCHEMA,
        temperature=temperature,
        max_tokens=max_tokens,
    )
    parsed = _enforce_exact_ranking(parsed, ml_payload)
    grounded, ungrounded = verify_number_grounding(parsed, ml_payload, layer2_summary)
    parsed["grounding_passed"] = grounded
    parsed["ungrounded_numbers"] = ungrounded
    if not grounded:
        parsed["grounding_warning"] = f"Ungrounded numbers detected: {', '.join(ungrounded)}"
    return parsed, meta


def write_option_detail(
    provider: LLMProvider,
    model: str,
    option: dict[str, Any],
    ml_payload: dict[str, Any],
    layer2_summary: dict[str, Any] | None,
    language: str = "en",
    temperature: float = 0.2,
    max_tokens: int = 900,
) -> tuple[dict[str, Any], dict[str, Any]]:
    """Write detailed explanation for a selected option using cached session data (no ML call)."""
    precip_unit = get_precip_unit()
    system_prompt = load_prompt("option_detail_writer.txt").replace("{precip_unit}", precip_unit)
    user_payload = {
        "language": language,
        "precip_unit": precip_unit,
        "option": option,
        "telemetry_used": ml_payload.get("telemetry_used", {}),
        "layer2_crops": (layer2_summary or {}).get("crops", []),
    }

    parsed, meta = call_json_with_retry(
        provider=provider,
        model=model,
        system_prompt=system_prompt,
        user_payload=user_payload,
        schema=DETAIL_SCHEMA,
        temperature=temperature,
        max_tokens=max_tokens,
    )
    grounded, ungrounded = verify_number_grounding(parsed, ml_payload, layer2_summary)
    parsed["grounding_passed"] = grounded
    parsed["ungrounded_numbers"] = ungrounded
    return parsed, meta
