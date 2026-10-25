"""Generate rajshahi_nasa_vector.geojson and rajshahi_nasa_polygons.geojson from current gateway cache and state."""
import os, sys, json, datetime as dt
import httpx

BASE_URL = "http://127.0.0.1:8000"
API_KEY = "ge_PdJ8xUk4Y0BnTiHmh4B0a3PePOyiLrh6"

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

def flatten(prefix, obj, out):
    if isinstance(obj, dict):
        for k, v in obj.items():
            new_key = f"{prefix}.{k}" if prefix else k
            flatten(new_key, v, out)
    elif isinstance(obj, (int, float, str, bool)):
        out[prefix] = obj

def main():
    print("Fetching latest field profiles from local NASA gateway...")
    client = httpx.Client(timeout=30)
    data_by_id = {}

    for p in DISTRICTS:
        try:
            r = client.get(f"{BASE_URL}/v1/field-profile?lat={p['lat']}&lon={p['lon']}",
                           headers={"X-API-Key": API_KEY})
            if r.status_code == 200:
                data_by_id[p["id"]] = r.json()
                print(f"  + {p['name']}: profile retrieved (HTTP 200)")
            else:
                print(f"  - {p['name']}: HTTP {r.status_code}")
        except Exception as e:
            print(f"  - {p['name']}: {e}")

    # Build Point GeoJSON
    point_features = []
    for p in DISTRICTS:
        props = {
            "id": p["id"],
            "name": p["name"],
            "zone": p["zone"],
            "lat": p["lat"],
            "lon": p["lon"],
            "generated_at": dt.datetime.now(dt.timezone.utc).isoformat(),
        }
        d = data_by_id.get(p["id"])
        if d:
            flatten("", d, props)
        
        point_features.append({
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [p["lon"], p["lat"]],
            },
            "properties": props
        })

    vector_fc = {
        "type": "FeatureCollection",
        "name": "rajshahi_nasa_vector",
        "features": point_features
    }

    with open("rajshahi_nasa_vector.geojson", "w", encoding="utf-8") as f:
        json.dump(vector_fc, f, indent=2)
    print(f"\n[OK] Saved rajshahi_nasa_vector.geojson with {len(point_features)} features!")

    # Build Polygon GeoJSON
    poly_file = "rajshahi_boundaries.geojson"
    if os.path.exists(poly_file):
        with open(poly_file, "r", encoding="utf-8") as f:
            poly_data = json.load(f)

        name_to_id = {
            "rajshahi": "D_RAJ",
            "bogura": "D_BOG",
            "bogra": "D_BOG",
            "pabna": "D_PAB",
            "naogaon": "D_NAO",
            "natore": "D_NAT",
            "joypurhat": "D_JOY",
            "chapainawabganj": "D_CHA",
            "chapai nawabganj": "D_CHA",
            "nawabganj": "D_CHA",
            "sirajganj": "D_SIR",
        }

        poly_features = []
        for feat in poly_data.get("features", []):
            sname = feat["properties"].get("shapeName", "").lower()
            matched_id = None
            for key, did in name_to_id.items():
                if key in sname:
                    matched_id = did
                    break
            
            new_props = dict(feat["properties"])
            if matched_id and matched_id in data_by_id:
                flatten("", data_by_id[matched_id], new_props)
                district_info = next((d for d in DISTRICTS if d["id"] == matched_id), None)
                if district_info:
                    new_props["zone"] = district_info["zone"]
                    new_props["district_name"] = district_info["name"]

            poly_features.append({
                "type": "Feature",
                "geometry": feat["geometry"],
                "properties": new_props
            })

        poly_fc = {
            "type": "FeatureCollection",
            "name": "rajshahi_nasa_polygons",
            "features": poly_features
        }

        with open("rajshahi_nasa_polygons.geojson", "w", encoding="utf-8") as f:
            json.dump(poly_fc, f, indent=2)
        print(f"[OK] Saved rajshahi_nasa_polygons.geojson with {len(poly_features)} polygons!")

if __name__ == "__main__":
    main()
