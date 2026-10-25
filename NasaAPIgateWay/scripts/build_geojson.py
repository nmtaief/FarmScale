import os, json, sqlite3, datetime as dt

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

con = sqlite3.connect("f:/Nasa API/FarmScale/NasaAPIgateWay/engine.db")
cur = con.cursor()

# Read cached weather
weather_by_coord = {}
cur.execute("SELECT k, v FROM cache WHERE k LIKE 'weather:%'")
for k, v in cur.fetchall():
    try:
        parts = k.split(":")
        lat_k = f"{float(parts[2]):.2f}"
        lon_k = f"{float(parts[3]):.2f}"
        weather_by_coord[(lat_k, lon_k)] = json.loads(v)
    except Exception as e:
        pass

# Read jobs
jobs_by_coord = {}
cur.execute("SELECT kind, task_id, status, error, result, jkey FROM jobs")
for kind, tid, status, err, res, jkey in cur.fetchall():
    try:
        # key format: kind:lat:lon:start:end
        parts = jkey.split(":")
        lat_k = f"{float(parts[1]):.2f}"
        lon_k = f"{float(parts[2]):.2f}"
        if (lat_k, lon_k) not in jobs_by_coord:
            jobs_by_coord[(lat_k, lon_k)] = {}
        jobs_by_coord[(lat_k, lon_k)][kind] = {
            "task_id": tid,
            "status": status,
            "error": err,
            "result": json.loads(res) if res else None
        }
    except Exception as e:
        pass

def flatten(prefix, obj, out):
    if isinstance(obj, dict):
        for k, v in obj.items():
            new_key = f"{prefix}.{k}" if prefix else k
            flatten(new_key, v, out)
    elif isinstance(obj, (int, float, str, bool)):
        out[prefix] = obj

# Build points
point_features = []
district_data_map = {}

for p in DISTRICTS:
    lat_k = f"{p['lat']:.2f}"
    lon_k = f"{p['lon']:.2f}"
    
    w_rows = weather_by_coord.get((lat_k, lon_k), [])
    latest_w = next((r for r in reversed(w_rows) if r.get("T2M") is not None), None)
    
    # Calculate simple water stress score from available data
    wetness = latest_w.get("GWETROOT") if latest_w else None
    stress_val = round((1 - wetness) * 100, 1) if wetness is not None else 45.0
    stress_lvl = "low" if stress_val < 35 else "moderate" if stress_val < 60 else "high"

    j_info = jobs_by_coord.get((lat_k, lon_k), {})
    smap_job = j_info.get("smap", {"status": "pending"})
    veg_job = j_info.get("vegetation", {"status": "pending"})

    profile = {
        "id": p["id"],
        "name": p["name"],
        "zone": p["zone"],
        "lat": p["lat"],
        "lon": p["lon"],
        "fetched_at": dt.datetime.now(dt.timezone.utc).isoformat(),
        "source": "NASA POWER / AppEEARS SMAP & MODIS Gateway",
        "weather": {
            "latest": latest_w,
            "total_monthly_records": len(w_rows),
            "temp_mean_c": latest_w.get("T2M") if latest_w else None,
            "temp_max_c": latest_w.get("T2M_MAX") if latest_w else None,
            "temp_min_c": latest_w.get("T2M_MIN") if latest_w else None,
            "precip_mm": latest_w.get("PRECTOTCORR") if latest_w else None,
            "rootzone_wetness": wetness,
        },
        "soil_moisture": {
            "status": smap_job.get("status"),
            "task_id": smap_job.get("task_id"),
            "product": "NASA SPL4SMGP.008",
        },
        "vegetation": {
            "status": veg_job.get("status"),
            "task_id": veg_job.get("task_id"),
            "product": "NASA MOD13Q1.061",
        },
        "water_stress": {
            "score": stress_val,
            "level": stress_lvl,
            "components": {
                "root_zone_wetness_model": stress_val
            }
        }
    }
    district_data_map[p["name"].lower()] = profile
    district_data_map[p["id"]] = profile

    props = {}
    flatten("", profile, props)

    point_features.append({
        "type": "Feature",
        "geometry": {
            "type": "Point",
            "coordinates": [p["lon"], p["lat"]]
        },
        "properties": props
    })

vector_geojson = {
    "type": "FeatureCollection",
    "name": "rajshahi_nasa_vector",
    "features": point_features
}

with open("rajshahi_nasa_vector.geojson", "w", encoding="utf-8") as f:
    json.dump(vector_geojson, f, indent=2)

print(f"[OK] Generated rajshahi_nasa_vector.geojson with {len(point_features)} districts:")
for feat in point_features:
    p = feat["properties"]
    print(f" - {p.get('name')}: Temp {p.get('weather.temp_mean_c')}°C, Wetness {p.get('weather.rootzone_wetness')}, Stress: {p.get('water_stress.score')} ({p.get('water_stress.level')}), SMAP: {p.get('soil_moisture.status')}, Veg: {p.get('vegetation.status')}")

# Join with boundary polygons
poly_file = "rajshahi_boundaries.geojson"
if os.path.exists(poly_file):
    with open(poly_file, "r", encoding="utf-8") as f:
        poly_fc = json.load(f)
    
    joined_polygons = []
    for f in poly_fc.get("features", []):
        sname = f["properties"].get("shapeName", "").lower()
        matched = None
        for dname, dprof in district_data_map.items():
            if dname in sname or (dname == "bogura" and "bogra" in sname) or (dname == "chapainawabganj" and "nawabganj" in sname):
                matched = dprof
                break
        
        poly_props = dict(f["properties"])
        if matched:
            flatten("", matched, poly_props)
        
        joined_polygons.append({
            "type": "Feature",
            "geometry": f["geometry"],
            "properties": poly_props
        })

    with open("rajshahi_nasa_polygons.geojson", "w", encoding="utf-8") as f:
        json.dump({"type": "FeatureCollection", "name": "rajshahi_nasa_polygons", "features": joined_polygons}, f, indent=2)
    print(f"[OK] Generated rajshahi_nasa_polygons.geojson with {len(joined_polygons)} district polygons!")
