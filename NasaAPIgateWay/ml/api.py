"""FastAPI Router for XGBoost ML Crop Rotation Recommendation Engine (Layer 3 & Arc Architecture)."""
import time
from typing import Dict, List, Any, Optional, Literal
from fastapi import APIRouter, Depends, HTTPException, Query, Header
from pydantic import BaseModel, Field

from .service import get_service
from .rotations import ROTATION_TEMPLATES
from .crops_kb import CROPS

router = APIRouter(prefix="/v1/ml", tags=["machine-learning"])


class RecommendRequest(BaseModel):
    query: Optional[str] = Field(None, description="Natural language query from farmer in English or Bengali")
    district: Optional[str] = Field("Rajshahi", description="District name (e.g. Rajshahi, Bogura, Pabna)")
    upazila: Optional[str] = Field(None, description="Upazila name (e.g. Godagari, Tanore, Bagmara)")
    lat: Optional[float] = Field(None, ge=-90, le=90, description="Latitude")
    lon: Optional[float] = Field(None, ge=-180, le=180, description="Longitude")
    goal: Optional[Literal["cash_crop", "soil_fertility", "land_preservation", "cultivability"]] = Field(
        None, description="Farmer objective"
    )
    season: Optional[str] = Field("annual", description="Target season (annual, rabi, kharif_1, kharif_2)")
    language: Optional[Literal["en", "bn"]] = Field("en", description="Output language (en=English, bn=Bengali)")
    top_k: int = Field(3, ge=1, le=10, description="Number of top rotation candidates to return")
    env_override: Optional[Dict[str, Any]] = Field(None, description="Optional custom NASA environmental parameters")


class LiveUpdateRequest(BaseModel):
    additional_trees: int = Field(20, ge=5, le=100, description="Number of boosting rounds to add")
    learning_rate: float = Field(0.02, gt=0.0001, le=0.5, description="Fine-tuning learning rate")
    new_samples: Optional[List[Dict[str, Any]]] = Field(None, description="Optional custom training observations")


class RetrainRequest(BaseModel):
    max_climate_rows: int = Field(15000, ge=1000, le=50000, description="Max historical NASA records to train on")


@router.post("/recommend", summary="End-to-End Crop Rotation Recommendation (Layer 1 -> Layer 2 -> Layer 3)")
async def recommend_crop_rotations(body: RecommendRequest):
    """Executes the full pipeline from architecture.mermaid:

    1. Layer 1 LLM extracts intent, location, goal, and season from farmer text.
    2. Open Data Sources retrieve NASA POWER, SMAP, MODIS, and SoilGrids indicators.
    3. Layer 2 Crop Knowledge Base packages rotation templates and agronomic traits.
    4. Layer 3 XGBoost ML Model scores and ranks all rotations for the location and goal.
    5. Layer 1 outputs top 3 rotations with plain-language reasons in English or Bengali.
    """
    svc = get_service()
    try:
        result = svc.recommend(
            query=body.query,
            district=body.district,
            upazila=body.upazila,
            lat=body.lat,
            lon=body.lon,
            goal=body.goal,
            season=body.season,
            language=body.language,
            env_override=body.env_override,
            top_k=body.top_k,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"ML recommendation failed: {str(e)}")


