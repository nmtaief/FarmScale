"""Layer 2: Crop Rotation Definitions and Synergy Analysis for Bangladesh / Rajshahi.

Defines proven annual crop rotation sequences across Rabi (Winter),
Kharif-I (Pre-Monsoon/Summer), and Kharif-II (Monsoon), and computes
agronomic rotation synergy metrics (N-balance, diversity, soil cover, duration).
"""
from typing import Dict, List, Any
from .crops_kb import get_crop, get_crop_vector

# Standard rotations tailored for Rajshahi Division & Bangladesh AEZs
ROTATION_TEMPLATES: List[Dict[str, Any]] = [
    {
        "id": "ROT_01_MUSTARD_RICE_RICE",
        "name": "Mustard -> Aus Rice -> T.Aman Rice",
        "bengali_name": "সরিষা -> আউশ ধান -> রোপা আমন",
        "pattern": ["mustard", "rice", "rice"],
        "seasons": ["Rabi (Winter)", "Kharif-I (Summer)", "Kharif-II (Monsoon)"],
        "description": "High value oilseed break crop followed by dual rice staples; taproot loosens Barind soil.",
        "primary_fit": "cash_crop",
        "suitable_zones": ["High Barind Tract", "Karatoa-Bangali Floodplain", "Ganges Floodplain"],
    },
    {
        "id": "ROT_02_POTATO_RICE_RICE",
        "name": "Potato -> Aus Rice -> T.Aman Rice",
        "bengali_name": "আলু -> আউশ ধান -> রোপা আমন",
        "pattern": ["potato", "rice", "rice"],
        "seasons": ["Rabi (Winter)", "Kharif-I (Summer)", "Kharif-II (Monsoon)"],
        "description": "Premier cash crop rotation popular in Bogura and Joypurhat; maximum financial output per hectare.",
        "primary_fit": "cash_crop",
        "suitable_zones": ["Karatoa-Bangali Floodplain", "Level Barind Tract"],
    },
    {
        "id": "ROT_03_LENTIL_RICE_RICE",
        "name": "Lentil -> Aus Rice -> T.Aman Rice",
        "bengali_name": "মসুর ডাল -> আউশ ধান -> রোপা আমন",
        "pattern": ["lentil", "rice", "rice"],
        "seasons": ["Rabi (Winter)", "Kharif-I (Summer)", "Kharif-II (Monsoon)"],
        "description": "Nitrogen-fixing pulse fixing 45-60 kg N/ha, replenishing soil fertility and cutting fertilizer costs.",
        "primary_fit": "soil_fertility",
        "suitable_zones": ["Ganges River Floodplain", "High Barind Tract"],
    },
    {
        "id": "ROT_04_CHICKPEA_FALLOW_RICE",
        "name": "Chickpea -> Fallow / Cover -> T.Aman Rice",
        "bengali_name": "ছোলা -> পতিত/সবুজ সার -> রোপা আমন",
        "pattern": ["chickpea", "rice"],
        "seasons": ["Rabi (Winter)", "Kharif-II (Monsoon)"],
        "description": "Drought-hardy legume surviving on residual soil moisture; conserves groundwater in dry Barind Tract.",
        "primary_fit": "land_preservation",
        "suitable_zones": ["High Barind Tract", "Barind Tract and Atrai Basin"],
    },
    {
        "id": "ROT_05_WHEAT_MUNGBEAN_RICE",
        "name": "Wheat -> Mungbean -> T.Aman Rice",
        "bengali_name": "গম -> মুগ ডাল -> রোপা আমন",
        "pattern": ["wheat", "mungbean", "rice"],
        "seasons": ["Rabi (Winter)", "Kharif-I (Summer)", "Kharif-II (Monsoon)"],
        "description": "Short-duration mungbean enriches soil between winter wheat and monsoon rice, boosting organic matter.",
        "primary_fit": "soil_fertility",
        "suitable_zones": ["High Barind Tract", "Karatoa-Bangali Floodplain", "Ganges Floodplain"],
    },
    {
        "id": "ROT_06_ONION_JUTE_RICE",
        "name": "Onion -> Jute -> T.Aman Rice",
        "bengali_name": "পেঁয়াজ -> পাট -> রোপা আমন",
        "pattern": ["onion", "jute", "rice"],
        "seasons": ["Rabi (Winter)", "Kharif-I (Summer)", "Kharif-II (Monsoon)"],
        "description": "Lucrative winter onion cash crop paired with jute fibre, whose falling leaf mulch adds tons of organic carbon.",
        "primary_fit": "cash_crop",
        "suitable_zones": ["Ganges River Floodplain", "Karatoa-Bangali Floodplain"],
    },
    {
        "id": "ROT_07_MAIZE_SOYBEAN_WHEAT",
        "name": "Maize -> Soybean -> Wheat",
        "bengali_name": "ভুট্টা -> সয়াবিন -> গম",
        "pattern": ["maize", "soybean", "wheat"],
        "seasons": ["Kharif-I (Summer)", "Kharif-II (Monsoon)", "Rabi (Winter)"],
        "description": "High-yield cereal-legume rotation; soybean restores nitrogen depleted by heavy-feeding maize.",
        "primary_fit": "soil_fertility",
        "suitable_zones": ["High Barind Tract", "Karatoa-Bangali Floodplain"],
    },
    {
        "id": "ROT_08_GARLIC_RICE_RICE",
        "name": "Garlic -> Aus Rice -> T.Aman Rice",
        "bengali_name": "রসুন -> আউশ ধান -> রোপা আমন",
        "pattern": ["garlic", "rice", "rice"],
        "seasons": ["Rabi (Winter)", "Kharif-I (Summer)", "Kharif-II (Monsoon)"],
        "description": "Zero-tillage garlic (Chalan Beel model in Natore/Pabna) minimizing soil disturbance, followed by rice.",
        "primary_fit": "cultivability",
        "suitable_zones": ["Chalan Beel Depression", "Ganges River Floodplain"],
    },
    {
        "id": "ROT_09_TOMATO_OKRA_RICE",
        "name": "Tomato -> Okra -> T.Aman Rice",
        "bengali_name": "টমেটো -> ঢ্যাঁড়শ -> রোপা আমন",
        "pattern": ["tomato", "okra", "rice"],
        "seasons": ["Rabi (Winter)", "Kharif-I (Summer)", "Kharif-II (Monsoon)"],
        "description": "Intensive market vegetable rotation giving frequent cash flow; rice flooding sterilizes soil pests.",
        "primary_fit": "cash_crop",
        "suitable_zones": ["Karatoa-Bangali Floodplain", "Ganges Floodplain"],
    },
    {
        "id": "ROT_10_SESAME_RICE_CHICKPEA",
        "name": "Chickpea -> Sesame -> T.Aman Rice",
        "bengali_name": "ছোলা -> তিল -> রোপা আমন",
        "pattern": ["chickpea", "sesame", "rice"],
        "seasons": ["Rabi (Winter)", "Kharif-I (Summer)", "Kharif-II (Monsoon)"],
        "description": "Extremely low water requirement rotation; ideal for water-scarce Barind tracts facing groundwater depletion.",
        "primary_fit": "land_preservation",
        "suitable_zones": ["High Barind Tract", "Barind Tract and Atrai Basin"],
    },
    {
        "id": "ROT_11_GROUNDNUT_RICE_MUSTARD",
        "name": "Mustard -> Groundnut -> T.Aman Rice",
        "bengali_name": "সরিষা -> চিনা বাদাম -> রোপা আমন",
        "pattern": ["mustard", "groundnut", "rice"],
        "seasons": ["Rabi (Winter)", "Kharif-I (Summer)", "Kharif-II (Monsoon)"],
        "description": "Legume-oilseed sequence stabilizing sandy and char lands, improving soil cohesion and adding N.",
        "primary_fit": "land_preservation",
        "suitable_zones": ["Ganges River Floodplain", "Mahananda River Basin"],
    },
    {
        "id": "ROT_12_WATERMELON_RICE_MUSTARD",
        "name": "Mustard -> Watermelon -> T.Aman Rice",
        "bengali_name": "সরিষা -> তরমুজ -> রোপা আমন",
        "pattern": ["mustard", "watermelon", "rice"],
        "seasons": ["Rabi (Winter)", "Kharif-I (Summer)", "Kharif-II (Monsoon)"],
        "description": "High cash revenue summer melon paired with mustard break crop; easy cultivability in light/medium soils.",
        "primary_fit": "cash_crop",
        "suitable_zones": ["Ganges River Floodplain", "Mahananda River Basin"],
    },
    {
        "id": "ROT_13_CABBAGE_MUNGBEAN_RICE",
        "name": "Cabbage -> Mungbean -> T.Aman Rice",
        "bengali_name": "বাঁধাকপি -> মুগ ডাল -> রোপা আমন",
        "pattern": ["cabbage", "mungbean", "rice"],
        "seasons": ["Rabi (Winter)", "Kharif-I (Summer)", "Kharif-II (Monsoon)"],
        "description": "Winter brassica cash crop followed by quick pulse green manure and staple aman rice.",
        "primary_fit": "cultivability",
        "suitable_zones": ["Karatoa-Bangali Floodplain", "High Barind Tract"],
    },
    {
        "id": "ROT_14_CAULIFLOWER_JUTE_RICE",
        "name": "Cauliflower -> Jute -> T.Aman Rice",
        "bengali_name": "ফুলকপি -> পাট -> রোপা আমন",
        "pattern": ["cauliflower", "jute", "rice"],
        "seasons": ["Rabi (Winter)", "Kharif-I (Summer)", "Kharif-II (Monsoon)"],
        "description": "Lucrative winter vegetable cash income followed by soil-restoring jute and flood-tolerant rice.",
        "primary_fit": "cash_crop",
        "suitable_zones": ["Ganges River Floodplain", "Karatoa-Bangali Floodplain"],
    },
    {
        "id": "ROT_15_SUNFLOWER_MUNGBEAN_RICE",
        "name": "Sunflower -> Mungbean -> T.Aman Rice",
        "bengali_name": "সূর্যমুখী -> মুগ ডাল -> রোপা আমন",
        "pattern": ["sunflower", "mungbean", "rice"],
        "seasons": ["Rabi (Winter)", "Kharif-I (Summer)", "Kharif-II (Monsoon)"],
        "description": "Deep-rooted sunflower extracts subsoil nutrients while mungbean fixes nitrogen and improves tilth.",
        "primary_fit": "soil_fertility",
        "suitable_zones": ["High Barind Tract", "Karatoa-Bangali Floodplain"],
    },
]


