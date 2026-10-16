"""SQLite storage for the crop gateway: API keys, usage log and response cache."""
import os, json, time, sqlite3, threading, hashlib, secrets

_lock = threading.RLock()
_db = None


def init():
    global _db
    _db = sqlite3.connect(os.getenv("CROP_DB", "crop_gateway.db"), check_same_thread=False)
    _db.row_factory = sqlite3.Row
    with _lock:
        _db.executescript("""
        CREATE TABLE IF NOT EXISTS api_keys(id INTEGER PRIMARY KEY, name TEXT, hash TEXT UNIQUE,
            rpm INTEGER DEFAULT 60, active INTEGER DEFAULT 1, created REAL);
        CREATE TABLE IF NOT EXISTS usage(id INTEGER PRIMARY KEY, key_id INTEGER, path TEXT, ts REAL);
        CREATE TABLE IF NOT EXISTS cache(k TEXT PRIMARY KEY, v TEXT, expires REAL, created REAL);
        """)
        _db.commit()


def _q(sql, args=()):
    with _lock:
        rows = _db.execute(sql, args).fetchall()
        _db.commit()
        return rows


_h = lambda raw: hashlib.sha256(raw.encode()).hexdigest()


def create_key(name, rpm=60):
    raw = "cg_" + secrets.token_urlsafe(24)
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


def cache_get(k, meta=False):
    r = _q("SELECT v,expires,created FROM cache WHERE k=?", (k,))
    if r and (r[0]["expires"] is None or r[0]["expires"] > time.time()):
        val = json.loads(r[0]["v"])
        return (val, int(time.time() - (r[0]["created"] or time.time()))) if meta else val
    return None


def cache_set(k, v, ttl=None):
    now = time.time()
    _q("INSERT OR REPLACE INTO cache(k,v,expires,created) VALUES(?,?,?,?)",
       (k, json.dumps(v), None if ttl is None else now + ttl, now))


def cache_clear(prefix=""):
    pat = prefix.replace("%", "") + "%"
    n = _q("SELECT COUNT(*) c FROM cache WHERE k LIKE ?", (pat,))[0]["c"]
    _q("DELETE FROM cache WHERE k LIKE ?", (pat,))
    return n
