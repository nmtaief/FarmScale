"""Crop knowledge base and calculations: suitability, water, nutrition and soil impact."""
import json, datetime as dt
from pathlib import Path

_here = Path(__file__).parent
_kb = next((p for p in (_here / "data" / "crops.json", _here / "crops.json") if p.exists()), None)
if _kb is None:
    raise FileNotFoundError("crops.json not found. Put it in a 'data' folder next to engine.py, or beside engine.py.")
KB = json.loads(_kb.read_text(encoding="utf-8"))
CROPS = {c["id"]: c for c in KB["crops"]}
DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
# Share of total uptake removed in the harvested product [N, P2O5, K2O]
REMOVAL = {"cereal": (.65, .75, .2), "legume": (.75, .7, .4), "oilseed": (.65, .7, .25), "root_tuber": (.7, .75, .65),
           "vegetable": (.7, .75, .7), "fruit": (.55, .6, .6), "fibre": (.5, .6, .4), "sugar": (.5, .6, .45)}
WEIGHTS = {"temperature": .40, "water": .25, "soil_ph": .20, "texture": .15}
ORDER = ["light", "medium", "heavy"]


def trap(v, r):
    a, b, c, d = r
    if v <= a or v >= d: return 0.0
    if v < b: return (v - a) / (b - a)
    if v <= c: return 1.0
    return (d - v) / (d - c)


def klass(s):
    return "high" if s >= 75 else "moderate" if s >= 55 else "marginal" if s >= 35 else "unsuitable"


def profile(c):
    n = sum(c["cycle"])
    return {"id": c["id"], "name": c["name"], "category": c["cat"], "cycle_days": n,
            "stage_days": dict(zip(("initial", "development", "mid", "late"), c["cycle"])),
            "kc": dict(zip(("initial", "mid", "end"), c["kc"])),
            "temperature_c": dict(zip(("abs_min", "opt_min", "opt_max", "abs_max"), c["temp"])),
            "soil_ph": dict(zip(("abs_min", "opt_min", "opt_max", "abs_max"), c["ph"])),
            "preferred_texture": c["tex"], "typical_yield_t_ha": c["yield"],
            "nutrient_uptake_kg_per_t": dict(zip(("N", "P2O5", "K2O"), c["uptake"])),
            "n_fixation_fraction": c["fix"], "drought_sensitivity": c["drought"], "critical_water_stages": c["crit"],
            "micronutrients_to_watch": c["micro"],
            "soil_effects": {"organic_matter": c["om"], "erosion_risk": c["erosion"], "note": c["note"]},
            "data_confidence": c["conf"]}


# ---------------------------------------------------------------- water
def simulate(crop, clim, start):
    """Daily crop water balance over one cycle, aggregated by month (CROPWAT-style, using normals)."""
    ini, dev, mid, late = crop["cycle"]
    k0, k1, k2 = crop["kc"]
    n = ini + dev + mid + late
    day0 = dt.date(2023, start, 1)
    stg = {s: {"days": 0, "kc": 0.0, "etc": 0.0, "pe": 0.0} for s in ("initial", "development", "mid", "late")}
    mon, tsum = {}, 0.0
    for i in range(n):
        d = day0 + dt.timedelta(days=i)
        c, dm = clim[d.month - 1], DAYS[d.month - 1]
        if i < ini: s, kc = "initial", k0
        elif i < ini + dev: s, kc = "development", k0 + (k1 - k0) * (i - ini + .5) / dev
        elif i < ini + dev + mid: s, kc = "mid", k1
        else: s, kc = "late", k1 + (k2 - k1) * (i - ini - dev - mid + .5) / late
        etc, pe = kc * c["et0_mm_day"], c["eff_rain_mm"] / dm
        g = stg[s]; g["days"] += 1; g["kc"] += kc; g["etc"] += etc; g["pe"] += pe
        m = mon.setdefault(d.month, [0.0, 0.0, 0.0]); m[0] += etc; m[1] += pe; m[2] += c["rain_mm"] / dm
        tsum += c["tmean"]
    etc_t = sum(m[0] for m in mon.values())
    used = sum(min(m[0], m[1]) for m in mon.values())
    deficit = sum(max(m[0] - m[1], 0) for m in mon.values())
    surplus = sum(max(m[1] - m[0], 0) for m in mon.values())
    extra = max(0.0, crop.get("extra_mm", 0) - surplus)  # land preparation / percolation not covered by surplus rain
    return {"start_month": start, "start_month_name": MONTHS[start - 1], "cycle_days": n,
            "mean_temp_c": round(tsum / n, 1), "seasonal_rain_mm": round(sum(m[2] for m in mon.values())),
            "etc_mm": round(etc_t), "effective_rain_mm": round(sum(m[1] for m in mon.values())),
            "rain_coverage": round(used / etc_t, 2) if etc_t else 1.0,
            "land_prep_mm": round(extra), "net_irrigation_mm": round(deficit + extra),
            "stages": [{"stage": k, "days": g["days"], "avg_kc": round(g["kc"] / g["days"], 2), "etc_mm": round(g["etc"]),
                        "effective_rain_mm": round(g["pe"])} for k, g in stg.items() if g["days"]],
            "months": [{"month": k, "month_name": MONTHS[k - 1], "etc_mm": round(v[0]), "effective_rain_mm": round(v[1]),
                        "irrigation_mm": round(max(v[0] - v[1], 0))} for k, v in mon.items()]}


