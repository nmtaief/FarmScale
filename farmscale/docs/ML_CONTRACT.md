# FarmScale ML Contract (`Layer 1/2 <-> Layer 3`)

This document describes the contract between the FarmScale application (`llm_layer` + `crop_layer`) and the XGBoost ML ranking engine (`ml_seam`).

## 1. Request (`MLClient.rank(request)`)

| Field | Type | Required | Description |
|---|---|---|---|
| `district` | `string` | Yes | District name in Rajshahi Division (e.g., `"Rajshahi"`) |
| `upazila` | `string` | Yes | Upazila name (e.g., `"Godagari"`) |
| `latitude` | `number` | Yes | Decimal degrees North |
| `longitude` | `number` | Yes | Decimal degrees East |
| `goal` | `string` | Yes | One of `cash_crop`, `soil_fertility`, `land_preservation`, `cultivability` |
| `season` | `string` | Yes | e.g. `"annual"` (treated as a string) |
| `language` | `string` | Yes | `"en"` or `"bn"` |
| `top_k` | `integer` | Yes | Number of top rotations requested (default `3`) |
| `candidate_crops` | `object` | No | Optional compact Layer 2 summary. ML engines that do not accept it may ignore it. |

## 2. Response Payload

Machine-readable schema: `ml_seam/contract/ml_payload.schema.json`.

### Top-level keys (10 standard keys)
`status`, `tool_name`, `arguments_used`, `query_analysis`, `telemetry_used`, `ml_metadata`, `ranked_rotations`, `plain_language_answer`, `llm_prompt_context`, `instruction_for_llm`.

### Required fields
- `status`: `"success"` or `"error"`
- `ml_metadata`: `version` (string), `model_type` (string; `"MOCK"` when mocked)
- `telemetry_used`:
  - `nasa_power_weather`: `temp_mean_c`, `precip_mm`, `rootzone_wetness`
  - `smap_soil_moisture`: `sm_rootzone_m3_m3`, `sm_rootzone_pctl`
  - `modis_vegetation`: `ndvi`, `ndvi_vci`
  - `soilgrids_soil`: `ph`, `soc_g_kg`, `n_g_kg`, `sand`, `silt`, `clay`, `texture_group`
- `ranked_rotations[]`:
  - `id`, `name`, `pattern` (ordered crop list), `seasons` (ordered season list), `score`, `rank`
  - `metrics`: `total_duration_days`, `total_yield_t_ha`, `net_n_balance_kg_ha`, `soil_cover_score`, `drought_resilience`, `diversity_score`
  - `environmental_factors`: `thermal_comfort_pct`, `ph_suitability_pct`, `water_adequacy_pct`, `stress_vulnerability`

### Optional fields (never required)
`bengali_name`, `primary_fit`, `suitable_zones`, `description`, `crops`, `ml_score`, `plain_language_answer`, `llm_prompt_context`, `instruction_for_llm`, `query_analysis`, `data_status` (e.g. `"preparing"`), `telemetry_date`.

## 3. Rules
1. Layer 1/2 **tolerates** missing optional fields and unknown extra fields.
2. Layer 1 **never** trusts ML templated text (`plain_language_answer`, `description`, `llm_prompt_context`) over numeric `metrics` and `environmental_factors`.
3. `precip_mm` unit is configurable via `PRECIP_UNIT` (default `mm/day`) in `llm_layer/config.py`.
