"""Feature Pipeline: Translates NASA Open Data, SoilGrids, and Crop Knowledge Base
into numerical interaction matrices for the XGBoost ML model (Layer 3).
"""
import math
from typing import Dict, List, Any, Optional

GOAL_KEYS = ["cash_crop", "soil_fertility", "land_preservation", "cultivability"]

# District baseline soil profiles for Bangladesh agro-ecological zones (SRDI & SoilGrids)
DISTRICT_SOIL_DEFAULTS: Dict[str, Dict[str, float]] = {
    # Rajshahi Division (Primary focus)
    "Rajshahi": {"ph": 5.8, "soc_g_kg": 7.5, "n_g_kg": 0.85, "sand": 22.0, "silt": 48.0, "clay": 30.0, "texture_group": 3},  # High Barind
    "Bogura": {"ph": 6.5, "soc_g_kg": 11.0, "n_g_kg": 1.15, "sand": 18.0, "silt": 58.0, "clay": 24.0, "texture_group": 2},  # Floodplain
    "Bogra": {"ph": 6.5, "soc_g_kg": 11.0, "n_g_kg": 1.15, "sand": 18.0, "silt": 58.0, "clay": 24.0, "texture_group": 2},
    "Pabna": {"ph": 7.4, "soc_g_kg": 9.5, "n_g_kg": 0.95, "sand": 28.0, "silt": 48.0, "clay": 24.0, "texture_group": 2},   # Ganges Floodplain
    "Naogaon": {"ph": 5.7, "soc_g_kg": 8.0, "n_g_kg": 0.90, "sand": 19.0, "silt": 51.0, "clay": 30.0, "texture_group": 3}, # Barind & Atrai
    "Natore": {"ph": 6.8, "soc_g_kg": 13.5, "n_g_kg": 1.30, "sand": 12.0, "silt": 45.0, "clay": 43.0, "texture_group": 3},  # Chalan Beel
    "Joypurhat": {"ph": 5.6, "soc_g_kg": 8.5, "n_g_kg": 0.90, "sand": 20.0, "silt": 52.0, "clay": 28.0, "texture_group": 2},
    "Chapainawabganj": {"ph": 6.1, "soc_g_kg": 7.2, "n_g_kg": 0.80, "sand": 25.0, "silt": 48.0, "clay": 27.0, "texture_group": 2},
    "Nawabganj": {"ph": 6.1, "soc_g_kg": 7.2, "n_g_kg": 0.80, "sand": 25.0, "silt": 48.0, "clay": 27.0, "texture_group": 2},
    "Sirajganj": {"ph": 7.0, "soc_g_kg": 9.8, "n_g_kg": 1.05, "sand": 32.0, "silt": 48.0, "clay": 20.0, "texture_group": 2},
    # General Default for other Bangladesh districts
    "Default": {"ph": 6.4, "soc_g_kg": 9.0, "n_g_kg": 0.95, "sand": 24.0, "silt": 50.0, "clay": 26.0, "texture_group": 2},
}

FEATURE_COLUMNS = [
    # 1. Location Weather Features (NASA POWER)
    "temp_mean_c",
    "temp_max_c",
    "temp_min_c",
    "temp_range_c",
    "precip_mm",
    "rootzone_wetness",
    "topsoil_wetness",
    "water_stress_score",
    # 2. Location Soil Moisture (SMAP)
    "sm_rootzone",
    "sm_rootzone_pctl",
    # 3. Location Vegetation Indices (MODIS/VIIRS)
    "ndvi",
    "evi",
    "ndvi_vci",
    # 4. Location Soil Properties (SoilGrids)
    "soil_ph",
    "soil_soc_g_kg",
    "soil_n_g_kg",
    "soil_sand_pct",
    "soil_silt_pct",
    "soil_clay_pct",
    "soil_texture_group",
    # 5. Rotation Agronomic Properties (Layer 2)
    "rot_total_cycle_days",
    "rot_avg_kc",
    "rot_total_yield_t_ha",
    "rot_net_n_balance_kg_ha",
    "rot_diversity_score",
    "rot_om_balance",
    "rot_soil_cover_score",
    "rot_drought_resilience",
    "rot_has_legume",
    "rot_has_oilseed",
    "rot_has_cash_tuber_veg",
    # 6. Interaction & Agro-Ecological Features
    "thermal_comfort_ratio",
    "ph_suitability_score",
    "water_supply_adequacy",
    "texture_affinity_score",
    "moisture_stress_vulnerability",
    # 7. Goal Alignment Encoding
    "goal_cash_crop",
    "goal_soil_fertility",
    "goal_land_preservation",
    "goal_cultivability",
]


