"""Launch FarmScale with Layer 3 XGBoost ML and expose it online via Cloudflare Tunnel."""

from __future__ import annotations

import os
import re
import shutil
import subprocess
import sys
import threading
import time
from pathlib import Path

# Setup paths
_HERE = Path(__file__).resolve().parent
_candidates = [
    _HERE / "farmscale",
    _HERE / "farmScale_llm-crops-data_layer" / "farmscale",
    _HERE.parent / "farmScale_llm-crops-data_layer" / "farmscale",
]
_FARMSCALE = next((c for c in _candidates if c.is_dir()), _HERE / "farmscale")

_gw_candidates = [
    _HERE / "NasaAPIgateWay",
    _HERE / "FarmScale" / "NasaAPIgateWay",
    _HERE.parent / "FarmScale" / "NasaAPIgateWay",
]
_GATEWAY = next((c for c in _gw_candidates if c.is_dir()), _HERE / "NasaAPIgateWay")

for p in (_FARMSCALE, _GATEWAY):
    if str(p) not in sys.path:
        sys.path.insert(0, str(p))

import httpx
import uvicorn
from dotenv import load_dotenv

load_dotenv(_FARMSCALE / ".env")

PORT = 8050
URL_FILE = _HERE / "online_url.txt"


def run_uvicorn():
    from llm_layer.api import app

    uvicorn.run(app, host="0.0.0.0", port=PORT, log_level="warning")


def main():
    print("=" * 76)
    print("  NASA FarmScale: Starting Web Service & Cloudflare Tunnel...")
    print("=" * 76)

    # 1. Start Uvicorn in background thread
    server_thread = threading.Thread(target=run_uvicorn, daemon=True)
    server_thread.start()

    # 2. Wait for server to become healthy
    print(f"Waiting for local server on port {PORT}...")
    ready = False
    for _ in range(30):
        try:
            r = httpx.get(f"http://127.0.0.1:{PORT}/v1/ml/health", timeout=1.0)
            if r.status_code == 200:
                ready = True
                print(f"[OK] Local server ready! Status: {r.json().get('status')}, Model: {r.json().get('model_type')}")
                break
        except Exception:
            pass
        time.sleep(0.5)

    if not ready:
        print("[ERROR] Failed to start local FarmScale server.")
        sys.exit(1)

    # 3. Locate cloudflared
    cf_path = shutil.which("cloudflared") or r"C:\Program Files (x86)\cloudflared\cloudflared.exe"
    print(f"Starting Cloudflare Tunnel via: {cf_path}")

    # 4. Launch cloudflared process
    proc = subprocess.Popen(
        [cf_path, "tunnel", "--url", f"http://127.0.0.1:{PORT}"],
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1,
    )

    tunnel_url = None
    url_pattern = re.compile(r"https://[a-zA-Z0-9-]+\.trycloudflare\.com")

    # Read output to capture the public URL
    for line in iter(proc.stdout.readline, ""):
        print(line, end="")
        match = url_pattern.search(line)
        if match and not tunnel_url:
            tunnel_url = match.group(0)
            URL_FILE.write_text(tunnel_url, encoding="utf-8")
            print("\n" + "=" * 76)
            print(f"  >>> ONLINE PUBLIC TUNNEL URL: {tunnel_url} <<<")
            print(f"  Web UI Tester: {tunnel_url}/")
            print(f"  Health Check:  {tunnel_url}/v1/ml/health")
            print("=" * 76 + "\n")
            sys.stdout.flush()

    proc.wait()


if __name__ == "__main__":
    main()

