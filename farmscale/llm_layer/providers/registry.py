"""Provider registry, fallback model suggestions, and environment key lookup."""

from __future__ import annotations

import json
import os
from functools import lru_cache
from pathlib import Path
from typing import Any

from llm_layer.providers.anthropic_provider import AnthropicProvider
from llm_layer.providers.base import LLMProvider
from llm_layer.providers.gemini_provider import GeminiProvider
from llm_layer.providers.mock_provider import MockProvider
from llm_layer.providers.openai_compat import OpenAICompatProvider

MODELS_PATH = Path(__file__).resolve().parent / "models.json"

PROVIDER_CONFIG: dict[str, dict[str, Any]] = {
    "anthropic": {
        "label": "Anthropic",
        "env_key": "ANTHROPIC_API_KEY",
        "default_base_url": "https://api.anthropic.com",
    },
    "gemini": {
        "label": "Google Gemini",
        "env_key": "GEMINI_API_KEY",
        "default_base_url": "https://generativelanguage.googleapis.com/v1beta",
    },
    "openai": {
        "label": "OpenAI",
        "env_key": "OPENAI_API_KEY",
        "default_base_url": "https://api.openai.com/v1",
    },
    "deepseek": {
        "label": "DeepSeek",
        "env_key": "DEEPSEEK_API_KEY",
        "default_base_url": "https://api.deepseek.com",
    },
    "openrouter": {
        "label": "OpenRouter",
        "env_key": "OPENROUTER_API_KEY",
        "default_base_url": "https://openrouter.ai/api/v1",
    },
    "mock": {
        "label": "Mock (Demo / Tests)",
        "env_key": None,
        "default_base_url": None,
    },
}


@lru_cache(maxsize=1)
def load_fallback_models() -> dict[str, list[str]]:
    with MODELS_PATH.open("r", encoding="utf-8") as f:
        return json.load(f)


def list_providers() -> list[dict[str, Any]]:
    fallback = load_fallback_models()
    out = []
    for pid, cfg in PROVIDER_CONFIG.items():
        out.append(
            {
                "id": pid,
                "label": cfg["label"],
                "default_base_url": cfg["default_base_url"],
                "fallback_models": fallback.get(pid, []),
            }
        )
    return out


def get_provider(
    name: str,
    api_key: str | None = None,
    base_url: str | None = None,
    timeout: float | None = None,
) -> LLMProvider:
    pid = (name or "mock").strip().lower()
    if pid not in PROVIDER_CONFIG:
        raise ValueError(f"Unknown provider '{pid}'. Supported: {', '.join(PROVIDER_CONFIG)}")

    cfg = PROVIDER_CONFIG[pid]
    t = timeout if timeout is not None else float(os.getenv("LLM_TIMEOUT_SECONDS", "30"))

    if pid == "mock":
        return MockProvider()

    key = (api_key or "").strip() or (os.getenv(cfg["env_key"], "") if cfg["env_key"] else "")
    url = (base_url or "").strip() or cfg["default_base_url"]

    if pid == "anthropic":
        return AnthropicProvider(api_key=key, base_url=url, timeout=t)
    if pid == "gemini":
        return GeminiProvider(api_key=key, base_url=url, timeout=t)
    if pid == "openrouter":
        return OpenAICompatProvider(
            name="openrouter",
            base_url=url,
            api_key=key,
            timeout=t,
            extra_headers={"X-Title": "FarmScale"},
        )
    return OpenAICompatProvider(name=pid, base_url=url, api_key=key, timeout=t)