def water_plan(crop, clim, start, area_ha=1.0, efficiency=0.6):
    s = simulate(crop, clim, start)
    net = s["net_irrigation_mm"]
    gross = net / efficiency
    return {**s, "irrigation_efficiency": efficiency, "gross_irrigation_mm": round(gross),
            "per_ha_m3": {"net": round(net * 10), "gross": round(gross * 10)}, "area_ha": area_ha,
            "for_area_m3": {"net": round(net * 10 * area_ha), "gross": round(gross * 10 * area_ha)},
            "drought_sensitivity": crop["drought"], "critical_stages": crop["crit"]}


# ----------------------------------------------------------- suitability
def score_crop(crop, clim, soil, start, irrigated=False):
    sim = simulate(crop, clim, start)
    comp = {"temperature": 100 * trap(sim["mean_temp_c"], crop["temp"])}
    fit = min(1.0, sim["rain_coverage"] / 0.8)
    lo, hi = crop["rain_excess"]
    excess = 1.0 if sim["seasonal_rain_mm"] <= lo else max(0.0, (hi - sim["seasonal_rain_mm"]) / (hi - lo))
    comp["water"] = 100 * ((0.6 + 0.4 * fit) if irrigated else fit) * excess
    if soil.get("ph") is not None:
        comp["soil_ph"] = 100 * trap(soil["ph"], crop["ph"])
    g = soil.get("texture_group")
    if g:
        dist = min(abs(ORDER.index(g) - ORDER.index(t)) for t in crop["tex"])
        comp["texture"] = {0: 100, 1: 55}.get(dist, 20)
    score = sum(WEIGHTS[k] * v for k, v in comp.items()) / sum(WEIGHTS[k] for k in comp)
    why = []
    if comp["temperature"] < 50:
        why.append(f"Mean temperature in the growing period is {sim['mean_temp_c']} C; the crop prefers {crop['temp'][1]}-{crop['temp'][2]} C.")
    if comp["water"] < 50:
        if excess < 0.5: why.append(f"Seasonal rainfall of {sim['seasonal_rain_mm']} mm is too high for this crop.")
        else: why.append(f"Rain covers only {round(sim['rain_coverage'] * 100)}% of the crop water need" + ("." if irrigated else "; irrigation would be needed."))
    if comp.get("soil_ph", 100) < 50:
        why.append(f"Soil pH {soil['ph']:.1f} is outside the preferred {crop['ph'][1]}-{crop['ph'][2]}.")
    if comp.get("texture", 100) < 50:
        why.append(f"{soil['texture'].title()} soil is a poor match; the crop prefers {'/'.join(crop['tex'])} textures.")
    return {"start_month": start, "start_month_name": MONTHS[start - 1], "score": round(score), "class": klass(score),
            "components": {k: round(v) for k, v in comp.items()}, "mean_temp_c": sim["mean_temp_c"],
            "rain_coverage": sim["rain_coverage"], "limiting_factors": why}


def suitability(crop, clim, soil, irrigated=False):
    starts = [1] if crop["cycle"][2] >= 365 else range(1, 13)
    res = sorted((score_crop(crop, clim, soil, s, irrigated) for s in starts), key=lambda r: -r["score"])
    best = dict(res[0])
    best["planting_windows"] = [{"month": r["start_month"], "month_name": r["start_month_name"], "score": r["score"]} for r in res[:3]]
    return best


def rank_all(clim, soil, irrigated=False, category=None):
    rows = []
    for c in CROPS.values():
        if category and c["cat"] != category: continue
        s = suitability(c, clim, soil, irrigated)
        rows.append({"id": c["id"], "name": c["name"], "category": c["cat"], "score": s["score"], "class": s["class"],
                     "best_planting_month": s["start_month"], "best_planting_month_name": s["start_month_name"],
                     "limiting_factors": s["limiting_factors"]})
    return sorted(rows, key=lambda r: -r["score"])


