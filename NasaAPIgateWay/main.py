"""Data engine: one API key -> weather, soil, soil moisture, vegetation, combined field profile.

Run:  uvicorn main:app --reload
Docs: http://127.0.0.1:8000/docs      Tester: http://127.0.0.1:8000/
"""
import os, json, time, asyncio, contextvars, datetime as dt
from collections import defaultdict, deque
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Literal, Optional

from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, Depends, Header, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel, Field

import store
import providers as P

SMAP_PRODUCT = os.getenv("SMAP_PRODUCT", "SPL4SMGP.008")  # verify current versions via /v1/meta/layers/{product}
VEG_PRODUCT = os.getenv("VEG_PRODUCT", "MOD13Q1.061")
REFRESH_HOURS = float(os.getenv("REFRESH_HOURS", "6"))  # background refresh of saved locations; 0 disables

# Job kinds that run through NASA AppEEARS (asynchronous extraction)
KINDS = {
    "smap": {"layers": [{"product": SMAP_PRODUCT, "layer": "Geophysical_Data_sm_rootzone"}],
             "process": P.process_smap, "years": int(os.getenv("SMAP_YEARS", "3"))},
    "vegetation": {"layers": [{"product": VEG_PRODUCT, "layer": l} for l in
                              ("_250m_16_days_NDVI", "_250m_16_days_EVI", "_250m_16_days_pixel_reliability")],
                   "process": P.process_veg, "years": int(os.getenv("VEG_YEARS", "8"))},
}


@asynccontextmanager
async def lifespan(app):
    store.init()
    if store.key_count() == 0:
        print("\n  First start: created API key ->", store.create_key("default", 60), "\n")
    task = asyncio.create_task(refresher()) if REFRESH_HOURS > 0 else None
    yield
    if task:
        task.cancel()


app = FastAPI(title="Data Engine", version="1.0", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=os.getenv("CORS_ORIGINS", "*").split(","),
                   allow_methods=["*"], allow_headers=["*"],
                   expose_headers=["X-Cache", "X-Cache-Age"])

# Per-request holder so cached() can report HIT / MISS / REFRESH in response headers
_cstate = contextvars.ContextVar("cstate", default=None)
STATS = {"hits": 0, "misses": 0}


@app.middleware("http")
async def cache_headers(request, call_next):
    st = {}
    _cstate.set(st)
    resp = await call_next(request)
    if "cache" in st:
        resp.headers["X-Cache"] = st["cache"]
        resp.headers["X-Cache-Age"] = str(st.get("age", 0))
    return resp


@app.exception_handler(P.UpstreamError)
async def upstream_error(request, exc):
    return JSONResponse({"error": str(exc), "upstream": True}, status_code=exc.status)


# ------------------------------------------------------------------ auth
_hits = defaultdict(deque)


async def auth(request: Request, x_api_key: Optional[str] = Header(None)):
    key = store.verify_key(x_api_key) if x_api_key else None
    if not key:
        raise HTTPException(401, "Missing or invalid API key (send it in the X-API-Key header)")
    now, q = time.time(), _hits[key["id"]]
    while q and now - q[0] > 60:
        q.popleft()
    if len(q) >= key["rpm"]:
        raise HTTPException(429, f"Rate limit of {key['rpm']} requests/minute exceeded", headers={"Retry-After": "10"})
    q.append(now)
    store.log_usage(key["id"], request.url.path)
    return key


def admin(x_admin_key: Optional[str] = Header(None)):
    if not os.getenv("ADMIN_KEY") or x_admin_key != os.getenv("ADMIN_KEY"):
        raise HTTPException(401, "Invalid or missing X-Admin-Key")


Lat = Query(..., ge=-90, le=90, description="Latitude")
Lon = Query(..., ge=-180, le=180, description="Longitude")


async def cached(key, ttl, fn, refresh=False):
    """Return a cached value, or call fn() and store the result. refresh=True skips the cache."""
    st = _cstate.get()
    if st is None:
        st = {}
    if not refresh:
        hit = store.cache_get(key, meta=True)
        if hit is not None:
            STATS["hits"] += 1
            st.setdefault("cache", "HIT")
            st["age"] = max(st.get("age", 0), hit[1])
            return hit[0]
    STATS["misses"] += 1
    st["cache"] = "REFRESH" if refresh else "MISS"
    val = await fn()
    store.cache_set(key, val, ttl)
    return val