def get_district_soil(district_name: Optional[str]) -> Dict[str, float]:
    """Retrieve verified soil properties for a given district name or fallback."""
    if district_name:
        for k, v in DISTRICT_SOIL_DEFAULTS.items():
            if k.lower() in district_name.lower():
                return dict(v)
    return dict(DISTRICT_SOIL_DEFAULTS["Default"])


def trapezoid(v: float, a: float, b: float, c: float, d: float) -> float:
    """Fuzzy membership function for agronomic envelope matching."""
    if v <= a or v >= d:
        return 0.0
    if v < b:
        return (v - a) / (b - a) if b > a else 1.0
    if v <= c:
        return 1.0
    return (d - v) / (d - c) if d > c else 1.0


def extract_location_features(
    env_data: Dict[str, Any],
    district: Optional[str] = None
) -> Dict[str, float]:
    """Extract and standardize location features from NASA POWER, SMAP, MODIS, and SoilGrids."""
    soil_base = get_district_soil(district)
    soil_input = env_data.get("soil", {})

    temp_mean = float(env_data.get("temp_mean_c", env_data.get("T2M", 26.5)))
    temp_max = float(env_data.get("temp_max_c", env_data.get("T2M_MAX", temp_mean + 5.5)))
    temp_min = float(env_data.get("temp_min_c", env_data.get("T2M_MIN", temp_mean - 6.0)))
    precip = float(env_data.get("precip_mm", env_data.get("PRECTOTCORR", 4.5)))

    # NASA rootzone wetness (GWETROOT 0-1)
    rz_wetness = float(env_data.get("rootzone_wetness", env_data.get("GWETROOT", 0.65)))
    top_wetness = float(env_data.get("topsoil_wetness", env_data.get("GWETTOP", 0.60)))
    stress_score = float(env_data.get("water_stress_score", 25.0))

    # SMAP (volumetric 0-1 m3/m3)
    sm_rootzone = float(env_data.get("sm_rootzone", rz_wetness * 0.40))
    sm_pctl = float(env_data.get("sm_rootzone_pctl", 100.0 - stress_score))

    # MODIS (NDVI, EVI, VCI)
    ndvi = float(env_data.get("ndvi", 0.48))
    evi = float(env_data.get("evi", 0.32))
    ndvi_vci = float(env_data.get("ndvi_vci", 60.0))

    # SoilGrids
    ph = float(soil_input.get("ph", soil_base["ph"]))
    soc = float(soil_input.get("soc_g_kg", soil_base["soc_g_kg"]))
    n_soil = float(soil_input.get("n_g_kg", soil_base["n_g_kg"]))
    sand = float(soil_input.get("sand", soil_base["sand"]))
    silt = float(soil_input.get("silt", soil_base["silt"]))
    clay = float(soil_input.get("clay", soil_base["clay"]))
    tex_group = float(soil_input.get("texture_group", soil_base["texture_group"]))

    return {
        "temp_mean_c": temp_mean,
        "temp_max_c": temp_max,
        "temp_min_c": temp_min,
        "temp_range_c": temp_max - temp_min,
        "precip_mm": precip,
        "rootzone_wetness": rz_wetness,
        "topsoil_wetness": top_wetness,
        "water_stress_score": stress_score,
        "sm_rootzone": sm_rootzone,
        "sm_rootzone_pctl": sm_pctl,
        "ndvi": ndvi,
        "evi": evi,
        "ndvi_vci": ndvi_vci,
        "soil_ph": ph,
        "soil_soc_g_kg": soc,
        "soil_n_g_kg": n_soil,
        "soil_sand_pct": sand,
        "soil_silt_pct": silt,
        "soil_clay_pct": clay,
        "soil_texture_group": tex_group,
    }


