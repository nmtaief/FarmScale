"""Base types, error normalization, and key redaction for LLM providers."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Literal, Protocol, runtime_checkable

ErrorCode = Literal[
    "invalid_key",
    "rate_limited",
    "model_not_found",
    "timeout",
    "provider_error",
]


@dataclass
class ProviderError(Exception):
    """Normalized error raised by all LLM providers."""

    code: ErrorCode
    message: str
    provider: str
    status_code: int | None = None

    def __str__(self) -> str:
        return f"[{self.provider}:{self.code}] {self.message}"


def redact_secret(text: str, secret: str | None) -> str:
    """Ensure an API key never appears in logs, traces, or error messages."""
    if not secret or len(secret) < 4:
        return text
    return text.replace(secret, "***REDACTED***")


def normalize_http_error(
    provider: str,
    status_code: int,
    body_text: str,
    api_key: str | None = None,
) -> ProviderError:
    """Map provider HTTP status codes and bodies to normalized ErrorCode values."""
    safe_body = redact_secret(body_text[:400], api_key)
    lower = safe_body.lower()

    if status_code in (401, 403) or "invalid api key" in lower or "authentication" in lower or "api_key_invalid" in lower:
        return ProviderError(
            code="invalid_key",
            message="API key was rejected by the provider. Please check your key in Settings.",
            provider=provider,
            status_code=status_code,
        )
    if status_code == 429 or "rate limit" in lower or "quota" in lower:
        return ProviderError(
            code="rate_limited",
            message="Provider rate limit or quota exceeded. Please wait and try again.",
            provider=provider,
            status_code=status_code,
        )
    if status_code == 404 or "model_not_found" in lower or "does not exist" in lower or "is not found" in lower:
        return ProviderError(
            code="model_not_found",
            message="Requested model was not found on this provider.",
            provider=provider,
            status_code=status_code,
        )
    if status_code in (408, 504):
        return ProviderError(
            code="timeout",
            message="Provider request timed out.",
            provider=provider,
            status_code=status_code,
        )
    return ProviderError(
        code="provider_error",
        message=f"Provider returned HTTP {status_code}: {safe_body}",
        provider=provider,
        status_code=status_code,
    )


@runtime_checkable
class LLMProvider(Protocol):
    """Common interface for all LLM providers."""

    name: str

    def chat(
        self,
        messages: list[dict[str, str]],
        model: str,
        temperature: float = 0.2,
        max_tokens: int = 1024,
        json_mode: bool = False,
    ) -> dict[str, Any]:
        """Return {'text': str, 'usage': dict, 'latency': float, 'provider': str, 'model': str}."""
        ...

    def list_models(self) -> list[str]:
        """Return available model IDs from the provider (or fallback)."""
        ...
