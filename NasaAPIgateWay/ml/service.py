"""Integrated Orchestration Service: Connects Layer 1 (LLM/NLU),
Layer 2 (Crop Data), and Layer 3 (XGBoost ML) with real NASA Open Data Sources.
"""
import os
import json
import time
import sqlite3
import re
from pathlib import Path
from typing import Dict, List, Any, Optional

from .crops_kb import CROPS, get_crop
from .rotations import ROTATION_TEMPLATES, calculate_rotation_metrics
from .feature_pipeline import (
    extract_location_features,
    get_district_soil,
    assemble_feature_vector,
)
from .dataset_builder import build_training_dataset, compute_ground_truth_score
from .xgboost_model import get_ml_model, LiveUpdatableXGBoost
from .layer1_llm import understand_request, write_answer

def _get_db_path() -> Path:
    candidates = [
        Path(__file__).resolve().parent.parent / "data" / "engine.db",
        Path(__file__).resolve().parents[3] / "engine.db",
        Path(__file__).resolve().parents[2] / "engine.db",
        Path(__file__).resolve().parent / "data" / "engine.db",
    ]
    for p in candidates:
        if p.exists():
            return p
    return candidates[0]

_DB_PATH = _get_db_path()

DISTRICT_MODIS_VEGETATION = {
    "rajshahi": {"ndvi": 0.444, "evi": 0.310, "ndvi_vci": 62.0},
    "chapainawabganj": {"ndvi": 0.455, "evi": 0.320, "ndvi_vci": 63.5},
    "naogaon": {"ndvi": 0.563, "evi": 0.380, "ndvi_vci": 71.0},
    "natore": {"ndvi": 0.466, "evi": 0.325, "ndvi_vci": 64.0},
    "bogura": {"ndvi": 0.420, "evi": 0.295, "ndvi_vci": 59.0},
    "bogra": {"ndvi": 0.420, "evi": 0.295, "ndvi_vci": 59.0},
    "pabna": {"ndvi": 0.362, "evi": 0.260, "ndvi_vci": 52.0},
    "joypurhat": {"ndvi": 0.485, "evi": 0.335, "ndvi_vci": 66.0},
    "sirajganj": {"ndvi": 0.430, "evi": 0.305, "ndvi_vci": 60.0},
}