def calculate_rotation_metrics(crop_ids: List[str]) -> Dict[str, float]:
    """Calculate aggregate agronomic synergy indicators across a rotation sequence."""
    crops = [get_crop(cid) for cid in crop_ids if get_crop(cid)]
    if not crops:
        return {}

    total_days = sum(sum(c["cycle"]) for c in crops)
    avg_kc = sum(c["kc"][1] for c in crops) / len(crops)
    total_yield = sum(c["yield"] for c in crops)

    # Nitrogen dynamics (kg/ha): N fixed minus net removal
    net_n_balance = 0.0
    for c in crops:
        uptake_n = c["uptake"][0] * c["yield"]
        fixed_n = uptake_n * c.get("fix", 0.0)
        removed_n = uptake_n * 0.70  # ~70% removed in harvest
        net_n_balance += (fixed_n - removed_n)

    # Diversity score: rewards different botanical categories
    categories = [c["cat"] for c in crops]
    unique_cats = len(set(categories))
    diversity_score = (unique_cats / len(crops)) * 100.0

    # Organic matter impact (-1, 0, +1 per crop)
    om_map = {"positive": 1.0, "neutral": 0.0, "negative": -1.0}
    om_balance = sum(om_map.get(c.get("om"), 0.0) for c in crops) / len(crops)

    # Erosion & cover score: lower erosion is better
    erosion_map = {"low": 3.0, "medium": 2.0, "high": 1.0}
    soil_cover_score = sum(erosion_map.get(c.get("erosion"), 2.0) for c in crops) / len(crops)

    # Drought resilience: lower sensitivity is more resilient
    drought_map = {"low": 3.0, "medium": 2.0, "high": 1.0}
    drought_resilience = sum(drought_map.get(c.get("drought"), 2.0) for c in crops) / len(crops)

    has_legume = 1.0 if any(c.get("cat") == "legume" for c in crops) else 0.0
    has_oilseed = 1.0 if any(c.get("cat") == "oilseed" for c in crops) else 0.0
    has_cash_tuber_veg = 1.0 if any(c.get("cat") in ("root_tuber", "vegetable") for c in crops) else 0.0

    return {
        "rot_total_cycle_days": float(total_days),
        "rot_avg_kc": float(avg_kc),
        "rot_total_yield_t_ha": float(total_yield),
        "rot_net_n_balance_kg_ha": float(net_n_balance),
        "rot_diversity_score": float(diversity_score),
        "rot_om_balance": float(om_balance),
        "rot_soil_cover_score": float(soil_cover_score),
        "rot_drought_resilience": float(drought_resilience),
        "rot_has_legume": float(has_legume),
        "rot_has_oilseed": float(has_oilseed),
        "rot_has_cash_tuber_veg": float(has_cash_tuber_veg),
    }
