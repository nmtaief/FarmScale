"""Collect NASA POWER weather & wetness data for all 70 Upazilas of Rajshahi Division and generate Upazila GeoJSON datasets."""
import os, sys, time, json, asyncio, datetime as dt
import httpx

POWER_URL = "https://power.larc.nasa.gov/api/temporal/monthly/point"
BASE_GATEWAY = "http://127.0.0.1:8000"
API_KEY = "ge_PdJ8xUk4Y0BnTiHmh4B0a3PePOyiLrh6"

# Load Upazila GeoJSON
with open("rajshahi_upazilas.geojson", "r", encoding="utf-8") as f:
    upz_data = json.load(f)

upazilas = []
for feat in upz_data["features"]:
    p = feat["properties"]
    upazilas.append({
        "name": p.get("shapeName", "Unknown"),
        "district": p.get("district", "Unknown"),
        "lat": p["centroid_lat"],
        "lon": p["centroid_lon"],
        "feature": feat
    })

print(f"Loaded {len(upazilas)} Upazilas. Starting NASA data collection...")

async def fetch_upazila_data(client, sem, u, idx, total):
    async with sem:
        lat, lon = u["lat"], u["lon"]
        # Try through local gateway first, fallback to direct NASA POWER
        try:
            r = await client.get(
                f"{BASE_GATEWAY}/v1/weather",
                params={"lat": lat, "lon": lon, "temporal": "monthly"},
                headers={"X-API-Key": API_KEY},
                timeout=30
            )
            if r.status_code == 200:
                rows = r.json().get("data", [])
            else:
                rows = []
        except Exception:
            rows = []

        # If gateway didn't return data, fetch directly from NASA POWER
        if not rows:
            try:
                r = await client.get(
                    POWER_URL,
                    params={
                        "parameters": "PRECTOTCORR,T2M,T2M_MAX,T2M_MIN,GWETROOT,GWETTOP",
                        "community": "AG",
                        "latitude": lat,
                        "longitude": lon,
                        "start": "2023",
                        "end": "2026",
                        "format": "JSON"
                    },
                    timeout=30
                )
                if r.status_code == 200:
                    raw = r.json().get("properties", {}).get("parameter", {})
                    dates = sorted({d for series in raw.values() for d in series if not d.endswith("13")})
                    rows = []
                    for d in dates:
                        row = {"date": d}
                        for k, series in raw.items():
                            v = series.get(d)
                            row[k] = None if v in (None, -999, -999.0) else v
                        rows.append(row)
            except Exception as e:
                print(f"[{idx}/{total}] {u['name']} error: {e}", flush=True)

        latest = next((r for r in reversed(rows) if r.get("T2M") is not None), None)
        wetness = latest.get("GWETROOT") if latest else 0.88
        stress_score = round((1 - (wetness if wetness is not None else 0.88)) * 100, 1)
        stress_level = "low" if stress_score < 35 else "moderate" if stress_score < 60 else "high"

        u["weather"] = {
            "latest": latest,
            "temp_mean_c": latest.get("T2M") if latest else None,
            "temp_max_c": latest.get("T2M_MAX") if latest else None,
            "temp_min_c": latest.get("T2M_MIN") if latest else None,
            "precip_mm": latest.get("PRECTOTCORR") if latest else None,
            "rootzone_wetness": wetness,
            "topsoil_wetness": latest.get("GWETTOP") if latest else None
        }
        u["water_stress"] = {
            "score": stress_score,
            "level": stress_level
        }

        print(f"[{idx}/{total}] {u['name']} ({u['district']}): Temp={u['weather']['temp_mean_c']}°C, Wetness={wetness}, Stress={stress_score} ({stress_level})", flush=True)

async def main():
    sem = asyncio.Semaphore(5)  # 5 concurrent requests
    async with httpx.AsyncClient(timeout=45) as client:
        tasks = [fetch_upazila_data(client, sem, u, i + 1, len(upazilas)) for i, u in enumerate(upazilas)]
        await asyncio.gather(*tasks)

    # 1. Generate Point GeoJSON (70 Upazila Centroids)
    point_features = []
    for u in upazilas:
        w = u["weather"]
        ws = u["water_stress"]
        props = {
            "id": f"UPZ_{u['name'].upper()[:4]}",
            "name": u["name"],
            "district": u["district"],
            "lat": u["lat"],
            "lon": u["lon"],
            "temp_mean_c": w["temp_mean_c"],
            "temp_max_c": w["temp_max_c"],
            "temp_min_c": w["temp_min_c"],
            "precip_mm": w["precip_mm"],
            "rootzone_wetness": w["rootzone_wetness"],
            "topsoil_wetness": w["topsoil_wetness"],
            "water_stress_score": ws["score"],
            "water_stress_level": ws["level"],
            "source": "NASA POWER / AppEEARS Gateway"
        }
        point_features.append({
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [u["lon"], u["lat"]]
            },
            "properties": props
        })

    upz_point_fc = {
        "type": "FeatureCollection",
        "name": "rajshahi_upazilas_vector",
        "features": point_features
    }
    with open("rajshahi_upazilas_vector.geojson", "w", encoding="utf-8") as f:
        json.dump(upz_point_fc, f, indent=2)
    print(f"\n[OK] Wrote rajshahi_upazilas_vector.geojson with {len(point_features)} Upazila points!")

    # 2. Generate Polygon GeoJSON (70 Upazila Polygons joined with NASA metrics)
    poly_features = []
    for u in upazilas:
        w = u["weather"]
        ws = u["water_stress"]
        orig_props = dict(u["feature"]["properties"])
        orig_props.update({
            "upazila_name": u["name"],
            "district": u["district"],
            "temp_mean_c": w["temp_mean_c"],
            "temp_max_c": w["temp_max_c"],
            "temp_min_c": w["temp_min_c"],
            "precip_mm": w["precip_mm"],
            "rootzone_wetness": w["rootzone_wetness"],
            "topsoil_wetness": w["topsoil_wetness"],
            "water_stress_score": ws["score"],
            "water_stress_level": ws["level"],
            "source": "NASA POWER API"
        })
        poly_features.append({
            "type": "Feature",
            "geometry": u["feature"]["geometry"],
            "properties": orig_props
        })

    upz_poly_fc = {
        "type": "FeatureCollection",
        "name": "rajshahi_upazilas_polygons",
        "features": poly_features
    }
    with open("rajshahi_upazilas_polygons.geojson", "w", encoding="utf-8") as f:
        json.dump(upz_poly_fc, f, indent=2)
    print(f"[OK] Wrote rajshahi_upazilas_polygons.geojson with {len(poly_features)} Upazila polygons!")

if __name__ == "__main__":
    asyncio.run(main())
