"""Layer 3: Live-Updatable XGBoost ML Model for Crop Rotation Recommendation.

Follows architecture.mermaid:
- D: Location features (weather trends, soil, water, vegetation index, pH) + Crop data + Goal
- E: Score and rank crop rotations for this goal
- Live-Updatable: supports online incremental learning via warm-start boosting (`xgb_model=booster`)
"""
import os
import json
import time
import threading
import datetime as dt
from pathlib import Path
from typing import Dict, List, Any, Optional, Tuple

import numpy as np
import pandas as pd
import xgboost as xgb
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score

from .rotations import ROTATION_TEMPLATES, calculate_rotation_metrics
from .feature_pipeline import (
    FEATURE_COLUMNS,
    assemble_feature_vector,
    get_district_soil,
)

_HERE = Path(__file__).parent
_MODELS_DIR = _HERE / "models"
_MODELS_DIR.mkdir(parents=True, exist_ok=True)

MODEL_FILE = _MODELS_DIR / "xgb_crop_rotation.json"
META_FILE = _MODELS_DIR / "model_meta.json"


class LiveUpdatableXGBoost:
    """Thread-safe, live-updatable XGBoost engine for crop rotation scoring and ranking."""

    def __init__(self, model_path: Optional[Path] = None, meta_path: Optional[Path] = None):
        self.model_path = model_path or MODEL_FILE
        self.meta_path = meta_path or META_FILE
        self.booster: Optional[xgb.Booster] = None
        self.feature_names: List[str] = list(FEATURE_COLUMNS)
        self.version: str = "v1.0.0"
        self.total_samples: int = 0
        self.live_updates_count: int = 0
        self.last_updated: Optional[str] = None
        self.metrics: Dict[str, float] = {}
        self.top_features: Dict[str, float] = {}
        self.update_history: List[Dict[str, Any]] = []
        self._lock = threading.RLock()

        # Try to load existing model from disk
        self.load()

    def train(
        self,
        X: pd.DataFrame,
        y: pd.Series,
        n_estimators: int = 250,
        version_tag: str = "v1.0.0",
        test_size: float = 0.2
    ) -> Dict[str, Any]:
        """Perform full baseline training on assembled real NASA dataset."""
        with self._lock:
            # Ensure feature ordering matches FEATURE_COLUMNS
            for col in self.feature_names:
                if col not in X.columns:
                    X[col] = 0.0
            X_ordered = X[self.feature_names]

            X_train, X_test, y_train, y_test = train_test_split(
                X_ordered, y, test_size=test_size, random_state=42
            )

            dtrain = xgb.DMatrix(X_train, label=y_train, feature_names=self.feature_names)
            dtest = xgb.DMatrix(X_test, label=y_test, feature_names=self.feature_names)

            params = {
                "objective": "reg:squarederror",
                "eval_metric": ["rmse", "mae"],
                "max_depth": 6,
                "learning_rate": 0.08,
                "subsample": 0.85,
                "colsample_bytree": 0.85,
                "min_child_weight": 3,
                "tree_method": "hist",
                "seed": 42
            }

            self.booster = xgb.train(
                params,
                dtrain,
                num_boost_round=n_estimators,
                evals=[(dtest, "test")],
                verbose_eval=False
            )

            preds = self.booster.predict(dtest)
            rmse = float(np.sqrt(mean_squared_error(y_test, preds)))
            mae = float(mean_absolute_error(y_test, preds))
            r2 = float(r2_score(y_test, preds))

            now_iso = dt.datetime.now(dt.timezone.utc).isoformat()
            self.version = version_tag
            self.total_samples = int(len(X))
            self.live_updates_count = 0
            self.last_updated = now_iso
            self.metrics = {
                "rmse": round(rmse, 4),
                "mae": round(mae, 4),
                "r2": round(r2, 4),
            }

            # Feature importance
            score_dict = self.booster.get_score(importance_type="gain")
            sorted_feats = sorted(score_dict.items(), key=lambda kv: kv[1], reverse=True)[:15]
            self.top_features = {k: round(v, 3) for k, v in sorted_feats}

            self.update_history = [{
                "event": "full_train",
                "version": version_tag,
                "timestamp": now_iso,
                "samples_trained": len(X),
                "num_trees": self.booster.num_boosted_rounds(),
                "metrics": self.metrics
            }]

            self.save()
            return self.get_status()

    def live_update(
        self,
        X_new: pd.DataFrame,
        y_new: pd.Series,
        additional_trees: int = 25,
        learning_rate: float = 0.03
    ) -> Dict[str, Any]:
        """Incremental online learning: warm-starts from active booster and fits additional trees."""
        with self._lock:
            if self.booster is None:
                raise RuntimeError("Cannot perform live update: no base model trained yet.")

            for col in self.feature_names:
                if col not in X_new.columns:
                    X_new[col] = 0.0
            X_ordered = X_new[self.feature_names]

            dnew = xgb.DMatrix(X_ordered, label=y_new, feature_names=self.feature_names)

            params = {
                "objective": "reg:squarederror",
                "max_depth": 5,
                "learning_rate": learning_rate,
                "subsample": 0.85,
                "colsample_bytree": 0.85,
                "tree_method": "hist"
            }

            old_trees = self.booster.num_boosted_rounds()
            # Hot incremental training
            new_booster = xgb.train(
                params,
                dnew,
                num_boost_round=additional_trees,
                xgb_model=self.booster
            )
            # Atomic swap
            self.booster = new_booster
            total_trees = self.booster.num_boosted_rounds()

            # Bump version (v1.0.0 -> v1.0.1)
            parts = self.version.lstrip("v").split(".")
            if len(parts) == 3:
                new_patch = int(parts[2]) + 1
                self.version = f"v{parts[0]}.{parts[1]}.{new_patch}"
            else:
                self.version = f"{self.version}.1"

            now_iso = dt.datetime.now(dt.timezone.utc).isoformat()
            self.last_updated = now_iso
            self.total_samples += len(X_new)
            self.live_updates_count += 1

            # Update feature importances
            score_dict = self.booster.get_score(importance_type="gain")
            sorted_feats = sorted(score_dict.items(), key=lambda kv: kv[1], reverse=True)[:15]
            self.top_features = {k: round(v, 3) for k, v in sorted_feats}

            self.update_history.append({
                "event": "live_incremental_update",
                "version": self.version,
                "timestamp": now_iso,
                "samples_added": len(X_new),
                "trees_added": total_trees - old_trees,
                "total_trees": total_trees
            })
            if len(self.update_history) > 50:
                self.update_history.pop(0)

            self.save()
            return self.get_status()

    def rank_rotations(
        self,
        env_data: Dict[str, Any],
        goal: str,
        district: str = "Rajshahi",
        top_k: int = 3
    ) -> List[Dict[str, Any]]:
        """Score and rank all candidate crop rotations using the active XGBoost model."""
        with self._lock:
            if self.booster is None:
                raise RuntimeError("ML model not initialized. Please train or load a model.")

            rows = []
            rot_items = []

            for r in ROTATION_TEMPLATES:
                metrics = calculate_rotation_metrics(r["pattern"])
                feat_vec = assemble_feature_vector(env_data, metrics, goal, district)
                rows.append(feat_vec)
                rot_items.append((r, metrics, feat_vec))

            df_eval = pd.DataFrame(rows)
            for col in self.feature_names:
                if col not in df_eval.columns:
                    df_eval[col] = 0.0
            X_eval = df_eval[self.feature_names]

            dm = xgb.DMatrix(X_eval, feature_names=self.feature_names)
            scores = self.booster.predict(dm)

            scored_rotations = []
            for idx, (r, metrics, feat_vec) in enumerate(rot_items):
                raw_score = float(scores[idx])
                clean_score = float(max(10.0, min(99.0, round(raw_score, 1))))

                scored_rotations.append({
                    "id": r["id"],
                    "name": r["name"],
                    "bengali_name": r.get("bengali_name", r["name"]),
                    "crops": r.get("pattern", []),
                    "pattern": r.get("pattern", []),
                    "seasons": r["seasons"],
                    "primary_fit": r["primary_fit"],
                    "suitable_zones": r.get("suitable_zones", []),
                    "description": r["description"],
                    "score": clean_score,
                    "ml_score": clean_score,
                    "metrics": {
                        "total_duration_days": metrics["rot_total_cycle_days"],
                        "total_yield_t_ha": metrics["rot_total_yield_t_ha"],
                        "net_n_balance_kg_ha": metrics["rot_net_n_balance_kg_ha"],
                        "soil_cover_score": metrics["rot_soil_cover_score"],
                        "drought_resilience": metrics["rot_drought_resilience"],
                        "diversity_score": metrics["rot_diversity_score"],
                    },
                    "environmental_factors": {
                        "thermal_comfort_pct": round(feat_vec["thermal_comfort_ratio"], 1),
                        "ph_suitability_pct": round(feat_vec["ph_suitability_score"], 1),
                        "water_adequacy_pct": round(feat_vec["water_supply_adequacy"], 1),
                        "stress_vulnerability": round(feat_vec["moisture_stress_vulnerability"], 1),
                    }
                })

            # Sort descending by XGBoost score
            scored_rotations.sort(key=lambda item: item["ml_score"], reverse=True)

            for rank_idx, item in enumerate(scored_rotations):
                item["rank"] = rank_idx + 1

            return scored_rotations[:top_k]

    def save(self):
        """Persist booster and metadata to disk."""
        if self.booster is not None:
            self.booster.save_model(str(self.model_path))

        meta = {
            "version": self.version,
            "model_type": "XGBoost Regressor (Layer 3)",
            "total_samples": self.total_samples,
            "live_updates_count": self.live_updates_count,
            "last_updated": self.last_updated,
            "metrics": self.metrics,
            "top_features": self.top_features,
            "num_trees": self.booster.num_boosted_rounds() if self.booster else 0,
            "feature_names": self.feature_names,
            "update_history": self.update_history,
        }
        with open(self.meta_path, "w", encoding="utf-8") as f:
            json.dump(meta, f, indent=2)

    def load(self) -> bool:
        """Load booster and metadata if files exist."""
        if self.model_path.exists() and self.meta_path.exists():
            try:
                self.booster = xgb.Booster()
                self.booster.load_model(str(self.model_path))
                with open(self.meta_path, "r", encoding="utf-8") as f:
                    meta = json.load(f)
                    self.version = meta.get("version", "v1.0.0")
                    self.total_samples = meta.get("total_samples", 0)
                    self.live_updates_count = meta.get("live_updates_count", 0)
                    self.last_updated = meta.get("last_updated")
                    self.metrics = meta.get("metrics", {})
                    self.top_features = meta.get("top_features", {})
                    self.feature_names = meta.get("feature_names", list(FEATURE_COLUMNS))
                    self.update_history = meta.get("update_history", [])
                return True
            except Exception as e:
                print(f"Warning: could not load saved ML model: {e}")
                self.booster = None
        return False

    def get_status(self) -> Dict[str, Any]:
        """Return comprehensive live status of the ML model."""
        return {
            "status": "ready" if self.booster is not None else "not_trained",
            "version": self.version,
            "model_type": "XGBoost Regressor (Layer 3)",
            "num_trees": self.booster.num_boosted_rounds() if self.booster else 0,
            "total_samples_trained": self.total_samples,
            "live_updates_applied": self.live_updates_count,
            "last_updated": self.last_updated,
            "metrics": self.metrics,
            "top_features": self.top_features,
            "recent_history": self.update_history[-5:] if self.update_history else [],
        }


# Global singleton instance
_GLOBAL_MODEL = None


def get_ml_model() -> LiveUpdatableXGBoost:
    """Singleton getter for the XGBoost ML model."""
    global _GLOBAL_MODEL
    if _GLOBAL_MODEL is None:
        _GLOBAL_MODEL = LiveUpdatableXGBoost()
    return _GLOBAL_MODEL
