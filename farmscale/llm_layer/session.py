"""In-memory session store for FarmScale conversations."""

from __future__ import annotations

import uuid
from dataclasses import dataclass, field
from typing import Any


@dataclass
class FarmSession:
    session_id: str
    location: dict[str, Any] | None = None
    goal: str | None = None
    season: str = "annual"
    language: str = "en"
    layer2_summary: dict[str, Any] | None = None
    ml_payload: dict[str, Any] | None = None
    interpretation: dict[str, Any] | None = None
    chosen_option: int | None = None
    history: list[dict[str, Any]] = field(default_factory=list)


class SessionStore:
    """Thread-safe-enough in-memory store for dev/testing sessions."""

    def __init__(self) -> None:
        self._sessions: dict[str, FarmSession] = {}

    def create(self, **kwargs: Any) -> FarmSession:
        sid = str(uuid.uuid4())
        sess = FarmSession(session_id=sid, **kwargs)
        self._sessions[sid] = sess
        return sess

    def get(self, session_id: str) -> FarmSession | None:
        return self._sessions.get(session_id)

    def save(self, session: FarmSession) -> None:
        self._sessions[session.session_id] = session


DEFAULT_SESSION_STORE = SessionStore()
