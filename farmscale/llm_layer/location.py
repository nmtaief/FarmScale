"""LocationProvider interface, ManualLocationProvider, and WebhookLocationProvider stub."""

from __future__ import annotations

from typing import Any, Protocol, runtime_checkable

from crop_layer.loader import resolve_location_from_gazetteer


@runtime_checkable
class LocationProvider(Protocol):
    """Resolves user or webhook location inputs to {district, upazila, latitude, longitude, source}."""

    def resolve(self, raw_location: dict[str, Any]) -> dict[str, Any] | None:
        ...


class ManualLocationProvider:
    """Resolves dropdowns, lat/lon coordinates, or LLM-extracted place names via the gazetteer."""

    def resolve(self, raw_location: dict[str, Any]) -> dict[str, Any] | None:
        if not raw_location:
            return None
        resolved = resolve_location_from_gazetteer(
            district=raw_location.get("district"),
            upazila=raw_location.get("upazila"),
            latitude=raw_location.get("latitude"),
            longitude=raw_location.get("longitude"),
        )
        if not resolved:
            return None
        return {
            "district": resolved["district"],
            "upazila": resolved["upazila"],
            "latitude": resolved["latitude"],
            "longitude": resolved["longitude"],
            "aez": resolved.get("aez"),
            "source": raw_location.get("source", "manual_gazetteer"),
        }


class WebhookLocationProvider:
    """
    Stub provider backed by an in-memory store populated by POST /webhooks/location.
    """

    def __init__(self) -> None:
        self._latest_by_session: dict[str, dict[str, Any]] = {}
        self._manual = ManualLocationProvider()

    def record(self, session_key: str, payload: dict[str, Any]) -> dict[str, Any] | None:
        resolved = self._manual.resolve({**payload, "source": "webhook"})
        if resolved:
            self._latest_by_session[session_key] = resolved
        return resolved

    def resolve(self, raw_location: dict[str, Any]) -> dict[str, Any] | None:
        session_key = raw_location.get("session_id") or raw_location.get("user_id")
        if session_key and session_key in self._latest_by_session:
            return self._latest_by_session[session_key]
        return self._manual.resolve(raw_location)
