"""Intent parser and follow-up router for FarmScale."""

from __future__ import annotations

import re
from typing import Any

from llm_layer.json_helper import call_json_with_retry, load_prompt
from llm_layer.providers.base import LLMProvider

INTENT_SCHEMA: dict[str, Any] = {
    "type": "object",
    "required": ["intent", "goal", "location", "season", "language", "constraints", "confidence", "clarifying_question"],
    "properties": {
        "intent": {
            "type": "string",
            "enum": [
                "advise",
                "explain_option",
                "change_goal",
                "change_location",
                "ask_about_this_result",
                "out_of_scope",
            ],
        },
        "goal": {"type": ["string", "null"]},
        "location": {
            "type": "object",
            "required": ["district", "upazila", "latitude", "longitude"],
            "properties": {
                "district": {"type": ["string", "null"]},
                "upazila": {"type": ["string", "null"]},
                "latitude": {"type": ["number", "null"]},
                "longitude": {"type": ["number", "null"]},
            },
        },
        "season": {"type": "string"},
        "language": {"type": "string", "enum": ["en", "bn"]},
        "constraints": {
            "type": "object",
            "required": ["irrigation_available", "land_size", "avoid_crops"],
            "properties": {
                "irrigation_available": {"type": ["boolean", "null"]},
                "land_size": {"type": ["string", "null"]},
                "avoid_crops": {"type": "array", "items": {"type": "string"}},
            },
        },
        "confidence": {"type": "number"},
        "clarifying_question": {"type": ["string", "null"]},
    },
}


def parse_intent(
    provider: LLMProvider,
    model: str,
    message: str,
    explicit_goal_id: str | None = None,
    explicit_location: dict[str, Any] | None = None,
    language: str | None = None,
    season: str = "annual",
    temperature: float = 0.1,
    max_tokens: int = 512,
) -> tuple[dict[str, Any], dict[str, Any]]:
    """Classify intent and extract goal, location, season, language, and constraints."""
    system_prompt = load_prompt("intent_parser.txt")
    payload = {
        "message": message,
        "goal_id": explicit_goal_id,
        "location": explicit_location or {},
        "language": language,
        "season": season,
    }
    return call_json_with_retry(
        provider=provider,
        model=model,
        system_prompt=system_prompt,
        user_payload=payload,
        schema=INTENT_SCHEMA,
        temperature=temperature,
        max_tokens=max_tokens,
    )


def route_followup(message: str) -> dict[str, Any]:
    """
    Lightweight deterministic router for follow-up messages:
    explain_option(n), change_goal, change_location, ask_about_this_result, out_of_scope.
    """
    text = message.strip()
    lower = text.lower()

    m = re.search(r"(?:option|বিকল্প)\s*#?\s*([1-3১-৩])", lower)
    if m:
        digit_map = {"১": 1, "২": 2, "৩": 3}
        raw_d = m.group(1)
        n = digit_map.get(raw_d) or int(raw_d)
        return {"action": "explain_option", "option_n": n}

    if any(k in lower for k in ("change goal", "different goal", "other goal", "লক্ষ্য পরিবর্তন")):
        return {"action": "change_goal"}

    if any(k in lower for k in ("change location", "different location", "another upazila", "এলাকা পরিবর্তন", "জায়গা পরিবর্তন")):
        return {"action": "change_location"}

    if any(k in lower for k in ("weather", "bitcoin", "cricket", "recipe", "stock price")):
        return {"action": "out_of_scope"}

    return {"action": "ask_about_this_result"}
