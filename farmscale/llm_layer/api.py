"""FastAPI backend for FarmScale Layer 1 & Layer 2."""

from __future__ import annotations

import logging
import os
import time
from collections import defaultdict, deque
from pathlib import Path
from typing import Any

from fastapi import FastAPI, Header, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel, Field

from crop_layer.loader import DATA_DIR as CROP_DATA_DIR, get_gazetteer
from llm_layer.goals import GOALS
from llm_layer.location import ManualLocationProvider, WebhookLocationProvider
from llm_layer.pipeline import run_advise, run_followup, run_option_detail
from llm_layer.providers.base import ProviderError, redact_secret
from llm_layer.providers.registry import get_provider, list_providers, load_fallback_models
from llm_layer.session import DEFAULT_SESSION_STORE
from ml_seam.client import get_ml_client

logger = logging.getLogger("farmscale.api")

WEB_DIR = Path(__file__).resolve().parent / "web"

app = FastAPI(title="FarmScale API", version="0.1.0")

_cors_origins = [
    o.strip()
    for o in os.getenv("CORS_ORIGINS", "http://localhost:8000,http://127.0.0.1:8000").split(",")
    if o.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "x-api-key"],
)

_rate_buckets: dict[str, deque[float]] = defaultdict(deque)
_webhook_location_provider = WebhookLocationProvider()
_manual_location_provider = ManualLocationProvider()


@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next: Any) -> Any:
    limit = int(os.getenv("RATE_LIMIT_PER_MINUTE", "60"))
    if limit > 0 and request.url.path.startswith("/v1/"):
        ip = request.client.host if request.client else "unknown"
        now = time.time()
        bucket = _rate_buckets[ip]
        while bucket and now - bucket[0] > 60.0:
            bucket.popleft()
        if len(bucket) >= limit:
            return JSONResponse(
                status_code=429,
                content={"error": "rate_limited", "message": "Too many requests. Please wait a minute."},
            )
        bucket.append(now)
    return await call_next(request)


@app.exception_handler(ProviderError)
async def provider_error_handler(_request: Request, exc: ProviderError) -> JSONResponse:
    return JSONResponse(
        status_code=400 if exc.code == "invalid_key" else 502,
        content={
            "error": exc.code,
            "provider": exc.provider,
            "message": exc.message,
        },
    )


class ProviderSettings(BaseModel):
    provider: str = "mock"
    api_key: str | None = None
    model: str = "mock-farmscale-v1"
    base_url: str | None = None
    temperature: float = 0.2
    max_tokens: int = 1200


class AdviseRequest(BaseModel):
    message: str = ""
    goal_id: str | None = None
    location: dict[str, Any] | None = None
    language: str | None = None
    season: str = "annual"
    top_k: int = Field(default=3, ge=1, le=5)
    # Active provider settings (key arrives per request, never stored/logged)
    provider: str = "mock"
    api_key: str | None = None
    model: str = "mock-farmscale-v1"
    base_url: str | None = None
    # Optional separate intent provider/model
    intent_provider: str | None = None
    intent_api_key: str | None = None
    intent_model: str | None = None
    intent_base_url: str | None = None
    temperature: float = 0.2
    max_tokens: int = 1200
    # ML source override for testing
    ml_mode: str | None = None
    ml_http_url: str | None = None


class OptionDetailRequest(BaseModel):
    provider: str = "mock"
    api_key: str | None = None
    model: str = "mock-farmscale-v1"
    base_url: str | None = None
    temperature: float = 0.2
    max_tokens: int = 900


class FollowupRequest(BaseModel):
    message: str
    provider: str = "mock"
    api_key: str | None = None
    model: str = "mock-farmscale-v1"
    base_url: str | None = None
    temperature: float = 0.2
    max_tokens: int = 700


class ProviderTestRequest(BaseModel):
    provider: str
    api_key: str | None = None
    model: str | None = None
    base_url: str | None = None


