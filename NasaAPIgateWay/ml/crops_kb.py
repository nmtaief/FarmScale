"""Layer 2: Crop Knowledge Base (FAO-56, EcoCrop, and Bangladesh Agronomic Data).

Provides validated crop profiles, nutrient dynamics, water coefficients,
temperature envelopes, pH tolerances, and soil impact indicators.
"""
import json
from pathlib import Path
from typing import Dict, List, Optional, Any

_HERE = Path(__file__).parent
_CANDIDATES = [
    _HERE / "data" / "crops.json",
    _HERE / "crops.json",
    _HERE.parent.parent / "Crop Data API" / "crops.json",
]

_KB_PATH = next((p for p in _CANDIDATES if p.exists()), None)
if _KB_PATH is None:
    raise FileNotFoundError("crops.json not found in ml/data or Crop Data API.")

with open(_KB_PATH, "r", encoding="utf-8") as f:
    _RAW_KB = json.load(f)

CROPS: Dict[str, Dict[str, Any]] = {c["id"]: c for c in _RAW_KB["crops"]}

CATEGORY_ENCODING = {
    "cereal": 1,
    "legume": 2,
    "oilseed": 3,
    "root_tuber": 4,
    "vegetable": 5,
    "fibre": 6,
    "sugar": 7,
    "fruit": 8,
}

DROUGHT_ENCODING = {"low": 1, "medium": 2, "high": 3}
EROSION_ENCODING = {"low": 1, "medium": 2, "high": 3}
OM_ENCODING = {"negative": -1, "neutral": 0, "positive": 1}


def get_crop(crop_id: str) -> Optional[Dict[str, Any]]:
    """Retrieve full crop dictionary by identifier."""
    return CROPS.get(crop_id.lower().strip())


def list_crops(category: Optional[str] = None) -> List[Dict[str, Any]]:
    """List all available crops, optionally filtered by category."""
    if category:
        return [c for c in CROPS.values() if c.get("cat") == category]
    return list(CROPS.values())


def get_crop_vector(crop_id: str) -> Dict[str, float]:
    """Convert crop agronomic attributes into numerical feature vector for XGBoost."""
    c = get_crop(crop_id)
    if not c:
        raise ValueError(f"Crop '{crop_id}' not found in knowledge base.")

    cycle_days = sum(c["cycle"])
    kc_init, kc_mid, kc_end = c["kc"]
    t_abs_min, t_opt_min, t_opt_max, t_abs_max = c["temp"]
    ph_abs_min, ph_opt_min, ph_opt_max, ph_abs_max = c["ph"]
    n_up, p_up, k_up = c["uptake"]

    return {
        "crop_cycle_days": float(cycle_days),
        "crop_kc_mid": float(kc_mid),
        "crop_kc_init": float(kc_init),
        "crop_kc_end": float(kc_end),
        "crop_temp_opt_min": float(t_opt_min),
        "crop_temp_opt_max": float(t_opt_max),
        "crop_ph_opt_min": float(ph_opt_min),
        "crop_ph_opt_max": float(ph_opt_max),
        "crop_yield_t_ha": float(c["yield"]),
        "crop_n_uptake_kg_t": float(n_up),
        "crop_p_uptake_kg_t": float(p_up),
        "crop_k_uptake_kg_t": float(k_up),
        "crop_n_fixation_fraction": float(c.get("fix", 0.0)),
        "crop_drought_code": float(DROUGHT_ENCODING.get(c.get("drought", "medium"), 2)),
        "crop_erosion_code": float(EROSION_ENCODING.get(c.get("erosion", "medium"), 2)),
        "crop_om_code": float(OM_ENCODING.get(c.get("om", "neutral"), 0)),
        "crop_cat_code": float(CATEGORY_ENCODING.get(c.get("cat", "cereal"), 1)),
    }