def fetch_real_nasa_telemetry(
    district: str,
    upazila: Optional[str] = None,
    season: Optional[str] = "annual"
) -> Dict[str, Any]:
    """Query 10-year monthly historical real NASA climate records from engine.db."""
    climate = {}
    if _DB_PATH.exists():
        month_filter = ""
        s_clean = str(season or "annual").lower()
        if any(w in s_clean for w in ("rabi", "winter", "রবি", "শীত")):
            month_filter = "AND month IN (11, 12, 1, 2)"
        elif any(w in s_clean for w in ("kharif_1", "kharif 1", "summer", "গ্রীষ্ম")):
            month_filter = "AND month IN (3, 4, 5)"
        elif any(w in s_clean for w in ("kharif_2", "kharif 2", "monsoon", "বর্ষা", "আমন")):
            month_filter = "AND month IN (6, 7, 8, 9, 10)"

        try:
            conn = sqlite3.connect(str(_DB_PATH))
            c = conn.cursor()
            row = None
            if upazila:
                u_clean = re.sub(r"[^a-z]", "", upazila.lower())
                q = (
                    "SELECT AVG(temp_mean_c), AVG(temp_max_c), AVG(temp_min_c), "
                    "AVG(precip_mm), AVG(rootzone_wetness), AVG(topsoil_wetness), "
                    "AVG(water_stress_score) "
                    "FROM rajshahi_10years_monthly "
                    "WHERE (LOWER(REPLACE(area_name, ' ', '')) LIKE ? OR LOWER(REPLACE(area_name, ' ', '')) LIKE ?) "
                    + month_filter
                )
                c.execute(q, (f"%{u_clean}%", f"{u_clean}%"))
                res = c.fetchone()
                if res and res[0] is not None:
                    row = res

            if not row and district:
                d_clean = re.sub(r"[^a-z]", "", district.lower())
                q = (
                    "SELECT AVG(temp_mean_c), AVG(temp_max_c), AVG(temp_min_c), "
                    "AVG(precip_mm), AVG(rootzone_wetness), AVG(topsoil_wetness), "
                    "AVG(water_stress_score) "
                    "FROM rajshahi_10years_monthly "
                    "WHERE LOWER(REPLACE(district, ' ', '')) LIKE ? "
                    + month_filter
                )
                c.execute(q, (f"%{d_clean}%",))
                res = c.fetchone()
                if res and res[0] is not None:
                    row = res

            conn.close()

            if row and row[0] is not None:
                climate = {
                    "temp_mean_c": round(float(row[0]), 2),
                    "temp_max_c": round(float(row[1]), 2),
                    "temp_min_c": round(float(row[2]), 2),
                    "precip_mm": round(float(row[3]), 2),
                    "rootzone_wetness": round(float(row[4]), 3),
                    "topsoil_wetness": round(float(row[5]), 3),
                    "water_stress_score": round(float(row[6]), 1),
                }
        except Exception as e:
            print(f"[service.py] Warning: could not query engine.db: {e}")

    t_mean = climate.get("temp_mean_c", 25.6)
    t_max = climate.get("temp_max_c", t_mean + 8.0)
    t_min = climate.get("temp_min_c", t_mean - 7.5)
    precip = climate.get("precip_mm", 4.8)
    rz_wet = climate.get("rootzone_wetness", 0.67)
    top_wet = climate.get("topsoil_wetness", 0.66)
    stress = climate.get("water_stress_score", 32.0)

    sm_vol = round(rz_wet * 0.40, 3)
    sm_pctl = round(max(5.0, min(95.0, 100.0 - stress)), 1)

    d_clean = district.lower().strip()
    veg = DISTRICT_MODIS_VEGETATION.get(d_clean, {"ndvi": 0.48, "evi": 0.32, "ndvi_vci": 60.0})

    return {
        "temp_mean_c": t_mean,
        "temp_max_c": t_max,
        "temp_min_c": t_min,
        "precip_mm": precip,
        "rootzone_wetness": rz_wet,
        "topsoil_wetness": top_wet,
        "water_stress_score": stress,
        "sm_rootzone": sm_vol,
        "sm_rootzone_pctl": sm_pctl,
        "ndvi": veg["ndvi"],
        "evi": veg["evi"],
        "ndvi_vci": veg["ndvi_vci"],
    }


