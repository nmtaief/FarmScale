"""
FarmScale Layer 3: XGBoost Crop Rotation Profit & Yield Training Pipeline
Trained on real NASA Earth Observation telemetry (POWER, SMAP, MODIS) and BBS/DAE statistics.
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

def run_training():
    print("=" * 60)
    print("🛰️  FarmScale XGBoost Model Training (Layer 3)")
    print("=" * 60)

    if not DATA_PATH.exists():
        raise FileNotFoundError(f"Processed dataset not found at {DATA_PATH}")

    df = pd.read_csv(DATA_PATH)
    print(f"Loaded dataset: {df.shape[0]} samples, {df.shape[1]} columns.")

    feature_cols = [
        "lat", "lon", "precip_annual_avg", "temp_mean", "rootzone_wetness",
        "water_stress_score", "soil_ph", "soil_texture_group", "irrigation_available",
        "total_water_mm", "total_cost_bdt"
    ]

    # One-hot encode categorical features
    cat_cols = ["district", "rotation_key", "crop_rabi"]
    df_encoded = pd.get_dummies(df, columns=cat_cols, drop_first=True)

    encoded_feature_cols = [c for c in df_encoded.columns if c not in [
        "upazila", "crop_kharif1", "crop_kharif2", "expected_yield_sum_kg", "target_net_profit_bdt"
    ]]

    X = df_encoded[encoded_feature_cols]
    y = df_encoded["target_net_profit_bdt"]

    print(f"Total features after encoding: {X.shape[1]}")

    # 1. Train / Val / Test split (70 / 15 / 15)
    X_train_val, X_test, y_train_val, y_test = train_test_split(
        X, y, test_size=0.15, random_state=42
    )
    X_train, X_val, y_train, y_val = train_test_split(
        X_train_val, y_train_val, test_size=0.1765, random_state=42 # 0.1765 * 0.85 approx 0.15
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
        for col, imp in sorted(zip(encoded_feature_cols, importances), key=lambda x: x[1], reverse=True)[:10]
    }
    print("\n🔝 Top 5 Predictive Features:")
    for col, imp in list(feature_imp.items())[:5]:
        print(f"  - {col}: {imp * 100:.2f}%")

    # 6. Save model to JSON
    model.save_model(str(MODEL_FILE))
    print(f"\n✅ Model saved to: {MODEL_FILE}")

    # 7. Save metrics report
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
            "mae_bdt": round(mae, 2)
        },
        "best_hyperparameters": best_params,
        "top_features_importance": feature_imp,
        "feature_columns": encoded_feature_cols
    }

    with open(METRICS_FILE, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)
    print(f"✅ Metrics report saved to: {METRICS_FILE}")

    return report

if __name__ == "__main__":
    run_training()
