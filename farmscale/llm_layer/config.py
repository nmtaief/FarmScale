"""Centralized configuration and telemetry unit definitions for FarmScale."""

from __future__ import annotations

import os
from pathlib import Path
from dotenv import load_dotenv

# Automatically load .env from farmscale root if present
_ENV_PATH = Path(__file__).resolve().parents[1] / ".env"
if _ENV_PATH.exists():
    load_dotenv(_ENV_PATH)


UNITS: dict[str, str] = {
    "precip_mm": os.getenv("PRECIP_UNIT", "mm/day"),
    "temp_mean_c": "°C",
    "sm_rootzone_m3_m3": "m³/m³",
    "sm_rootzone_pctl": "percentile",
    "soc_g_kg": "g/kg",
    "n_g_kg": "g/kg",
    "total_duration_days": "days",
    "total_yield_t_ha": "t/ha",
    "net_n_balance_kg_ha": "kg N/ha",
    "thermal_comfort_pct": "%",
    "ph_suitability_pct": "%",
    "water_adequacy_pct": "%",
}


def get_precip_unit() -> str:
    return os.getenv("PRECIP_UNIT", UNITS["precip_mm"])
