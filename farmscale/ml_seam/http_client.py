"""HTTP MLClient implementation with explicit request/response mapping hooks."""

from __future__ import annotations

from typing import Any

import httpx


def map_request_to_http(request: dict[str, Any]) -> dict[str, Any]:
    """
    Map the canonical FarmScale ML request into the remote HTTP ML service payload.
    TODO(integration): adjust field names here if the remote ML HTTP API differs.
    """
    payload = {
        "district": request["district"],
        "upazila": request["upazila"],
        "latitude": request["latitude"],
        "longitude": request["longitude"],
        "goal": request["goal"],
        "season": request.get("season", "annual"),
        "language": request.get("language", "en"),
        "top_k": request.get("top_k", 3),
    }
    if "candidate_crops" in request and request["candidate_crops"] is not None:
        payload["candidate_crops"] = request["candidate_crops"]
    return payload


def map_response_from_http(raw: dict[str, Any]) -> dict[str, Any]:
    """
    Map the remote HTTP ML response into the canonical FarmScale ML contract.
    TODO(integration): normalize any mismatched field names here before returning.
    """
    return raw


class HttpMLClient:
    """Calls a remote Layer 3 XGBoost ML service over HTTP."""

    def __init__(self, base_url: str = "http://localhost:8001", timeout: float = 15.0) -> None:
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout

    def rank(self, request: dict[str, Any]) -> dict[str, Any]:
        body = map_request_to_http(request)
        with httpx.Client(timeout=self.timeout) as client:
            resp = client.post(f"{self.base_url}/rank", json=body)
            resp.raise_for_status()
            return map_response_from_http(resp.json())

    def health(self) -> dict[str, Any]:
        try:
            with httpx.Client(timeout=min(self.timeout, 5.0)) as client:
                resp = client.get(f"{self.base_url}/health")
                resp.raise_for_status()
                data = resp.json()
                return {
                    "status": "ok",
                    "mode": "http",
                    "url": self.base_url,
                    "remote": data,
                }
        except Exception as exc:
            return {
                "status": "unavailable",
                "mode": "http",
                "url": self.base_url,
                "error": str(exc),
            }
