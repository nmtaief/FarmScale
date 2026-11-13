"""Shared OpenAI-compatible provider adapter (OpenAI, DeepSeek, OpenRouter)."""

from __future__ import annotations

import time
from typing import Any

import httpx

from llm_layer.providers.base import ProviderError, normalize_http_error, redact_secret


class OpenAICompatProvider:
    """Adapter for OpenAI-compatible Chat Completions and /models endpoints."""

    def __init__(
        self,
        name: str,
        base_url: str,
        api_key: str | None = None,
        timeout: float = 30.0,
        extra_headers: dict[str, str] | None = None,
    ) -> None:
        self.name = name
        self.base_url = base_url.rstrip("/")
        self.api_key = (api_key or "").strip()
        self.timeout = timeout
        self.extra_headers = extra_headers or {}

    def _headers(self) -> dict[str, str]:
        if not self.api_key:
            raise ProviderError(
                code="invalid_key",
                message=f"No API key provided for {self.name}.",
                provider=self.name,
                status_code=401,
            )
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        headers.update(self.extra_headers)
        return headers

    def chat(
        self,
        messages: list[dict[str, str]],
        model: str,
        temperature: float = 0.2,
        max_tokens: int = 1024,
        json_mode: bool = False,
    ) -> dict[str, Any]:
        body: dict[str, Any] = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }
        if json_mode:
            body["response_format"] = {"type": "json_object"}

        t0 = time.perf_counter()
        try:
            with httpx.Client(timeout=self.timeout) as client:
                resp = client.post(
                    f"{self.base_url}/chat/completions",
                    headers=self._headers(),
                    json=body,
                )
        except httpx.TimeoutException as exc:
            raise ProviderError(
                code="timeout",
                message=f"Request to {self.name} timed out after {self.timeout}s.",
                provider=self.name,
            ) from exc
        except httpx.HTTPError as exc:
            raise ProviderError(
                code="provider_error",
                message=redact_secret(f"Network error calling {self.name}: {exc}", self.api_key),
                provider=self.name,
            ) from exc

        latency = round(time.perf_counter() - t0, 3)
        if resp.status_code >= 400:
            raise normalize_http_error(self.name, resp.status_code, resp.text, self.api_key)

        data = resp.json()
        choices = data.get("choices") or []
        text = choices[0]["message"]["content"] if choices else ""
        usage = data.get("usage") or {}
        return {
            "text": text,
            "usage": {
                "input_tokens": usage.get("prompt_tokens", 0),
                "output_tokens": usage.get("completion_tokens", 0),
                "total_tokens": usage.get("total_tokens", 0),
            },
            "latency": latency,
            "provider": self.name,
            "model": data.get("model", model),
        }

    def list_models(self) -> list[str]:
        try:
            with httpx.Client(timeout=min(self.timeout, 10.0)) as client:
                resp = client.get(f"{self.base_url}/models", headers=self._headers())
        except httpx.TimeoutException as exc:
            raise ProviderError(code="timeout", message=f"{self.name} /models timed out.", provider=self.name) from exc
        except httpx.HTTPError as exc:
            raise ProviderError(
                code="provider_error",
                message=redact_secret(f"Error listing models for {self.name}: {exc}", self.api_key),
                provider=self.name,
            ) from exc

        if resp.status_code >= 400:
            raise normalize_http_error(self.name, resp.status_code, resp.text, self.api_key)

        data = resp.json()
        items = data.get("data") or []
        return sorted({item["id"] for item in items if isinstance(item, dict) and "id" in item})
