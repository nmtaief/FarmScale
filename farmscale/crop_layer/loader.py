"""Layer 2 crop data loader and summarizer."""

from __future__ import annotations

import json
import math
from functools import lru_cache
from pathlib import Path
from typing import Any

DATA_DIR = Path(__file__).resolve().parent / "data"

SEASONS = ("Rabi", "Kharif-I", "Kharif-II")


def _load_json(filename: str) -> dict[str, Any]:
    path = DATA_DIR / filename
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


@lru_cache(maxsize=1)
def _crops_index() -> tuple[dict[str, Any], dict[str, dict[str, Any]]]:
    raw = _load_json("crops.json")
    by_id = {c["id"]: c for c in raw.get("crops", [])}
    return raw.get("metadata", {}), by_id


@lru_cache(maxsize=1)
def _crop_id_map() -> dict[str, str]:
    raw = _load_json("crop_id_map.json")
    return {k.lower(): v for k, v in raw.get("ml_to_canonical", {}).items()}


@lru_cache(maxsize=1)
def get_gazetteer() -> dict[str, Any]:
    """Return the full Rajshahi Division gazetteer."""
    return _load_json("gazetteer.json")


@lru_cache(maxsize=1)
def _local_crops_data() -> dict[str, Any]:
    return _load_json("local_crops.json")


def canonical_crop_id(crop_id: str) -> str:
    """Resolve an external/ML crop ID to canonical crops.json ID."""
    key = crop_id.strip().lower().replace(" ", "_")
    return _crop_id_map().get(key, key)


def get_crop(crop_id: str) -> dict[str, Any] | None:
    """Return a full crop profile by canonical or mapped ID, or None if not found."""
    _, by_id = _crops_index()
    cid = canonical_crop_id(crop_id)
    return by_id.get(cid)


def list_all_crops() -> list[dict[str, Any]]:
    """Return all crop profiles."""
    _, by_id = _crops_index()
    return list(by_id.values())


