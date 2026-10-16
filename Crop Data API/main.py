"""Crop Gateway: location-based crop suitability, water and nutrient needs, and soil impact behind one API key.

Run:  uvicorn main:app --reload --port 8100
Docs: http://127.0.0.1:8100/docs      Tester: http://127.0.0.1:8100/
"""
import os, time, datetime as dt
from collections import defaultdict, deque
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, Depends, Header, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel

import store
import climate as C
import engine as E

DISCLAIMER = ("Indicative estimates from general agronomic references and satellite-derived climate and soil data. "
              "Confirm with a local soil test and an agronomist before making fertilizer or irrigation decisions.")
SOURCES = ["NASA POWER climatology (temperature, rainfall)", "ISRIC SoilGrids (soil)",
           "FAO-56 crop coefficients and EcoCrop-style requirements (crop knowledge base)"]


@asynccontextmanager
async def lifespan(app):
    store.init()
    if store.key_count() == 0:
        print("\n  First start: created API key ->", store.create_key("default", 60), "\n")
    yield


app = FastAPI(title="Crop Gateway", version="1.0", lifespan=lifespan,
              description="Location-based crop suitability, water and nutrient needs, and soil impact.")
app.add_middleware(CORSMiddleware, allow_origins=os.getenv("CORS_ORIGINS", "*").split(","), allow_methods=["*"], allow_headers=["*"])


@app.exception_handler(C.UpstreamError)
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


# ------------------------------------------------------------ helpers
Lat = Query(..., ge=-90, le=90, description="Latitude")
Lon = Query(..., ge=-180, le=180, description="Longitude")


def overrides(ph: Optional[float] = Query(None, ge=3, le=10, description="Measured soil pH (overrides SoilGrids)"),
              soc: Optional[float] = Query(None, ge=0, le=500, description="Soil organic carbon, g/kg"),
              n: Optional[float] = Query(None, ge=0, le=50, description="Total soil nitrogen, g/kg"),
              sand: Optional[float] = Query(None, ge=0, le=100, description="Sand %"),
              silt: Optional[float] = Query(None, ge=0, le=100, description="Silt %"),
              clay: Optional[float] = Query(None, ge=0, le=100, description="Clay %")):
    ov = {k: v for k, v in dict(ph=ph, soc_g_kg=soc, n_g_kg=n, sand=sand, silt=silt, clay=clay).items() if v is not None}
    tex = [ov.get(k) for k in ("sand", "silt", "clay")]
    if any(v is not None for v in tex) and (None in tex or abs(sum(tex) - 100) > 5):
        raise HTTPException(422, "Give sand, silt and clay together, and they should add up to about 100.")
    return ov


async def cached(key, ttl, fn):
    hit = store.cache_get(key)
    if hit is not None:
        return hit
    val = await fn()
    store.cache_set(key, val, ttl)
    return val


async def context(lat, lon, ov):
    """Climate normals + topsoil for a point. Measured values you pass in override SoilGrids."""
    clim = await cached(f"clim:{lat:.2f}:{lon:.2f}", 30 * 86400, lambda: C.climatology(lat, lon))
    warnings, base = [], {}
    if any(ov.get(k) is None for k in ("ph", "soc_g_kg", "n_g_kg", "sand", "silt", "clay")):
        try:
            base = await cached(f"soil:{lat:.3f}:{lon:.3f}", None, lambda: C.soilgrids(lat, lon))
        except C.UpstreamError as e:
            warnings.append(f"Soil data unavailable ({e}); soil factors were skipped. Pass ph, sand, silt and clay to supply your own.")
    soil = C.finish_soil({**base, **ov})
    return clim, soil, warnings


def crop_or_404(cid):
    c = E.CROPS.get(cid.lower())
    if not c:
        raise HTTPException(404, f"Unknown crop '{cid}'. See /v1/crops for valid ids.")
    return c


def month_or_best(crop, clim, soil, month, irrigated=False):
    return month or E.suitability(crop, clim, soil, irrigated)["start_month"]


# ------------------------------------------------------------------ crops
@app.get("/v1/crops", tags=["crops"], summary="List or search crops")
async def crops(category: Optional[str] = None, q: Optional[str] = None, _=Depends(auth)):
    rows = [{"id": c["id"], "name": c["name"], "category": c["cat"]} for c in E.CROPS.values()
            if (not category or c["cat"] == category) and (not q or q.lower() in c["id"] or q.lower() in c["name"].lower())]
    return {"count": len(rows), "categories": sorted({c["cat"] for c in E.CROPS.values()}), "crops": rows}


@app.get("/v1/crops/{crop_id}", tags=["crops"], summary="Static crop profile: requirements, nutrient uptake, soil effects")
async def crop_profile(crop_id: str, _=Depends(auth)):
    return {**E.profile(crop_or_404(crop_id)), "disclaimer": DISCLAIMER}


# --------------------------------------------------------------- location
@app.get("/v1/location", tags=["location"], summary="Climate normals, reference evapotranspiration and topsoil for a point")
async def location(lat: float = Lat, lon: float = Lon, ov=Depends(overrides), _=Depends(auth)):
    clim, soil, warn = await context(lat, lon, ov)
    return {"lat": lat, "lon": lon, "climate_monthly": clim,
            "annual": {"rain_mm": round(sum(m["rain_mm"] for m in clim)), "et0_mm": round(sum(m["et0_mm"] for m in clim)),
                       "mean_temp_c": round(sum(m["tmean"] for m in clim) / 12, 1)},
            "soil": soil, "warnings": warn, "sources": SOURCES}