class WebhookLocationPayload(BaseModel):
    session_id: str = "default"
    district: str | None = None
    upazila: str | None = None
    latitude: float | None = None
    longitude: float | None = None


def _sanitize_secrets(obj: Any, secrets: list[str]) -> Any:
    if isinstance(obj, str):
        out = obj
        for s in secrets:
            out = redact_secret(out, s)
        return out
    if isinstance(obj, dict):
        return {k: _sanitize_secrets(v, secrets) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_sanitize_secrets(v, secrets) for v in obj]
    return obj


@app.get("/")
def serve_tester() -> FileResponse:
    index = WEB_DIR / "tester.html"
    if not index.exists():
        raise HTTPException(status_code=404, detail="tester.html not found")
    return FileResponse(index)


@app.get("/cache")
def serve_cache_page() -> FileResponse:
    page = WEB_DIR / "cache.html"
    if not page.exists():
        raise HTTPException(status_code=404, detail="cache.html not found")
    return FileResponse(page)


@app.get("/v1/cache/bundle")
def api_cache_bundle(download: bool = Query(default=False)) -> JSONResponse:
    import json
    from datetime import datetime, timezone

    def _read_crop_json(filename: str) -> Any:
        with (CROP_DATA_DIR / filename).open("r", encoding="utf-8") as f:
            return json.load(f)

    bundle = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "crops": _read_crop_json("crops.json"),
        "local_crops": _read_crop_json("local_crops.json"),
        "gazetteer": _read_crop_json("gazetteer.json"),
        "crop_id_map": _read_crop_json("crop_id_map.json"),
        "goals": GOALS,
    }
    headers = {"Content-Disposition": 'attachment; filename="farmscale-offline-bundle.json"'} if download else {}
    return JSONResponse(content=bundle, headers=headers)


@app.get("/v1/cache/dataset/{name}")
def api_cache_dataset(name: str, download: bool = Query(default=False)) -> JSONResponse:
    import json

    allowed = {
        "crops": "crops.json",
        "local_crops": "local_crops.json",
        "gazetteer": "gazetteer.json",
        "crop_id_map": "crop_id_map.json",
    }
    filename = allowed.get(name)
    if not filename:
        raise HTTPException(status_code=404, detail=f"Unknown dataset '{name}'.")
    with (CROP_DATA_DIR / filename).open("r", encoding="utf-8") as f:
        data = json.load(f)
    headers = {"Content-Disposition": f'attachment; filename="{filename}"'} if download else {}
    return JSONResponse(content=data, headers=headers)


@app.get("/v1/goals")
def get_goals() -> dict[str, Any]:
    return {"goals": GOALS}


@app.get("/v1/gazetteer")
def api_get_gazetteer() -> dict[str, Any]:
    return get_gazetteer()


@app.get("/v1/providers")
def api_list_providers() -> dict[str, Any]:
    return {"providers": list_providers()}


@app.get("/v1/providers/{provider_id}/models")
def api_list_provider_models(
    provider_id: str,
    base_url: str | None = Query(default=None),
    x_api_key: str | None = Header(default=None),
) -> dict[str, Any]:
    fallback = load_fallback_models().get(provider_id.lower(), [])
    if provider_id.lower() == "mock":
        return {"provider": "mock", "models": fallback, "source": "mock"}
    try:
        prov = get_provider(provider_id, api_key=x_api_key, base_url=base_url)
        models = prov.list_models()
        if models:
            return {"provider": provider_id, "models": models, "source": "live"}
    except ProviderError as exc:
        return {
            "provider": provider_id,
            "models": fallback,
            "source": "fallback",
            "note": exc.message,
        }
    return {"provider": provider_id, "models": fallback, "source": "fallback"}


