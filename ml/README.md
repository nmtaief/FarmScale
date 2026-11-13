# 🌾 FarmScale Layer 3: XGBoost Crop Rotation Recommendation Engine

This module trains and serves the **Layer 3 XGBoost Machine Learning Model** that powers the FarmScale crop rotation recommender for smallholder farmers across all 67 Upazilas of Rajshahi Division, Bangladesh.

---

## 🛰️ 1. Real Data Sources & Provenance

We strictly adhere to real agro-climatic, market, and agronomic datasets. Zero synthetic or faked numbers are generated:

| Domain | Source | Parameters Used | License / Authority |
| :--- | :--- | :--- | :--- |
| **Historical Climate** | **NASA POWER API** (10-Year, 2016–2026, 130 months) | Daily precipitation, 2m air temperature, surface solar insolation, relative humidity | Open NASA Earthdata Policy |
| **Soil Telemetry** | **NASA SMAP & SoilGrids / SRDI** | 0–100 cm root-zone soil moisture (`sm_rootzone`), soil pH, organic carbon, texture class | NASA / ISRIC / SRDI Bangladesh |
| **Vegetation & Drought** | **NASA MODIS (MOD13Q1.061)** | 250m 16-day NDVI & EVI vegetation indices, VCI drought anomaly | USGS / NASA LP DAAC |
| **Crop Yields & Prices** | **BBS Agricultural Statistics & DAM Bangladesh** | Upazila-level historical crop yields (kg/bigha), wholesale farmgate prices | BBS / Dept. of Agricultural Marketing |
| **Fertilizer Doses** | **BARC Fertilizer Recommendation Guide (FRG)** | Official Nitrogen, Phosphorus, Potassium, Gypsum, Zinc per crop | Bangladesh Agricultural Research Council |
| **Administrative Units** | **BBS / Bangladesh GeoData** | Verified registry of all 67 Upazilas across 8 districts | Bangladesh Bureau of Statistics |

---

## ⚠️ 2. Known Data Gaps & Documented Assumptions

In accordance with scientific rigor, any unavailable granular data is transparently documented:

1. **Hyperlocal Energy & Tubewell Tariffs:**  
   Individual diesel pump rental and electricity meter rates vary across villages. We adopt the official **Barind Multipurpose Development Authority (BMDA)** regulated deep-tubewell (DTW) tariff per irrigation event rather than extrapolating speculative village rates.
2. **Sub-plot Micronutrient Heterogeneity:**  
   Farm-level soil test values for zinc and sulfur are mapped from the **SRDI Upazila Land and Soil Resource Utilization Guide (LSRUG)** regional soil texture classes rather than individual farm borehole probes.
3. **Pesticide Spot Prices:**  
   Plant protection costs represent standard preventive IPM protocols (e.g. Mancozeb for potato late blight, Imidacloprid for mustard aphids) published by the **Department of Agricultural Extension (DAE)**.

---

## ⚙️ 3. Training Pipeline & Model Performance

The training pipeline executes in `ml/train.py`:
1. **Splitting:** 70% Training ($N=139$), 15% Validation ($N=31$), and 15% Holdout Test ($N=31$).
2. **Cross-Validation:** 5-Fold Cross Validation with hyperparameter grid search over `max_depth`, `learning_rate`, `n_estimators`, `subsample`, and `colsample_bytree`.
3. **Holdout Evaluation Metrics:**
   * **$R^2$ Score:** `0.9963`
   * **RMSE:** `৳266.68` BDT
   * **MAE:** `৳127.99` BDT

### Top Predictive Feature Importance:
1. `rotation_key_profit`: 72.91%
2. `total_cost_bdt`: 15.24%
3. `total_water_mm`: 11.28%
4. `rotation_key_shift`: 0.24%
5. `district_Chapainawabganj`: 0.15%

---

## 🚀 4. How to Retrain the Model

```bash
# 1. Install dependencies
pip install xgboost scikit-learn pandas numpy fastapi uvicorn

# 2. Run the training pipeline
python ml/train.py

# 3. Start the FastAPI prediction service
python ml/serve.py
```
Model is exported to [`ml/models/model.json`](file:///f:/Nasa%20API/FarmScale/ml/models/model.json) and metrics to [`ml/models/metrics_report.json`](file:///f:/Nasa%20API/FarmScale/ml/models/metrics_report.json).
