# FarmScale — Layer 1 (LLM) & Layer 2 (Crop Data)

Standalone implementation of FarmScale's **Layer 1 (LLM)**, **Layer 2 (Crop Data)**, **ML Seam (`ml_seam/`)**, and interactive test page (`llm_layer/web/tester.html`) for Rajshahi Division, Bangladesh.

## Setup

```bash
cd farmscale
python3 -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
cp .env.example .env
```

## Run the Server & Test Page

```bash
uvicorn llm_layer.api:app --reload --port 8000
```

Open `http://localhost:8000` in your browser. Demo mode runs end-to-end with `MockProvider` and `MockMLClient` with no API keys required.

## Run Tests & Contract Check

```bash
pytest -v
python -m ml_seam.contract_check --mode mock
```

## How to Add a New LLM Provider

1. Implement the `LLMProvider` protocol (`name`, `chat(...)`, `list_models()`) in `llm_layer/providers/`.
   - If OpenAI-compatible, reuse `OpenAICompatProvider` in `llm_layer/providers/openai_compat.py`.
   - Normalize errors via `normalize_http_error(...)` and redact keys with `redact_secret(...)`.
2. Register the provider in `PROVIDER_CONFIG` and `get_provider()` inside `llm_layer/providers/registry.py`.
3. Add fallback model suggestions in `llm_layer/providers/models.json`.
4. Add the provider ID to `llm_layer/web/tester.html` (`PROVIDERS` array and `<select>` options).
