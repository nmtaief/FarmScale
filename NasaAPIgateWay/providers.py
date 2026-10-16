"""Upstream data providers and post-processing. No web framework code here."""
import os, io, csv, time, asyncio, statistics, datetime as dt
from collections import defaultdict
import httpx

POWER = "https://power.larc.nasa.gov/api/temporal/{t}/point"
SOILGRIDS = "https://rest.isric.org/soilgrids/v2.0/properties/query"
APPEEARS = "https://appeears.earthdatacloud.nasa.gov/api"


class UpstreamError(Exception):
    def __init__(self, msg, status=502):
        super().__init__(msg)
        self.status = status


async def _request(client, method, url, retries=3, **kw):
    """HTTP call with exponential backoff on 429/5xx."""
    for i in range(retries):
        try:
            r = await client.request(method, url, **kw)
        except httpx.HTTPError as e:
            if i == retries - 1:
                raise UpstreamError(f"Network error calling {url}: {e}")
        else:
            if r.status_code < 400:
                return r
            if r.status_code not in (429, 500, 502, 503, 504) or i == retries - 1:
                raise UpstreamError(f"{url} returned {r.status_code}: {r.text[:200]}")
        await asyncio.sleep(2 ** (i + 1))


# ---------------------------------------------------------------- NASA POWER
async def power(lat, lon, start, end, temporal="monthly",
                params="PRECTOTCORR,T2M,T2M_MAX,T2M_MIN,GWETROOT,GWETTOP"):
    async with httpx.AsyncClient(timeout=90) as c:
        r = await _request(c, "GET", POWER.format(t=temporal), params={
            "parameters": params, "community": "AG", "latitude": lat, "longitude": lon,
            "start": start, "end": end, "format": "JSON"})
    raw = r.json()["properties"]["parameter"]
    dates = sorted({d for series in raw.values() for d in series})
    rows = []
    for d in dates:
        if temporal == "monthly" and d.endswith("13"):  # annual-average pseudo month
            continue
        row = {"date": d}
        for name, series in raw.items():
            v = series.get(d)
            row[name] = None if v in (None, -999, -999.0) else v
        rows.append(row)
    return rows


def trends(rows, fields=("T2M", "PRECTOTCORR")):
    """Linear trend of annual means (complete years only)."""
    out = {}
    for f in fields:
        by = defaultdict(list)
        for r in rows:
            if r.get(f) is not None:
                by[int(r["date"][:4])].append(r[f])
        years = sorted(y for y, v in by.items() if len(v) == 12)
        if len(years) >= 5:
            vals = [statistics.fmean(by[y]) for y in years]
            mx, mv = statistics.fmean(years), statistics.fmean(vals)
            slope = sum((x - mx) * (v - mv) for x, v in zip(years, vals)) / sum((x - mx) ** 2 for x in years)
            out[f] = {"slope_per_year": round(slope, 4), "from": years[0], "to": years[-1]}
    return out


# ----------------------------------------------------------------- SoilGrids
_soil_lock = asyncio.Lock()
_soil_last = 0.0
SOIL_GAP = float(os.getenv("SOILGRIDS_MIN_INTERVAL", "12"))  # public API allows ~5 req/min
DEPTH_W = {"0-5cm": 5, "5-15cm": 10, "15-30cm": 15, "30-60cm": 30}


async def soilgrids(lat, lon):
    global _soil_last
    async with _soil_lock:
        wait = SOIL_GAP - (time.time() - _soil_last)
        if wait > 0:
            await asyncio.sleep(wait)
        try:
            async with httpx.AsyncClient(timeout=90) as c:
                r = await _request(c, "GET", SOILGRIDS, params={
                    "lat": lat, "lon": lon,
                    "property": ["phh2o", "soc", "nitrogen", "clay", "sand", "silt"],
                    "depth": list(DEPTH_W), "value": "mean"})
        finally:
            _soil_last = time.time()
    out = {}
    for layer in r.json()["properties"]["layers"]:
        f = layer["unit_measure"].get("d_factor") or 1
        depths = {}
        for d in layer["depths"]:
            v = d["values"].get("mean")
            depths[d["label"]] = None if v is None else round(v / f, 3)
        valid = [(depths[k], w) for k, w in DEPTH_W.items() if depths.get(k) is not None]
        rz = round(sum(v * w for v, w in valid) / sum(w for _, w in valid), 3) if valid else None
        out[layer["name"]] = {"unit": layer["unit_measure"].get("target_units"),
                              "depths": depths, "rootzone_0_60cm_weighted": rz}
    return out


# ------------------------------------------------------------------ AppEEARS
_tok = {"v": None, "exp": 0.0}


def _mdy(iso):
    return dt.date.fromisoformat(iso).strftime("%m-%d-%Y")


async def _token(c):
    if _tok["v"] and time.time() < _tok["exp"]:
        return _tok["v"]
    try:
        auth = (os.environ["EARTHDATA_USER"], os.environ["EARTHDATA_PASS"])
    except KeyError:
        raise UpstreamError("EARTHDATA_USER / EARTHDATA_PASS are not set on the server", 500)
    r = await _request(c, "POST", f"{APPEEARS}/login", auth=auth)
    _tok.update(v=r.json()["token"], exp=time.time() + 3000)
    return _tok["v"]


async def appeears_layers(product):
    async with httpx.AsyncClient(timeout=60) as c:
        r = await _request(c, "GET", f"{APPEEARS}/product/{product}")
    return sorted(r.json().keys())


