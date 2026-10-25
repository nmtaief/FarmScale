import urllib.request
import json
import ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

url = "https://github.com/wmgeolab/geoBoundaries/raw/9469f09/releaseData/gbOpen/BGD/ADM2/geoBoundaries-BGD-ADM2.geojson"
print("Downloading Bangladesh ADM2 GeoJSON...")
req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
with urllib.request.urlopen(req, context=ctx, timeout=60) as resp:
    data = json.loads(resp.read().decode("utf-8"))

print(f"Total features in BGD ADM2: {len(data['features'])}")

raj_districts = ["Rajshahi", "Bogura", "Bogra", "Pabna", "Naogaon", "Natore", "Joypurhat", "Chapainawabganj", "Chapai Nawabganj", "Nawabganj", "Sirajganj"]
matched = []
for f in data["features"]:
    name = f["properties"].get("shapeName", "")
    for d in raj_districts:
        if d.lower() in name.lower():
            matched.append(f)
            break

print(f"Matched {len(matched)} Rajshahi Division districts:")
for m in matched:
    print(" -", m["properties"].get("shapeName"))

with open("rajshahi_boundaries.geojson", "w", encoding="utf-8") as out:
    json.dump({"type": "FeatureCollection", "features": matched}, out, indent=2)

print("Saved rajshahi_boundaries.geojson successfully!")
