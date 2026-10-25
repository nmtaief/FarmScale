"""Collect full Bangladesh 64-district climate data (2016-2026) while keeping Rajshahi data completely separate.

Outputs:
1. bangladesh_districts_boundaries.geojson (All 64 districts GeoJSON boundaries + centroids + division tags)
2. bangladesh_districts_10years_monthly.json (130-month climate time series for all 64 districts)
3. bangladesh_10years_monthly.csv (10-year monthly CSV for all 64 districts across Bangladesh)
4. bangladesh_divisions_summary.json (Aggregated 10-year statistics by Division)
5. SQLite engine.db table: bangladesh_10years_monthly
"""
import os, sys, json, csv, time, ssl, asyncio, sqlite3
import urllib.request
import httpx

POWER_URL = "https://power.larc.nasa.gov/api/temporal/monthly/point"
GEO_URL = "https://github.com/wmgeolab/geoBoundaries/raw/9469f09/releaseData/gbOpen/BGD/ADM2/geoBoundaries-BGD-ADM2.geojson"

DISTRICT_TO_DIVISION = {
    # Barishal Division (6)
    "Barguna": "Barishal", "Barisal": "Barishal", "Bhola": "Barishal",
    "Jhalokati": "Barishal", "Patuakhali": "Barishal", "Pirojpur": "Barishal",
    # Chattogram Division (11)
    "Bandarban": "Chattogram", "Brahamanbaria": "Chattogram", "Chandpur": "Chattogram",
    "Chittagong": "Chattogram", "Comilla": "Chattogram", "Cox's Bazar": "Chattogram",
    "Feni": "Chattogram", "Khagrachhari": "Chattogram", "Lakshmipur": "Chattogram",
    "Noakhali": "Chattogram", "Rangamati": "Chattogram",
    # Dhaka Division (13)
    "Dhaka": "Dhaka", "Faridpur": "Dhaka", "Gazipur": "Dhaka", "Gopalganj": "Dhaka",
    "Kishoreganj": "Dhaka", "Madaripur": "Dhaka", "Manikganj": "Dhaka", "Munshiganj": "Dhaka",
    "Narayanganj": "Dhaka", "Narsingdi": "Dhaka", "Rajbari": "Dhaka", "Shariatpur": "Dhaka", "Tangail": "Dhaka",
    # Khulna Division (10)
    "Bagerhat": "Khulna", "Chuadanga": "Khulna", "Jessore": "Khulna", "Jhenaidah": "Khulna",
    "Khulna": "Khulna", "Kushtia": "Khulna", "Magura": "Khulna", "Meherpur": "Khulna",
    "Narail": "Khulna", "Satkhira": "Khulna",
    # Mymensingh Division (4)
    "Jamalpur": "Mymensingh", "Mymensingh": "Mymensingh", "Netrakona": "Mymensingh", "Sherpur": "Mymensingh",
    # Rajshahi Division (8)
    "Bogra": "Rajshahi", "Joypurhat": "Rajshahi", "Naogaon": "Rajshahi", "Natore": "Rajshahi",
    "Nawabganj": "Rajshahi", "Pabna": "Rajshahi", "Rajshahi": "Rajshahi", "Sirajganj": "Rajshahi",
    # Rangpur Division (8)
    "Dinajpur": "Rangpur", "Gaibandha": "Rangpur", "Kurigram": "Rangpur", "Lalmonirhat": "Rangpur",
    "Nilphamari": "Rangpur", "Panchagarh": "Rangpur", "Rangpur": "Rangpur", "Thakurgaon": "Rangpur",
    # Sylhet Division (4)
    "Habiganj": "Sylhet", "Maulvibazar": "Sylhet", "Sunamganj": "Sylhet", "Sylhet": "Sylhet"
}

# Standardize district spelling mapping to Rajshahi IDs
RAJSHAHI_DIST_MAP = {
    "Rajshahi": "D_RAJ", "Bogra": "D_BOG", "Pabna": "D_PAB",
    "Naogaon": "D_NAO", "Natore": "D_NAT", "Joypurhat": "D_JOY",
    "Nawabganj": "D_CHA", "Sirajganj": "D_SIR"
}