def _iso(s, name):
    try:
        return dt.date.fromisoformat(s).isoformat()
    except ValueError:
        raise HTTPException(422, f"{name} must be YYYY-MM-DD")


# --------------------------------------------------------------- weather
async def _weather(lat, lon, temporal="monthly", start=None, end=None, refresh=False):
    today = dt.date.today()
    if temporal == "monthly":
        start, end = start or today.year - 10, end or today.year
    else:
        end = end or int(today.strftime("%Y%m%d"))
        start = start or int((today - dt.timedelta(days=365)).strftime("%Y%m%d"))
    key = f"weather:{temporal}:{lat:.2f}:{lon:.2f}:{start}:{end}"
    rows = await cached(key, 6 * 3600, lambda: P.power(lat, lon, start, end, temporal), refresh)
    return rows


@app.get("/v1/weather", tags=["data"], summary="Rainfall, temperature and root-zone wetness (NASA POWER)")
async def weather(lat: float = Lat, lon: float = Lon,
                  temporal: Literal["monthly", "daily"] = "monthly",
                  start: Optional[int] = Query(None, description="YYYY (monthly) or YYYYMMDD (daily)"),
                  end: Optional[int] = None, refresh: bool = Query(False, description="Skip the cache"),
                  _=Depends(auth)):
    rows = await _weather(lat, lon, temporal, start, end, refresh)
    out = {"lat": lat, "lon": lon, "source": "NASA POWER", "temporal": temporal, "count": len(rows), "data": rows}
    if temporal == "monthly":
        out["trends"] = P.trends(rows)
    return out


# ------------------------------------------------------------------ soil
async def _soil(lat, lon, refresh=False):
    return await cached(f"soil:{lat:.3f}:{lon:.3f}", None, lambda: P.soilgrids(lat, lon), refresh)  # static: cache forever


@app.get("/v1/soil", tags=["data"], summary="Baseline soil pH, organic carbon, texture (SoilGrids)")
async def soil(lat: float = Lat, lon: float = Lon, refresh: bool = Query(False, description="Skip the cache"),
               _=Depends(auth)):
    return {"lat": lat, "lon": lon, "source": "ISRIC SoilGrids (CC BY 4.0)", "soil": await _soil(lat, lon, refresh)}


# ------------------------------------------------- AppEEARS-backed jobs
_submit_lock = asyncio.Lock()


def _shape(job, series=True):
    data = json.loads(job["result"]) if job.get("result") else None
    if data and not series:
        data = {k: v for k, v in data.items() if k != "series"}
    return {"job_id": job["id"], "kind": job["kind"], "status": job["status"],
            "error": job.get("error"), "data": data}


PV = 2  # bump when post-processing changes; finished jobs are then rebuilt from the original NASA task


async def _refresh(job):
    if job["status"] == "failed":
        return job
    if job["status"] == "done" and (json.loads(job["result"]) if job.get("result") else {}).get("pv") == PV:
        return job
    cfg = KINDS[job["kind"]]
    st = await P.appeears_status(job["task_id"])
    s = st.get("status", "pending")
    if s == "done":
        suffixes = [l["layer"] for l in cfg["layers"]]
        rows = await P.appeears_rows(job["task_id"], suffixes)
        store.job_update(job["id"], "done", result={**cfg["process"](rows), "pv": PV})
    elif s in ("error", "deleted"):
        store.job_update(job["id"], "failed", error=st.get("error") or f"AppEEARS task {s}")
    else:
        store.job_update(job["id"], s)
    return store.job_by_id(job["id"])


async def _get_or_submit(kind, lat, lon, start, end):
    cfg = KINDS[kind]
    today = dt.date.today()
    end = _iso(end, "end") if end else today.isoformat()
    start = _iso(start, "start") if start else today.replace(year=today.year - cfg["years"]).isoformat()
    jkey = f"{kind}:{lat:.3f}:{lon:.3f}:{start}:{end}"
    async with _submit_lock:
        job = store.job_by_key(jkey)
        if not job:
            task_id = await P.appeears_submit(cfg["layers"], lat, lon, start, end, f"{kind}_{lat:.3f}_{lon:.3f}")
            job = store.job_create(jkey, kind, task_id)
    return await _refresh(job)


@app.get("/v1/smap", tags=["data"],
         summary="Root-zone soil moisture + anomalies (SMAP). Returns a job until data is ready; call again to poll.")
