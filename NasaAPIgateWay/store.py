"""SQLite storage: API keys, usage log, response cache, async jobs."""
import os, json, time, sqlite3, threading, hashlib, secrets, uuid

_lock = threading.RLock()
_db = None


def init():
    global _db
    _db = sqlite3.connect(os.getenv("ENGINE_DB", "engine.db"), check_same_thread=False)
    _db.row_factory = sqlite3.Row
    with _lock:
        _db.executescript("""
        CREATE TABLE IF NOT EXISTS api_keys(id INTEGER PRIMARY KEY, name TEXT, hash TEXT UNIQUE,
            rpm INTEGER DEFAULT 60, active INTEGER DEFAULT 1, created REAL);
        CREATE TABLE IF NOT EXISTS usage(id INTEGER PRIMARY KEY, key_id INTEGER, path TEXT, ts REAL);
        CREATE TABLE IF NOT EXISTS cache(k TEXT PRIMARY KEY, v TEXT, expires REAL, created REAL);
        CREATE TABLE IF NOT EXISTS jobs(id TEXT PRIMARY KEY, jkey TEXT UNIQUE, kind TEXT, task_id TEXT,
            status TEXT, result TEXT, error TEXT, created REAL);
        CREATE TABLE IF NOT EXISTS locations(id INTEGER PRIMARY KEY, key_id INTEGER, name TEXT, lat REAL, lon REAL,
            created REAL, UNIQUE(key_id, name));
        CREATE TABLE IF NOT EXISTS snapshots(id INTEGER PRIMARY KEY, loc_id INTEGER, ts REAL, score REAL, level TEXT, payload TEXT);
        CREATE INDEX IF NOT EXISTS snap_loc ON snapshots(loc_id, ts);
        """)
        try:  # upgrade databases created by the first version
            _db.execute("ALTER TABLE cache ADD COLUMN created REAL")
        except sqlite3.OperationalError:
            pass
        _db.commit()


def _q(sql, args=()):
    with _lock:
        rows = _db.execute(sql, args).fetchall()
        _db.commit()
        return rows


def _h(raw):
    return hashlib.sha256(raw.encode()).hexdigest()


# ---- API keys ----
def create_key(name, rpm=60):
    raw = "ge_" + secrets.token_urlsafe(24)
    _q("INSERT INTO api_keys(name,hash,rpm,created) VALUES(?,?,?,?)", (name, _h(raw), rpm, time.time()))
    return raw  # shown once; only the hash is stored


def verify_key(raw):
    r = _q("SELECT * FROM api_keys WHERE hash=? AND active=1", (_h(raw),))
    return dict(r[0]) if r else None


def list_keys():
    return [dict(r) for r in _q(
        "SELECT k.id,k.name,k.rpm,k.active,k.created,(SELECT COUNT(*) FROM usage u WHERE u.key_id=k.id) AS requests "
        "FROM api_keys k ORDER BY k.id")]


def revoke_key(key_id):
    _q("UPDATE api_keys SET active=0 WHERE id=?", (key_id,))


def key_count():
    return _q("SELECT COUNT(*) c FROM api_keys")[0]["c"]


def log_usage(key_id, path):
    _q("INSERT INTO usage(key_id,path,ts) VALUES(?,?,?)", (key_id, path, time.time()))


def usage(key_id):
    total = _q("SELECT COUNT(*) c FROM usage WHERE key_id=?", (key_id,))[0]["c"]
    day = _q("SELECT COUNT(*) c FROM usage WHERE key_id=? AND ts>?", (key_id, time.time() - 86400))[0]["c"]
    paths = _q("SELECT path,COUNT(*) c FROM usage WHERE key_id=? GROUP BY path ORDER BY c DESC LIMIT 10", (key_id,))
    return {"total": total, "last_24h": day, "by_path": {r["path"]: r["c"] for r in paths}}


# ---- cache (ttl=None means permanent) ----
def cache_get(k, meta=False):
    """Return the cached value (or None). With meta=True return (value, age_seconds)."""
    r = _q("SELECT v,expires,created FROM cache WHERE k=?", (k,))
    if r and (r[0]["expires"] is None or r[0]["expires"] > time.time()):
        val = json.loads(r[0]["v"])
        return (val, int(time.time() - (r[0]["created"] or time.time()))) if meta else val
    return None


def cache_set(k, v, ttl=None):
    now = time.time()
    _q("INSERT OR REPLACE INTO cache(k,v,expires,created) VALUES(?,?,?,?)",
       (k, json.dumps(v), None if ttl is None else now + ttl, now))


