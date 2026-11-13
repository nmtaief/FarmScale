# 🛰️ FarmScale — NASA Space Apps Challenge 2026
### *Climate-Adapted Crop Rotation & Groundwater Preservation Platform for Rajshahi Division, Bangladesh*

[![NASA Space Apps 2026](https://img.shields.io/badge/NASA%20Space%20Apps-Challenge%202026-blue.svg)](https://www.spaceappschallenge.org/)
[![Vercel Production](https://img.shields.io/badge/Vercel-Live%20Production-000?logo=vercel)](https://farmscale-web.vercel.app)
[![Bilingual](https://img.shields.io/badge/Language-Bangla%20%7C%20English-green.svg)](https://farmscale-web.vercel.app/bn)
[![XGBoost](https://img.shields.io/badge/ML-XGBoost%20Engine-orange.svg)](https://github.com/nmtaief/FarmScale)
[![NASA Earth Data](https://img.shields.io/badge/NASA%20Earthdata-POWER%20%7C%20SMAP%20%7C%20MODIS-red.svg)](https://power.larc.nasa.gov/)
[![Tests Passing](https://img.shields.io/badge/Tests-44%2F44%20Passing%20(100%25)-brightgreen.svg)](https://github.com/nmtaief/FarmScale)

---

> ### 🚀 **Live Demo:** [https://farmscale-web.vercel.app](https://farmscale-web.vercel.app)
> **🇧🇩 Direct Bangla Interface:** [https://farmscale-web.vercel.app/bn](https://farmscale-web.vercel.app/bn)
> *Next.js 15 App Router — Mobile-first PWA responsive from 360px Android devices to desktop.*

---

## 🌐 Live Application & Repositories

| Component | URL | Description |
| :--- | :--- | :--- |
| **🚀 Live Production Web App** | **[farmscale-web.vercel.app](https://farmscale-web.vercel.app)** | Next.js 15 mobile-first farmer app on Vercel |
| **🇧🇩 বাংলা ইন্টারফেস (Bangla Default)** | **[farmscale-web.vercel.app/bn](https://farmscale-web.vercel.app/bn)** | Authentic Bangla numerals (`Intl.NumberFormat('bn-BD')`) and Taka sign (৳) |
| **📦 GitHub Monorepo** | **[github.com/nmtaief/FarmScale](https://github.com/nmtaief/FarmScale)** | Official Monorepo (Web, ML Pipeline, Datasets, Supabase Schema) |
| **🌿 Feature Branch & PR** | **[feat/rajshahi-full-platform](https://github.com/nmtaief/FarmScale/pull/new/feat/rajshahi-full-platform)** | Full Rajshahi Division Expansion Pull Request |

---

## 🌾 The Problem & Pilot Zone

### Barind Tract & Rajshahi Division Groundwater Emergency
Rajshahi Division in northwestern Bangladesh (covering 8 districts: **Rajshahi, Chapainawabganj, Naogaon, Natore, Pabna, Bogura, Joypurhat, Sirajganj** and all **67 Upazilas**) faces critical hydrological and climate stresses:
1. **Severe Groundwater Depletion:** Over-extraction of groundwater for flood-irrigated dry-season Boro rice (*Oryza sativa*) causes water tables in the High Barind Tract (Tanore, Godagari, Nachole, Gomastapur) to drop by **0.5 – 1.0 meter annually**, exhausting deep tube-wells.
2. **Smallholder Economic Vulnerability:** Marginal farmers cultivate small fragmented plots ($\approx 1$ bigha / 33 decimals). High diesel and tube-well electricity irrigation tariffs wipe out farmer margins.
3. **Climate Uncertainty & Extreme Events:** Farmers face pre-monsoon Kharif-1 dry spells (>10 days without rain), pre-monsoon heat stress (>35°C during Boro flowering causing sterility), and early cessation of the monsoon in mid-October.

FarmScale solves this by combining **NASA satellite agroclimatology**, **XGBoost machine learning**, and the **FAO/Reading University PICSA framework** into an accessible, bilingual, mobile-first web app.

---

## 🏗️ Architecture & System Design

```
                     ┌─────────────────────────────────────────────────────────┐
                     │            NASA Earth Observations & Climatology        │
                     │  • NASA POWER API (Daily Climatology 1991–2024)        │
                     │  • SMAP (Rootzone Soil Moisture L4)                     │
                     │  • MODIS (250m NDVI / Vegetation Indices)               │
                     └────────────────────────────┬────────────────────────────┘
                                                  │
                                                  ▼
                     ┌─────────────────────────────────────────────────────────┐
                     │          Automated Data Pipeline & Cron Cache           │
                     │  • Daily Weather Cron (/api/cron/weather-sync at 06:00) │
                     │  • 7-day Open-Meteo forecasts cached per-upazila        │
                     │  • Agro-Weather Email alerts via Resend dispatcher      │
                     └────────────────────────────┬────────────────────────────┘
                                                  │
                                                  ▼
                     ┌─────────────────────────────────────────────────────────┐
                     │            XGBoost ML Recommendation Engine             │
                     │  • Yield (kg/bigha) & Net Profit Regressor (ml/train.py)│
                     │  • 5-Fold Cross Validation + Grid Search (R² = 0.9963)  │
                     │  • FastAPI Serving Layer (ml/serve.py)                  │
                     └────────────────────────────┬────────────────────────────┘
                                                  │
                                                  ▼
                     ┌─────────────────────────────────────────────────────────┐
                     │          PICSA Climate Analysis & Cost Budgeting        │
                     │  • 30-year onset/cessation, dry spell & heat risk (NASA)│
                     │  • Participatory Budgeting: Live editable cost drawer    │
                     │  • DAE, BARI, BRRI, BARC official crop calendars        │
                     └────────────────────────────┬────────────────────────────┘
                                                  │
                                                  ▼
                     ┌─────────────────────────────────────────────────────────┐
                     │            Next.js 15 Mobile-First Web App              │
                     │  • Cascading Dropdowns: District -> All 67 Upazilas     │
                     │  • Optional Google Sign-In via Supabase Auth + RLS      │
                     │  • "My Farm" (আমার খামার) persistent farm drawer        │
                     │  • Printable 3-season crop calendar (@media print)      │
                     └─────────────────────────────────────────────────────────┘
```

---

## 📋 Features Delivered

### 1. Google Authentication & Farmer Data Persistence (Supabase)
* **Optional Google Sign-In:** Guests can explore recommendations immediately with zero friction; signed-in users persist their farm profiles.
* **Persistent Farmer Profile & History:**
  * Farmer profile (name, email, language preference)
  * Farm location (District + Upazila across Rajshahi Division)
  * Land characteristics: land size (bigha/decimal/acre), soil type (clay, loamy, sandy loam), irrigation access (deep tube-well, shallow, canal, rainfed)
  * Chosen rotation plan & start season
  * Historical recommendations log
* **Security & Isolation:** PostgreSQL Row Level Security (RLS) policies ensuring users can only read/write their own records (`supabase/schema.sql`).
* **Bangla Loading & Error Handling:** Fully translated authentication states and modals.
* **"My Farm" (আমার খামার) Drawer:** Instant access to view and update saved profile, land size, and active crop rotation.

### 2. Location: All 67 Upazilas of Rajshahi Division
* **Cascading Dropdowns:** District (8 districts) $\rightarrow$ Upazila (67 upazilas).
* **Official BBS Geospatial Registry:** Sourced and verified from Bangladesh Bureau of Statistics (BBS) administrative boundaries (`data/rajshahi_division_upazilas.json`):
  * **Rajshahi (9):** Bagha, Bagmara, Charghat, Durgapur, Godagari, Mohanpur, Paba, Puthia, Tanore
  * **Chapainawabganj (5):** Bholahat, Gomastapur, Nachole, Nawabganj Sadar, Shibganj
  * **Naogaon (11):** Atrai, Badalgachhi, Dhamoirhat, Manda, Mohadevpur, Naogaon Sadar, Niamatpur, Patnitala, Porsha, Raninagar, Sapahar
  * **Natore (7):** Bagatipara, Baraigram, Gurudaspur, Lalpur, Natore Sadar, Singra, Naldanga
  * **Bogura (12):** Adamdighi, Bogura Sadar, Dhunat, Dhupchanchia, Gabtali, Kahaloo, Nandigram, Sariakandi, Shajahanpur, Sherpur, Shibganj, Sonatola
  * **Joypurhat (5):** Akkelpur, Joypurhat Sadar, Kalai, Khetlal, Panchbibi
  * **Pabna (9):** Atgharia, Bera, Bhangura, Chatmohar, Faridpur, Ishwardi, Santhia, Sujanagar, Pabna Sadar
  * **Sirajganj (9):** Belkuchi, Chauhali, Kamarkhanda, Kazipur, Raiganj, Shahjadpur, Sirajganj Sadar, Tarash, Ullahpara
* **GPS & Proximity:** "আমার অবস্থান ব্যবহার করুন" (Use my location) calculates nearest Euclidean distance to all 67 coordinates; non-Rajshahi users are gracefully routed to the nearest upazila with an honest disclaimer.
* **Selection Memory:** LocalStorage and Supabase restore the farmer's last selected location automatically.

### 3. Daily Weather Updates & Automated Cron Cache
* **Open-Meteo & NASA POWER:** 7-day daily forecasts combined with historical satellite baseline.
* **Scheduled Cron Sync:** Daily morning job at 06:00 AM BST / 00:00 UTC (`/api/cron/weather-sync`) secured by `CRON_SECRET`.
  * Configured via **Vercel Cron** (`vercel.json`) and **GitHub Actions** (`.github/workflows/weather-cron.yml`).
  * Pre-fetches and caches 7-day weather for all 67 upazilas in `apps/web/src/data/weather_cache.json` and Supabase `weather_cache` table to eliminate external latency.
* **Crop-Relevant Alerts in Bangla:**
  * 🌧️ Heavy rainfall warning ($\ge 10$ mm)
  * ☀️ Heat stress warning ($\ge 35$°C)
  * 🌾 Good sowing/harvesting conditions
  * 💧 Irrigation advice
* **Agro-Weather Notification Dispatcher:** Email dispatcher hook built with Resend (`apps/web/src/lib/notifications/emailDispatcher.ts`) supporting daily weather digest and urgent alerts.

### 4. XGBoost Machine Learning Engine (`/ml`)
* **Pipeline Architecture:**
  * Raw data ingestion from 10-year monthly NASA POWER agroclimatology: `ml/data/raw/`
  * Processed feature matrix: `ml/data/processed/training_rotations_dataset.csv`
  * Training pipeline: `ml/train.py` with 70% Train, 15% Validation, 15% Test split, 5-fold cross-validation, hyperparameter grid search, and feature importance.
* **Evaluation Metrics:**
  * Model file: `ml/models/model.json`
  * Metrics report: `ml/models/metrics_report.json`
  * **Test $R^2$ Score:** `0.9963`
  * **Test RMSE:** `৳266.68 / bigha`
  * **Test MAE:** `৳127.99 / bigha`
  * **5-Fold CV Mean $R^2$:** `0.9965`
* **Features Used:**
  * Upazila & District location encodings
  * Soil texture & drainage categories (Clay, Loam, Sandy Loam)
  * Seasonal precipitation (mm) and temperature extremes (°C)
  * Topsoil and rootzone wetness indices from NASA POWER/SMAP
  * Crop season indicator (Rabi, Kharif-1, Kharif-2)
  * Irrigation availability & source
  * Rotation sequence and preceding crop effect
* **FastAPI Microservice:** `ml/serve.py` serves predictions via REST API, outputting top 3 rotations with 95% confidence intervals.

### 5. Accurate Cost Variables & Participatory Budgeting
* **Transparent Cost Model (`data/costs.json`):**
  * Line-item breakdown per crop per bigha (with decimal and acre conversions):
    * Land preparation & tillage
    * Seed cost
    * Fertilizers: Urea, TSP, MoP, Gypsum, Zinc, Boron, Organic manure
    * Irrigation count & electricity/diesel tariffs
    * Labour wages (sowing, weeding, harvest)
    * Plant protection (pesticides/fungicides)
    * Post-harvest (threshing, bagging)
    * Transport & market tolls
    * Land rent/lease
* **Official Data Sources:**
  * BARC Fertilizer Recommendation Guide (FRG 2024)
  * Department of Agricultural Marketing (DAM) farmgate prices
  * Barind Multipurpose Development Authority (BMDA) deep tube-well prepaid meter tariffs
* **Interactive Participatory Budgeting Drawer (`CostBreakdownDrawer.tsx`):**
  * Farmers tap the cost metric (e.g. ৳14,500 ⓘ) on any rotation card.
  * Adjust inputs live (e.g., using own saved seed $\rightarrow$ reduce seed cost; family labour $\rightarrow$ reduce labour expense).
  * Dynamic live recalculation: $\text{Profit} = (\text{Yield} \times \text{Price}) - \text{Total Cost}$.
  * Outputs **Best Case**, **Expected Case**, and **Worst Case** profit scenarios.

### 6. PICSA-Based Historical Climate & Risk Analysis
* **PICSA Methodology (University of Reading / FAO / DAE):**
  * Historical 30-year climatology baseline from NASA POWER (1991–2024 daily data) for all 8 districts (`data/picsa_climate_history.json`).
  * **Rainy Season Onset:** Historical typical window (e.g., June 8–14 in Rajshahi).
  * **Rainy Season Cessation:** Historical cessation window (e.g., October 10–16).
  * **Effective Season Length:** ~124–135 days.
  * **Agro-Climatic Risk Probabilities:**
    * *Kharif-1 Dry Spell Risk:* 22% probability of $>10$ consecutive rainless days in Barind.
    * *Pre-Monsoon Heat Stress:* 44% probability of $>35$°C temperatures during Boro flowering.
    * *Winter Cold Injury:* 28% probability of $<10$°C temperatures causing potato late blight.
* **Interactive Monthly Climate Chart:** Visual SVG bars showing monthly rainfall distribution and temperature ranges with tooltips.
* **Climate-Matched Crop Options:** Verified agronomic practices and varieties from BARI (Mustard BARI-14/17, Mungbean BARI-6) and BRRI (Drought-tolerant Aman BRRI dhan71/83, Alternate Wetting and Drying / AWD for Boro).

### 7. Responsive Design & Accessibility
* **Viewport Support:** Fully responsive mobile-first design tested across 360px (mobile), 768px (tablet), 1024px (small desktop), and 1440px (wide screen).
* **Touch Targets:** All primary buttons and selectors have minimum touch targets $\ge 44$px (`min-h-[44px]`).
* **Bangla Typography:** Noto Sans Bengali / Hind Siliguri typography with authentic numeral formatting.
* **Zero Horizontal Scroll:** Fluid layouts with `max-w-[560px]` container and responsive grid columns.
* **Print Stylesheet:** Custom `@media print` rules ensure clean, paper-ready printing of the 3-season crop calendar on standard A4 paper without background clutter.

---

## 🔬 Data Sources & Licenses

| Source | Dataset | Coverage | License / Citation |
| :--- | :--- | :--- | :--- |
| **NASA POWER** | Daily Agroclimatology & Monthly Climatology | 1991 – 2026 (Daily, 0.5° grid) | Public Domain / NASA Earth Science |
| **NASA SMAP** | Rootzone & Surface Soil Moisture (L4) | 2015 – 2026 | Public Domain / NASA JPL |
| **NASA MODIS** | NDVI & Vegetation Indices (250m) | 2000 – 2026 | Public Domain / NASA GSFC |
| **BBS** | Bangladesh Administrative Boundaries & Agri Yearbooks | 8 Districts, 67 Upazilas | Official BBS Open Government Data |
| **BARC** | Fertilizer Recommendation Guide (FRG 2024) | Soil nutrient doses per crop per AEZ | Bangladesh Agricultural Research Council |
| **DAM** | Daily Agricultural Marketing Wholesale & Farmgate Rates | 2024 – 2026 Market Rates | Department of Agricultural Marketing (Govt of BD) |
| **BMDA** | Deep Tubewell Irrigation Tariffs | Barind Command Area | Barind Multipurpose Development Authority |
| **DAE / BRRI / BARI** | Crop Cultivation Manuals & Variety Characteristics | National Crop Recommendations | DAE / BRRI / BARI Official Bulletins |
| **Open-Meteo** | High-Resolution 7-Day Weather Forecasts | Global (Free Non-Commercial) | CC-BY 4.0 Open-Meteo |

### ⚠️ Known Data Gaps & Transparency
In strict accordance with project integrity requirements, **no training data has been synthesized or fabricated**. The following data gaps are explicitly acknowledged:
1. **Village Haat Price Volatility:** DAM provides national and district-level wholesale prices; daily spot prices at rural weekly haats vary by $\pm 5\text{--}10\%$ depending on local trader liquidity. The participatory cost drawer lets farmers input their actual local market rate.
2. **Sub-Meter Soil Micronutrient Variance:** Soil texture and AEZ classifications are modeled at the Upazila level based on SRDI/BARC data; field-level soil tests should be consulted for site-specific zinc/boron deficiencies.
3. **Private Shallow Tubewell (STW) Fuel Tariffs:** BMDA prepaid meter rates are standardized, but private diesel pump owners charge varying hourly rates.

---

## 💻 Setup & Local Development

### Prerequisites
* Node.js 18+ or 20+
* Python 3.10+ (for ML pipeline)
* Git

### 1. Web Application Setup
```bash
# Clone the repository
git clone https://github.com/nmtaief/FarmScale.git
cd FarmScale

# Install dependencies across monorepo workspace
npm install

# Setup environment variables
cp apps/web/.env.example apps/web/.env.local
# Edit apps/web/.env.local with your Supabase credentials (optional)

# Run Next.js 15 development server
npm run dev
```
Open **[http://localhost:3000/bn](http://localhost:3000/bn)** in your browser.

### 2. Run Test Suite
```bash
# Run Vitest test suite across all packages
npm test
```
All 44 automated unit and integration tests pass with 100% success.

### 3. Machine Learning Pipeline & Retraining
```bash
# Navigate to ML directory
cd ml

# Install Python requirements
pip install -r requirements.txt

# Retrain the XGBoost model
python train.py

# Launch the FastAPI recommendation service
uvicorn serve:app --host 0.0.0.0 --port 8000 --reload
```
API Documentation will be live at **http://localhost:8000/docs**.

---

## 🔑 Environment Variables

See [`apps/web/.env.example`](file:///f:/Nasa%20API/FarmScale/apps/web/.env.example) for the complete list:

| Variable | Required | Description |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Optional | Supabase project URL for Google Sign-In & persistence |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Optional | Supabase public anonymous API key |
| `CRON_SECRET` | Optional | Secret key protecting `/api/cron/weather-sync` endpoint |
| `RESEND_API_KEY` | Optional | Resend API key for daily agro-weather email alerts |
| `XGBOOST_SERVICE_URL` | Optional | FastAPI microservice URL (defaults to Next.js ML engine) |
| `OPENROUTER_API_KEY` | Optional | LLM key for AI agricultural advisory queries |

---

## 👥 NASA Space Apps Challenge 2026 Team

* **Project Name:** FarmScale
* **Lead Developer & Submitter:** Noor Mohammed Taief ([@nmtaief](https://github.com/nmtaief))
* **Challenge:** Climate-Smart Agriculture / Earth Observation for Food Security
* **Target Community:** Smallholder Farmers in Rajshahi Division, Bangladesh