async def smap(lat: float = Lat, lon: float = Lon, start: Optional[str] = None, end: Optional[str] = None,
               include_series: bool = True, _=Depends(auth)):
    return _shape(await _get_or_submit("smap", lat, lon, start, end), include_series)


@app.get("/v1/vegetation", tags=["data"],
         summary="NDVI/EVI greenness + anomalies (MODIS). Returns a job until data is ready; call again to poll.")
async def vegetation(lat: float = Lat, lon: float = Lon, start: Optional[str] = None, end: Optional[str] = None,
                     include_series: bool = True, _=Depends(auth)):
    return _shape(await _get_or_submit("vegetation", lat, lon, start, end), include_series)


@app.get("/v1/jobs/{job_id}", tags=["data"], summary="Check a job by id")
async def job_status(job_id: str, include_series: bool = True, _=Depends(auth)):
    job = store.job_by_id(job_id)
    if not job:
        raise HTTPException(404, "Unknown job_id")
    return _shape(await _refresh(job), include_series)


# --------------------------------------------------------- combined view
async def _safe(coro):
    try:
        return await coro
    except HTTPException as e:
        return {"error": e.detail}
    except P.UpstreamError as e:
        return {"error": str(e)}


@app.get("/v1/field-profile", tags=["data"],
         summary="Everything for one location + a combined water-stress score")
async def field_profile(lat: float = Lat, lon: float = Lon, refresh: bool = False, _=Depends(auth)):
    return await _profile(lat, lon, refresh)


async def _profile(lat, lon, refresh=False):
    w, s, sm, v = await asyncio.gather(
        _safe(_weather(lat, lon, refresh=refresh)), _safe(_soil(lat, lon)),
        _safe(_get_or_submit("smap", lat, lon, None, None)),
        _safe(_get_or_submit("vegetation", lat, lon, None, None)))
    rows = w if isinstance(w, list) else []
    smap_d = sm.get("data") if isinstance(sm, dict) else None
    veg_d = v.get("data") if isinstance(v, dict) else None
    return {
        "lat": lat, "lon": lon,
        "weather": {"latest": rows[-1] if rows else None, "trends": P.trends(rows), "error": w.get("error") if isinstance(w, dict) else None},
        "soil": s,
        "soil_moisture": {k: sm.get(k) for k in ("job_id", "status", "error")} | {"latest": (smap_d or {}).get("latest")} if isinstance(sm, dict) else sm,
        "vegetation": {k: v.get(k) for k in ("job_id", "status", "error")} | {"latest": (veg_d or {}).get("latest")} if isinstance(v, dict) else v,
        "water_stress": P.stress_score(rows, smap_d, veg_d),
        "note": "Soil moisture and vegetation arrive via background jobs; call again in a minute if status is not 'done'.",
    }


# ------------------------------------------------------------ meta / usage
@app.get("/v1/meta/layers/{product}", tags=["meta"], summary="List AppEEARS layer names for a product")
async def layers(product: str, _=Depends(auth)):
    return {"product": product, "layers": await P.appeears_layers(product)}


@app.get("/v1/usage", tags=["meta"], summary="Request counts for your API key")
async def my_usage(key=Depends(auth)):
    return {"key_name": key["name"], "rate_limit_per_min": key["rpm"], **store.usage(key["id"])}


@app.get("/health", tags=["meta"])
async def health():
    return {"status": "ok", "time": dt.datetime.utcnow().isoformat() + "Z",
            "earthdata_configured": bool(os.getenv("EARTHDATA_USER") and os.getenv("EARTHDATA_PASS"))}


# ------------------------------------------------------------------ admin
class KeyIn(BaseModel):
    name: str
    rpm: int = 60


@app.post("/admin/keys", tags=["admin"], dependencies=[Depends(admin)], summary="Create an API key (shown once)")
async def create_key(body: KeyIn):
    return {"name": body.name, "rpm": body.rpm, "api_key": store.create_key(body.name, body.rpm)}


@app.get("/admin/keys", tags=["admin"], dependencies=[Depends(admin)])
async def list_keys():
    return store.list_keys()


@app.delete("/admin/keys/{key_id}", tags=["admin"], dependencies=[Depends(admin)])
async def revoke(key_id: int):
    store.revoke_key(key_id)
    return {"revoked": key_id}


NO_CACHE = {"Cache-Control": "no-cache, no-store, must-revalidate, max-age=0", "Pragma": "no-cache", "Expires": "0"}


