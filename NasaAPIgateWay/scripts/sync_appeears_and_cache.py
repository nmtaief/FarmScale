import os, sys, json, time, io, csv, statistics, sqlite3
from collections import defaultdict
from pathlib import Path
import httpx
from dotenv import load_dotenv

BASE_DIR = Path("f:/Nasa API")
GATEWAY_DIR = BASE_DIR / "FarmScale" / "NasaAPIgateWay"
RAW_DOWNLOAD_DIR = BASE_DIR / "downloaded_nasa_appeears"
RAW_DOWNLOAD_DIR.mkdir(exist_ok=True)

load_dotenv(GATEWAY_DIR / ".env")
USER = os.getenv("EARTHDATA_USER")
PASS = os.getenv("EARTHDATA_PASS")
APPEEARS = "https://appeears.earthdatacloud.nasa.gov/api"
PV = 2

KINDS = {
    "smap": {"layers": ["Geophysical_Data_sm_rootzone"]},
    "vegetation": {"layers": ["_250m_16_days_NDVI", "_250m_16_days_EVI", "_250m_16_days_pixel_reliability"]}
}

def _num(v):
    try:
        return float(v)
    except (TypeError, ValueError):
        return None

def _doy(d):
    import datetime as dt
    return dt.date.fromisoformat(d).timetuple().tm_yday

def _anomalies(rows, field):
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

def process_veg(rows):
    NDVI, EVI, REL = "_250m_16_days_NDVI", "_250m_16_days_EVI", "_250m_16_days_pixel_reliability"
    probe = [abs(r[k]) for r in rows for k in (NDVI, EVI) if r.get(k) is not None and r[k] != -3000]
    scale = 0.0001 if probe and max(probe) > 5 else 1.0
    ok = lambda v: v is not None and v != -3000 and -0.25 <= v * scale <= 1.0
    out = []
    for r in rows:
        nd, ev, rel = r.get(NDVI), r.get(EVI), r.get(REL)
        if not ok(nd) or (rel is not None and not 0 <= rel <= 1):
            continue
        out.append({"date": r["date"], "ndvi": round(nd * scale, 4),
                    "evi": round(ev * scale, 4) if ok(ev) else None})
    _anomalies(out, "ndvi")
    return {"count": len(out), "latest": out[-1] if out else None, "series": out}

def process_smap(rows):
    out = []
    for r in rows:
        v = r.get("Geophysical_Data_sm_rootzone")
        if v is not None and 0 <= v <= 1:
            out.append({"date": r["date"], "sm_rootzone": round(v, 4)})
    _anomalies(out, "sm_rootzone")
    return {"unit": "m3/m3", "count": len(out), "latest": out[-1] if out else None, "series": out}

def main():
    print(f"Connecting to NASA AppEEARS as user: {USER}...")
    db_path = GATEWAY_DIR / "engine.db"
    con = sqlite3.connect(db_path)
    cur = con.cursor()

    cur.execute("SELECT id, jkey, kind, task_id, status FROM jobs")
    jobs = cur.fetchall()
    print(f"Total jobs in database: {len(jobs)}")

    with httpx.Client(timeout=60, follow_redirects=True) as client:
        # Authenticate with NASA AppEEARS
        resp = client.post(f"{APPEEARS}/login", auth=(USER, PASS))
        if resp.status_code != 200:
            print(f"Error logging in to AppEEARS: {resp.text}")
            return
        token = resp.json()["token"]
        headers = {"Authorization": f"Bearer {token}"}
        print("Successfully authenticated with NASA Earthdata / AppEEARS!")

        downloaded_count = 0
        done_count = 0
        processing_count = 0
        pending_count = 0

        for jid, jkey, kind, tid, current_status in jobs:
            try:
                task_resp = client.get(f"{APPEEARS}/task/{tid}", headers=headers)
                task_data = task_resp.json()
                status = task_data.get("status", "unknown")
                print(f"Job {jid} [{kind}] task={tid[:8]}... status: {status.upper()}")

                if status == "done":
                    done_count += 1
                    # Get bundle files
                    bundle_resp = client.get(f"{APPEEARS}/bundle/{tid}", headers=headers)
                    files = bundle_resp.json().get("files", [])

                    suffixes = KINDS[kind]["layers"]
                    acc = defaultdict(lambda: defaultdict(list))

                    for f in files:
                        fname = f["file_name"]
                        fid = f["file_id"]
                        
                        # Save raw CSV
                        if fname.lower().endswith(".csv") and "results" in fname.lower():
                            raw_file_path = RAW_DOWNLOAD_DIR / f"{jid}_{kind}_{fname}"
                            f_resp = client.get(f"{APPEEARS}/bundle/{tid}/{fid}", headers=headers)
                            raw_csv_text = f_resp.text
                            raw_file_path.write_text(raw_csv_text, encoding="utf-8")
                            downloaded_count += 1
                            print(f"   -> Downloaded & archived: {raw_file_path.name} ({len(raw_csv_text)} bytes)")

                            # Parse rows
                            reader = csv.DictReader(io.StringIO(raw_csv_text))
                            for row in reader:
                                day = (row.get("Date") or "")[:10]
                                for col, val in row.items():
                                    for s in suffixes:
                                        if col.endswith(s) and _num(val) is not None:
                                            acc[day][s].append(_num(val))

                    # Merge rows
                    merged_rows = [
                        dict(date=d, **{s: statistics.fmean(v) for s, v in cols.items()})
                        for d, cols in sorted(acc.items()) if d
                    ]

                    # Process
                    if kind == "vegetation":
                        processed_result = process_veg(merged_rows)
                    else:
                        processed_result = process_smap(merged_rows)

                    result_payload = {**processed_result, "pv": PV}

                    # Update database job
                    cur.execute(
                        "UPDATE jobs SET status='done', result=?, error=NULL WHERE id=?",
                        (json.dumps(result_payload), jid)
                    )
                    con.commit()
                    print(f"   -> Updated database job {jid} to DONE! Records processed: {len(processed_result.get('series', []))}")

                elif status in ("processing", "queued"):
                    processing_count += 1
                    cur.execute("UPDATE jobs SET status=? WHERE id=?", (status, jid))
                    con.commit()
                else:
                    pending_count += 1

            except Exception as e:
                print(f"   -> Error on job {jid}: {e}")

        con.close()
        print("\n================ SYNC SUMMARY ================")
        print(f"Total Completed & Cached: {done_count}")
        print(f"Total Processing in Cloud: {processing_count}")
        print(f"Total Pending in Queue:   {pending_count}")
        print(f"Raw CSV Files Downloaded: {downloaded_count}")
        print("All completed data cached in engine.db!")

if __name__ == "__main__":
    main()
