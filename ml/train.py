"""
FarmScale Layer 3: XGBoost Crop Rotation Profit & Yield Training Pipeline
Trained on real NASA Earth Observation telemetry (POWER, SMAP) and BBS/DAE/SRDI/DAM statistics.
Includes: Train/Val/Test Split, 5-Fold Cross-Validation, Hyperparameter Search,
Evaluation Metrics (R2, RMSE, MAE), Feature Importance, and TreeSHAP Analysis.
"""

import os
import json
from pathlib import Path
import numpy as np
import pandas as pd
import xgboost as xgb
from sklearn.model_selection import train_test_split, KFold, GridSearchCV
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score

BASE_DIR = Path(__file__).parent
DATA_PATH = BASE_DIR / "data" / "processed" / "training_rotations_dataset.csv"
MODELS_DIR = BASE_DIR / "models"
MODELS_DIR.mkdir(parents=True, exist_ok=True)

MODEL_FILE = MODELS_DIR / "model.json"
METRICS_FILE = MODELS_DIR / "metrics_report.json"
UPAZILAS_FILE = BASE_DIR.parent / "data" / "rajshahi_division_upazilas.json"
PREDICTIONS_EXPORT_1 = BASE_DIR.parent / "data" / "rajshahi_xgboost_predictions.json"
PREDICTIONS_EXPORT_2 = BASE_DIR.parent / "apps" / "web" / "src" / "data" / "rajshahi_xgboost_predictions.json"

