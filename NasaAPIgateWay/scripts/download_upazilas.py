import urllib.request
import json
import ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

url = "https://github.com/wmgeolab/geoBoundaries/raw/9469f09/releaseData/gbOpen/BGD/ADM3/geoBoundaries-BGD-ADM3.geojson"
print("Downloading Bangladesh ADM3 (Upazila) GeoJSON...")
req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
with urllib.request.urlopen(req, context=ctx, timeout=60) as resp:
    data = json.loads(resp.read().decode("utf-8"))

print(f"Total features in BGD ADM3: {len(data['features'])}")
first_feat = data['features'][0]
print("Sample feature properties:", first_feat['properties'])

# Load district polygons for Rajshahi Division to do spatial filtering
with open("rajshahi_boundaries.geojson", "r", encoding="utf-8") as f:
    dist_fc = json.load(f)

# Helper function to compute centroid of polygon
def compute_centroid(coords):
    # handle Polygon or MultiPolygon
    points = []
    def extract_pts(obj):
        if isinstance(obj, list):
            if len(obj) == 2 and isinstance(obj[0], (int, float)):
                points.append(obj)
            else:
                for sub in obj:
                    extract_pts(sub)
    extract_pts(coords)
    if not points:
        return None, None
    avg_lon = sum(p[0] for p in points) / len(points)
    avg_lat = sum(p[1] for p in points) / len(points)
    return avg_lat, avg_lon

# Check point in polygon (simple ray-casting algorithm)
def point_in_poly(x, y, poly_coords):
    # poly_coords is list of linear rings: [[ [lon, lat], ... ]]
    inside = False
    for ring in poly_coords:
        n = len(ring)
        p1x, p1y = ring[0][0], ring[0][1]
        for i in range(n + 1):
            p2x, p2y = ring[i % n][0], ring[i % n][1]
            if y > min(p1y, p2y):
                if y <= max(p1y, p2y):
                    if x <= max(p1x, p2x):
                        if p1y != p2y:
                            xinters = (y - p1y) * (p2x - p1x) / (p2y - p1y) + p1x
                        if p1x == p2x or x <= xinters:
                            inside = not inside
            p1x, p1y = p2x, p2y
    return inside

def is_point_in_geometry(x, y, geom):
    gtype = geom["type"]
    coords = geom["coordinates"]
    if gtype == "Polygon":
        return point_in_poly(x, y, coords)
    elif gtype == "MultiPolygon":
        for poly in coords:
            if point_in_poly(x, y, poly):
                return True
    return False

rajshahi_upazilas = []
for f in data["features"]:
    geom = f["geometry"]
    c_lat, c_lon = compute_centroid(geom["coordinates"])
    if c_lat is None:
        continue
    
    # Check which district this upazila centroid falls inside
    matched_district = None
    for df in dist_fc["features"]:
        if is_point_in_geometry(c_lon, c_lat, df["geometry"]):
            matched_district = df["properties"].get("shapeName", "Unknown")
            break
            
    if matched_district:
        f["properties"]["district"] = matched_district
        f["properties"]["centroid_lat"] = round(c_lat, 4)
        f["properties"]["centroid_lon"] = round(c_lon, 4)
        rajshahi_upazilas.append(f)

print(f"Matched {len(rajshahi_upazilas)} Upazilas inside Rajshahi Division districts!")
dist_counts = {}
for u in rajshahi_upazilas:
    d = u["properties"]["district"]
    dist_counts[d] = dist_counts.get(d, 0) + 1

for d, count in sorted(dist_counts.items()):
    print(f" - {d}: {count} upazilas")

with open("rajshahi_upazilas.geojson", "w", encoding="utf-8") as out:
    json.dump({"type": "FeatureCollection", "features": rajshahi_upazilas}, out, indent=2)

print("Saved rajshahi_upazilas.geojson successfully!")
