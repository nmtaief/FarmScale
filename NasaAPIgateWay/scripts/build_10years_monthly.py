"""Build complete month-by-month 10-year (130-month) dataset for all 8 districts and 70 upazilas."""
import os, sys, json, csv, sqlite3, datetime as dt

con = sqlite3.connect("f:/Nasa API/FarmScale/NasaAPIgateWay/engine.db")
cur = con.cursor()

# Load districts
DISTRICTS = [
    {"id": "D_RAJ", "name": "Rajshahi", "zone": "High Barind Tract", "lat": 24.3745, "lon": 88.6042},
    {"id": "D_BOG", "name": "Bogura", "zone": "Karatoa-Bangali Floodplain", "lat": 24.8465, "lon": 89.3777},
    {"id": "D_PAB", "name": "Pabna", "zone": "Ganges River Floodplain", "lat": 24.0064, "lon": 89.2483},
    {"id": "D_NAO", "name": "Naogaon", "zone": "Barind Tract and Atrai Basin", "lat": 24.8138, "lon": 88.9515},
    {"id": "D_NAT", "name": "Natore", "zone": "Chalan Beel Depression", "lat": 24.4172, "lon": 88.9959},
    {"id": "D_JOY", "name": "Joypurhat", "zone": "Level Barind Tract", "lat": 25.0947, "lon": 89.0279},
    {"id": "D_CHA", "name": "Chapainawabganj", "zone": "Mahananda River Basin", "lat": 24.5965, "lon": 88.2775},
    {"id": "D_SIR", "name": "Sirajganj", "zone": "Jamuna River Floodplain", "lat": 24.4534, "lon": 89.7008},
]

# Load upazilas
with open("rajshahi_upazilas.geojson", "r", encoding="utf-8") as f:
    upz_fc = json.load(f)

# Load cached monthly weather records
cur.execute("SELECT k, v FROM cache WHERE k LIKE 'weather:monthly:%'")
cached_weather = {}
for k, v in cur.fetchall():
    try:
        parts = k.split(":")
        lat_k = f"{float(parts[2]):.2f}"
        lon_k = f"{float(parts[3]):.2f}"
        cached_weather[(lat_k, lon_k)] = json.loads(v)
    except Exception:
        pass

def find_weather(lat, lon):
    lat_k = f"{lat:.2f}"
    lon_k = f"{lon:.2f}"
    if (lat_k, lon_k) in cached_weather:
        return cached_weather[(lat_k, lon_k)]
    # closest match
    best = None
    min_dist = float("inf")
    for (clk, cln), rows in cached_weather.items():
        dist = (float(clk) - lat)**2 + (float(cln) - lon)**2
        if dist < min_dist:
            min_dist = dist
            best = rows
    return best or []

def process_series(rows):
    out = []
    for r in rows:
        d = str(r.get("date", ""))
        if not d or d.endswith("13"):
            continue
        year = int(d[:4])
        if year < 2016 or year > 2026:
            continue
        ym = f"{d[:4]}-{d[4:6]}" if len(d) >= 6 else d
        wetness = r.get("GWETROOT")
        topwetness = r.get("GWETTOP")
        temp = r.get("T2M")
        tmax = r.get("T2M_MAX")
        tmin = r.get("T2M_MIN")
        rain = r.get("PRECTOTCORR")
        
        # calculate monthly water stress
        if wetness is not None:
            stress = round((1 - wetness) * 100, 1)
        else:
            stress = 15.0
        lvl = "low" if stress < 35 else "moderate" if stress < 60 else "high"
        
        out.append({
            "date": ym,
            "year": int(d[:4]),
            "month": int(d[4:6]),
            "temp_mean_c": round(temp, 2) if temp is not None else None,
            "temp_max_c": round(tmax, 2) if tmax is not None else None,
            "temp_min_c": round(tmin, 2) if tmin is not None else None,
            "precip_mm": round(rain, 2) if rain is not None else None,
            "rootzone_wetness": round(wetness, 3) if wetness is not None else None,
            "topsoil_wetness": round(topwetness, 3) if topwetness is not None else None,
            "water_stress_score": stress,
            "water_stress_level": lvl
        })
    return out

# 1. Process 8 Districts
districts_monthly = {}
for d in DISTRICTS:
    w = find_weather(d["lat"], d["lon"])
    s = process_series(w)
    districts_monthly[d["id"]] = {
        "id": d["id"],
        "name": d["name"],
        "zone": d["zone"],
        "lat": d["lat"],
        "lon": d["lon"],
        "total_months": len(s),
        "series": s
    }

with open("rajshahi_districts_10years_monthly.json", "w", encoding="utf-8") as f:
    json.dump(districts_monthly, f, indent=2)
print(f"[OK] Wrote rajshahi_districts_10years_monthly.json with {len(districts_monthly)} districts!")

# 2. Process 70 Upazilas
upazilas_monthly = {}
for feat in upz_fc["features"]:
    p = feat["properties"]
    name = p.get("shapeName", "Unknown")
    district = p.get("district", "Unknown")
    lat = p.get("centroid_lat")
    lon = p.get("centroid_lon")
    w = find_weather(lat, lon)
    s = process_series(w)
    upazilas_monthly[name] = {
        "name": name,
        "district": district,
        "lat": lat,
        "lon": lon,
        "total_months": len(s),
        "series": s
    }

with open("rajshahi_upazilas_10years_monthly.json", "w", encoding="utf-8") as f:
    json.dump(upazilas_monthly, f, indent=2)
print(f"[OK] Wrote rajshahi_upazilas_10years_monthly.json with {len(upazilas_monthly)} upazilas!")

# 3. Export Comprehensive CSV
csv_file = "rajshahi_10years_monthly.csv"
with open(csv_file, "w", newline="", encoding="utf-8") as f:
    writer = csv.writer(f)
    writer.writerow([
        "AreaType", "District", "AreaName", "YearMonth", "Year", "Month",
        "TempMean_C", "TempMax_C", "TempMin_C", "Precip_mm", "RootzoneWetness", "TopsoilWetness", "WaterStressScore", "WaterStressLevel"
    ])
    # Write districts
    for did, d in districts_monthly.items():
        for r in d["series"]:
            writer.writerow([
                "District", d["name"], d["name"], r["date"], r["year"], r["month"],
                r["temp_mean_c"], r["temp_max_c"], r["temp_min_c"], r["precip_mm"], r["rootzone_wetness"], r["topsoil_wetness"], r["water_stress_score"], r["water_stress_level"]
            ])
    # Write upazilas
    for uname, u in upazilas_monthly.items():
        for r in u["series"]:
            writer.writerow([
                "Upazila", u["district"], uname, r["date"], r["year"], r["month"],
                r["temp_mean_c"], r["temp_max_c"], r["temp_min_c"], r["precip_mm"], r["rootzone_wetness"], r["topsoil_wetness"], r["water_stress_score"], r["water_stress_level"]
            ])
print(f"[OK] Wrote {csv_file} with full 10-year month-by-month records!")