@app.get("/v1/suitability", tags=["analysis"], summary="Rank crops for a location, with the best planting month for each")
async def suitability(lat: float = Lat, lon: float = Lon, category: Optional[str] = None, irrigated: bool = False,
                      limit: int = Query(15, ge=1, le=50), min_score: float = Query(0, ge=0, le=100),
                      ov=Depends(overrides), _=Depends(auth)):
    clim, soil, warn = await context(lat, lon, ov)
    rows = [r for r in E.rank_all(clim, soil, irrigated, category) if r["score"] >= min_score][:limit]
    return {"lat": lat, "lon": lon, "irrigated": irrigated, "soil_used": soil, "warnings": warn, "results": rows,
            "disclaimer": DISCLAIMER}


@app.get("/v1/water", tags=["analysis"], summary="Crop water requirement and irrigation need by stage and month")
async def water(crop: str, lat: float = Lat, lon: float = Lon, planting_month: Optional[int] = Query(None, ge=1, le=12),
                area_ha: float = Query(1.0, gt=0, le=100000), efficiency: float = Query(0.6, gt=0.1, le=1.0),
                ov=Depends(overrides), _=Depends(auth)):
    c = crop_or_404(crop)
    clim, soil, warn = await context(lat, lon, ov)
    return {"crop": {"id": c["id"], "name": c["name"]}, "lat": lat, "lon": lon, "warnings": warn,
            "water": E.water_plan(c, clim, month_or_best(c, clim, soil, planting_month), area_ha, efficiency),
            "method": "FAO-56 crop coefficients x Hargreaves ET0 from climate normals; USDA SCS effective rainfall.",
            "disclaimer": DISCLAIMER}


@app.get("/v1/nutrition", tags=["analysis"], summary="Nutrient uptake and indicative fertilizer need")
async def nutrition(crop: str, lat: float = Lat, lon: float = Lon, yield_t_ha: Optional[float] = Query(None, gt=0),
                    area_ha: float = Query(1.0, gt=0, le=100000), ov=Depends(overrides), _=Depends(auth)):
    c = crop_or_404(crop)
    clim, soil, warn = await context(lat, lon, ov)
    return {"crop": {"id": c["id"], "name": c["name"]}, "soil_used": soil, "warnings": warn,
            "nutrition": E.nutrition(c, soil, yield_t_ha, area_ha), "disclaimer": DISCLAIMER}


@app.get("/v1/soil-impact", tags=["analysis"], summary="What the crop does to the soil, plus rotation suggestions")
async def soil_impact(crop: str, lat: float = Lat, lon: float = Lon, yield_t_ha: Optional[float] = Query(None, gt=0),
                      irrigated: bool = False, ov=Depends(overrides), _=Depends(auth)):
    c = crop_or_404(crop)
    clim, soil, warn = await context(lat, lon, ov)
    return {"crop": {"id": c["id"], "name": c["name"]}, "warnings": warn,
            "soil_impact": {**E.soil_impact(c, soil, yield_t_ha), "rotation": E.rotation(c, clim, soil, irrigated)},
            "disclaimer": DISCLAIMER}


@app.get("/v1/plan", tags=["analysis"], summary="Everything for one crop at one location: suitability, water, nutrition, soil impact")
async def plan(crop: str, lat: float = Lat, lon: float = Lon, planting_month: Optional[int] = Query(None, ge=1, le=12),
               area_ha: float = Query(1.0, gt=0, le=100000), yield_t_ha: Optional[float] = Query(None, gt=0),
               irrigated: bool = False, efficiency: float = Query(0.6, gt=0.1, le=1.0),
               ov=Depends(overrides), _=Depends(auth)):
    c = crop_or_404(crop)
    clim, soil, warn = await context(lat, lon, ov)
    suit = E.suitability(c, clim, soil, irrigated)
    month = planting_month or suit["start_month"]
    if planting_month:
        suit = {**E.score_crop(c, clim, soil, month, irrigated), "planting_windows": suit["planting_windows"]}
    return {"crop": {"id": c["id"], "name": c["name"], "category": c["cat"]}, "location": {"lat": lat, "lon": lon},
            "soil_used": soil, "warnings": warn, "suitability": suit,
            "water": E.water_plan(c, clim, month, area_ha, efficiency),
            "nutrition": E.nutrition(c, soil, yield_t_ha, area_ha),
            "soil_impact": {**E.soil_impact(c, soil, yield_t_ha), "rotation": E.rotation(c, clim, soil, irrigated)},
            "sources": SOURCES, "disclaimer": DISCLAIMER}


# ------------------------------------------------------------ meta / usage
@app.get("/v1/usage", tags=["meta"], summary="Request counts for your API key")
async def my_usage(key=Depends(auth)):
    return {"key_name": key["name"], "rate_limit_per_min": key["rpm"], **store.usage(key["id"])}


@app.get("/health", tags=["meta"])
async def health():
    return {"status": "ok", "crops": len(E.CROPS), "time": dt.datetime.utcnow().isoformat() + "Z"}


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


@app.delete("/admin/cache", tags=["admin"], dependencies=[Depends(admin)], summary="Clear cached climate/soil (optionally by prefix: clim or soil)")
async def clear_cache(prefix: str = ""):
    return {"deleted": store.cache_clear(prefix)}


@app.get("/", include_in_schema=False)
async def tester():
    f = Path(__file__).parent / "tester.html"
    return FileResponse(f) if f.exists() else {"message": "Crop Gateway running. See /docs"}
