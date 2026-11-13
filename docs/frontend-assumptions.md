# Frontend Assumptions and Gateway Open Questions

Tracked assumptions marked with `// TODO(human)` across the FarmScale frontend codebase.

## 1. Data Gateway Endpoints & Responses
- **Assumption:** The gateway will provide JSON responses adhering to discriminated union states (`live`, `sample`, `unavailable`, `error`, `rate_limited`).
- **TODO(human):** Confirm gateway endpoint paths (e.g. `/v1/climate`, `/v1/soil`, `/v1/crops`, `/v1/rotations/rank`) and authentication headers.
- **Current Fallback:** `sampleAdapter` returns local fixtures where every field is marked `status: "sample"` and `source: "sample"`.

## 2. Crop Ratings & Signal Codes
- **Assumption:** Ratings for Mustard (8/5/8), Wheat (6/7/7), Lentil (7/5/8), and Boro rice (2/9/3) are illustrative sample data placeholders.
- **TODO(human):** Replace sample ratings with authoritative FAO-56 / EcoCrop / BARI cited tables.
- **Signal Codes:** Gateway returns structured reason codes (`low_water_demand_winter`, `legume_nitrogen_boost`, etc.), mapped to localized sentences in `messages/*.json`.

## 3. Map Tiles & Vector Provider (Ahead of Step 4)
- **Assumption:** MapLibre GL will read a style URL from `NEXT_PUBLIC_MAP_TILE_STYLE_URL` with an SVG offline fallback.
- **Candidate Providers:**
  1. **Carto Positron / Voyager:** High-clarity, free tier for open-source/humanitarian apps, clean neutral palette matching Agro-Scientific Tactile style.
  2. **Stadia Maps / OpenMapTiles:** High-performance vector tiles with global coverage.
  3. **Self-hosted / Static PMTiles:** Fully offline capable, zero external runtime dependency.

## 4. Native Translation Review
- **Assumption:** Farming terms translated in Bangla (`messages/bn.json`) and Japanese (`messages/ja.json`) are marked with `_reviewNote: "NEEDS-NATIVE-REVIEW"` for native agronomist sign-off before production.
