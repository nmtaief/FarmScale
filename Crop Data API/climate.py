"""Location data: climate normals (NASA POWER), soil (ISRIC SoilGrids) and reference evapotranspiration."""
import math, time, asyncio
import httpx

POWER_CLIM = "https://power.larc.nasa.gov/api/temporal/climatology/point"
SOILGRIDS = "https://rest.isric.org/soilgrids/v2.0/properties/query"
MON = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"]
DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
MID = [15, 45, 74, 105, 135, 166, 196, 227, 258, 288, 319, 349]  # mid-month day of year


class UpstreamError(Exception):
    def __init__(self, msg, status=502):
        super().__init__(msg)
        self.status = status


async def _get(client, url, params, retries=3):
    for i in range(retries):
        try:
            r = await client.get(url, params=params)
        except httpx.HTTPError as e:
            if i == retries - 1:
                raise UpstreamError(f"Network error calling {url}: {e}")
        else:
            if r.status_code < 400:
                return r
            if r.status_code not in (429, 500, 502, 503, 504) or i == retries - 1:
                raise UpstreamError(f"{url} returned {r.status_code}: {r.text[:160]}")
        await asyncio.sleep(2 ** (i + 1))


# ------------------------------------------------------------------ ET0
def _ra(lat, doy):
    """Extraterrestrial radiation, MJ/m2/day (FAO-56 eq. 21)."""
    phi = math.radians(lat)
    dr = 1 + 0.033 * math.cos(2 * math.pi * doy / 365)
    d = 0.409 * math.sin(2 * math.pi * doy / 365 - 1.39)
    ws = math.acos(max(-1, min(1, -math.tan(phi) * math.tan(d))))
    return 24 * 60 / math.pi * 0.0820 * dr * (ws * math.sin(phi) * math.sin(d) + math.cos(phi) * math.cos(d) * math.sin(ws))


def hargreaves(lat, doy, tmean, tmax, tmin):
    """Reference evapotranspiration mm/day (Hargreaves-Samani); needs only temperature and latitude."""
    return max(0.0, 0.0023 * (_ra(lat, doy) / 2.45) * (tmean + 17.8) * math.sqrt(max(tmax - tmin, 0)))


def eff_rain(p):
    """USDA SCS effective rainfall (mm) from monthly rainfall (mm), as used by CROPWAT."""
    return p * (125 - 0.2 * p) / 125 if p <= 250 else 125 + 0.1 * p


async def climatology(lat, lon):
    """Twelve monthly climate normals plus derived ET0 and effective rain."""
    async with httpx.AsyncClient(timeout=90) as c:
        r = await _get(c, POWER_CLIM, {"parameters": "T2M,T2M_MAX,T2M_MIN,PRECTOTCORR", "community": "AG",
                                       "latitude": lat, "longitude": lon, "format": "JSON"})
    p = r.json()["properties"]["parameter"]
    out = []
    for i, m in enumerate(MON):
        t, tx, tn, pr = (p[k].get(m) for k in ("T2M", "T2M_MAX", "T2M_MIN", "PRECTOTCORR"))
        if any(v is None or v == -999 for v in (t, tx, tn, pr)):
            raise UpstreamError("NASA POWER has no climate normals for this location")
        rain = pr * DAYS[i]
        et0 = hargreaves(lat, MID[i], t, tx, tn)
        out.append({"month": i + 1, "tmean": round(t, 1), "tmax": round(tx, 1), "tmin": round(tn, 1),
                    "rain_mm": round(rain, 1), "eff_rain_mm": round(eff_rain(rain), 1),
                    "et0_mm_day": round(et0, 2), "et0_mm": round(et0 * DAYS[i], 1)})
    return out


# ------------------------------------------------------------------ soil
def texture_class(sand, silt, clay):
    if silt + 1.5 * clay < 15: return "sand"
    if silt + 1.5 * clay >= 15 and silt + 2 * clay < 30: return "loamy sand"
    if (7 <= clay < 20 and sand > 52 and silt + 2 * clay >= 30) or (clay < 7 and silt < 50 and silt + 2 * clay >= 30): return "sandy loam"
    if 7 <= clay < 27 and 28 <= silt < 50 and sand <= 52: return "loam"
    if (silt >= 50 and 12 <= clay < 27) or (50 <= silt < 80 and clay < 12): return "silt loam"
    if silt >= 80 and clay < 12: return "silt"
    if 20 <= clay < 35 and silt < 28 and sand > 45: return "sandy clay loam"
    if 27 <= clay < 40 and sand <= 20: return "silty clay loam"
    if 27 <= clay < 40 and 20 < sand <= 45: return "clay loam"
    if clay >= 35 and sand > 45: return "sandy clay"
    if clay >= 40 and silt >= 40: return "silty clay"
    if clay >= 40 and sand <= 45 and silt < 40: return "clay"
    return "loam"


GROUPS = {"light": {"sand", "loamy sand", "sandy loam"}, "medium": {"loam", "silt loam", "silt", "sandy clay loam"},
          "heavy": {"clay loam", "silty clay loam", "sandy clay", "silty clay", "clay"}}


def finish_soil(s):
    """Add texture class and group when sand, silt and clay are all known."""
    if all(s.get(k) is not None for k in ("sand", "silt", "clay")):
        s["texture"] = texture_class(s["sand"], s["silt"], s["clay"])
        s["texture_group"] = next(g for g, v in GROUPS.items() if s["texture"] in v)
    return s


_lock, _last = asyncio.Lock(), 0.0
W = {"0-5cm": 5, "5-15cm": 10, "15-30cm": 15}


async def soilgrids(lat, lon):
    """Topsoil (0-30 cm, depth-weighted) pH, organic carbon, nitrogen and texture. Throttled for the public API."""
    global _last
    async with _lock:
        wait = 12 - (time.time() - _last)
        if wait > 0:
            await asyncio.sleep(wait)
        try:
            async with httpx.AsyncClient(timeout=90) as c:
                r = await _get(c, SOILGRIDS, {"lat": lat, "lon": lon, "depth": list(W), "value": "mean",
                                              "property": ["phh2o", "soc", "nitrogen", "clay", "sand", "silt"]})
        finally:
            _last = time.time()
    vals = {}
    for layer in r.json()["properties"]["layers"]:
        f = layer["unit_measure"].get("d_factor") or 1
        pairs = [(d["values"].get("mean"), W[d["label"]]) for d in layer["depths"] if d["label"] in W]
        pairs = [(v / f, w) for v, w in pairs if v is not None]
        vals[layer["name"]] = round(sum(v * w for v, w in pairs) / sum(w for _, w in pairs), 2) if pairs else None
    return finish_soil({"ph": vals.get("phh2o"), "soc_g_kg": vals.get("soc"), "n_g_kg": vals.get("nitrogen"),
                        "sand": vals.get("sand"), "silt": vals.get("silt"), "clay": vals.get("clay")})