# ---- jobs ----
def job_by_key(jkey):
    r = _q("SELECT * FROM jobs WHERE jkey=?", (jkey,))
    return dict(r[0]) if r else None


def job_by_id(job_id):
    r = _q("SELECT * FROM jobs WHERE id=?", (job_id,))
    return dict(r[0]) if r else None


def job_create(jkey, kind, task_id):
    jid = uuid.uuid4().hex[:12]
    _q("INSERT OR IGNORE INTO jobs(id,jkey,kind,task_id,status,created) VALUES(?,?,?,?,?,?)",
       (jid, jkey, kind, task_id, "pending", time.time()))
    return job_by_key(jkey)


def job_update(job_id, status, result=None, error=None):
    _q("UPDATE jobs SET status=?, result=COALESCE(?,result), error=? WHERE id=?",
       (status, None if result is None else json.dumps(result), error, job_id))


# ---- cache administration ----
def cache_stats():
    now = time.time()
    r = _q("SELECT COUNT(*) n, COALESCE(SUM(expires IS NULL),0) perm, "
           "COALESCE(SUM(expires IS NOT NULL AND expires<=?),0) dead, COALESCE(SUM(LENGTH(v)),0) b FROM cache", (now,))[0]
    j = _q("SELECT COUNT(*) n, COALESCE(SUM(status='done'),0) done FROM jobs")[0]
    return {"cache_entries": r["n"] - r["dead"], "permanent_entries": r["perm"], "expired_entries": r["dead"],
            "cache_size_kb": round(r["b"] / 1024, 1), "jobs_total": j["n"], "jobs_done": j["done"],
            "saved_locations": _q("SELECT COUNT(*) c FROM locations")[0]["c"],
            "snapshots": _q("SELECT COUNT(*) c FROM snapshots")[0]["c"]}


def cache_clear(prefix=""):
    pat = prefix.replace("%", "") + "%"
    n = _q("SELECT COUNT(*) c FROM cache WHERE k LIKE ?", (pat,))[0]["c"]
    _q("DELETE FROM cache WHERE k LIKE ?", (pat,))
    return n


def cache_purge():
    _q("DELETE FROM cache WHERE expires IS NOT NULL AND expires<=?", (time.time(),))


def jobs_clear():
    n = _q("SELECT COUNT(*) c FROM jobs")[0]["c"]
    _q("DELETE FROM jobs")
    return n


# ---- saved locations and stress-score history ----
def loc_create(key_id, name, lat, lon):
    _q("INSERT INTO locations(key_id,name,lat,lon,created) VALUES(?,?,?,?,?) "
       "ON CONFLICT(key_id,name) DO UPDATE SET lat=excluded.lat, lon=excluded.lon",
       (key_id, name, lat, lon, time.time()))
    return dict(_q("SELECT * FROM locations WHERE key_id=? AND name=?", (key_id, name))[0])


def loc_list(key_id):
    return [dict(r) for r in _q(
        "SELECT l.*, (SELECT score FROM snapshots s WHERE s.loc_id=l.id ORDER BY ts DESC LIMIT 1) AS last_score "
        "FROM locations l WHERE key_id=? ORDER BY name", (key_id,))]


def loc_get(loc_id, key_id):
    r = _q("SELECT * FROM locations WHERE id=? AND key_id=?", (loc_id, key_id))
    return dict(r[0]) if r else None


def loc_all():
    return [dict(r) for r in _q("SELECT * FROM locations")]


def loc_delete(loc_id):
    _q("DELETE FROM snapshots WHERE loc_id=?", (loc_id,))
    _q("DELETE FROM locations WHERE id=?", (loc_id,))


def snap_save(loc_id, score, level, payload):
    _q("INSERT INTO snapshots(loc_id,ts,score,level,payload) VALUES(?,?,?,?,?)",
       (loc_id, time.time(), score, level, json.dumps(payload)))


def snap_list(loc_id, limit=365):
    rows = _q("SELECT ts,score,level,payload FROM snapshots WHERE loc_id=? ORDER BY ts DESC LIMIT ?", (loc_id, limit))
    return [{"ts": r["ts"], "date": time.strftime("%Y-%m-%d %H:%M", time.gmtime(r["ts"])),
             "score": r["score"], "level": r["level"], "payload": json.loads(r["payload"])} for r in reversed(rows)]