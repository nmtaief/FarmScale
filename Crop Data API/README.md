# Crop Gateway

Location-based crop suitability, water and nutrient needs, and soil impact behind one API key.
Separate from the data engine: own keys, own database, own port.

## Run
```bash
pip install -r requirements.txt
cp .env.example .env          # set ADMIN_KEY
uvicorn main:app --reload --port 8100
```
First start prints an API key (`cg_...`). Open http://127.0.0.1:8100/ for the tester and /docs for the API reference.
No Earthdata account is needed: NASA POWER and SoilGrids are open.

## Endpoints (send `X-API-Key`)
| Endpoint | Returns |
|---|---|
| `GET /v1/crops`, `/v1/crops/{id}` | Crop list and static profile |
| `GET /v1/location?lat&lon` | Climate normals, ET0, topsoil |
| `GET /v1/suitability?lat&lon` | Crops ranked, with best planting month |
| `GET /v1/water?crop&lat&lon` | Water need by stage and month, irrigation volume |
| `GET /v1/nutrition?crop&lat&lon` | Uptake and indicative fertilizer |
| `GET /v1/soil-impact?crop&lat&lon` | Nutrient removal, depletion, organic matter, rotation |
| `GET /v1/plan?crop&lat&lon` | All of the above for one crop |

Pass `ph`, `soc`, `n`, `sand`, `silt`, `clay` to use your own soil test instead of satellite soil data.

## Extending the crop data
Edit `data/crops.json` (one crop per line; field meanings are in its `meta` block) and restart.
Review values with a local agronomist before giving advice to farmers.
