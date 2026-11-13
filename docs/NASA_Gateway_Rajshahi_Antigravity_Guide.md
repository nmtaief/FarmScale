# NASA API Gateway: Rajshahi Division Data Collection and GeoJSON Vector Map

Guide for the Antigravity agent. It covers the **NASA API Gateway only** (port `8000`). The Crop Data API, crop suitability and crop dataset export are removed.

**Goal:** collect NASA POWER weather, SoilGrids soil, SMAP soil moisture and MODIS NDVI/EVI data for Rajshahi Division, Bangladesh, and produce a GeoJSON vector file (`rajshahi_nasa_vector.geojson`) that can be opened in QGIS, geojson.io or Leaflet.

---

## 1. What the gateway provides

| Source | Data | Endpoint |
|---|---|---|
| NASA POWER | Rainfall, temperature, soil wetness | `/v1/weather` |
| ISRIC SoilGrids | pH, SOC, nitrogen, sand/silt/clay (0-60 cm) | `/v1/soil` |
| NASA AppEEARS (SMAP) | Root-zone soil moisture (async job) | `/v1/smap` |
| NASA AppEEARS (MODIS) | NDVI/EVI, VCI anomaly (async job) | `/v1/vegetation` |
| Combined | All of the above plus a 0-100 water-stress score | `/v1/field-profile` |

The script below uses **`/v1/field-profile`**, because one call returns everything and starts the async AppEEARS jobs.

Other endpoints: `/v1/jobs/{job_id}`, `/v1/locations` (POST/GET), `/v1/cache/stats`, `/health`, `/admin/keys`, `/admin/cache`.

Auth: `X-API-Key: ge_...` for `/v1/*`, `X-Admin-Key: <ADMIN_KEY>` for `/admin/*`.

Cache behaviour (SQLite `engine.db`):
- Soil: permanent cache. SoilGrids allows about 1 request per 12 s, so wait 12-13 s between new coordinates.
- Weather: 6-hour TTL.
- AppEEARS jobs: take about 2-8 minutes. Poll every 30 s.

---

## 2. Setup (terminal)

```bash
git clone https://github.com/za-m-an/NasaSpaceAppDataGateWay.git FarmScale
cd FarmScale/NasaAPIgateWay
cp .env.example .env
```

`.env`:

```env
EARTHDATA_USER=your_earthdata_username
EARTHDATA_PASS=your_earthdata_password
ADMIN_KEY=YourSecureAdminPassword123!
ENGINE_DB=engine.db
CORS_ORIGINS=*
SMAP_PRODUCT=SPL4SMGP.008
VEG_PRODUCT=MOD13Q1.061
REFRESH_HOURS=6
```

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

On first start the terminal prints an API key starting with `ge_`. To create another key:

```bash
curl -X POST http://127.0.0.1:8000/admin/keys \
  -H "X-Admin-Key: YourSecureAdminPassword123!" \
  -H "Content-Type: application/json" \
  -d '{"name":"antigravity","rpm":300}'
```

Check health (it must show `earthdata_configured: true`):

```bash
curl http://127.0.0.1:8000/health
```

---

## 3. Browser tasks for the Antigravity agent

Use the browser for these steps.

