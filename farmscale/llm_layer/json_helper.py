"""Shared helper for schema-validated JSON LLM calls with one automatic retry."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from jsonschema import Draft202012Validator

from llm_layer.providers.base import LLMProvider

PROMPTS_DIR = Path(__file__).resolve().parent / "prompts"


def load_prompt(filename: str) -> str:
    with (PROMPTS_DIR / filename).open("r", encoding="utf-8") as f:
        return f.read()


def _strip_fences(raw: str) -> str:
    text = raw.strip()
    if text.startswith("```"):
        lines = text.splitlines()
        if lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].strip().startswith("```"):
            lines = lines[:-1]
        text = "\n".join(lines).strip()
    return text


def call_json_with_retry(
    provider: LLMProvider,
    model: str,
    system_prompt: str,
    user_payload: dict[str, Any],
    schema: dict[str, Any],
    temperature: float = 0.2,
    max_tokens: int = 1024,
) -> tuple[dict[str, Any], dict[str, Any]]:
    """
    Call provider.chat(..., json_mode=True), parse JSON, validate against `schema`,
    and perform one automatic retry with the validation error if needed.
    Returns (parsed_json, meta_with_usage_latency_and_messages).
    """
    validator = Draft202012Validator(schema)
    messages: list[dict[str, str]] = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": json.dumps(user_payload, ensure_ascii=False)},
    ]

    last_err = ""
    total_usage = {"input_tokens": 0, "output_tokens": 0, "total_tokens": 0}
    total_latency = 0.0

    for attempt in range(2):
        res = provider.chat(
            messages=messages,
            model=model,
            temperature=temperature,
            max_tokens=max_tokens,
            json_mode=True,
        )
        u = res.get("usage") or {}
        total_usage["input_tokens"] += u.get("input_tokens", 0)
        total_usage["output_tokens"] += u.get("output_tokens", 0)
        total_usage["total_tokens"] += u.get("total_tokens", 0)
        total_latency += float(res.get("latency", 0.0))

        raw_text = _strip_fences(res.get("text", ""))
        try:
            parsed = json.loads(raw_text)
        except json.JSONDecodeError as exc:
            last_err = f"Invalid JSON: {exc}"
            if attempt == 0:
                messages.append({"role": "assistant", "content": raw_text})
                messages.append(
                    {
                        "role": "user",
                        "content": f"Your previous output was not valid JSON ({last_err}). Return ONLY a valid JSON object matching the schema.",
                    }
                )
                continue
            raise ValueError(f"LLM failed to return valid JSON after retry: {last_err}") from exc

        errors = sorted(validator.iter_errors(parsed), key=lambda e: list(e.path))
        if not errors:
            return parsed, {
                "usage": total_usage,
                "latency": round(total_latency, 3),
                "provider": res.get("provider", provider.name),
                "model": res.get("model", model),
                "prompts_sent": messages,
                "attempts": attempt + 1,
            }

        last_err = "; ".join(f"{'.'.join(str(p) for p in e.path) or '<root>'}: {e.message}" for e in errors)
        if attempt == 0:
            messages.append({"role": "assistant", "content": raw_text})
            messages.append(
                {
                    "role": "user",
                    "content": f"Your JSON failed schema validation: {last_err}. Fix these fields and return ONLY valid JSON.",
                }
            )
            continue
        raise ValueError(f"LLM JSON failed schema validation after retry: {last_err}")

    raise ValueError(f"Unexpected JSON retry failure: {last_err}")
