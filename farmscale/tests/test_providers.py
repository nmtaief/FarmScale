"""Tests for llm_layer/providers: normalization, key redaction, mock, and registry."""

import httpx
import pytest

from llm_layer.providers.base import ProviderError, normalize_http_error, redact_secret
from llm_layer.providers.registry import get_provider, list_providers, load_fallback_models


def test_list_providers_and_fallback_models():
    providers = list_providers()
    ids = {p["id"] for p in providers}
    assert ids == {"anthropic", "gemini", "openai", "deepseek", "openrouter", "mock"}
    fallback = load_fallback_models()
    for pid in ids:
        assert len(fallback[pid]) >= 1


def test_mock_provider_chat_and_models():
    p = get_provider("mock")
    assert p.list_models() == ["mock-farmscale-v1"]
    res = p.chat([{"role": "user", "content": "hello"}], model="mock-farmscale-v1")
    assert res["provider"] == "mock"
    assert res["text"]


def test_error_normalization_and_key_redaction():
    secret = "sk-super-secret-1234567890"
    err_401 = normalize_http_error("openai", 401, f"bad key {secret}", api_key=secret)
    assert err_401.code == "invalid_key"
    assert secret not in str(err_401)

    err_429 = normalize_http_error("anthropic", 429, "rate limit hit", api_key=secret)
    assert err_429.code == "rate_limited"

    err_404 = normalize_http_error("gemini", 404, "model not found", api_key=secret)
    assert err_404.code == "model_not_found"

    assert secret not in redact_secret(f"error with {secret}", secret)


@pytest.mark.parametrize("pid", ["anthropic", "gemini", "openai", "deepseek", "openrouter"])
def test_missing_key_raises_invalid_key(pid, monkeypatch):
    for env in ("ANTHROPIC_API_KEY", "GEMINI_API_KEY", "OPENAI_API_KEY", "DEEPSEEK_API_KEY", "OPENROUTER_API_KEY"):
        monkeypatch.delenv(env, raising=False)
    p = get_provider(pid, api_key="")
    with pytest.raises(ProviderError) as exc_info:
        p.chat([{"role": "user", "content": "hi"}], model="test-model")
    assert exc_info.value.code == "invalid_key"


def test_openai_compat_timeout_normalized(monkeypatch):
    def fake_post(*args, **kwargs):
        raise httpx.ReadTimeout("timed out")

    monkeypatch.setattr(httpx.Client, "post", fake_post)
    p = get_provider("openai", api_key="sk-test-key")
    with pytest.raises(ProviderError) as exc_info:
        p.chat([{"role": "user", "content": "hi"}], model="gpt-4o-mini")
    assert exc_info.value.code == "timeout"