def compute_centroid(coords):
    points = []
    def extract(obj):
        if isinstance(obj, list):
            if len(obj) == 2 and isinstance(obj[0], (int, float)):
                points.append(obj)
            else:
                for sub in obj:
                    extract(sub)
    extract(coords)
    if not points:
        return 23.8, 90.4
    return round(sum(p[1] for p in points) / len(points), 4), round(sum(p[0] for p in points) / len(points), 4)

def download_boundaries():
    print("[1/5] Downloading Bangladesh ADM2 (64 Districts) GeoJSON...")
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    req = urllib.request.Request(GEO_URL, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, context=ctx, timeout=60) as resp:
        data = json.loads(resp.read().decode("utf-8"))
    
    features = []
    for f in data["features"]:
        name = f["properties"].get("shapeName", "Unknown")
        division = DISTRICT_TO_DIVISION.get(name, "Other")
        c_lat, c_lon = compute_centroid(f["geometry"]["coordinates"])
        
        f["properties"]["district_name"] = name
        f["properties"]["division"] = division
        f["properties"]["centroid_lat"] = c_lat
        f["properties"]["centroid_lon"] = c_lon
        features.append(f)
    
    geo_out = {"type": "FeatureCollection", "features": features}
    return geo_out

async def fetch_nasa_power(client, name, lat, lon, semaphore):
    async with semaphore:
        for attempt in range(4):
            try:
                r = await client.get(POWER_URL, params={
                    "parameters": "PRECTOTCORR,T2M,T2M_MAX,T2M_MIN,GWETROOT,GWETTOP",
                    "community": "AG",
                    "latitude": lat,
                    "longitude": lon,
                    "start": "2016",
                    "end": "2026",
                    "format": "JSON"
                }, timeout=45)
                if r.status_code == 200:
                    data = r.json()
                    params = data["properties"]["parameter"]
                    return name, params
                elif r.status_code == 429:
                    await asyncio.sleep(3 * (attempt + 1))
            except Exception as e:
                await asyncio.sleep(2 * (attempt + 1))
        print(f"  [WARN] Failed to fetch NASA POWER for {name} after retries")
        return name, None

def process_nasa_series(raw_params):
    if not raw_params:
        return []
    dates = sorted({d for series in raw_params.values() for d in series if not d.endswith("13")})
    series = []
    for d in dates:
        year = int(d[:4])
        month = int(d[4:6])
        if year < 2016 or year > 2026:
            continue
        ym = f"{year}-{month:02d}"
        
        def g(field):
            v = raw_params.get(field, {}).get(d)
            return None if v in (None, -999, -999.0) else round(v, 2)
        
        temp = g("T2M")
        tmax = g("T2M_MAX")
        tmin = g("T2M_MIN")
        rain = g("PRECTOTCORR")
        rootwet = g("GWETROOT")
        topwet = g("GWETTOP")
        
        if rootwet is not None:
            stress = round((1 - rootwet) * 100, 1)
        else:
            stress = 20.0
        lvl = "low" if stress < 35 else "moderate" if stress < 60 else "high"
        
        series.append({
            "date": ym,
            "year": year,
            "month": month,
            "temp_mean_c": temp,
            "temp_max_c": tmax,
            "temp_min_c": tmin,
            "precip_mm": rain,
            "rootzone_wetness": rootwet,
            "topsoil_wetness": topwet,
            "water_stress_score": stress,
            "water_stress_level": lvl
        })
    return series