@router.post("/update", summary="Live Online / Incremental Update of the XGBoost ML Model")
async def live_update_model(body: LiveUpdateRequest):
    """Incremental warm-start retraining on newly arrived NASA observations.

    - Updates the active booster in-memory without downtime (thread-safe hot swapping).
    - Preserves prior knowledge while adapting to recent satellite/climate observations.
    - Bumps version tag (e.g. v1.0.0 -> v1.0.1) and records updated validation metrics.
    """
    svc = get_service()
    try:
        status = svc.live_update(
            new_samples=body.new_samples,
            additional_trees=body.additional_trees,
        )
        return {
            "message": "XGBoost model successfully updated live in memory.",
            "updated_status": status,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Live update failed: {str(e)}")


@router.post("/retrain", summary="Full Retraining of the XGBoost Model on all NASA Datasets")
async def full_retrain_model(body: RetrainRequest):
    """Retrain the baseline XGBoost model across all 68,510+ NASA upazila records."""
    svc = get_service()
    try:
        status = svc.full_retrain(max_climate_rows=body.max_climate_rows)
        return {
            "message": "Full XGBoost model retrain completed successfully.",
            "status": status,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Retrain failed: {str(e)}")


@router.get("/status", summary="XGBoost Model Status, Version, Metrics, and Top Feature Importances")
async def get_model_status():
    """Retrieve active model version, R², MAE, RMSE, total samples, total trees, and feature importance rankings."""
    svc = get_service()
    return svc.status()


@router.get("/rotations", summary="List All Pre-Defined Crop Rotation Templates with Agronomic Metrics")
async def list_rotations():
    """Retrieve candidate rotation templates validated for Bangladesh / Rajshahi agro-ecological zones."""
    return {
        "count": len(ROTATION_TEMPLATES),
        "rotations": ROTATION_TEMPLATES,
    }


@router.get("/crops", summary="List Available Crops in Layer 2 Crop Knowledge Base")
async def list_crops():
    """Retrieve 32 FAO-56 crop profiles with nutrient uptake, cycles, temperature, and pH bounds."""
    return {
        "count": len(CROPS),
        "crops": list(CROPS.values()),
    }


# ------------------------------------------------------------- LLM Tool Integration
class ToolCallRequest(BaseModel):
    arguments: Dict[str, Any] = Field(..., description="Function arguments generated by the LLM tool call")


class LLMChatRequest(BaseModel):
    query: str = Field(..., description="Natural language question from the farmer (English or Bengali)")
    provider: Optional[Literal["auto", "openai", "gemini", "mock"]] = Field("auto", description="LLM provider")
    model_name: Optional[str] = Field(None, description="Model identifier (e.g. gpt-4o-mini, gemini-2.0-flash)")
    api_key: Optional[str] = Field(None, description="Optional custom API key for the LLM provider")


@router.get("/tool/schema", summary="LLM Function Calling Tool Definitions (OpenAI, Gemini, Anthropic)")
async def get_tool_schema():
    """Returns standardized tool declarations ready to be attached to an LLM call.
    
    Supports:
    - OpenAI format (`tools=[{"type": "function", "function": ...}]`)
    - Google Gemini format (`function_declarations=[...]`)
    - Anthropic Claude format (`input_schema={...}`)
    """
    from .llm_tool import get_all_tool_schemas
    return get_all_tool_schemas()


@router.post("/tool/call", summary="Execute LLM Tool Call Directly on the XGBoost ML Model")
async def call_tool_from_llm(body: ToolCallRequest):
    """Direct invocation endpoint for LLMs (GPT-4, Gemini, Claude, LangChain agents).
    
    Accepts LLM-generated arguments, runs Layer 3 XGBoost ML Model with real NASA telemetry,
    and returns a clean, structured payload plus an LLM prompt-ready context string.
    """
    from .llm_tool import execute_ml_tool_call
    try:
        return execute_ml_tool_call(body.arguments)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM tool execution error: {str(e)}")


@router.post("/llm/chat", summary="End-to-End LLM Agent Execution with XGBoost ML Tool Calling")
async def chat_with_llm_agent(body: LLMChatRequest):
    """Executes the complete LLM agent loop from architecture.mermaid:
    1. Farmer asks a question in Bengali or English.
    2. LLM decides to call the `query_nasa_crop_rotation_ml` tool.
    3. Tool scores and ranks rotations using the Layer 3 XGBoost model.
    4. LLM receives the factual NASA + ML payload and writes an empathetic, agronomist reply.
    """
    from .llm_tool import run_llm_agent
    try:
        return run_llm_agent(
            farmer_query=body.query,
            provider=body.provider,
            model_name=body.model_name,
            api_key=body.api_key
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM agent error: {str(e)}")
