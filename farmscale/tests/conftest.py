import os
import pytest

@pytest.fixture(autouse=True)
def default_test_env(monkeypatch):
    # Tests default to mock mode unless explicitly testing inprocess or http
    monkeypatch.setenv("ML_MODE", "mock")