def build_interaction_features(
    loc_feat: Dict[str, float],
    rot_metrics: Dict[str, float],
    goal: str
) -> Dict[str, float]:
    """Compute cross-domain agronomic interactions between environmental state, rotation traits, and goal."""
    temp = loc_feat["temp_mean_c"]
    ph = loc_feat["soil_ph"]
    precip = loc_feat["precip_mm"]
    wetness = loc_feat["rootzone_wetness"]
    stress = loc_feat["water_stress_score"]

    # 1. Thermal Comfort Ratio: optimal temperature range for tropical/subtropical cropping (18 - 32 C)
    thermal_comfort = trapezoid(temp, 10.0, 18.0, 30.0, 38.0)

    # 2. pH Suitability: optimal pH range (5.5 - 7.5)
    ph_suitability = trapezoid(ph, 4.5, 5.5, 7.5, 8.8) * 100.0

    # 3. Water Supply Adequacy: ratio between available moisture and rotation average Kc demand
    available_water_index = (precip * 3.0) + (wetness * 60.0)
    demand_index = rot_metrics.get("rot_avg_kc", 1.0) * 45.0
    water_adequacy = min(1.5, max(0.2, available_water_index / (demand_index + 1e-4))) * 66.6

    # 4. Texture Affinity: medium texture (2) is universally preferred; heavy (3) suits rice/wheat; light (1) suits tubers/melons
    tex = loc_feat["soil_texture_group"]
    has_tuber = rot_metrics.get("rot_has_cash_tuber_veg", 0.0)
    if tex == 2:  # medium
        texture_score = 95.0
    elif tex == 3 and has_tuber:  # heavy soil with tubers
        texture_score = 55.0
    elif tex == 1 and not has_tuber:  # light soil with flood crops
        texture_score = 65.0
    else:
        texture_score = 85.0

    # 5. Moisture Stress Vulnerability: higher water stress penalized if rotation lacks drought resilience
    drought_resilience = rot_metrics.get("rot_drought_resilience", 2.0)
    moisture_vulnerability = (stress / 100.0) * (4.0 - drought_resilience) * 25.0

    # 6. One-hot goal encoding
    clean_goal = goal.lower().strip()
    return {
        "thermal_comfort_ratio": float(thermal_comfort * 100.0),
        "ph_suitability_score": float(ph_suitability),
        "water_supply_adequacy": float(water_adequacy),
        "texture_affinity_score": float(texture_score),
        "moisture_stress_vulnerability": float(moisture_vulnerability),
        "goal_cash_crop": 1.0 if clean_goal == "cash_crop" else 0.0,
        "goal_soil_fertility": 1.0 if clean_goal == "soil_fertility" else 0.0,
        "goal_land_preservation": 1.0 if clean_goal in ("land_preservation", "land_protection") else 0.0,
        "goal_cultivability": 1.0 if clean_goal == "cultivability" else 0.0,
    }


def assemble_feature_vector(
    env_data: Dict[str, Any],
    rot_metrics: Dict[str, float],
    goal: str,
    district: Optional[str] = None
) -> Dict[str, float]:
    """Assemble the complete flattened feature vector for an XGBoost inference row."""
    loc_feat = extract_location_features(env_data, district)
    inter_feat = build_interaction_features(loc_feat, rot_metrics, goal)
    row = {**loc_feat, **rot_metrics, **inter_feat}
    return {col: float(row.get(col, 0.0)) for col in FEATURE_COLUMNS}
