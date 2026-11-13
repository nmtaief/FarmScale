# FarmScale — Full-Stack Agro-Intelligence Platform

An integrated, end-to-end agricultural intelligence platform connecting:
1. **Layer 1: LLM Natural Language Advisor (`farmscale/llm_layer/`)** — Natural language prompt interface powered by OpenRouter / OpenAI / Anthropic / Gemini, extracting farmer intent, location, constraints, and generating plain-language guidance in Bangla and English.
2. **Layer 2: Crop Data Layer (`farmscale/crop_layer/`)** — Agronomic data, local core crops, water budgeting, and offline caching.
3. **Layer 3: XGBoost ML Engine (`NasaAPIgateWay/ml/`)** — 335-tree gradient boosted crop rotation scoring and ranking engine, trained on real NASA satellite telemetry.
4. **NASA Earth Data Gateway (`NasaAPIgateWay/`)** — Satellite telemetry engine with 10-year (2016–2026, 130 months) historical climate database (`engine.db`), interactive vector map, and REST APIs.

---

## Quick Start (Run the Full Unified System)

To run the complete system (Layer 1 LLM + Layer 2 Crop Data + Layer 3 XGBoost ML):

```bash
# 1. Install dependencies
pip install -r NasaAPIgateWay/requirements.txt
pip install fastapi uvicorn httpx pydantic pyyaml xgboost scikit-learn

# 2. Run the unified application
python run_farmscale.py
```

- **Unified Web Tester & Prompt Space:** Open [http://127.0.0.1:8000/tester.html](http://127.0.0.1:8000/tester.html)
- **API Documentation:** Open [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **NASA Climate Map Viewer:** Open [http://127.0.0.1:8000/map](http://127.0.0.1:8000/map)

### Configuring OpenRouter / LLM
In the Web Tester (`/tester.html`), click **LLM Settings** (top-right gear icon) to enter your OpenRouter API key and preferred model (e.g. `openai/gpt-4o-mini`, `google/gemini-2.0-flash`), or export it in your environment:
```bash
export OPENROUTER_API_KEY="your-openrouter-key"
```

---

## Architecture Overview

```
FarmScale/
├── farmscale/                         # Integrated LLM & Crop Data Package
│   ├── llm_layer/                     # Layer 1: Prompt interpreter, intent parser, providers
│   │   ├── web/tester.html            # Clean natural language prompt UI
│   │   ├── providers/                 # OpenRouter, Anthropic, Gemini, OpenAI clients
│   │   └── pipeline.py                # Pipeline coordinator
│   ├── crop_layer/                    # Layer 2: Crop database, local core crop lookups
│   ├── ml_seam/                       # Integration bridge connecting to Layer 3 ML
│   │   ├── inprocess_client.py        # Direct zero-latency ML client
│   │   └── contract_check.py          # Payload schema validation
│   └── tests/                         # Full automated test suite (42 tests)
│
├── NasaAPIgateWay/                    # NASA Earth Data & ML Gateway
│   ├── ml/                            # Layer 3: XGBoost ML Model & Rotations
│   │   ├── models/                    # Trained XGBoost models (xgb_crop_rotation.json)
│   │   ├── service.py                 # Telemetry aggregator & scoring service
│   │   ├── feature_pipeline.py        # Soil & telemetry feature assembler
│   │   └── llm_tool.py                # Schema-validated tool executor
│   ├── data/
│   │   ├── engine.db                  # 10-Year Bangladesh NASA climate SQLite database
│   │   └── crops.json                 # Crop parameters
│   ├── main.py                        # NASA API gateway server
│   └── requirements.txt               # Dependencies
│
├── run_farmscale.py                   # One-command full system launcher
└── Crop Data API/                     # Legacy crop suitability microservice
```

---

## Quick Start

### 1. Run NASA API Gateway (Port 8000)

```bash
cd NasaAPIgateWay
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env       # (Optional: set EARTHDATA credentials for async AppEEARS jobs)
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

- **Interactive Climate Map:** Open [http://127.0.0.1:8000/](http://127.0.0.1:8000/) or `/map`
- **Gateway Dashboard:** Open [http://127.0.0.1:8000/dashboard](http://127.0.0.1:8000/dashboard)
- **API Tester:** Open [http://127.0.0.1:8000/tester](http://127.0.0.1:8000/tester)
- **Interactive Swagger Docs:** Open [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

### 2. Run Crop Data API (Port 8100)

```bash
cd "Crop Data API"
pip install -r requirements.txt
cp .env.example .env
uvicorn main:app --reload --host 0.0.0.0 --port 8100
```

- **Interactive Tester:** Open [http://127.0.0.1:8100/](http://127.0.0.1:8100/)
- **Swagger Docs:** Open [http://127.0.0.1:8100/docs](http://127.0.0.1:8100/docs)

---

## 10-Year Bangladesh Climate Dataset (2016–2026)

The NASA API Gateway includes pre-collected and verified 10-year month-by-month NASA POWER agroclimatology records:
- **Coverage:** All 64 Districts of Bangladesh and all 70 Upazilas of Rajshahi Division.
- **Time Range:** January 2016 through October 2026 (130 monthly slices per area).
- **Parameters:**
  - `TempMean_C`, `TempMax_C`, `TempMin_C` (2m Air Temperature)
  - `Precip_mm` (Corrected Monthly Precipitation)
  - `RootzoneWetness` (0–1 Root Zone Soil Wetness)
  - `TopsoilWetness` (0–1 Surface Soil Wetness)
  - `WaterStressScore` (0–100 Normalized Agro-hydrological Stress Score)
  - `WaterStressLevel` (`low`, `moderate`, `high`, `severe`)

All dataset files can be queried via API or downloaded directly via CSV/GeoJSON endpoints.
