"""Mock MLClient for development, testing, and demo mode."""

from __future__ import annotations

import copy
import json
from pathlib import Path
from typing import Any

from crop_layer.loader import get_crop, get_local_core_crops

FIXTURES_DIR = Path(__file__).resolve().parent / "fixtures"


class MockMLClient:
    """
    Deterministic mock MLClient.
    Returns curated fixtures for the two golden cases and builds schema-valid
    deterministic payloads from Layer 2 crop data for any other input.
    """

    def __init__(self) -> None:
        self._godagari_fixture = self._load_fixture("godagari_cash_crop_en.json")
        self._niamatpur_fixture = self._load_fixture("niamatpur_soil_fertility_bn.json")

    @staticmethod
    def _load_fixture(name: str) -> dict[str, Any]:
        with (FIXTURES_DIR / name).open("r", encoding="utf-8") as f:
            return json.load(f)

    def health(self) -> dict[str, Any]:
        return {
            "status": "ok",
            "mode": "mock",
            "model_type": "MOCK",
            "version": "mock-0.1.0",
        }

    def rank(self, request: dict[str, Any]) -> dict[str, Any]:
        district = str(request.get("district", "")).strip()
        upazila = str(request.get("upazila", "")).strip()
        goal = str(request.get("goal", "cash_crop")).strip()
        language = str(request.get("language", "en")).strip().lower()
        top_k = int(request.get("top_k", 3))

        if (
            district.lower() == "rajshahi"
            and upazila.lower() == "godagari"
            and goal == "cash_crop"
            and language == "en"
        ):
            payload = copy.deepcopy(self._godagari_fixture)
            payload["ranked_rotations"] = payload["ranked_rotations"][:top_k]
            return payload

        if (
            district.lower() == "naogaon"
            and upazila.lower() == "niamatpur"
            and goal == "soil_fertility"
            and language == "bn"
        ):
            payload = copy.deepcopy(self._niamatpur_fixture)
            payload["ranked_rotations"] = payload["ranked_rotations"][:top_k]
            return payload

        return self._build_deterministic(request, top_k=top_k)

    def _build_deterministic(self, request: dict[str, Any], top_k: int) -> dict[str, Any]:
        district = str(request.get("district", "Rajshahi"))
        upazila = str(request.get("upazila", "Godagari"))
        lat = float(request.get("latitude", 24.466))
        lon = float(request.get("longitude", 88.330))
        goal = str(request.get("goal", "cash_crop"))
        season = str(request.get("season", "annual"))
        language = str(request.get("language", "en"))

        try:
            local = get_local_core_crops({"district": district, "upazila": upazila, "latitude": lat, "longitude": lon})
            by_season = local["crops_by_season"]
            aez = local["aez"] or "Rajshahi Division"
        except Exception:
            by_season = {
                "Kharif-II": [get_crop("aman_rice")],
                "Rabi": [get_crop("mustard"), get_crop("lentil"), get_crop("potato")],
                "Kharif-I": [get_crop("mungbean"), get_crop("aus_rice"), get_crop("maize")],
            }
            aez = "Rajshahi Division"

        k2_list = [c for c in by_season.get("Kharif-II", []) if c] or [get_crop("aman_rice")]
        rabi_list = [c for c in by_season.get("Rabi", []) if c] or [get_crop("mustard")]
        k1_list = [c for c in by_season.get("Kharif-I", []) if c] or [get_crop("mungbean")]

        # Build candidate 3-crop rotations deterministically
        candidates: list[tuple[dict[str, Any], dict[str, Any], dict[str, Any]]] = []
        k2_crop = k2_list[0]
        for r_crop in rabi_list[:3]:
            for k1_crop in k1_list[:2]:
                if r_crop and k1_crop and k2_crop:
                    candidates.append((k2_crop, r_crop, k1_crop))

        if not candidates:
            candidates = [(get_crop("aman_rice"), get_crop("mustard"), get_crop("mungbean"))]  # type: ignore[list-item]

        scored: list[tuple[float, dict[str, Any]]] = []
        for idx, (c_k2, c_rabi, c_k1) in enumerate(candidates):
            crops_seq = [c_k2, c_rabi, c_k1]
            total_days = sum(c["stage_lengths"]["total_days"] for c in crops_seq)
            total_yield = round(sum(c["typical_yield"] for c in crops_seq), 2)
            # Estimate simple net N balance: fixation credit minus uptake
            n_fix = sum(c["typical_yield"] * c["nutrient_uptake_per_tonne"]["N"] * c["nitrogen_fixation_share"] for c in crops_seq)
            n_upt = sum(c["typical_yield"] * c["nutrient_uptake_per_tonne"]["N"] * (1.0 - c["nitrogen_fixation_share"]) for c in crops_seq)
            net_n = round(n_fix - n_upt * 0.35, 1)

            legume_count = sum(1 for c in crops_seq if c["nitrogen_fixation_share"] > 0)
            soil_cover = round(min(0.95, 0.65 + 0.1 * legume_count), 2)
            drought_res = round(
                sum(0.9 if c["drought_sensitivity"] in ("low", "very_low") else 0.7 if c["drought_sensitivity"] == "medium" else 0.5 for c in crops_seq) / 3.0,
                2,
            )
            diversity = round(min(0.95, 0.70 + 0.08 * len({c["category"] for c in crops_seq})), 2)

            if goal == "cash_crop":
                cash_bonus = sum(0.15 if c["category"] in ("vegetable", "cash_crop", "spice", "oilseed") else 0.0 for c in crops_seq)
                raw_score = min(0.96, 0.72 + cash_bonus + total_yield * 0.002 - idx * 0.01)
            elif goal == "soil_fertility":
                raw_score = min(0.96, 0.70 + legume_count * 0.10 + max(0.0, net_n) * 0.001 - idx * 0.01)
            elif goal == "land_preservation":
                raw_score = min(0.96, 0.65 + soil_cover * 0.25 + drought_res * 0.05 - idx * 0.01)
            else:  # cultivability
                raw_score = min(0.96, 0.70 + drought_res * 0.20 + diversity * 0.05 - idx * 0.01)

            score = round(raw_score, 2)
            rot_entry = {
                "id": f"rot_mock_{idx + 1}",
                "name": " -> ".join(c["name_en"] for c in crops_seq),
                "bengali_name": " -> ".join(c["name_bn"] for c in crops_seq),
                "pattern": [c["id"] for c in crops_seq],
                "seasons": ["Kharif-II", "Rabi", "Kharif-I"],
                "score": score,
                "ml_score": score,
                "rank": 1,  # updated after sorting
                "primary_fit": f"Deterministic mock fit for {goal} in {aez}",
                "suitable_zones": [aez],
                "metrics": {
                    "total_duration_days": total_days,
                    "total_yield_t_ha": total_yield,
                    "net_n_balance_kg_ha": net_n,
                    "soil_cover_score": soil_cover,
                    "drought_resilience": drought_res,
                    "diversity_score": diversity,
                },
                "environmental_factors": {
                    "thermal_comfort_pct": 85.0,
                    "ph_suitability_pct": 87.0,
                    "water_adequacy_pct": 78.0,
                    "stress_vulnerability": "low_to_moderate",
                },
            }
            scored.append((score, rot_entry))

        scored.sort(key=lambda x: x[0], reverse=True)
        top_rotations = []
        for rank_idx, (_, rot) in enumerate(scored[:top_k], start=1):
            rot["rank"] = rank_idx
            top_rotations.append(rot)

        return {
            "status": "success",
            "tool_name": "farmscale_rank_rotations",
            "arguments_used": {
                "district": district,
                "upazila": upazila,
                "latitude": lat,
                "longitude": lon,
                "goal": goal,
                "season": season,
                "language": language,
                "top_k": top_k,
            },
            "query_analysis": {
                "aez": aez,
                "goal": goal,
            },
            "telemetry_used": {
                "nasa_power_weather": {
                    "temp_mean_c": 25.5,
                    "precip_mm": 4.2,
                    "rootzone_wetness": 0.58,
                },
                "smap_soil_moisture": {
                    "sm_rootzone_m3_m3": 0.25,
                    "sm_rootzone_pctl": 46.0,
                },
                "modis_vegetation": {
                    "ndvi": 0.55,
                    "ndvi_vci": 62.0,
                },
                "soilgrids_soil": {
                    "ph": 6.3,
                    "soc_g_kg": 9.8,
                    "n_g_kg": 0.96,
                    "sand": 26.0,
                    "silt": 46.0,
                    "clay": 28.0,
                    "texture_group": "clay_loam",
                },
            },
            "ml_metadata": {
                "version": "mock-0.1.0",
                "model_type": "MOCK",
                "telemetry_date": "2026-10-31",
                "data_status": "ready",
            },
            "ranked_rotations": top_rotations,
            "plain_language_answer": "Mock templated answer (ignore in favor of metrics).",
            "llm_prompt_context": f"Mock context for {upazila}, {district}.",
            "instruction_for_llm": "Present options in exact rank order using verified metrics.",
        }