# ------------------------------------------------------------- nutrition
def _budget(crop, y):
    up = [u * y for u in crop["uptake"]]
    fixed = up[0] * crop.get("fix", 0)
    rem = [u * r for u, r in zip(up, REMOVAL[crop["cat"]])]
    return up, rem, fixed


def nutrition(crop, soil, yield_t_ha=None, area_ha=1.0):
    y = yield_t_ha or crop["yield"]
    up, rem, fixed = _budget(crop, y)
    n_soil = soil.get("n_g_kg")
    supply = n_soil * 2600 * 0.012 if n_soil else 45.0  # total N in 20 cm topsoil (kg/ha) x ~1.2% mineralised per season
    n_fert = max(0.0, up[0] - fixed - supply) / 0.40     # ~40% fertilizer N recovery
    if crop.get("fix", 0) > 0: n_fert = min(n_fert, 25.0)  # legumes: starter dose only
    ph, sand, soc = soil.get("ph"), soil.get("sand"), soil.get("soc_g_kg")
    p_fert = rem[1] * (1.3 if ph is not None and (ph < 5.5 or ph > 7.8) else 1.0)   # P is fixed on acid/alkaline soils
    k_fert = rem[2] * (1.2 if sand is not None and sand > 60 else 1.0)              # K leaches from sandy soil
    prod = {"urea": round(n_fert / 0.46), "tsp": round(p_fert / 0.46), "mop": round(k_fert / 0.60)}
    adv = []
    if ph is not None and ph < 5.5: adv.append("Soil is acidic: consider liming; confirm the rate with a soil test.")
    if ph is not None and ph > 8.0: adv.append("Soil is alkaline: zinc, iron and phosphorus may be less available.")
    if soc is not None and soc < 10: adv.append("Low organic carbon: add compost or manure and return crop residues.")
    if crop.get("fix", 0) > 0: adv.append("Inoculate seed with rhizobia to get the full nitrogen fixation.")
    if crop["micro"]: adv.append("Watch for deficiency of: " + ", ".join(crop["micro"]) + ".")
    return {"yield_t_ha": y, "area_ha": area_ha,
            "uptake_kg_ha": dict(zip(("N", "P2O5", "K2O"), (round(v) for v in up))),
            "removal_kg_ha": dict(zip(("N", "P2O5", "K2O"), (round(v) for v in rem))),
            "n_from_fixation_kg_ha": round(fixed), "soil_n_supply_kg_ha": round(supply),
            "soil_n_supply_basis": "estimated from soil total nitrogen" if n_soil else "default of 45 kg/ha (no soil nitrogen data)",
            "fertilizer_nutrients_kg_ha": {"N": round(n_fert), "P2O5": round(p_fert), "K2O": round(k_fert)},
            "fertilizer_products_kg_ha": prod, "for_area_kg": {k: round(v * area_ha) for k, v in prod.items()},
            "micronutrients_to_watch": crop["micro"], "advice": adv,
            "basis": "Nitrogen = (crop uptake - fixation - soil supply) / 40% recovery. Phosphorus and potassium replace what the harvest removes. Indicative only; confirm with a soil test."}


# ----------------------------------------------------------- soil impact
def soil_impact(crop, soil, yield_t_ha=None):
    y = yield_t_ha or crop["yield"]
    up, rem, fixed = _budget(crop, y)
    n_net = max(0.0, rem[0] - fixed)
    ref = (100, 40, 100)  # reference removal (kg/ha) for a heavily depleting crop
    score = min(100.0, sum(v / r for v, r in zip((n_net, rem[1], rem[2]), ref)) / 3 * 100)
    return {"yield_t_ha": y, "nutrient_removal_kg_ha": dict(zip(("N", "P2O5", "K2O"), (round(v) for v in rem))),
            "n_fixed_kg_ha": round(fixed), "net_n_balance_kg_ha": round(fixed - rem[0]),
            "depletion": {"score": round(score), "level": "low" if score < 35 else "moderate" if score < 60 else "high"},
            "organic_matter_effect": crop["om"], "erosion_risk": crop["erosion"], "note": crop["note"]}


def rotation(crop, clim, soil, irrigated=False):
    want = {"legume", "oilseed"} if crop.get("fix", 0) == 0 else {"cereal", "oilseed", "vegetable"}
    why = "fixes nitrogen and breaks pest and disease cycles" if crop.get("fix", 0) == 0 else "uses the nitrogen left by the legume"
    out = []
    for r in rank_all(clim, soil, irrigated):
        if r["id"] != crop["id"] and r["category"] in want and r["score"] >= 45:
            out.append({"id": r["id"], "name": r["name"], "score": r["score"], "why": ("Legume or oilseed: " if crop.get("fix", 0) == 0 else "Follow-on crop: ") + why})
        if len(out) == 3: break
    return out