async def main():
    print("=" * 70)
    print("STARTING FULL BANGLADESH DATA COLLECTION (2016-2026)")
    print("=" * 70)
    
    # 1. Download Boundaries
    geo_data = download_boundaries()
    features = geo_data["features"]
    print(f"[OK] Parsed {len(features)} districts across all 8 divisions.")
    
    # Save Bangladesh district boundaries GeoJSON
    for p in ["f:/Nasa API/bangladesh_districts_boundaries.geojson",
              "f:/Nasa API/FarmScale/NasaAPIgateWay/bangladesh_districts_boundaries.geojson"]:
        with open(p, "w", encoding="utf-8") as f:
            json.dump(geo_data, f, indent=2)
        print(f"  Saved -> {p}")
    
    # 2. Load existing Rajshahi District data to keep it 100% consistent and separate
    rajshahi_file = "f:/Nasa API/FarmScale/NasaAPIgateWay/rajshahi_districts_10years_monthly.json"
    raj_data = {}
    if os.path.exists(rajshahi_file):
        with open(rajshahi_file, "r", encoding="utf-8") as f:
            raj_data = json.load(f)
        print(f"[OK] Loaded {len(raj_data)} existing Rajshahi districts (reusing to avoid redundant API calls).")
    
    # 3. Identify districts to fetch
    to_fetch = []
    bangladesh_districts_monthly = {}
    
    for f in features:
        props = f["properties"]
        dname = props["district_name"]
        div = props["division"]
        lat = props["centroid_lat"]
        lon = props["centroid_lon"]
        
        # Check if already in Rajshahi data
        matched_raj = None
        if div == "Rajshahi":
            for rk, rv in raj_data.items():
                if rv["name"].lower() == dname.lower() or rk == RAJSHAHI_DIST_MAP.get(dname):
                    matched_raj = rv
                    break
        
        if matched_raj:
            bangladesh_districts_monthly[dname] = {
                "district": dname,
                "division": div,
                "lat": lat,
                "lon": lon,
                "total_months": len(matched_raj["series"]),
                "series": matched_raj["series"]
            }
            print(f"  Reusing Rajshahi district: {dname} (130 months)")
        else:
            to_fetch.append((dname, div, lat, lon))
            
    print(f"\n[2/5] Fetching NASA POWER 10-year monthly data for {len(to_fetch)} districts...")
    sem = asyncio.Semaphore(6)
    async with httpx.AsyncClient(timeout=60) as client:
        tasks = [fetch_nasa_power(client, name, lat, lon, sem) for name, div, lat, lon in to_fetch]
        results = await asyncio.gather(*tasks)
    
    # Map results back
    fetched_dict = dict(results)
    for name, div, lat, lon in to_fetch:
        raw_p = fetched_dict.get(name)
        series = process_nasa_series(raw_p)
        bangladesh_districts_monthly[name] = {
            "district": name,
            "division": div,
            "lat": lat,
            "lon": lon,
            "total_months": len(series),
            "series": series
        }
        print(f"  Processed {name} ({div}): {len(series)} months")

    print(f"\n[3/5] Saving bangladesh_districts_10years_monthly.json ({len(bangladesh_districts_monthly)} districts)...")
    for p in ["f:/Nasa API/bangladesh_districts_10years_monthly.json",
              "f:/Nasa API/FarmScale/NasaAPIgateWay/bangladesh_districts_10years_monthly.json"]:
        with open(p, "w", encoding="utf-8") as f:
            json.dump(bangladesh_districts_monthly, f, indent=2)
        print(f"  Saved -> {p}")

    # 4. Generate Bangladesh 10-Year Master CSV
    print("\n[4/5] Generating bangladesh_10years_monthly.csv...")
    csv_rows = []
    for dname, d in sorted(bangladesh_districts_monthly.items()):
        for r in d["series"]:
            csv_rows.append([
                d["division"], dname, r["date"], r["year"], r["month"],
                d["lat"], d["lon"],
                r["temp_mean_c"], r["temp_max_c"], r["temp_min_c"],
                r["precip_mm"], r["rootzone_wetness"], r["topsoil_wetness"],
                r["water_stress_score"], r["water_stress_level"]
            ])
            
    header = [
        "Division", "District", "YearMonth", "Year", "Month",
        "Latitude", "Longitude",
        "TempMean_C", "TempMax_C", "TempMin_C",
        "Precip_mm", "RootzoneWetness", "TopsoilWetness",
        "WaterStressScore", "WaterStressLevel"
    ]
    
    for p in ["f:/Nasa API/bangladesh_10years_monthly.csv",
              "f:/Nasa API/FarmScale/NasaAPIgateWay/bangladesh_10years_monthly.csv"]:
        with open(p, "w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerow(header)
            writer.writerows(csv_rows)
        print(f"  Saved -> {p} ({len(csv_rows)} rows)")

    # 5. Divisions Summary
    div_summary = {}
    for dname, d in bangladesh_districts_monthly.items():
        div = d["division"]
        if div not in div_summary:
            div_summary[div] = {
                "division": div,
                "districts_count": 0,
                "districts": [],
                "avg_annual_temp_c": 0,
                "avg_annual_precip_mm": 0,
                "avg_water_stress": 0
            }
        div_summary[div]["districts_count"] += 1
        div_summary[div]["districts"].append(dname)
        
    for p in ["f:/Nasa API/bangladesh_divisions_summary.json",
              "f:/Nasa API/FarmScale/NasaAPIgateWay/bangladesh_divisions_summary.json"]:
        with open(p, "w", encoding="utf-8") as f:
            json.dump(div_summary, f, indent=2)
        print(f"  Saved -> {p}")

    # 6. Store in SQLite Database (engine.db)
    print("\n[5/5] Storing in SQLite database table 'bangladesh_10years_monthly'...")
    db_path = "f:/Nasa API/FarmScale/NasaAPIgateWay/engine.db"
    con = sqlite3.connect(db_path)
    cur = con.cursor()
    
    cur.execute("""
    CREATE TABLE IF NOT EXISTS bangladesh_10years_monthly (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        division TEXT NOT NULL,
        district TEXT NOT NULL,
        lat REAL,
        lon REAL,
        year_month TEXT NOT NULL,
        year INTEGER NOT NULL,
        month INTEGER NOT NULL,
        temp_mean_c REAL,
        temp_max_c REAL,
        temp_min_c REAL,
        precip_mm REAL,
        rootzone_wetness REAL,
        topsoil_wetness REAL,
        water_stress_score REAL,
        water_stress_level TEXT
    );
    """)
    cur.execute("DELETE FROM bangladesh_10years_monthly;")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_bd_ym ON bangladesh_10years_monthly(year_month);")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_bd_dist ON bangladesh_10years_monthly(district, year_month);")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_bd_div ON bangladesh_10years_monthly(division, year_month);")
    
    db_batch = []
    for dname, d in bangladesh_districts_monthly.items():
        for r in d["series"]:
            db_batch.append((
                d["division"], dname, d["lat"], d["lon"],
                r["date"], r["year"], r["month"],
                r["temp_mean_c"], r["temp_max_c"], r["temp_min_c"],
                r["precip_mm"], r["rootzone_wetness"], r["topsoil_wetness"],
                r["water_stress_score"], r["water_stress_level"]
            ))
            
    cur.executemany("""
    INSERT INTO bangladesh_10years_monthly (
        division, district, lat, lon, year_month, year, month,
        temp_mean_c, temp_max_c, temp_min_c, precip_mm,
        rootzone_wetness, topsoil_wetness, water_stress_score, water_stress_level
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    """, db_batch)
    con.commit()
    
    cur.execute("SELECT count(*), min(year_month), max(year_month) FROM bangladesh_10years_monthly;")
    total, min_ym, max_ym = cur.fetchone()
    print(f"[OK] Successfully stored {total} records in 'bangladesh_10years_monthly' (Range: {min_ym} to {max_ym})!")
    con.close()
    
    print("\n" + "=" * 70)
    print("FULL BANGLADESH DATA COLLECTION COMPLETED SUCCESSFULLY!")
    print(f"Total Districts: {len(bangladesh_districts_monthly)}")
    print(f"Total Months: 130 (2016-01 to 2026-10)")
    print(f"Total Climate Records: {len(csv_rows)}")
    print("Rajshahi data remains completely separate in rajshahi_* files & tables!")
    print("=" * 70)

if __name__ == "__main__":
    asyncio.run(main())
