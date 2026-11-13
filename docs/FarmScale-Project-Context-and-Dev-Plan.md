# FarmScale: Project Context and Development Plan

**How to use this file:** Paste it at the start of a new Gemini conversation (or attach it), then say which phase from Section 9 you want to work on. It contains the full background, decisions made, verified facts, the architecture, and a step-by-step plan, so the new assistant does not need the earlier chat.

---

## 1. Project summary

- **Product name:** FarmScale (originally "Field Shift" during the competition; the name changed. Older files still say Field Shift).
- **Team:** Team Thinking.
- **Origin:** NASA Space Apps Challenge 2026, challenge "Field Shift: Adapting Farms with NASA Data". The challenge asks for a **decision-support tool** that combines NASA Earth observations, local soil information, crop characteristics and **farmer priorities** to help farmers explore **crop rotation strategies** that strengthen soil health and adapt to changing conditions (temperature, rainfall, water shortage, extreme weather, declining soil health).
- **Competition format:** 24 hours. The final pitch was a 240-second video, not a live demo.
- **One-line promise:** "Pick a place. See what the climate is doing. Get rotation options that fit your priorities, with the reason shown."
- **Pilot region:** Rajshahi, Bangladesh (Barind Tract, one of the driest parts of the country, heavy groundwater irrigation).
- **Languages planned:** English, Bangla (বাংলা), Japanese (日本語).
- **Current stage:** Moving from competition prototype to real development. The team has built a **data gateway** for NASA data and crop data for any location (details of its endpoints must be confirmed, see Section 10). No AI endpoints are connected yet, and that is intentional for this phase.

## 2. Target users

1. **Smallholder farmers:** mid-range Android phone, unstable internet, not technical. Primary user.
2. **Agricultural extension officers:** laptop or tablet, advise many farmers.
3. **Researchers, partners and developers:** use the data gateway (API) directly.

## 3. Core product idea

Inputs: **NASA climate data + local soil + crop traits + farmer priorities.**
Process: a **scoring engine** ranks candidate crop rotations.
Output: the **top 3 rotations**, each with a score, a season timeline and a plain-language **"why"** that names the data signal behind it.

Farmer priorities are three sliders: **Save water, Earn income, Rebuild soil.** Changing them re-ranks the rotations. Example from the pitch (illustrative scores, 0-10, weights water/income/soil):

| Rotation | Water | Income | Soil |
|---|---|---|---|
| Mustard - Mungbean - Aman rice | 8 | 5 | 8 |
| Wheat - Mungbean - Aman rice | 6 | 7 | 7 |
| Lentil - Aus rice - Aman rice | 7 | 5 | 8 |
| Boro rice - Aman rice | 2 | 9 | 3 |

Water-first weights 8/3/4 → Mustard rotation wins (7.4). Income-first weights 3/8/4 → Wheat rotation wins (6.8). Score = sum(weight × rating) / sum(weights). **These ratings are illustrative and must be replaced with sourced crop data.**

## 4. NASA and other data sources (planned)

| Source | Gives | Use |
|---|---|---|
| NASA POWER API | Daily rainfall, temperature, humidity, 20+ years, no login, global grid (roughly 50 km cells) | Rain-onset shift, hot days per year, rainfall trend |
| SMAP (soil moisture, from 2015) | Surface and root-zone soil moisture | Water-stress percentile versus past seasons |
| MODIS / VIIRS NDVI | Vegetation greenness | Crop-stress anomaly |
| GPM IMERG (optional) | Higher-resolution rainfall | Only if time allows (heavy) |
| SoilGrids (ISRIC, non-NASA) | Organic carbon, pH, texture | Soil-health baseline |
| FAO-56 / EcoCrop (or hardcoded and cited) | Crop water need, heat tolerance, season, legume or not | Crop trait table (5-8 local crops for the pilot) |

Known limits to state honestly in the product: POWER grid is coarse, SMAP starts in 2015.

## 5. Verified facts about Rajshahi / Barind (with sources)

These were found by web search and can be used as published context. Re-check before putting them in production copy.