@app.get("/", include_in_schema=False)
async def home_map():
    f = Path(__file__).parent / "map.html"
    return FileResponse(f, headers=NO_CACHE) if f.exists() else {"message": "Data Engine running. See /docs"}


@app.get("/tester", include_in_schema=False)
async def tester():
    f = Path(__file__).parent / "tester.html"
    return FileResponse(f) if f.exists() else {"message": "Data Engine running. See /docs"}


@app.get("/dashboard", include_in_schema=False)
async def dashboard():
    f = Path(__file__).parent / "dashboard.html"
    return FileResponse(f) if f.exists() else JSONResponse({"error": "dashboard.html not found"}, status_code=404)


@app.get("/map", include_in_schema=False)
async def map_viewer():
    f = Path(__file__).parent / "map.html"
    return FileResponse(f, headers=NO_CACHE) if f.exists() else JSONResponse({"error": "map.html not found"}, status_code=404)


@app.get("/rajshahi_nasa_vector.geojson", include_in_schema=False)
async def get_vector_geojson():
    f = Path(__file__).parent / "rajshahi_nasa_vector.geojson"
    return FileResponse(f) if f.exists() else JSONResponse({"error": "geojson not found"}, status_code=404)


@app.get("/rajshahi_nasa_polygons.geojson", include_in_schema=False)
async def get_polygons_geojson():
    f = Path(__file__).parent / "rajshahi_nasa_polygons.geojson"
    return FileResponse(f) if f.exists() else JSONResponse({"error": "geojson not found"}, status_code=404)


@app.get("/rajshahi_upazilas_vector.geojson", include_in_schema=False)
async def get_upazilas_vector_geojson():
    f = Path(__file__).parent / "rajshahi_upazilas_vector.geojson"
    return FileResponse(f) if f.exists() else JSONResponse({"error": "geojson not found"}, status_code=404)


@app.get("/rajshahi_upazilas_polygons.geojson", include_in_schema=False)
async def get_upazilas_polygons_geojson():
    f = Path(__file__).parent / "rajshahi_upazilas_polygons.geojson"
    return FileResponse(f) if f.exists() else JSONResponse({"error": "geojson not found"}, status_code=404)


@app.get("/rajshahi_districts_10years_monthly.json", include_in_schema=False)
async def get_districts_monthly():
    f = Path(__file__).parent / "rajshahi_districts_10years_monthly.json"
    return FileResponse(f) if f.exists() else JSONResponse({"error": "file not found"}, status_code=404)


@app.get("/rajshahi_upazilas_10years_monthly.json", include_in_schema=False)
async def get_upazilas_monthly():
    f = Path(__file__).parent / "rajshahi_upazilas_10years_monthly.json"
    return FileResponse(f) if f.exists() else JSONResponse({"error": "file not found"}, status_code=404)


@app.get("/rajshahi_10years_monthly.csv", include_in_schema=False)
async def get_monthly_csv():
    f = Path(__file__).parent / "rajshahi_10years_monthly.csv"
    return FileResponse(f, media_type="text/csv", filename="rajshahi_10years_monthly.csv") if f.exists() else JSONResponse({"error": "file not found"}, status_code=404)


@app.get("/rajshahi_satellite_vegetation_all.csv", include_in_schema=False)
async def get_satellite_veg_csv():
    f = Path(__file__).parent / "rajshahi_satellite_vegetation_all.csv"
    return FileResponse(f, media_type="text/csv", filename="rajshahi_satellite_vegetation_all.csv") if f.exists() else JSONResponse({"error": "file not found"}, status_code=404)


@app.get("/bangladesh_districts_boundaries.geojson", include_in_schema=False)
async def get_bd_boundaries_geojson():
    f = Path(__file__).parent / "bangladesh_districts_boundaries.geojson"
    if not f.exists():
        f = Path(__file__).parent / "bangladesh_districts_vector.geojson"
    return FileResponse(f, headers=NO_CACHE) if f.exists() else JSONResponse({"error": "file not found"}, status_code=404)


@app.get("/bangladesh_districts_vector.geojson", include_in_schema=False)
async def get_bd_vector_geojson():
    f = Path(__file__).parent / "bangladesh_districts_vector.geojson"
    return FileResponse(f, headers=NO_CACHE) if f.exists() else JSONResponse({"error": "file not found"}, status_code=404)