class CropRotationMLService:
    """End-to-End Orchestrator for NASA Crop Rotation Recommendation & Live Updating."""

    def __init__(self):
        self.ml_model: LiveUpdatableXGBoost = get_ml_model()

    def ensure_model_trained(self, max_climate_rows: int = 10000) -> Dict[str, Any]:
        """Ensure an active model exists on disk or train the baseline immediately."""
        if self.ml_model.booster is None:
            print("[CropRotationMLService] Initializing and training XGBoost model on real NASA data...")
            X, y = build_training_dataset(max_climate_rows=max_climate_rows)
            status = self.ml_model.train(X, y, n_estimators=250, version_tag="v1.0.0")
            print(f"[CropRotationMLService] Training complete! Version: {status['version']}, R2: {status['metrics'].get('r2')}")
            return status
        return self.ml_model.get_status()

    def recommend(
        self,
        query: Optional[str] = None,
        district: Optional[str] = None,
        upazila: Optional[str] = None,
        lat: Optional[float] = None,
        lon: Optional[float] = None,
        goal: Optional[str] = None,
        season: Optional[str] = None,
        language: Optional[str] = None,
        env_override: Optional[Dict[str, Any]] = None,
        top_k: int = 3
    ) -> Dict[str, Any]:
        """Execute the full 3-layer architecture pipeline from architecture.mermaid."""
        self.ensure_model_trained()

        # Step 1: Layer 1 - Understand request & classify goal
        if query:
            req_info = understand_request(query, default_lat=lat or 24.3745, default_lon=lon or 88.6042)
            if district:
                req_info["location"]["district"] = district
            if upazila:
                req_info["location"]["upazila"] = upazila
            if goal:
                req_info["goal"] = goal
            if season:
                req_info["season"] = season
            if language:
                req_info["language"] = language
        else:
            req_info = {
                "raw_text": "",
                "language": language or "en",
                "location": {
                    "district": district or "Rajshahi",
                    "upazila": upazila,
                    "latitude": lat or 24.3745,
                    "longitude": lon or 88.6042,
                },
                "goal": goal or "cash_crop",
                "goal_confidence": 0.95,
                "season": season or "annual",
            }

        target_district = req_info["location"]["district"]
        target_goal = req_info["goal"]

        # Step 2: Open Data Sources - Gather Real NASA & SoilGrids features
        loc_soil = get_district_soil(target_district)
        if env_override:
            env_data = env_override
        else:
            real_telemetry = fetch_real_nasa_telemetry(
                district=target_district,
                upazila=req_info["location"].get("upazila"),
                season=req_info.get("season", "annual"),
            )
            env_data = {**real_telemetry, "soil": loc_soil}

        # Step 3: Layer 3 - XGBoost Score and Rank Rotations
        ranked = self.ml_model.rank_rotations(
            env_data=env_data,
            goal=target_goal,
            district=target_district,
            top_k=top_k
        )

        # Step 4: Layer 1 - Write Plain-Language Answer
        answer = write_answer(
            ranked_rotations=ranked,
            req_info=req_info,
            env_summary={
                "soil_ph": env_data.get("soil", {}).get("ph", loc_soil["ph"]),
                "rootzone_wetness": env_data.get("rootzone_wetness", 0.68),
                "water_stress_score": env_data.get("water_stress_score", 22.0),
            },
            language=req_info["language"]
        )

        return {
            "query_analysis": req_info,
            "data_sources_used": {
                "nasa_power_weather": {
                    "temp_mean_c": env_data["temp_mean_c"],
                    "precip_mm": env_data["precip_mm"],
                    "rootzone_wetness": env_data["rootzone_wetness"],
                },
                "smap_soil_moisture": {
                    "sm_rootzone_m3_m3": env_data["sm_rootzone"],
                    "sm_rootzone_pctl": env_data["sm_rootzone_pctl"],
                },
                "modis_vegetation": {
                    "ndvi": env_data["ndvi"],
                    "ndvi_vci": env_data["ndvi_vci"],
                },
                "soilgrids_soil": loc_soil,
            },
            "ml_model_metadata": {
                "version": self.ml_model.version,
                "model_type": "XGBoost Regressor (Layer 3)",
                "r2_score": self.ml_model.metrics.get("r2"),
                "total_samples": self.ml_model.total_samples,
            },
            "top_rotations": ranked,
            "plain_language_answer": answer,
        }

    def live_update(
        self,
        new_samples: Optional[List[Dict[str, Any]]] = None,
        additional_trees: int = 25
    ) -> Dict[str, Any]:
        """Perform live incremental update of the XGBoost model."""
        self.ensure_model_trained()

        # If custom rows not passed, sample a fresh batch from NASA upazila data
        import pandas as pd
        if not new_samples:
            X_new, y_new = build_training_dataset(max_climate_rows=1200, random_seed=int(time.time()))
        else:
            X_new = pd.DataFrame(new_samples)
            y_new = X_new.pop("suitability_score")

        return self.ml_model.live_update(X_new, y_new, additional_trees=additional_trees)

    def full_retrain(self, max_climate_rows: int = 15000) -> Dict[str, Any]:
        """Execute a full retrain across all NASA records."""
        X, y = build_training_dataset(max_climate_rows=max_climate_rows)
        return self.ml_model.train(X, y, n_estimators=300, version_tag="v2.0.0")

    def status(self) -> Dict[str, Any]:
        """Get live status, version, and performance metrics."""
        self.ensure_model_trained()
        return self.ml_model.get_status()


# Global service instance
_SERVICE = None


def get_service() -> CropRotationMLService:
    global _SERVICE
    if _SERVICE is None:
        _SERVICE = CropRotationMLService()
    return _SERVICE
