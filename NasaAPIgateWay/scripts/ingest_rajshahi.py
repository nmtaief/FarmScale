"""Ingest Rajshahi Division NASA data, produce rajshahi_nasa_vector.geojson and rajshahi_nasa_polygons.geojson."""
import os, sys, time, json, datetime as dt
import httpx

BASE_URL = os.getenv("NASA_API_URL", "http://127.0.0.1:8000")
API_KEY = os.getenv("NASA_KEY", "ge_PdJ8xUk4Y0BnTiHmh4B0a3PePOyiLrh6")
MAX_POLLS = 10  # Poll rounds

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

def fetch_field_profile(client, p):
    url = f"{BASE_URL}/v1/field-profile?lat={p['lat']}&lon={p['lon']}"
    r = client.get(url, headers={"X-API-Key": API_KEY}, timeout=45)
    if r.status_code != 200:
        raise RuntimeError(f"HTTP {r.status_code}: {r.text[:200]}")
    return r.json()

def get_job_status(data, key):
    if isinstance(data, dict) and key in data:
        sub = data[key]
        if isinstance(sub, dict) and "status" in sub:
            return sub["status"]
    return "unknown"

def is_terminal(data):
    if not data:
        return False
    for k in ["soil_moisture", "vegetation"]:
        s = get_job_status(data, k)
        if s not in ("done", "failed"):
            return False
    return True

def flatten(prefix, obj, out):
    if isinstance(obj, dict):
        for k, v in obj.items():
            new_key = f"{prefix}.{k}" if prefix else k
            flatten(new_key, v, out)
    elif isinstance(obj, (int, float, str, bool)):
        out[prefix] = obj

def make_feature(p, data):
    props = {
        "id": p["id"],
        "name": p["name"],
        "zone": p["zone"],
        "fetched_at": dt.datetime.now(dt.timezone.utc).isoformat(),
    }
    if data:
        flatten("", data, props)
    return {
        "type": "Feature",
        "geometry": {
            "type": "Point",
            "coordinates": [p["lon"], p["lat"]],
        },
        "properties": props,
    }

def main():
    print(f"Starting NASA Gateway Rajshahi ingestion using API Key: {API_KEY[:8]}...")
    client = httpx.Client(timeout=45)
    latest = {}

    # Pass 1: touch every point
    print("\n--- Pass 1: Touching all 8 Rajshahi districts ---")
    for i, p in enumerate(DISTRICTS, 1):
        print(f"[{i}/8] {p['name']} ({p['lat']}, {p['lon']})...", flush=True)
        try:
            latest[p["id"]] = fetch_field_profile(client, p)
            sm_s = get_job_status(latest[p["id"]], "soil_moisture")
            veg_s = get_job_status(latest[p["id"]], "vegetation")
            print(f"    Success! SMAP: {sm_s}, Vegetation: {veg_s}", flush=True)
        except Exception as e:
            print(f"    Notice: {e}", flush=True)
        time.sleep(2)

    # Pass 2: check status
    print("\n--- Pass 2: Checking AppEEARS job status ---")
    for round_num in range(1, MAX_POLLS + 1):
        pending = [p for p in DISTRICTS if not is_terminal(latest.get(p["id"]))]
        print(f"Round {round_num}/{MAX_POLLS}: {len(pending)} point(s) processing / polling...", flush=True)
        
        for p in DISTRICTS:
            if not is_terminal(latest.get(p["id"])):
                try:
                    latest[p["id"]] = fetch_field_profile(client, p)
                    sm_s = get_job_status(latest[p["id"]], "soil_moisture")
                    veg_s = get_job_status(latest[p["id"]], "vegetation")
                    print(f"    {p['name']}: SMAP={sm_s}, Veg={veg_s}", flush=True)
                except Exception as ex:
                    print(f"    {p['name']} check: {ex}", flush=True)

        if not [p for p in DISTRICTS if not is_terminal(latest.get(p["id"]))]:
            print("All points completed or reached terminal status!")
            break
        print("Waiting 20s before next poll...", flush=True)
        time.sleep(20)

    # Generate Point GeoJSON
    features = [make_feature(p, latest.get(p["id"])) for p in DISTRICTS]
    fc = {
        "type": "FeatureCollection",
        "name": "rajshahi_nasa_vector",
        "features": features,
    }

    out_file = "rajshahi_nasa_vector.geojson"
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(fc, f, indent=2)
    print(f"\nWrote {out_file} with {len(features)} point features!")

    # Join with Polygon Boundaries if available
    poly_file = "rajshahi_boundaries.geojson"
    if os.path.exists(poly_file):
        try:
            with open(poly_file, "r", encoding="utf-8") as f:
                poly_fc = json.load(f)
            
            district_map = {p["name"].lower(): latest.get(p["id"]) for p in DISTRICTS}
            # Also handle alternative spellings
            district_map["bogra"] = latest.get("D_BOG")
            district_map["nawabganj"] = latest.get("D_CHA")
            district_map["chapai nawabganj"] = latest.get("D_CHA")

            joined_features = []
            for feat in poly_fc.get("features", []):
                sname = feat["properties"].get("shapeName", "").lower()
                matched_data = None
                for d_name, d_val in district_map.items():
                    if d_name in sname:
                        matched_data = d_val
                        break
                
                new_props = dict(feat["properties"])
                if matched_data:
                    flatten("", matched_data, new_props)
                
                joined_features.append({
                    "type": "Feature",
                    "geometry": feat["geometry"],
                    "properties": new_props
                })

            out_poly = "rajshahi_nasa_polygons.geojson"
            with open(out_poly, "w", encoding="utf-8") as f:
                json.dump({"type": "FeatureCollection", "name": "rajshahi_nasa_polygons", "features": joined_features}, f, indent=2)
            print(f"Wrote {out_poly} with {len(joined_features)} polygon features!")
        except Exception as e:
            print("Failed to join polygons:", e)

if __name__ == "__main__":
    main()
