"""FarmScale Unified Web Application Runner.

Starts the full FarmScale system:
- Layer 1: LLM (OpenRouter & Prompt Interface)
- Layer 2: Crop Data Layer
- Layer 3: XGBoost ML Model & NASA Telemetry
"""
from __future__ import annotations

import os
import sys
from pathlib import Path

# Add paths to sys.path
root = Path(__file__).resolve().parent
farmscale_path = root / "farmscale"
gateway_path = root / "NasaAPIgateWay"

if str(farmscale_path) not in sys.path:
    sys.path.insert(0, str(farmscale_path))
if str(gateway_path) not in sys.path:
    sys.path.insert(0, str(gateway_path))

# Ensure in-process ML and OpenRouter are defaults
os.environ.setdefault("ML_MODE", "inprocess")
os.environ.setdefault("DEFAULT_LLM_PROVIDER", "openrouter")

if __name__ == "__main__":
    import uvicorn
    from farmscale.llm_layer.web.app import app

    host = os.environ.get("APP_HOST", "0.0.0.0")
    port = int(os.environ.get("APP_PORT", "8000"))
    print("=" * 60)
    print(" FarmScale Unified System Running!")
    print(f" Web Tester UI: http://127.0.0.1:{port}/tester.html")
    print(f" API Docs:      http://127.0.0.1:{port}/docs")
    print("=" * 60)
    uvicorn.run(app, host=host, port=port)
