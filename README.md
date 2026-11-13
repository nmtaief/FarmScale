# 🛰️ FarmScale — NASA Space Apps Challenge 2026
### *Climate-Adapted Crop Rotation & Groundwater Preservation Platform for the Barind Tract*

[![NASA Space Apps 2026](https://img.shields.io/badge/NASA%20Space%20Apps-Challenge%202026-blue.svg)](https://www.spaceappschallenge.org/)
[![Vercel Production](https://img.shields.io/badge/Vercel-Live%20Production-000?logo=vercel)](https://farmscale-web.vercel.app)
[![Bilingual](https://img.shields.io/badge/Language-Bangla%20%7C%20English-green.svg)](https://farmscale-web.vercel.app/bn)
[![XGBoost](https://img.shields.io/badge/ML-XGBoost%20Regressor%20(Layer%203)-orange.svg)](https://github.com/nmtaief/FarmScale)
[![NASA Earth Data](https://img.shields.io/badge/NASA%20Earthdata-SMAP%20%7C%20MODIS%20%7C%20POWER-red.svg)](https://appeears.earthdatacloud.nasa.gov/)
[![Tests Passing](https://img.shields.io/badge/Tests-41%2F41%20Passing%20(100%25)-brightgreen.svg)](https://github.com/nmtaief/FarmScale)

---

## 🌐 Live Application & Repositories

| Component | URL | Description |
| :--- | :--- | :--- |
| **🚀 Live Production Web App** | **[farmscale-web.vercel.app](https://farmscale-web.vercel.app)** | Next.js 15 mobile-first farmer app on Vercel |
| **🇧🇩 বাংলা ইন্টারফেস (Bangla Default)** | **[farmscale-web.vercel.app/bn](https://farmscale-web.vercel.app/bn)** | Designed for low-literacy farmers (360px viewport) |
| **📦 All-in-One GitHub Submission** | **[github.com/nmtaief/FarmScale](https://github.com/nmtaief/FarmScale)** | Official Monorepo (Web, ML, NASA Data, LLM Layer) |

---

## 🌾 The Problem: The Barind Tract Groundwater Crisis

The **Barind Tract** across northwestern Bangladesh (Rajshahi, Naogaon, Chapai Nawabganj) is confronting a severe hydrological emergency:
1. **Catastrophic Groundwater Depletion:** Over-reliance on irrigated dry-season Boro rice (*Oryza sativa*) has driven groundwater extraction beyond natural recharge. The water table in Upazilas like Tanore and Godagari drops by over **0.5 – 1.0 meter annually**, causing deep tubewells to run dry.
2. **Smallholder Vulnerability:** Marginal farmers cultivate fragmented plots ($\approx 1$ bigha / 33 decimals). High diesel and electricity costs for deep irrigation wipe out farmer profit margins.
3. **Information Barrier:** Smallholder farmers rely on mid-range Android smartphones (360px screen width), unstable 3G networks, and have limited reading literacy. Existing agricultural advisory tools present dense text, English interfaces, and lack localized satellite telemetry.

---

## 💡 The FarmScale Solution

FarmScale turns **NASA Earth Observation data** and **Machine Learning** into one ultra-simple, honest decision-support experience built specifically for low-literacy smallholder farmers:

```
                  ┌─────────────────────────────────────────────────────────┐
                  │                 NASA Earth Observations                 │
                  │  • SMAP (Rootzone Soil Moisture)                        │
                  │  • MODIS (250m NDVI / EVI & Drought Anomaly)            │
                  │  • NASA POWER (Precipitation, Solar Radiation, Temp)    │
                  └────────────────────────────┬────────────────────────────┘
                                               │
                                               ▼
                  ┌─────────────────────────────────────────────────────────┐
                  │             Layer 3: XGBoost ML Engine                  │
                  │  • 335-Tree Regressor trained on 10-Yr NASA Telemetry   │
                  │  • Evaluates 3-season crop rotation suitability         │
                  └────────────────────────────┬────────────────────────────┘
                                               │
                                               ▼
                  ┌─────────────────────────────────────────────────────────┐
                  │          Layer 2: Agronomic Rules & Live Weather        │
                  │  • BARI / DAE crop calendars & fertilizer doses/bigha   │
                  │  • Open-Meteo 7-day live rainfall warnings & adaptation │
                  └────────────────────────────┬────────────────────────────┘
                                               │
                                               ▼
                  ┌─────────────────────────────────────────────────────────┐
                  │       Layer 1: Mobile-First Farmer App (Vercel)         │
                  │  • 1-Tap Location GPS & Barind Interactive Map Picker   │
                  │  • Exactly 3 distinct rotation strategies (৳, 💧, ⚡)   │
                  │  • Stage-by-stage AI farming outline (যখন কী করবেন)    │
                  │  • Hind Siliguri typography, 44px+ touch targets        │
                  └─────────────────────────────────────────────────────────┘
```

### Key Capabilities
1. **Interactive Barind Map Picker & GPS:**
   - 1-tap "আমার অবস্থান ব্যবহার করুন" (GPS geolocation).
   - Interactive SVG map covering the Barind Tract (Rajshahi Sadar, Godagari, Tanore, Paba) with Padma River boundary. Farmers can tap directly on the map to drop a pin. Outside-pilot locations automatically snap to the nearest pilot upazila with an honest note.
2. **Exactly 3 Distinct Rotation Choices (Rabi ➔ Kharif-1 ➔ Kharif-2):**
   - **সবচেয়ে বেশি লাভ (Most Profit):** e.g., Potato $\rightarrow$ Mungbean $\rightarrow$ Aman Rice (Net Profit: ~৳40,000 / bigha).
   - **বোরোর সেরা বিকল্প (Best Shift from Boro):** e.g., Mustard $\rightarrow$ Mungbean $\rightarrow$ Aman Rice (Saves **60% groundwater**, Net Profit: ~৳28,500 / bigha).
   - **কম খরচ ও সহজ (Low Cost & Low Effort):** e.g., Lentil $\rightarrow$ Mungbean $\rightarrow$ Aman Rice (Cost: ~৳12,000, Net Profit: ~৳20,000 / bigha).
3. **Live Weather Warning & Schedule Adaptation:**
   - Connects live to Open-Meteo for 7-day local rainfall and temperature forecasts.
   - Detects upcoming rain events ($\ge 1.0\text{ mm}$ or $\ge 50\%$ rain probability).
   - **1-Tap Schedule Adjustment:** Farmers tap "আবহাওয়া অনুযায়ী সূচি সমন্বয় করুন" to dynamically push fertilizer application and irrigation past the rainy window to prevent nutrient runoff and seed rot.
4. **Comprehensive Stage-by-Stage Farming Plan:**
   - Detailed date-wise and growth-stage instructions (জমি তৈরি ➔ বীজ বপন ➔ সেচ ও সার ➔ নিড়ানি ➔ ফসল তোলা) for all 3 seasons.
   - Exact BARI/DAE fertilizer dosage per bigha (Urea, TSP, MoP, Gypsum, Zinc).
   - Grounded interactive AI Farm Advisor for voice/text Q&A in natural Bangla.

---

## 🛰️ NASA Earth Science Data Integration

| Dataset | Satellite / Mission | Spatial / Temporal Resolution | How FarmScale Uses It |
| :--- | :--- | :--- | :--- |
| **L4_SM** (Rootzone Soil Moisture) | **NASA SMAP** (Soil Moisture Active Passive) | 9 km grid / 3-day global | Monitors root-zone water availability ($0\text{--}100\text{ cm}$) to predict crop water stress and trigger drought-tolerant rotation recommendations. |
| **MOD13Q1.061** (NDVI & EVI) | **NASA Terra / Aqua MODIS** | 250 m / 16-day composite | Historical 10-year vegetation baseline (2016–2026). Generates the Vegetation Condition Index (VCI) to identify crop stress anomalies. |
| **NASA POWER** | Multi-mission satellite & assimilation | $0.5^\circ \times 0.5^\circ$ daily | Climatology features: Daily precipitation sum, 2m air temperature, surface solar radiation, and relative humidity. |
| **SoilGrids Telemetry** | ISRIC / NASA partnership | 250 m | Sand, silt, clay, bulk density, and organic carbon calibrated into 4 Barind soil texture classes (clay loam, loam, sandy loam, clay). |

Data is processed via NASA AppEEARS API scripts in [`NasaAPIgateWay/scripts/`](file:///f:/Nasa%20API/FarmScale/NasaAPIgateWay/scripts/) and stored in an indexed 10-year SQLite climate database ([`engine.db`](file:///f:/Nasa%20API/FarmScale/NasaAPIgateWay/data/engine.db)).

---

## 📂 Repository Monorepo Structure

```
FarmScale/
├── apps/
│   └── web/                               # Next.js 15 App Router Frontend
│       ├── src/
│       │   ├── app/
│       │   │   ├── [locale]/              # Bilingual pages (/bn and /en)
│       │   │   ├── api/weather/           # Open-Meteo 7-day forecast & rain warning API
│       │   │   ├── api/recommend/         # 3-option deterministic/ML recommendation API
│       │   │   └── api/advisor/           # AI farming advisor endpoint
│       │   ├── components/
│       │   │   ├── home/
│       │   │   │   ├── BarindMapPicker.tsx # Interactive Barind SVG map picker
│       │   │   │   ├── AiFarmingOutline.tsx# 3-season stage plan & weather adaptation
│       │   │   │   └── SimpleFarmerHome.tsx# Farmer home matching farmscale-home spec
│       │   │   ├── crops/CropIcon.tsx     # Reusable custom SVG crop icons
│       │   │   └── brand/FarmScaleLogo.tsx# Brand logo
│       │   └── lib/recommend/             # Pilot area bounds, crop data, scoring rules
│       └── tests/                         # Vitest acceptance & unit test suites (37 tests)
│
├── packages/
│   ├── scoring/                           # Deterministic & XGBoost scoring module (4 tests)
│   └── ui-tokens/                         # Tailwind design tokens (#1B3B2B green, #E0A800 gold)
│
├── NasaAPIgateWay/                        # NASA Earth Observation & ML Gateway
│   ├── ml/
│   │   ├── models/xgb_crop_rotation.json  # Pre-trained 335-tree XGBoost model
│   │   ├── xgboost_model.py               # Layer 3 XGBoost inference engine
│   │   ├── feature_pipeline.py            # Telemetry & soil feature assembler
│   │   ├── service.py                     # ML scoring service
│   │   └── llm_tool.py                    # Structured LLM tool-calling seam
│   ├── data/
│   │   ├── engine.db                      # 10-year NASA historical climate database
│   │   └── crops.json                     # Agronomic parameters for Barind crops
│   └── scripts/                           # AppEEARS sync & GeoJSON generation scripts
│
├── farmscale/                             # Layer 1 LLM & Layer 2 Crop Data Layer
│   ├── llm_layer/                         # Natural language interpreter & OpenRouter interface
│   ├── crop_layer/                        # Core crop lookups and agronomic data
│   └── ml_seam/                           # Zero-latency in-process client bridging ML
│
├── docs/                                  # Project Architecture & Documentation
│   ├── NASA_XGBOOST_ML_ARCHITECTURE.md    # Deep dive into Layer 1, 2, 3 ML architecture
│   ├── NASA_Gateway_Rajshahi_Antigravity_Guide.md # NASA AppEEARS ingestion guide
│   ├── DESIGN-RULES.md                    # Mobile-first UX constraints (360px viewport)
│   └── architecture.mermaid               # Mermaid workflow diagram
│
├── package.json                           # Root monorepo workspace configuration
├── vercel.json                            # Vercel deployment configuration
├── requirements.txt                       # Python dependencies for ML/NASA backend
├── run_farmscale.py                       # Unified backend launcher
├── start_online.py                        # Cloudflare tunnel production runner
└── sync_to_github.py                      # Automatic multi-repo GitHub sync utility
```

---

## ⚡ Quick Start & Local Development

### 1. Web Application (Frontend)
```bash
# Clone the repository
git clone https://github.com/nmtaief/FarmScale.git
cd FarmScale

# Install dependencies
npm install

# Run development server
npm run dev

# Run test suite
npm test
```
The web app is available at **http://localhost:3000** (Bangla at **http://localhost:3000/bn**).

### 2. ML Gateway & NASA Telemetry (Backend)
```bash
# Install Python dependencies
pip install -r requirements.txt

# Run the backend API & ML Gateway
python run_farmscale.py
```
- API Documentation (Swagger): **http://127.0.0.1:8000/docs**
- Unified Prompt Space: **http://127.0.0.1:8000/tester.html**

---

## 🧪 Verification & Automated Testing

The repository includes comprehensive automated test suites covering:
1. **Simple Farmer Home Acceptance:** Bilingual purity, zero Japanese leak, 3-option structure, Taka formatting with Bangla digits (`Intl.NumberFormat('bn-BD')`).
2. **Barind Map Coordinate Snapping:** Correct nearest pilot upazila selection for boundary coordinates.
3. **Open-Meteo Live Weather Thresholds:** Triggering alerts when $\ge 1.0\text{ mm}$ precipitation is forecasted.
4. **Deterministic Scoring Engine:** Goal weight mapping (profit, water, soil).

```bash
npm test
```
```
 ✓ tests/engine.test.ts (4 tests)
 ✓ tests/store.test.ts (3 tests)
 ✓ tests/farmJourney.test.ts (13 tests)
 ✓ tests/acceptance.test.ts (9 tests)
 ✓ tests/simpleHome.test.ts (10 tests)
 ✓ tests/Button.test.tsx (2 tests)

 Test Files  6 passed (6)
      Tests  41 passed (41) - 100% Passing
```

---

## 👥 NASA Space Apps Challenge 2026 Team

* **Project Name:** FarmScale
* **Lead Developer & Submitter:** Noor Mohammed Taief ([@nmtaief](https://github.com/nmtaief))
* **Challenge:** Climate-Smart Agriculture / Earth Observation for Food Security
* **Target Community:** Smallholder Farmers in Barind Tract (Rajshahi Division, Bangladesh)
