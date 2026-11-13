"""Google Gemini REST API provider adapter."""

from __future__ import annotations

import time
from typing import Any

import httpx

from llm_layer.providers.base import ProviderError, normalize_http_error, redact_secret

DEFAULT_GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta"


class GeminiProvider:
    """Adapter for Google Gemini generateContent and models endpoints."""

    name = "gemini"

    def __init__(
        self,
        api_key: str | None = None,
        base_url: str | None = None,
        timeout: float = 30.0,
    ) -> None:
        self.api_key = (api_key or "").strip()
        self.base_url = (base_url or DEFAULT_GEMINI_URL).rstrip("/")
        self.timeout = timeout

    def _headers(self) -> dict[str, str]:
        if not self.api_key:
            raise ProviderError(
                code="invalid_key",
                message="No API key provided for gemini.",
                provider=self.name,
                status_code=401,
            )
        return {
            "x-goog-api-key": self.api_key,
            "Content-Type": "application/json",
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
        contents = []
        for m in messages:
            role = m.get("role")
            if role == "system":
                continue
            gemini_role = "model" if role == "assistant" else "user"
            contents.append({"role": gemini_role, "parts": [{"text": m["content"]}]})

        gen_config: dict[str, Any] = {
            "temperature": temperature,
            "maxOutputTokens": max_tokens,
        }
        if json_mode:
            gen_config["responseMimeType"] = "application/json"

        body: dict[str, Any] = {
            "contents": contents,
            "generationConfig": gen_config,
        }
        if system_parts:
            body["systemInstruction"] = {"parts": [{"text": "\n\n".join(system_parts)}]}

        clean_model = model.removeprefix("models/")
        t0 = time.perf_counter()
        try:
            with httpx.Client(timeout=self.timeout) as client:
                resp = client.post(
                    f"{self.base_url}/models/{clean_model}:generateContent",
                    headers=self._headers(),
                    json=body,
                )
        except httpx.TimeoutException as exc:
            raise ProviderError(
                code="timeout",
                message=f"Request to gemini timed out after {self.timeout}s.",
                provider=self.name,
            ) from exc
        except httpx.HTTPError as exc:
            raise ProviderError(
                code="provider_error",
                message=redact_secret(f"Network error calling gemini: {exc}", self.api_key),
                provider=self.name,
            ) from exc

        latency = round(time.perf_counter() - t0, 3)
        if resp.status_code >= 400:
            raise normalize_http_error(self.name, resp.status_code, resp.text, self.api_key)

        data = resp.json()
        candidates = data.get("candidates") or []
        parts = candidates[0].get("content", {}).get("parts", []) if candidates else []
        text = "".join(p.get("text", "") for p in parts)
        usage = data.get("usageMetadata") or {}
        in_tok = usage.get("promptTokenCount", 0)
        out_tok = usage.get("candidatesTokenCount", 0)
        return {
            "text": text,
            "usage": {
                "input_tokens": in_tok,
                "output_tokens": out_tok,
                "total_tokens": usage.get("totalTokenCount", in_tok + out_tok),
            },
            "latency": latency,
            "provider": self.name,
            "model": clean_model,
        }

    def list_models(self) -> list[str]:
        try:
            with httpx.Client(timeout=min(self.timeout, 10.0)) as client:
                resp = client.get(f"{self.base_url}/models", headers=self._headers())
        except httpx.TimeoutException as exc:
            raise ProviderError(code="timeout", message="gemini /models timed out.", provider=self.name) from exc
        except httpx.HTTPError as exc:
            raise ProviderError(
                code="provider_error",
                message=redact_secret(f"Error listing models for gemini: {exc}", self.api_key),
                provider=self.name,
            ) from exc

        if resp.status_code >= 400:
            raise normalize_http_error(self.name, resp.status_code, resp.text, self.api_key)

        data = resp.json()
        models = []
        for item in data.get("models") or []:
            methods = item.get("supportedGenerationMethods") or []
            if "generateContent" in methods and "name" in item:
                models.append(item["name"].removeprefix("models/"))
        return models