async def appeears_submit(layers, lat, lon, start, end, name):
    body = {"task_type": "point", "task_name": name,
            "params": {"dates": [{"startDate": _mdy(start), "endDate": _mdy(end)}],
                       "layers": layers,
                       "coordinates": [{"id": "pt", "latitude": lat, "longitude": lon, "category": "point"}]}}
    async with httpx.AsyncClient(timeout=60) as c:
        h = {"Authorization": f"Bearer {await _token(c)}"}
        r = await _request(c, "POST", f"{APPEEARS}/task", json=body, headers=h)
    return r.json()["task_id"]


async def appeears_status(task_id):
    async with httpx.AsyncClient(timeout=60) as c:
        h = {"Authorization": f"Bearer {await _token(c)}"}
        r = await _request(c, "GET", f"{APPEEARS}/task/{task_id}", headers=h)
    return r.json()


def _num(v):
    try:
        return float(v)
    except (TypeError, ValueError):
        return None


async def appeears_rows(task_id, suffixes):
    """Download result CSVs and merge into one row per date. Columns are matched by layer-name suffix."""
    async with httpx.AsyncClient(timeout=180, follow_redirects=True) as c:
        h = {"Authorization": f"Bearer {await _token(c)}"}
        files = (await _request(c, "GET", f"{APPEEARS}/bundle/{task_id}", headers=h)).json()["files"]
        acc = defaultdict(lambda: defaultdict(list))
        for f in files:
            n = f["file_name"].lower()
            if n.endswith(".csv") and "results" in n:
                txt = (await _request(c, "GET", f"{APPEEARS}/bundle/{task_id}/{f['file_id']}", headers=h)).text
                for row in csv.DictReader(io.StringIO(txt)):
                    day = (row.get("Date") or "")[:10]
                    for col, val in row.items():
                        for s in suffixes:
                            if col.endswith(s) and _num(val) is not None:
                                acc[day][s].append(_num(val))
    return [dict(date=d, **{s: statistics.fmean(v) for s, v in cols.items()})
            for d, cols in sorted(acc.items()) if d]


# ----------------------------------------------------------- post-processing
def _doy(d):
    return dt.date.fromisoformat(d).timetuple().tm_yday


def _anomalies(rows, field):
    """Add mean / z-score / percentile / VCI vs the same time of year (8-day buckets) across all years."""
    buckets = defaultdict(list)
    for r in rows:
        if r.get(field) is not None:
            buckets[_doy(r["date"]) // 8].append(r[field])
    for r in rows:
        v = r.get(field)
        if v is None:
            continue
        vals = buckets[_doy(r["date"]) // 8]
        m = statistics.fmean(vals)
        sd = statistics.pstdev(vals) if len(vals) > 1 else 0
        lo, hi = min(vals), max(vals)
        r[f"{field}_mean"] = round(m, 4)
        r[f"{field}_z"] = round((v - m) / sd, 2) if sd else None
        r[f"{field}_pctl"] = round(100 * sum(x <= v for x in vals) / len(vals), 1)
        r[f"{field}_vci"] = round(100 * (v - lo) / (hi - lo), 1) if hi > lo else None
    return rows


def process_smap(rows):
    out = []
    for r in rows:
        v = r.get("Geophysical_Data_sm_rootzone")
        if v is not None and 0 <= v <= 1:  # -9999 fill excluded
            out.append({"date": r["date"], "sm_rootzone": round(v, 4)})
    _anomalies(out, "sm_rootzone")
    return {"unit": "m3/m3", "count": len(out), "latest": out[-1] if out else None, "series": out}


def process_veg(rows):
    NDVI, EVI, REL = "_250m_16_days_NDVI", "_250m_16_days_EVI", "_250m_16_days_pixel_reliability"
    # AppEEARS normally returns already-scaled values (-0.2 to 1.0). Only apply the 0.0001 factor to raw integers.
    probe = [abs(r[k]) for r in rows for k in (NDVI, EVI) if r.get(k) is not None and r[k] != -3000]
    scale = 0.0001 if probe and max(probe) > 5 else 1.0
    ok = lambda v: v is not None and v != -3000 and -0.25 <= v * scale <= 1.0
    out = []
    for r in rows:
        nd, ev, rel = r.get(NDVI), r.get(EVI), r.get(REL)
        if not ok(nd) or (rel is not None and not 0 <= rel <= 1):
            continue  # fill value, snow or cloud
        out.append({"date": r["date"], "ndvi": round(nd * scale, 4),
                    "evi": round(ev * scale, 4) if ok(ev) else None})
    _anomalies(out, "ndvi")
    return {"count": len(out), "latest": out[-1] if out else None, "series": out}


def stress_score(weather_rows, smap, veg):
    """0-100, higher = more water stress. Averages whichever components are available."""
    comp = {}
    for r in reversed(weather_rows or []):
        if r.get("GWETROOT") is not None:
            comp["root_zone_wetness_model"] = round((1 - r["GWETROOT"]) * 100, 1)
            break
    s = (smap or {}).get("latest") or {}
    if s.get("sm_rootzone_pctl") is not None:
        comp["soil_moisture_smap"] = round(100 - s["sm_rootzone_pctl"], 1)
    v = (veg or {}).get("latest") or {}
    if v.get("ndvi_vci") is not None:
        comp["vegetation_ndvi"] = round(100 - v["ndvi_vci"], 1)
    if not comp:
        return None
    score = round(sum(comp.values()) / len(comp), 1)
    return {"score": score, "level": "low" if score < 35 else "moderate" if score < 60 else "high",
            "components": comp}