def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    r = 6371.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp = math.radians(lat2 - lat1)
    dl = math.radians(lon2 - lon1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


def resolve_location_from_gazetteer(
    district: str | None = None,
    upazila: str | None = None,
    latitude: float | None = None,
    longitude: float | None = None,
) -> dict[str, Any] | None:
    """Resolve district/upazila or lat/lon against the Rajshahi Division gazetteer."""
    gaz = get_gazetteer()
    districts = gaz.get("districts", [])

    if district or upazila:
        d_norm = (district or "").strip().lower()
        u_norm = (upazila or "").strip().lower()
        for d in districts:
            d_match = not d_norm or d["district"].lower() == d_norm or d.get("district_bn") == district
            if not d_match:
                continue
            for u in d["upazilas"]:
                if u_norm and (u["upazila"].lower() == u_norm or u.get("upazila_bn") == upazila):
                    return {
                        "division": "Rajshahi",
                        "district": d["district"],
                        "district_bn": d.get("district_bn"),
                        "upazila": u["upazila"],
                        "upazila_bn": u.get("upazila_bn"),
                        "latitude": u["latitude"],
                        "longitude": u["longitude"],
                        "aez": u.get("aez"),
                    }
        # District-only fallback: pick first upazila centroid as district representative
        if d_norm and not u_norm:
            for d in districts:
                if d["district"].lower() == d_norm or d.get("district_bn") == district:
                    first = d["upazilas"][0]
                    return {
                        "division": "Rajshahi",
                        "district": d["district"],
                        "district_bn": d.get("district_bn"),
                        "upazila": first["upazila"],
                        "upazila_bn": first.get("upazila_bn"),
                        "latitude": first["latitude"],
                        "longitude": first["longitude"],
                        "aez": first.get("aez"),
                    }

    if latitude is not None and longitude is not None:
        best: dict[str, Any] | None = None
        best_dist = float("inf")
        for d in districts:
            for u in d["upazilas"]:
                dist = _haversine_km(latitude, longitude, u["latitude"], u["longitude"])
                if dist < best_dist:
                    best_dist = dist
                    best = {
                        "division": "Rajshahi",
                        "district": d["district"],
                        "district_bn": d.get("district_bn"),
                        "upazila": u["upazila"],
                        "upazila_bn": u.get("upazila_bn"),
                        "latitude": latitude,
                        "longitude": longitude,
                        "aez": u.get("aez"),
                        "nearest_upazila_km": round(best_dist, 2),
                    }
        return best

    return None


def _normalize_season(season: str | None) -> str | None:
    if not season:
        return None
    s = season.strip().lower()
    if s in ("annual", "all", "year"):
        return None
    if "rabi" in s or "winter" in s:
        return "Rabi"
    if "kharif-i" in s or "kharif_1" in s or "kharif-1" in s or "summer" in s:
        return "Kharif-I"
    if "kharif-ii" in s or "kharif_2" in s or "kharif-2" in s or "monsoon" in s:
        return "Kharif-II"
    return season


def get_local_core_crops(
    location: dict[str, Any],
    season: str | None = None,
) -> dict[str, Any]:
    """
    Return local core crops for a location (dict with district, upazila, optional lat/lon, aez)
    and optional season ('Rabi', 'Kharif-I', 'Kharif-II', or 'annual'/None for all).
    """
    resolved = resolve_location_from_gazetteer(
        district=location.get("district"),
        upazila=location.get("upazila"),
        latitude=location.get("latitude"),
        longitude=location.get("longitude"),
    )
    if not resolved:
        raise ValueError(f"Could not resolve location in Rajshahi Division: {location}")

    local_data = _local_crops_data()
    key = f"{resolved['district']}:{resolved['upazila']}"
    record = local_data.get("upazila_overrides", {}).get(key)
    if record is None:
        aez = resolved.get("aez") or "High Barind Tract"
        record = local_data.get("aez_defaults", {}).get(aez)
    if record is None:
        raise ValueError(f"No local crop record found for {key} (AEZ: {resolved.get('aez')})")

    norm_season = _normalize_season(season)
    target_seasons = [norm_season] if norm_season in SEASONS else list(SEASONS)

    crops_by_season: dict[str, list[dict[str, Any]]] = {}
    for s in target_seasons:
        crop_ids = record.get(s, [])
        enriched: list[dict[str, Any]] = []
        for cid in crop_ids:
            prof = get_crop(cid)
            if prof:
                enriched.append(prof)
        crops_by_season[s] = enriched

    return {
        "location": resolved,
        "season_filter": norm_season or "annual",
        "aez": resolved.get("aez"),
        "notes": record.get("notes", ""),
        "crops_by_season": crops_by_season,
        "provenance": {
            "source": record.get("source", "draft"),
            "updated_at": record.get("updated_at", "2026-11-12"),
            "confidence": record.get("confidence", "low"),
            "units": record.get("units", "season_crop_list"),
        },
    }


def summarize_for_ml(
    location: dict[str, Any],
    season: str | None = None,
) -> dict[str, Any]:
    """
    Build a compact summary of local core crops for passing as optional `candidate_crops`
    to MLClient.rank and for grounding Layer 1 explanations.
    """
    local = get_local_core_crops(location, season=season)
    seen: dict[str, dict[str, Any]] = {}
    seasons_map: dict[str, list[str]] = {}

    for s, profiles in local["crops_by_season"].items():
        seasons_map[s] = [p["id"] for p in profiles]
        for p in profiles:
            if p["id"] not in seen:
                seen[p["id"]] = {
                    "id": p["id"],
                    "name_en": p["name_en"],
                    "name_bn": p["name_bn"],
                    "category": p["category"],
                    "duration_days": p["stage_lengths"]["total_days"],
                    "typical_yield_t_ha": p["typical_yield"],
                    "n_fixation_share": p["nitrogen_fixation_share"],
                    "drought_sensitivity": p["drought_sensitivity"],
                    "source": p["source"],
                    "confidence": p["confidence"],
                }

    return {
        "district": local["location"]["district"],
        "upazila": local["location"]["upazila"],
        "aez": local["aez"],
        "season": local["season_filter"],
        "seasons": seasons_map,
        "candidate_crop_ids": list(seen.keys()),
        "crops": list(seen.values()),
        "provenance": local["provenance"],
    }


def refresh() -> dict[str, Any]:
    """
    Stub for the future scheduled job that refreshes crop profiles and local crop lists
    from Bangladesh agriculture extension (DAE / BARI / BARC) and statistics (BBS) sources.
    """
    return {
        "status": "not_implemented",
        "message": "refresh() is a stub. Public source sync will be added after extension verification.",
    }