@app.get("/bangladesh_districts_vector.js", include_in_schema=False)
async def get_bd_vector_js():
    f = Path(__file__).parent / "bangladesh_districts_vector.js"
    return FileResponse(f, media_type="application/javascript", headers=NO_CACHE) if f.exists() else JSONResponse({"error": "file not found"}, status_code=404)




@app.get("/bangladesh_districts_10years_monthly.json", include_in_schema=False)
async def get_bd_districts_monthly():
    f = Path(__file__).parent / "bangladesh_districts_10years_monthly.json"
    return FileResponse(f, headers=NO_CACHE) if f.exists() else JSONResponse({"error": "file not found"}, status_code=404)


@app.get("/bangladesh_10years_monthly.csv", include_in_schema=False)
async def get_bd_monthly_csv():
    f = Path(__file__).parent / "bangladesh_10years_monthly.csv"
    return FileResponse(f, media_type="text/csv", filename="bangladesh_10years_monthly.csv") if f.exists() else JSONResponse({"error": "file not found"}, status_code=404)


@app.get("/bangladesh_divisions_summary.json", include_in_schema=False)
async def get_bd_divisions_summary():
    f = Path(__file__).parent / "bangladesh_divisions_summary.json"
    return FileResponse(f) if f.exists() else JSONResponse({"error": "file not found"}, status_code=404)


@app.get("/bangladesh_upazilas_vector.geojson", include_in_schema=False)
async def get_bd_upazilas_vector_geojson():
    f = Path(__file__).parent / "bangladesh_upazilas_vector.geojson"
    return FileResponse(f, headers=NO_CACHE) if f.exists() else JSONResponse({"error": "file not found"}, status_code=404)


@app.get("/bangladesh_upazilas_vector.js", include_in_schema=False)
async def get_bd_upazilas_vector_js():
    f = Path(__file__).parent / "bangladesh_upazilas_vector.js"
    return FileResponse(f, media_type="application/javascript", headers=NO_CACHE) if f.exists() else JSONResponse({"error": "file not found"}, status_code=404)


@app.get("/bangladesh_upazilas_10years_monthly.json", include_in_schema=False)
async def get_bd_upazilas_monthly():
    f = Path(__file__).parent / "bangladesh_upazilas_10years_monthly.json"
    return FileResponse(f, headers=NO_CACHE) if f.exists() else JSONResponse({"error": "file not found"}, status_code=404)


@app.get("/bangladesh_upazilas_10years_monthly.csv", include_in_schema=False)
async def get_bd_upazilas_monthly_csv():
    f = Path(__file__).parent / "bangladesh_upazilas_10years_monthly.csv"
    return FileResponse(f, media_type="text/csv", filename="bangladesh_upazilas_10years_monthly.csv") if f.exists() else JSONResponse({"error": "file not found"}, status_code=404)


@app.get("/v1/climate/monthly", tags=["data"], summary="Query 10-year monthly climate records (2016-2026)")
async def get_climate_monthly(
    area: Optional[str] = Query(None, description="Area name (e.g. Rajshahi or Bagmara)"),
    district: Optional[str] = Query(None, description="District name"),
    year_month: Optional[str] = Query(None, description="Year-month string (e.g. 2026-09)"),
    year: Optional[int] = Query(None, ge=2016, le=2026, description="Year (2016-2026)"),
    area_type: Optional[Literal["District", "Upazila"]] = Query(None),
    limit: int = Query(500, ge=1, le=5000)
):
    rows = store.climate_query(area_name=area, district=district, year_month=year_month, year=year, area_type=area_type, limit=limit)
    return {"total": len(rows), "records": rows}


@app.get("/v1/rajshahi/monthly", tags=["data"], summary="Query 10-year monthly climate records specifically for Rajshahi Division (2016-2026)")
async def get_rajshahi_monthly(
    area: Optional[str] = Query(None, description="District or Upazila name"),
    district: Optional[str] = Query(None, description="District name"),
    year_month: Optional[str] = Query(None, description="Year-month string (e.g. 2026-09)"),
    year: Optional[int] = Query(None, ge=2016, le=2026, description="Year (2016-2026)"),
    area_type: Optional[Literal["District", "Upazila"]] = Query(None),
    limit: int = Query(500, ge=1, le=5000)
):
    rows = store.rajshahi_climate_query(area_name=area, district=district, year_month=year_month, year=year, area_type=area_type, limit=limit)
    return {"total": len(rows), "records": rows}