- Normal annual rainfall in Rajshahi is about **1,625 mm**, versus about **2,550 mm** for Bangladesh overall (about 36% less). Source: "Drought vulnerability assessment ... Barind Tract", PMC11620109.
- Annual rainfall across **northwest Bangladesh fell about 25.6% between 1981 and 2014**; groundwater in Rajshahi district fell **4-12 m** over the same period. Source: "Sustainability of groundwater use for irrigation of dry-season crops in northwest Bangladesh", ScienceDirect.
- Barind groundwater depth: about **26 ft (1985-90) → 50 ft (2010) → 60 ft (2021) → over 113 ft in many areas now**. Source: Dhaka Tribune, "Water crisis threatens food security in Barind region".
- **75%** of Barind irrigation comes from groundwater, up from **41%** in 1982-83 (Adhikari 2013; Hasan et al. 2018).
- BMDA operates about **16,000 deep tube wells**, none installed since 2012; a rotational irrigation system was introduced in 2024. Source: Dialogue Earth, "Landless Bangladeshi farmers suffer as paddy fades in Barind".

## 6. What was already produced (files from the earlier chat)

| File | Description | Status |
|---|---|---|
| Hosted HTML pitch deck | 7-slide interactive deck (Team Thinking, Field Shift) | Still says "Field Shift" |
| `Team-Thinking-Field-Shift-Pitch.pptx` | 7-slide PowerPoint with native charts, real Rajshahi data, speaker notes | Still says "Field Shift"; rename to FarmScale if reused |
| Video script (.docx) | Narration for the 240-second video | **Was requested but not delivered yet**; the narration text exists in the pptx speaker notes |
| `FarmScale-UIUX-Design-Brief.md` | Full UI/UX brief (6 screens, 3 languages, AI reserved) | Done |
| `FarmScale-Design-Fix-Prompt.md` | Revision prompt: honest data states, Simple/Expert view, mobile, languages, less AI, missing screens | Done |
| `ADMIN-SPEC.md` | Admin console specification (modules, roles, security, phases) | Done |
| `FarmScale-Layout-Optimization-Prompt.md` | Revision prompt: placement, layout, responsive and performance | Done |
| Stitch design export (`stitch_farmscale_crop_rotation_app.zip`) | 4 desktop screens (Landing, Climate and Soil Dashboard, Rotation Planner, Crop Library) as HTML + PNG, plus `DESIGN.md` design system | First draft, needs the fixes below |

## 7. Design system (from `DESIGN.md`, "Agro-Scientific Tactile")

- **Colors:** Grain Gold `#D9A21B` (primary actions), Leaf Green `#2F7D4F` (growth, soil, NDVI), Water Blue `#2E7DA6` (rain, moisture), Heat Red `#C2472D` (heat, warnings), Deep Forest `#14291F` (text, dark surfaces), Soft Sage `#F3F7F0` (canvas). The export also defines a full Material-style token set (surface, on-surface, containers, etc.).
- **Fonts:** Source Serif 4 (headings), Noto Sans (body; Noto Sans Bengali and Noto Sans JP for other scripts), JetBrains Mono (numbers, coordinates). Non-Latin scripts need larger line height (about +4 px).
- **Shapes and spacing:** radius 8 / 16 / 24 px, 8 px spacing system, 12-column grid desktop, 8 tablet, 4 mobile. Gutters 24 px desktop, 16 px mobile. Margins 40 px desktop, 16 px mobile.
- **Motif:** three-season rotation ring (Kharif-1 pre-monsoon, Kharif-2 monsoon, Rabi winter).
- **Elevation:** subtle borders `rgba(20,41,31,0.08)` and soft shadows; modals use a 40% forest overlay.

### Review findings on the Stitch draft (must be fixed in the build)

1. **Invented numbers shown as real** (for example groundwater loss per year, heat-day counts, pH and carbon values, "94 compatibility", "94% pilot success rate", "validated against BMDA/BARI sensors", "Neural Engine v2.4"). Every value must come from the gateway or be labeled **Sample data**.
2. **Too dense for farmers.** Add a **Simple / Expert** toggle (Simple default).
3. **No mobile designs** (only 1280 px). Needs 360 px layouts: bottom tab bar, single column, bottom sheets.
4. **Language switcher is not designed.** Needs real Bangla and Japanese text and text-length tests.
5. **AI is too prominent.** Keep only one disabled "Coming soon" assistant slot and disabled "Ask about this recommendation" buttons.
6. **Missing screens:** Location Explorer (map), Data Gateway page, states (loading, error, offline).
7. **Production issues:** Tailwind loaded from CDN and images hotlinked from Google; bundle locally. Footer says 2024. Small 12 px mono text fails readability.