1. **Earthdata account.** Open https://urs.earthdata.nasa.gov/, log in, and approve the **AppEEARS** application under *Applications > Authorized Apps*. The AppEEARS (SMAP/NDVI) jobs fail without this. Pause and let the user type their own password. Do not ask the user to paste credentials into chat.
2. **Verify coordinates.** Open OpenStreetMap Nominatim, search `Rajshahi Division, Bangladesh`, and confirm the bounding box and the 8 district centroids in section 4.
3. **(Optional) Download the division boundary polygons.** Get the Bangladesh ADM2 (district) GeoJSON from geoBoundaries (https://www.geoboundaries.org/) and keep only the 8 Rajshahi Division districts. This gives polygon geometry, which can be joined to the point data by district name.
4. **Visual check.** After the run, open `rajshahi_nasa_vector.geojson` at https://geojson.io and confirm the points sit inside the division and have properties.

---

## 4. Rajshahi Division coordinates

Bounding box: lat 23.8071 to 25.2760, lon 88.0079 to 89.8297.

| District | Lat | Lon | Zone |
|---|---|---|---|
| Rajshahi | 24.3745 | 88.6042 | High Barind Tract |
| Bogura | 24.8465 | 89.3777 | Karatoa-Bangali Floodplain |
| Pabna | 24.0064 | 89.2483 | Ganges River Floodplain |
| Naogaon | 24.8138 | 88.9515 | Barind Tract and Atrai Basin |
| Natore | 24.4172 | 88.9959 | Chalan Beel Depression |
| Joypurhat | 25.0947 | 89.0279 | Level Barind Tract |
| Chapainawabganj | 24.5965 | 88.2775 | Mahananda River Basin |
| Sirajganj | 24.4534 | 89.7008 | Jamuna River Floodplain |

The script below can also add an optional 0.2-degree grid (about 22 km) over the bounding box with `--grid`. The box is a rectangle, so some grid points fall in India or in other Bangladeshi divisions. If you use the grid, filter points by the polygon from step 3. The grid is slow: each new coordinate needs a 13 s SoilGrids pause.

---

## 5. Ingestion and GeoJSON export (Java)

Requires Java 17+ and the Gson jar. Save as `IngestRajshahi.java`.

```bash
# download gson (browser or curl): https://repo1.maven.org/maven2/com/google/code/gson/gson/2.11.0/gson-2.11.0.jar
export NASA_KEY=ge_your_key
java -cp gson-2.11.0.jar IngestRajshahi.java            # 8 districts
java -cp gson-2.11.0.jar IngestRajshahi.java --grid     # districts + grid
```

```java
import com.google.gson.*;
import java.net.URI;
import java.net.http.*;
import java.nio.file.*;
import java.time.Duration;
import java.time.Instant;
import java.util.*;

public class IngestRajshahi {
    static final String BASE = System.getenv().getOrDefault("NASA_API_URL", "http://127.0.0.1:8000");
    static final String KEY = System.getenv("NASA_KEY");
    static final int MAX_POLLS = 20;          // 20 x 30 s = 10 min of waiting for AppEEARS
    static final HttpClient HTTP = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(30)).build();
    static final Gson GSON = new GsonBuilder().setPrettyPrinting().create();

    record Pt(String id, String name, String zone, double lat, double lon) {}

    static List<Pt> districts() {
        return List.of(
            new Pt("D_RAJ", "Rajshahi",        "High Barind Tract",            24.3745, 88.6042),
            new Pt("D_BOG", "Bogura",          "Karatoa-Bangali Floodplain",   24.8465, 89.3777),
            new Pt("D_PAB", "Pabna",           "Ganges River Floodplain",      24.0064, 89.2483),
            new Pt("D_NAO", "Naogaon",         "Barind Tract and Atrai Basin", 24.8138, 88.9515),
            new Pt("D_NAT", "Natore",          "Chalan Beel Depression",       24.4172, 88.9959),
            new Pt("D_JOY", "Joypurhat",       "Level Barind Tract",           25.0947, 89.0279),
            new Pt("D_CHA", "Chapainawabganj", "Mahananda River Basin",        24.5965, 88.2775),
            new Pt("D_SIR", "Sirajganj",       "Jamuna River Floodplain",      24.4534, 89.7008));
    }

    static List<Pt> grid(double step) {
        List<Pt> g = new ArrayList<>();
        int idx = 1;
        for (double lat = 23.85; lat <= 25.25; lat += step)
            for (double lon = 88.05; lon <= 89.80; lon += step)
                g.add(new Pt(String.format("RAJ_GRID_%03d", idx++), "grid", "grid",
                        Math.round(lat * 1e4) / 1e4, Math.round(lon * 1e4) / 1e4));
        return g;
    }

    static JsonObject fieldProfile(Pt p) throws Exception {
        URI uri = URI.create(BASE + "/v1/field-profile?lat=" + p.lat() + "&lon=" + p.lon());
        HttpRequest req = HttpRequest.newBuilder(uri).header("X-API-Key", KEY)
                .timeout(Duration.ofSeconds(180)).GET().build();
        HttpResponse<String> r = HTTP.send(req, HttpResponse.BodyHandlers.ofString());
        if (r.statusCode() != 200) throw new RuntimeException("HTTP " + r.statusCode() + ": " + r.body());
        return JsonParser.parseString(r.body()).getAsJsonObject();
    }

    static String status(JsonObject d, String key) {
        if (d.has(key) && d.get(key).isJsonObject() && d.getAsJsonObject(key).has("status")
                && d.getAsJsonObject(key).get("status").isJsonPrimitive())
            return d.getAsJsonObject(key).get("status").getAsString();
        return "unknown";
    }

    static boolean terminal(JsonObject d) {
        for (String k : new String[]{"soil_moisture", "vegetation"}) {
            String s = status(d, k);
            if (!s.equals("done") && !s.equals("failed")) return false;
        }
        return true;
    }

    // Flattens nested objects into dotted keys. Arrays (time series) and nulls are skipped.
    static void flatten(String prefix, JsonElement e, JsonObject out) {
        if (e.isJsonObject()) {
            for (var en : e.getAsJsonObject().entrySet())
                flatten(prefix.isEmpty() ? en.getKey() : prefix + "." + en.getKey(), en.getValue(), out);
        } else if (e.isJsonPrimitive()) {
            JsonPrimitive p = e.getAsJsonPrimitive();
            if (p.isNumber()) out.addProperty(prefix, p.getAsNumber());
            else if (p.isBoolean()) out.addProperty(prefix, p.getAsBoolean());
            else out.addProperty(prefix, p.getAsString());
        }
    }

    static JsonObject feature(Pt p, JsonObject data) {
        JsonObject props = new JsonObject();
        props.addProperty("id", p.id());
        props.addProperty("name", p.name());
        props.addProperty("zone", p.zone());
        props.addProperty("fetched_at", Instant.now().toString());
        if (data != null) flatten("", data, props);

        JsonArray coords = new JsonArray();
        coords.add(p.lon());           // GeoJSON order is [lon, lat]
        coords.add(p.lat());
        JsonObject geom = new JsonObject();
        geom.addProperty("type", "Point");
        geom.add("coordinates", coords);

        JsonObject f = new JsonObject();
        f.addProperty("type", "Feature");
        f.add("geometry", geom);
        f.add("properties", props);
        return f;
    }

    public static void main(String[] args) throws Exception {
        if (KEY == null || KEY.isBlank()) throw new IllegalStateException("Set NASA_KEY (ge_...)");
        List<Pt> points = new ArrayList<>(districts());
        if (Arrays.asList(args).contains("--grid")) points.addAll(grid(0.2));

        Map<String, JsonObject> latest = new LinkedHashMap<>();

        // Pass 1: touch every point once. This caches SoilGrids/POWER and starts all AppEEARS jobs.
        for (Pt p : points) {
            System.out.printf("[1] %s (%.4f, %.4f)%n", p.name(), p.lat(), p.lon());
            try {
                latest.put(p.id(), fieldProfile(p));
            } catch (Exception ex) {
                System.out.println("    failed: " + ex.getMessage());
            }
            Thread.sleep(13_000);      // respect SoilGrids throttle
        }

        // Pass 2: poll until SMAP and vegetation jobs are done or failed.
        for (int round = 1; round <= MAX_POLLS; round++) {
            List<Pt> pending = points.stream()
                    .filter(p -> latest.containsKey(p.id()) && !terminal(latest.get(p.id()))).toList();
            if (pending.isEmpty()) break;
            System.out.printf("[2] round %d: %d point(s) still processing%n", round, pending.size());
            Thread.sleep(30_000);
            for (Pt p : pending) {
                try { latest.put(p.id(), fieldProfile(p)); }
                catch (Exception ex) { System.out.println("    " + p.name() + ": " + ex.getMessage()); }
            }
        }

        JsonArray features = new JsonArray();
        for (Pt p : points) features.add(feature(p, latest.get(p.id())));

        JsonObject fc = new JsonObject();
        fc.addProperty("type", "FeatureCollection");
        fc.addProperty("name", "rajshahi_nasa_vector");
        fc.add("features", features);

        Files.writeString(Path.of("rajshahi_nasa_vector.geojson"), GSON.toJson(fc));
        System.out.println("Wrote rajshahi_nasa_vector.geojson with " + features.size() + " features");
    }
}
```

Notes:
- Each feature is a Point in `[lon, lat]` order (EPSG:4326). Properties hold the district name, zone, and the flattened field-profile values: weather, soil, SMAP status/values, vegetation, and `water_stress.score` / `level`.
- Time-series arrays are left out on purpose, to keep the GeoJSON small. To keep a series, call `/v1/smap` or `/v1/vegetation` with `include_series=true` separately.
- Property names come straight from the gateway response. Check them once in QGIS or geojson.io.

---

## 6. Prompt to give Antigravity

> Open the browser and make sure my NASA Earthdata account has the AppEEARS app authorized (stop and let me type the password myself). Verify the Rajshahi Division bounding box and the 8 district centroids on OpenStreetMap Nominatim. In the terminal, check that the NASA gateway is running on port 8000 (`curl /health` must show `earthdata_configured: true`), create an API key via `/admin/keys` if needed, and export it as `NASA_KEY`. Run `IngestRajshahi.java`, wait for the AppEEARS jobs to finish, and write `rajshahi_nasa_vector.geojson`. Then open the file in geojson.io, confirm all 8 districts have properties, and report any district with `failed` status. Optionally download the Rajshahi Division ADM2 boundaries from geoBoundaries and join them to the points by district name.

---

## 7. Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| HTTP 401 | Missing or wrong `X-API-Key` | Create a key via `/admin/keys` or read `engine.db` (`api_keys` table has hashes only, so make a new one) |
| HTTP 429 | Over the `rpm` limit | Create a key with a higher `rpm` |
| HTTP 502 from SoilGrids | Throttled (about 5 calls/min) | Keep the 13 s pause. Cached points return instantly |
| SMAP or vegetation stuck on `pending` / `processing` | AppEEARS is asynchronous (2-8 min) | Keep polling every 30 s. Do not hammer the endpoint |
| `earthdata_configured: false` | `EARTHDATA_USER` or `EARTHDATA_PASS` missing in `.env` | Fix `.env` and restart uvicorn |
| SMAP or vegetation `failed` | AppEEARS app not authorized, or job error | Authorize AppEEARS in Earthdata, then clear the failed job with `DELETE /admin/cache?jobs=true` and re-run |
| `database is locked` | Concurrent SQLite writes | Do not write to `engine.db` by hand while the server runs |