@app.get("/v1/bangladesh/monthly", tags=["data"], summary="Query 10-year monthly climate records for all 64 districts in Bangladesh (2016-2026)")
async def get_bangladesh_monthly(
    division: Optional[str] = Query(None, description="Division name (e.g. Dhaka, Chattogram, Rajshahi, etc.)"),
    district: Optional[str] = Query(None, description="District name (e.g. Dhaka, Sylhet, Comilla, etc.)"),
    year_month: Optional[str] = Query(None, description="Year-month string (e.g. 2026-09)"),
    year: Optional[int] = Query(None, ge=2016, le=2026, description="Year (2016-2026)"),
    limit: int = Query(500, ge=1, le=5000)
):
    rows = store.bangladesh_climate_query(division=division, district=district, year_month=year_month, year=year, limit=limit)
    return {"total": len(rows), "records": rows}


# ------------------------------------------------- saved locations & history
class LocIn(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    lat: float = Field(ge=-90, le=90)
    lon: float = Field(ge=-180, le=180)


def _own_location(loc_id, key):
    loc = store.loc_get(loc_id, key["id"])
    if not loc:
        raise HTTPException(404, "Unknown location")
    return loc


def _snapshot(loc_id, prof):
    """Store today's stress score and key readings so trends can be charted later."""
    ws = prof.get("water_stress")
    if not ws:
        return False
    store.snap_save(loc_id, ws["score"], ws["level"], {
        "components": ws["components"], "weather": prof["weather"].get("latest"),
        "soil_moisture": prof["soil_moisture"].get("latest"), "vegetation": prof["vegetation"].get("latest")})
    return True


@app.post("/v1/locations", tags=["storage"], summary="Save a named location (updates it if the name exists)")
async def add_location(body: LocIn, key=Depends(auth)):
    return store.loc_create(key["id"], body.name.strip(), body.lat, body.lon)


@app.get("/v1/locations", tags=["storage"], summary="List your saved locations with their latest stress score")
async def list_locations(key=Depends(auth)):
    return {"locations": store.loc_list(key["id"])}


@app.delete("/v1/locations/{loc_id}", tags=["storage"], summary="Delete a saved location and its history")
async def delete_location(loc_id: int, key=Depends(auth)):
    _own_location(loc_id, key)
    store.loc_delete(loc_id)
    return {"deleted": loc_id}


@app.get("/v1/locations/{loc_id}/history", tags=["storage"], summary="Recorded water-stress snapshots over time")
async def location_history(loc_id: int, limit: int = Query(365, ge=1, le=2000), key=Depends(auth)):
    loc = _own_location(loc_id, key)
    return {"location": loc, "history": store.snap_list(loc_id, limit)}


@app.post("/v1/locations/{loc_id}/refresh", tags=["storage"], summary="Bypass the cache, refetch, and record a snapshot")
async def refresh_location(loc_id: int, key=Depends(auth)):
    loc = _own_location(loc_id, key)
    prof = await _profile(loc["lat"], loc["lon"], refresh=True)
    return {"snapshot_saved": _snapshot(loc_id, prof), "profile": prof}


@app.get("/v1/cache/stats", tags=["storage"], summary="What is stored: cache entries, jobs, locations, snapshots")
async def cache_stats(_=Depends(auth)):
    return {**store.cache_stats(), "hits_since_start": STATS["hits"], "misses_since_start": STATS["misses"],
            "background_refresh_hours": REFRESH_HOURS}


@app.delete("/admin/cache", tags=["admin"], dependencies=[Depends(admin)],
            summary="Clear cache entries (optionally only keys starting with a prefix, e.g. weather)")
async def clear_cache(prefix: str = "", jobs: bool = False):
    return {"cache_entries_deleted": store.cache_clear(prefix), "jobs_deleted": store.jobs_clear() if jobs else 0}


async def refresher():
    """Keep saved locations fresh: refetch, record a snapshot, and purge expired cache rows."""
    await asyncio.sleep(20)
    while True:
        try:
            store.cache_purge()
            for loc in store.loc_all():
                try:
                    _snapshot(loc["id"], await _profile(loc["lat"], loc["lon"], refresh=True))
                except Exception as e:
                    print("background refresh failed for", loc["name"], "->", e)
                await asyncio.sleep(5)
        except Exception as e:
            print("refresh loop error:", e)
        await asyncio.sleep(REFRESH_HOURS * 3600)