## 8. Architecture decision

**Separate frontend and backend; do not go fully serverless for the data gateway.**

| Layer | Recommended choice | Reason |
|---|---|---|
| Frontend | Next.js (or Vite + React) on Vercel or Cloudflare Pages | CDN, free tier, auto-deploy. Serverless is fine here. |
| Gateway API | FastAPI (Python) or Node, in a Docker container on Render, Railway or Fly.io | NASA calls are slow and rate-limited; avoids serverless timeouts and cold starts; Python suits geospatial libraries. |
| Database | Postgres + PostGIS (Supabase or Neon) | Cached location data, farmer profiles, spatial queries. |
| Cache | Redis (Upstash) | Fast repeat lookups, rate-limit tracking. |
| Jobs | Worker or cron on the same platform | Prefetch popular regions (for example Rajshahi), refresh data. |
| Edge (later) | Cloudflare Workers in front of the API | Cache public responses. |
| Admin console | Separate app (`apps/admin`) on its own subdomain, calling protected `/v1/admin/*` routes | Lets developers manage the gateway, crop data, API keys, flags and the disabled AI registry. See `ADMIN-SPEC.md`. |

**Design rules for future scaling**

1. **Cache by grid cell, not exact coordinates** (POWER is gridded). 1,000 farmers in the same cell cost one NASA call.
2. **Version the API from day one** (`/v1/...`) and publish an OpenAPI spec.
3. Keep the **scoring engine a pure library** (no web code inside) so it can run in the API now, or inside an AI service later.
4. Add **AI later as a separate service** that calls the gateway (independent scaling, cost and failure).
5. **Gateway returns codes and numbers, not sentences** (for example `rain_onset: "later"`), so the frontend translates and an AI service can follow the same pattern.
6. Start as a **modular monolith**; split services only when real traffic demands it.

## 9. Development plan

### Phase 0: Alignment (1-2 days)
- Confirm the existing data gateway: endpoints, response shapes, auth, rate limits, hosting. Write an **OpenAPI spec** for it (Section 10).
- Decide data policy: every UI value is Live, Sample or Unavailable.
- Create the repo(s), a README, and choose the stack (suggested: monorepo with `apps/web`, `apps/api`, `packages/scoring`, `packages/ui-tokens`).

### Phase 1: Foundations (3-5 days)
- Convert `DESIGN.md` tokens into Tailwind config and CSS variables (light and dark).
- Set up i18n (next-intl or i18next) with routes `/en`, `/bn`, `/ja`; all strings in translation files; `lang` attribute on each page; font subsets for Noto Sans Bengali and Noto Sans JP.
- Build base components: data card (Live / Sample / Unavailable), status tag, priority slider, rotation card, season selector (ring plus mobile swipe), language switcher, bottom tab bar, bottom sheet, skeleton loaders, error and offline states.
- CI, linting, type checks, automatic preview deploys.

### Phase 2: Backend and scoring (5-7 days)
- Gateway endpoints (suggested, adjust to what exists):
  - `GET /v1/locations/search?q=` and `GET /v1/locations/{id}`
  - `GET /v1/locations/{lat},{lon}/climate` (rainfall trend, rain-onset shift, hot days, soil moisture percentile)
  - `GET /v1/locations/{lat},{lon}/soil` (carbon, pH, texture)
  - `GET /v1/crops` and `GET /v1/crops/{id}`
  - `POST /v1/rotations/rank` (inputs: location, priorities, optional soil overrides; output: ranked rotations with scores and "why" signal codes)
  - `GET /v1/health`
- Implement grid-cell caching, rate limiting, timeouts and retries for upstream APIs, and clear error codes.
- Build the **scoring engine** as a pure, tested library: crop trait table (5-8 Rajshahi crops with cited values), rotation candidates, priority weighting, explanation codes. Unit tests with known inputs and outputs.
- Seed and prefetch Rajshahi and a few other pilot locations.

