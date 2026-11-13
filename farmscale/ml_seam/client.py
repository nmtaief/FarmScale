"""MLClient Protocol and factory for selecting mock, http, or inprocess ML."""

from __future__ import annotations

import os
from pathlib import Path
from typing import Any, Protocol, runtime_checkable
from dotenv import load_dotenv

_ENV_PATH = Path(__file__).resolve().parents[1] / ".env"
if _ENV_PATH.exists():
    load_dotenv(_ENV_PATH)



@runtime_checkable
class MLClient(Protocol):
    """Protocol that all Layer 3 ML clients must satisfy."""

    def rank(self, request: dict[str, Any]) -> dict[str, Any]:
        """Rank crop rotations for the given request payload."""
        ...

    def health(self) -> dict[str, Any]:
        """Return health and active mode metadata for the ML client."""
        ...


def get_ml_client(
    mode: str | None = None,
    http_url: str | None = None,
    timeout: float | None = None,
) -> MLClient:
    """Instantiate the configured MLClient ('mock', 'http', or 'inprocess')."""
    selected = (mode or os.getenv("ML_MODE", "mock")).strip().lower()
    if selected == "mock":
        from ml_seam.mock_client import MockMLClient

        return MockMLClient()
    if selected == "http":
        from ml_seam.http_client import HttpMLClient

        url = http_url or os.getenv("ML_HTTP_URL", "http://localhost:8001")
        t = timeout if timeout is not None else float(os.getenv("ML_TIMEOUT_SECONDS", "15"))
        return HttpMLClient(base_url=url, timeout=t)
    if selected == "inprocess":
        from ml_seam.inprocess_client import InProcessMLClient

        return InProcessMLClient()
    raise ValueError(f"Unsupported ML_MODE '{selected}'. Expected 'mock', 'http', or 'inprocess'.")