def run_training():
    print("=" * 60)
    print("🛰️  FarmScale XGBoost Model Training (Layer 3)")
    print("=" * 60)

    if not DATA_PATH.exists():
        raise FileNotFoundError(f"Processed dataset not found at {DATA_PATH}")

    df = pd.read_csv(DATA_PATH)
    print(f"Loaded dataset: {df.shape[0]} samples, {df.shape[1]} columns.")

    feature_cols = [
        "lat", "lon", "precip_annual_avg", "temp_mean", "temp_max", "temp_min",
        "rootzone_wetness", "water_stress_score", "soil_ph", "soil_soc_g_kg",
        "soil_clay_pct", "soil_texture_group", "irrigation_available",
        "total_water_mm", "total_cost_bdt"
    ]

    # One-hot encode categorical features
    cat_cols = ["district", "rotation_key", "crop_rabi"]
    df_encoded = pd.get_dummies(df, columns=cat_cols, drop_first=True)

    non_feature_cols = [
        "upazila", "crop_kharif1", "crop_kharif2", "expected_yield_sum_kg",
        "expected_rabi_yield_kg", "rabi_cost_bdt", "target_net_profit_bdt"
    ]
    encoded_feature_cols = [c for c in df_encoded.columns if c not in non_feature_cols]

    X = df_encoded[encoded_feature_cols]
    y = df_encoded["target_net_profit_bdt"]

    print(f"Total features after encoding: {X.shape[1]}")

    # 1. Train / Val / Test split (70 / 15 / 15)
    X_train_val, X_test, y_train_val, y_test = train_test_split(
        X, y, test_size=0.15, random_state=42
    )
    X_train, X_val, y_train, y_val = train_test_split(
        X_train_val, y_train_val, test_size=0.1765, random_state=42  # 0.1765 * 0.85 approx 0.15
    )

    print(f"Dataset split: Train={len(X_train)} (70%), Val={len(X_val)} (15%), Test={len(X_test)} (15%)")

    # 2. 5-Fold Cross Validation & Hyperparameter Grid Search
    param_grid = {
        "max_depth": [4, 6],
        "learning_rate": [0.05, 0.08],
        "n_estimators": [150, 250],
        "subsample": [0.85, 1.0],
        "colsample_bytree": [0.85, 1.0],
    }

    base_estimator = xgb.XGBRegressor(
        objective="reg:squarederror",
        tree_method="hist",
        random_state=42
    )

    kf = KFold(n_splits=5, shuffle=True, random_state=42)
    grid_search = GridSearchCV(
        estimator=base_estimator,
        param_grid=param_grid,
        scoring="neg_root_mean_squared_error",
        cv=kf,
        n_jobs=-1,
        verbose=0
    )

    print("Running 5-fold cross-validation and hyperparameter search...")
    grid_search.fit(X_train, y_train)

    best_params = grid_search.best_params_
    print(f"Best hyperparameters: {best_params}")

    # 3. Train final model with best parameters
    model = xgb.XGBRegressor(
        **best_params,
        objective="reg:squarederror",
        tree_method="hist",
        random_state=42
    )
    model.fit(
        X_train, y_train,
        eval_set=[(X_val, y_val)],
        verbose=False
    )

    # 4. Evaluate on holdout test set
    test_preds = model.predict(X_test)
    rmse = float(np.sqrt(mean_squared_error(y_test, test_preds)))
    mae = float(mean_absolute_error(y_test, test_preds))
    r2 = float(r2_score(y_test, test_preds))

    print("\n📊 Holdout Test Set Performance:")
    print(f"  • R² Score: {r2:.4f}")
    print(f"  • RMSE:     ৳{rmse:.2f}")
    print(f"  • MAE:      ৳{mae:.2f}")

    # 5. Feature Importance Analysis
    importances = model.feature_importances_
    feature_imp = {
        col: float(imp)
        for col, imp in sorted(zip(encoded_feature_cols, importances), key=lambda x: x[1], reverse=True)[:15]
    }
    print("\n🔝 Top 5 Predictive Features:")
    for col, imp in list(feature_imp.items())[:5]:
        print(f"  - {col}: {imp * 100:.2f}%")

    # 6. TreeSHAP Analysis
    dtest = xgb.DMatrix(X_test, feature_names=encoded_feature_cols)
    booster = model.get_booster()
    shap_contribs = booster.predict(dtest, pred_contribs=True)
    # Mean absolute SHAP value per feature
    mean_abs_shap = np.mean(np.abs(shap_contribs[:, :-1]), axis=0)
    shap_ranking = {
        col: float(round(val, 2))
        for col, val in sorted(zip(encoded_feature_cols, mean_abs_shap), key=lambda x: x[1], reverse=True)[:10]
    }
    print("\n🔬 Top 5 TreeSHAP Attribution Magnitude (BDT):")
    for col, val in list(shap_ranking.items())[:5]:
        print(f"  - {col}: ৳{val:,.2f}")

    # 7. Save model to JSON
    model.save_model(str(MODEL_FILE))
    print(f"\n✅ Model saved to: {MODEL_FILE}")

    # 8. Save metrics report
    report = {
        "model_type": "XGBoost Regressor (Layer 3)",
        "version": "2.0.0",
        "dataset_samples": int(len(df)),
        "train_samples": int(len(X_train)),
        "val_samples": int(len(X_val)),
        "test_samples": int(len(X_test)),
        "evaluation_metrics": {
            "r2_score": round(r2, 4),
            "rmse_bdt": round(rmse, 2),
            "mae_bdt": round(mae, 2),
            "cv_5fold_rmse_bdt": round(float(-grid_search.best_score_), 2)
        },
        "best_hyperparameters": best_params,
        "top_features_importance": feature_imp,
        "shap_feature_attributions_bdt": shap_ranking,
        "feature_columns": encoded_feature_cols
    }

    with open(METRICS_FILE, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)
    print(f"✅ Metrics report saved to: {METRICS_FILE}")

    # 9. Precompute all 67 upazila predictions for low-latency web serving
    print("\n⚡ Precomputing XGBoost predictions for all 67 Rajshahi Upazilas...")
    all_preds = model.predict(X)
    df["xgb_predicted_profit_bdt"] = all_preds

    predictions_export = {
        "model": "XGBoost Regressor (Layer 3)",
        "version": "2.0.0",
        "r2_score": round(r2, 4),
        "rmse_bdt": round(rmse, 2),
        "total_upazilas": 67,
        "upazilas": {}
    }

    # Group by upazila
    for u_name, group in df.groupby("upazila"):
        dist_name = group.iloc[0]["district"]
        lat = float(group.iloc[0]["lat"])
        lon = float(group.iloc[0]["lon"])

        upazila_data = {
            "upazila_en": u_name,
            "district_en": dist_name,
            "lat": lat,
            "lon": lon,
            "soil_ph": float(group.iloc[0]["soil_ph"]),
            "soil_soc_g_kg": float(group.iloc[0]["soil_soc_g_kg"]),
            "precip_annual_avg": float(group.iloc[0]["precip_annual_avg"]),
            "temp_mean": float(group.iloc[0]["temp_mean"]),
            "water_stress_score": float(group.iloc[0]["water_stress_score"]),
            "rotations": {}
        }

        for _, row in group.iterrows():
            r_key = row["rotation_key"]
            pred_profit = float(row["xgb_predicted_profit_bdt"])
            # Round profit to nearest 250 BDT for clean farmer presentation
            rounded_profit = int(round(pred_profit / 250.0) * 250)
            
            # Confidence interval: 95% CI is ± (1.96 * RMSE)
            lower_ci = int(round((pred_profit - 1.96 * rmse) / 100.0) * 100)
            upper_ci = int(round((pred_profit + 1.96 * rmse) / 100.0) * 100)

            # Cost per bigha:
            # We show the Rabi seasonal production cost (or total rotation cost)
            # For farmer clarity:
            # Potato Rabi cost: 33,500 + irr_adj (or approx 22,000 operational cash)
            # We provide both detailed breakdown and operational cost
            upazila_data["rotations"][r_key] = {
                "rotation_key": r_key,
                "predicted_profit_bdt": rounded_profit,
                "exact_xgb_profit_bdt": round(pred_profit, 2),
                "confidence_range": {
                    "lower_bdt": lower_ci,
                    "upper_bdt": upper_ci
                },
                "total_cost_bdt": int(row["total_cost_bdt"]),
                "rabi_cost_bdt": int(row["rabi_cost_bdt"]),
                "expected_yield_sum_kg": int(row["expected_yield_sum_kg"]),
                "expected_rabi_yield_kg": int(row["expected_rabi_yield_kg"]),
                "water": "mid" if r_key in ["profit", "maize_commercial", "onion_spices"] else "low",
            }

        predictions_export["upazilas"][u_name.lower().replace(" ", "_")] = upazila_data
        predictions_export["upazilas"][u_name.lower()] = upazila_data

    # Save to both data/ and apps/web/src/data/
    PREDICTIONS_EXPORT_1.parent.mkdir(parents=True, exist_ok=True)
    with open(PREDICTIONS_EXPORT_1, "w", encoding="utf-8") as f:
        json.dump(predictions_export, f, indent=2, ensure_ascii=False)

    PREDICTIONS_EXPORT_2.parent.mkdir(parents=True, exist_ok=True)
    with open(PREDICTIONS_EXPORT_2, "w", encoding="utf-8") as f:
        json.dump(predictions_export, f, indent=2, ensure_ascii=False)

    print(f"✅ Precomputed XGBoost predictions saved to:\n   - {PREDICTIONS_EXPORT_1}\n   - {PREDICTIONS_EXPORT_2}")
    print("\n🎉 Training pipeline completed successfully!")

if __name__ == "__main__":
    run_training()
