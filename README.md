# FarmScale — NASA Space Apps & Crop Data Gateway

An integrated agricultural intelligence platform consisting of two complementary microservices:

1. **NASA API Gateway (`NasaAPIgateWay/`)** — High-performance satellite data engine aggregating NASA POWER weather, ISRIC SoilGrids soil profile, NASA AppEEARS SMAP rootzone soil moisture, and MODIS vegetation indices (NDVI/EVI). Includes a comprehensive 10-year (2016–2026, 130 months) month-by-month climate dataset and interactive vector map for all 64 districts and upazilas of Bangladesh.
2. **Crop Data API (`Crop Data API/`)** — Agronomic intelligence service providing location-based crop suitability scoring, water budgeting by growth stage, nutrient removal calculations, and crop rotation planning.

---

## Architecture Overview

```
FarmScale/
├── Crop Data API/                     # Port 8100: Crop suitability & agronomic engine
│   ├── main.py                        # FastAPI application
│   ├── engine.py                      # Suitability algorithms & water/nutrient models
│   ├── crops.json                     # Agronomic rules and crop parameters
│   └── tester.html                    # Interactive API testing interface
│
└── NasaAPIgateWay/                    # Port 8000: NASA Earth data engine & vector maps
    ├── main.py                        # FastAPI application & dataset endpoints
    ├── providers.py                   # NASA POWER, SoilGrids, and AppEEARS clients
    ├── store.py                       # SQLite cache, API key auth, 10Y climate query
    ├── map.html                       # 10-Year Bangladesh Climate Vector Map viewer
    ├── dashboard.html                 # Gateway operations & location manager dashboard
    ├── tester.html                    # Endpoint tester and request builder
    ├── bangladesh_districts_vector.geojson  # Decimated vector polygons (64 districts)
    ├── bangladesh_upazilas_vector.geojson   # Decimated vector polygons (544 upazilas)
    ├── bangladesh_10years_monthly.csv       # 10Y monthly climate records (64 districts)
    ├── bangladesh_districts_10years_monthly.json
    ├── bangladesh_upazilas_10years_monthly.csv
    ├── bangladesh_upazilas_10years_monthly.json
    ├── rajshahi_10years_monthly.csv         # Rajshahi Division 10Y monthly climate records
    ├── rajshahi_districts_10years_monthly.json
    ├── rajshahi_nasa_polygons.geojson       # Rajshahi division polygon vector map
    ├── rajshahi_nasa_vector.geojson         # Rajshahi district centroid points
    └── rajshahi_satellite_vegetation_all.csv # MODIS NDVI/EVI & VCI time series
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
