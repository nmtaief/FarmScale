# FarmScale Assumptions & Verification Notes

1. **Draft Crop & Gazetteer Data (`source: "draft"`, `confidence: "low"`):**
   - No seed `crops.json` or ML fixture payloads were provided, so `crop_layer/data/crops.json`, `local_crops.json`, `gazetteer.json`, `crop_id_map.json`, and `ml_seam/fixtures/*.json` were drafted from general agronomic and geographic knowledge of Rajshahi Division.
   - All crop and local-crop records are marked `"source": "draft"` and `"confidence": "low"` for verification against DAE/BARI/BARC/BBS sources before farmer deployment.
   - Market `price` and `production_cost` fields are present as placeholders with `"status": "missing"`.
2. **Bangla Templates & Labels:**
   - Bangla UI labels, goal templates, and mock outputs were drafted and should be reviewed by a native Bangla speaker.
3. **Precipitation Unit (`precip_mm`):**
   - Assumed to be `mm/day` by default; configurable in one place via `PRECIP_UNIT` in `.env` / `llm_layer/config.py`.
4. **"Most production" Goal (`max_production`):**
   - Kept disabled (`supported_by_ml: false`) per Open Question 1 until the ML team decides between adding a `max_yield` goal or client-side sorting by `total_yield_t_ha`.
5. **Live Provider Calls:**
   - Provider adapters (`anthropic`, `gemini`, `openai`, `deepseek`, `openrouter`) were implemented against current official REST API documentation, and tested with mocked HTTP/error responses. Live end-to-end calls to external provider APIs were not executed without user API keys.
6. **In-Process & HTTP ML Clients:**
   - `InProcessMLClient` and `HttpMLClient` were verified structurally and for missing-package error handling; live calls against the real Layer 3 XGBoost model were not run because Layer 3 code is external.