@app.post("/v1/providers/test")
def api_test_provider(req: ProviderTestRequest) -> dict[str, Any]:
    fallback = load_fallback_models().get(req.provider.lower(), [])
    model = req.model or (fallback[0] if fallback else "mock-farmscale-v1")
    try:
        prov = get_provider(req.provider, api_key=req.api_key, base_url=req.base_url, timeout=15.0)
        res = prov.chat(
            messages=[{"role": "user", "content": "Reply with OK."}],
            model=model,
            temperature=0.0,
            max_tokens=16,
            json_mode=False,
        )
        return {
            "ok": True,
            "provider": res["provider"],
            "model": res["model"],
            "latency": res["latency"],
            "message": f"Connected to {res['provider']} ({res['model']}) in {res['latency']}s.",
        }
    except ProviderError as exc:
        return {
            "ok": False,
            "provider": exc.provider,
            "error_code": exc.code,
            "message": exc.message,
        }


@app.get("/v1/ml/health")
def api_ml_health(
    mode: str | None = Query(default=None),
    http_url: str | None = Query(default=None),
) -> dict[str, Any]:
    client = get_ml_client(mode=mode, http_url=http_url)
    return client.health()


@app.post("/webhooks/location")
def api_webhook_location(payload: WebhookLocationPayload) -> dict[str, Any]:
    resolved = _webhook_location_provider.record(payload.session_id, payload.model_dump())
    if not resolved:
        raise HTTPException(status_code=400, detail="Could not resolve location in Rajshahi Division.")
    return {"status": "recorded", "session_id": payload.session_id, "location": resolved}


@app.post("/v1/advise")
def api_advise(req: AdviseRequest) -> dict[str, Any]:
    secrets = [s for s in (req.api_key, req.intent_api_key) if s]
    interp_prov = get_provider(req.provider, api_key=req.api_key, base_url=req.base_url)
    intent_prov = (
        get_provider(
            req.intent_provider,
            api_key=req.intent_api_key or req.api_key,
            base_url=req.intent_base_url or req.base_url,
        )
        if req.intent_provider
        else interp_prov
    )
    ml_client = get_ml_client(mode=req.ml_mode, http_url=req.ml_http_url)

    logger.info("POST /v1/advise provider=%s ml_mode=%s", req.provider, req.ml_mode or "default")
    result = run_advise(
        message=req.message,
        intent_provider=intent_prov,
        intent_model=req.intent_model or req.model,
        interp_provider=interp_prov,
        interp_model=req.model,
        ml_client=ml_client,
        location_provider=_manual_location_provider,
        explicit_goal_id=req.goal_id,
        explicit_location=req.location,
        language=req.language,
        season=req.season,
        temperature=req.temperature,
        max_tokens=req.max_tokens,
        top_k=req.top_k,
        session_store=DEFAULT_SESSION_STORE,
    )
    return _sanitize_secrets(result, secrets)


@app.post("/v1/advise/{session_id}/option/{option_n}")
def api_option_detail(session_id: str, option_n: int, req: OptionDetailRequest) -> dict[str, Any]:
    secrets = [s for s in (req.api_key,) if s]
    prov = get_provider(req.provider, api_key=req.api_key, base_url=req.base_url)
    try:
        res = run_option_detail(
            session_id=session_id,
            option_n=option_n,
            provider=prov,
            model=req.model,
            temperature=req.temperature,
            max_tokens=req.max_tokens,
            session_store=DEFAULT_SESSION_STORE,
        )
        return _sanitize_secrets(res, secrets)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.post("/v1/advise/{session_id}/followup")
def api_followup(session_id: str, req: FollowupRequest) -> dict[str, Any]:
    secrets = [s for s in (req.api_key,) if s]
    prov = get_provider(req.provider, api_key=req.api_key, base_url=req.base_url)
    try:
        res = run_followup(
            session_id=session_id,
            message=req.message,
            provider=prov,
            model=req.model,
            temperature=req.temperature,
            max_tokens=req.max_tokens,
            session_store=DEFAULT_SESSION_STORE,
        )
        return _sanitize_secrets(res, secrets)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