### Phase 3: Core screens (7-10 days)
Build in this order, mobile first:
1. Landing page (shortened, with provable trust points)
2. Location Explorer (map with search and summary panel)
3. Climate and Soil Dashboard (Simple and Expert views, one source label and update time per card)
4. Rotation Planner (sliders, live re-rank, "Why this rotation", disabled "Ask about this recommendation")
5. Crop Library (filters, card grid, detail view)
6. Data Gateway page (endpoint list, copyable examples, API key area)

### Phase 3b: Admin console (in parallel, 5-8 days)
- Build per `ADMIN-SPEC.md` phases A, B and the health part of C first: login with MFA, roles, audit log, crop and rotation editor with sources (draft, review, publish), health overview.
- Then API keys, flags, jobs, cache controls, translations status, feedback inbox.
- Add the **AI registry in disabled state** (records, flags, kill switch). No model calls.
- Security review before the pilot.

### Phase 4: Quality (3-5 days)
- Accessibility: WCAG AA contrast, 44 px targets, keyboard use, screen-reader labels, chart text alternatives and "view as table".
- Performance: lazy-load charts and map, skeleton states, local assets only, test on slow 3G and a low-end Android phone.
- Language QA: longest-text tests in all three languages; native-speaker review of farming terms (rotation, fallow, soil moisture).
- Replace all illustrative crop ratings with sourced values; document sources.

### Phase 5: Launch pilot (3-5 days)
- Deploy frontend and API, set up monitoring and error tracking, backups.
- Pilot with Rajshahi extension officers; collect feedback; compare rankings with real yields.

### Phase 6: Later
- Separate AI service calling the gateway (explanations, "Ask about this recommendation", assistant panel), enabled through the admin AI registry flags with the kill switch ready.
- Bangla voice guidance, SMS or low-bandwidth delivery, more regions, exportable PDF advice sheets.

## 10. Open questions the new assistant should ask first

1. **Existing data gateway:** language and framework, endpoints and response format, hosting, auth, which NASA datasets are already wired, and whether it caches.
2. **Team skills and size:** main language (Python or JavaScript), who does frontend, backend and data.
3. **Hosting and budget:** preferred providers and free-tier limits.
4. **Crop data:** does the team have a sourced crop trait table, or should one be built from FAO-56 / EcoCrop?
5. **Designer status:** did the Stitch revisions (fix prompt and layout prompt) get applied?
6. **Name and assets:** final FarmScale logo, domain name, and license choice for the code and data.

## 11. Rules and constraints to keep

- **Never show invented numbers as real.** Label sample values. Keep one source label per data card.
- **No AI features in this phase,** only disabled placeholders.
- Mobile first (360 px), low-bandwidth friendly, plain language, evidence shown for every recommendation, farmer can correct soil values and see the ranking update.
- Do not hotlink images or load Tailwind from a CDN in production.
- Keep the scoring engine independent of the web framework.
- State data limits honestly (grid size, data start dates).

## 12. Starter prompts to give Gemini

**Start of a coding session**
> You are a senior full-stack engineer. Read the attached FarmScale context file. First ask me the questions in Section 10 that are still unanswered. Then propose the repo structure and the Phase 1 task list with estimates. Do not write code until I approve the plan.

**Design tokens**
> Using the colors, fonts, radii and spacing in Section 7, generate a Tailwind config and a `tokens.css` with light and dark themes and script-specific line heights for English, Bangla and Japanese.

**Scoring engine**
> Write a pure TypeScript (or Python) library that takes a list of crops with trait ratings, a list of candidate rotations, and three priority weights (water, income, soil), and returns ranked rotations with scores and explanation codes. Include unit tests using the example table in Section 3.

**Gateway spec**
> Here is my current gateway code/endpoints: [paste]. Produce an OpenAPI 3 spec with versioned routes, error codes and caching headers, and list what must change to meet Section 8.

**Frontend screen**
> Build the Rotation Planner screen mobile first in Next.js and Tailwind using the tokens, with Live / Sample / Unavailable data states, English / Bangla / Japanese strings from translation files, and a disabled "Ask about this recommendation" button.
