"""XGBoost Crop Rotation ML Engine Package (Layer 3 & Arc Architecture)."""
from .service import get_service, CropRotationMLService
from .xgboost_model import get_ml_model, LiveUpdatableXGBoost
from .rotations import ROTATION_TEMPLATES, calculate_rotation_metrics
from .crops_kb import CROPS, get_crop

__all__ = [
    "get_service",
    "CropRotationMLService",
    "get_ml_model",
    "LiveUpdatableXGBoost",
    "ROTATION_TEMPLATES",
    "calculate_rotation_metrics",
    "CROPS",
    "get_crop",
]
