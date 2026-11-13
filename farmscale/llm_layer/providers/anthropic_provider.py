"""Anthropic Messages API provider adapter."""

from __future__ import annotations

import time
from typing import Any

import httpx

from llm_layer.providers.base import ProviderError, normalize_http_error, redact_secret

DEFAULT_ANTHROPIC_URL = "https://api.anthropic.com"
ANTHROPIC_VERSION = "2023-06-01"


class AnthropicProvider:
    """Adapter for Anthropic /v1/messages and /v1/models."""

    name = "anthropic"

    def __init__(
        self,
        api_key: str | None = None,
        base_url: str | None = None,
        timeout: float = 30.0,
    ) -> None:
        self.api_key = (api_key or "").strip()
        self.base_url = (base_url or DEFAULT_ANTHROPIC_URL).rstrip("/")
        self.timeout = timeout

    def _headers(self) -> dict[str, str]:
        if not self.api_key:
            raise ProviderError(
                code="invalid_key",
                message="No API key provided for anthropic.",
                provider=self.name,
                status_code=401,
            )
        return {
            "x-api-key": self.api_key,
            "anthropic-version": ANTHROPIC_VERSION,
            "content-type": "application/json",
        }

    def chat(
        self,
        messages: list[dict[str, str]],
        model: str,
        temperature: float = 0.2,
        max_tokens: int = 1024,
        json_mode: bool = False,
    ) -> dict[str, Any]:
        system_parts = [m["content"] for m in messages if m.get("role") == "system"]
        chat_msgs = [
            {"role": m["role"], "content": m["content"]}
            for m in messages
            if m.get("role") in ("user", "assistant")
        ]
        if json_mode:
            system_parts.append("Respond with a single valid JSON object only, with no markdown fences.")

        body: dict[str, Any] = {
            "model": model,
            "max_tokens": max_tokens,
            "temperature": temperature,
            "messages": chat_msgs,
        }
        if system_parts:
            body["system"] = "\n\n".join(system_parts)

        t0 = time.perf_counter()
        try:
            with httpx.Client(timeout=self.timeout) as client:
                resp = client.post(
                    f"{self.base_url}/v1/messages",
                    headers=self._headers(),
                    json=body,
                )
        except httpx.TimeoutException as exc:
            raise ProviderError(
                code="timeout",
                message=f"Request to anthropic timed out after {self.timeout}s.",
                provider=self.name,
            ) from exc
        except httpx.HTTPError as exc:
            raise ProviderError(
                code="provider_error",
                message=redact_secret(f"Network error calling anthropic: {exc}", self.api_key),
                provider=self.name,
            ) from exc

        latency = round(time.perf_counter() - t0, 3)
        if resp.status_code >= 400:
            raise normalize_http_error(self.name, resp.status_code, resp.text, self.api_key)

        data = resp.json()
        blocks = data.get("content") or []
        text = "".join(b.get("text", "") for b in blocks if b.get("type") == "text")
        usage = data.get("usage") or {}
        in_tok = usage.get("input_tokens", 0)
        out_tok = usage.get("output_tokens", 0)
        return {
            "text": text,
            "usage": {
                "input_tokens": in_tok,
                "output_tokens": out_tok,
                "total_tokens": in_tok + out_tok,
            },
            "latency": latency,
            "provider": self.name,
            "model": data.get("model", model),
        }

    def list_models(self) -> list[str]:
        try:
            with httpx.Client(timeout=min(self.timeout, 10.0)) as client:
                resp = client.get(f"{self.base_url}/v1/models", headers=self._headers())
        except httpx.TimeoutException as exc:
            raise ProviderError(code="timeout", message="anthropic /v1/models timed out.", provider=self.name) from exc
        except httpx.HTTPError as exc:
            raise ProviderError(
                code="provider_error",
                message=redact_secret(f"Error listing models for anthropic: {exc}", self.api_key),
                provider=self.name,
            ) from exc

        if resp.status_code >= 400:
            raise normalize_http_error(self.name, resp.status_code, resp.text, self.api_key)

        data = resp.json()
        items = data.get("data") or []
        return [item["id"] for item in items if isinstance(item, dict) and "id" in item]
