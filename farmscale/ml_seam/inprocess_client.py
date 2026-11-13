"""In-process MLClient implementation connected directly with the Layer 3 XGBoost ML model."""

from __future__ import annotations

import sys
from pathlib import Path
from typing import Any


class InProcessMLClient:
    """
    In-process ML client connected to the real Layer 3 XGBoost crop rotation engine.
    This is the ONLY file in FarmScale allowed to import `ml.*`.
    """

    def _load_ml_module(self) -> Any:
        # Dynamically locate the NasaAPIgateWay directory containing the ml package
        here = Path(__file__).resolve()
        candidates = [
            here.parents[3] / "FarmScale" / "NasaAPIgateWay",
            here.parents[3] / "NasaSpaceAppDataGateWay" / "NasaAPIgateWay",
            here.parents[2] / "FarmScale" / "NasaAPIgateWay",
            here.parents[2] / "NasaSpaceAppDataGateWay" / "NasaAPIgateWay",
            here.parents[2] / "NasaAPIgateWay",
            here.parents[1] / "NasaAPIgateWay",
            here.parents[1] / "ml",
            Path("f:/Nasa API/FarmScale/NasaAPIgateWay"),
        ]
        gateway_dir = None
        for cand in candidates:
            if (cand / "ml").is_dir():
                gateway_dir = cand
                break
            elif cand.name == "ml" and cand.is_dir() and (cand / "llm_tool.py").is_file():
                gateway_dir = cand.parent
                break

        if gateway_dir and str(gateway_dir) not in sys.path:
            sys.path.insert(0, str(gateway_dir))

        try:
            from ml.llm_tool import execute_ml_tool_call
            from ml.service import get_service

            return {
                "execute_ml_tool_call": execute_ml_tool_call,
                "get_service": get_service,
            }
        except ImportError as exc:
            raise RuntimeError(
                f"In-process ML package 'ml' could not be loaded from {gateway_dir}. "
                "Ensure FarmScale/NasaAPIgateWay is available on PYTHONPATH."
            ) from exc

    def rank(self, request: dict[str, Any]) -> dict[str, Any]:
        import copy
        ml_mod = self._load_ml_module()
        execute_fn = ml_mod["execute_ml_tool_call"]

        # Call real XGBoost recommendation engine
        raw = execute_fn(request)
        payload = copy.deepcopy(raw)

        # Normalize to strictly satisfy ml_payload.schema.json:
        # 1. plain_language_answer: schema requires string or null (raw returns a dict)
        pla = payload.get("plain_language_answer")
        if isinstance(pla, dict):
            payload["plain_language_answer"] = (
                pla.get("summary")
                or pla.get("heading")
                or "NASA-backed XGBoost crop rotation recommendation."
            )

        # 2. texture_group: schema requires string (raw returns int e.g. 3)
        soil = payload.get("telemetry_used", {}).get("soilgrids_soil", {})
        if "texture_group" in soil:
            tg = soil["texture_group"]
            tg_map = {1: "sandy_loam", 2: "loam", 3: "clay_loam", 4: "clay"}
            if isinstance(tg, int):
                soil["texture_group"] = tg_map.get(tg, str(tg))
            elif not isinstance(tg, str):
                soil["texture_group"] = str(tg)

        # 3. Ensure ml_metadata has version and model_type
        meta = payload.setdefault("ml_metadata", {})
        if not meta.get("model_type"):
            meta["model_type"] = "XGBoost Regressor (Layer 3)"
        if not meta.get("version"):
            meta["version"] = "v1.0.6"

        return payload

    def health(self) -> dict[str, Any]:
        try:
            ml_mod = self._load_ml_module()
            svc = ml_mod["get_service"]()
            st = svc.status()
            return {
                "status": "ok",
                "mode": "inprocess",
                "model_type": st.get("model_type", "XGBoost Regressor (Layer 3)"),
                "version": st.get("version", "v1.0.6"),
                "num_trees": st.get("num_trees", 0),
            }
        except Exception as exc:
            return {"status": "unavailable", "mode": "inprocess", "error": str(exc)}
