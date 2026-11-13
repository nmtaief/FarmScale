# FarmScale ML Integration Guide (Layer 3 Hand-Off)

This guide explains how to connect the real Layer 3 XGBoost ML engine to FarmScale without modifying `llm_layer/` or `crop_layer/`.

## 1. Files to Edit

Only edit files in `ml_seam/` and `.env` / environment configuration:

- **`.env` / environment**: Set `ML_MODE=http` (with `ML_HTTP_URL`) or `ML_MODE=inprocess`.
- **Option A — HTTP service (`ml_seam/http_client.py`)**:
  - Update `map_request_to_http()` and `map_response_from_http()` if the remote ML endpoint uses different field names or URL paths (`/rank`, `/health`).
- **Option B — In-process Python package (`ml_seam/inprocess_client.py`)**:
  - Replace the `TODO(integration)` blocks in `_load_ml_module()` and `rank()`.
  - `ml_seam/inprocess_client.py` is the **only** file allowed to import `ml.*`.

## 2. Running `contract_check`

Validate your real ML output against `ml_seam/contract/ml_payload.schema.json`:

```bash
python -m ml_seam.contract_check --mode http --http-url http://localhost:8001
# or
python -m ml_seam.contract_check --mode inprocess
```

## 3. Known Mismatches & Open Questions to Check

1. **`candidate_crops` support (Open Question 2):**
   - FarmScale passes Layer 2's compact summary as an optional `candidate_crops` field in `MLClient.rank(request)`.
   - If your ML engine does not accept `candidate_crops`, strip it in `map_request_to_http()` or `InProcessMLClient.rank()`. Layer 2 will still be used to annotate and ground explanations.
2. **Crop IDs (`crop_layer/data/crop_id_map.json`, Open Question 3):**
   - `crops.json` uses canonical IDs like `aman_rice`, `boro_rice`, `aus_rice`, `mustard`, `watermelon`.
   - If the ML uses IDs like `rice`, `t_aman`, `boro`, update `crop_layer/data/crop_id_map.json`.
3. **Precipitation units (`PRECIP_UNIT`):**
   - `telemetry_used.nasa_power_weather.precip_mm` defaults to `mm/day` in `llm_layer/config.py` (`UNITS["precip_mm"]`). If the ML outputs monthly or seasonal totals, set `PRECIP_UNIT` in `.env` accordingly.
4. **"Most production" goal (`max_production`, Open Question 1):**
   - Currently disabled (`supported_by_ml: false` in `llm_layer/goals.py`) because no ML goal exists for it yet. Enable it once `max_yield` is added to the ML or a client-side sorting caveat is approved.
5. **Templated text conflicts:**
   - The interpreter ignores/overrides `plain_language_answer`, `description`, and `llm_prompt_context` whenever they conflict with numeric `metrics`.
