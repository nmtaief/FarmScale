# AGENTS.md

Rules for AI coding agents working on **FarmScale**. Read this file fully before making any change. If a rule here conflicts with a request, stop and ask the human.

## 1. Project in one paragraph

FarmScale is a decision-support web app that turns NASA Earth data, local soil data and crop traits into ranked **crop rotation** recommendations for a specific location, weighted by the farmer's priorities (save water, earn income, rebuild soil). Every recommendation must show the evidence behind it. The pilot region is **Rajshahi, Bangladesh**. Users are smallholder farmers on mid-range Android phones with unstable internet, extension officers, and developers using the data API. UI languages: **English, Bangla (bn), Japanese (ja)**.

Full background and plan: `docs/FarmScale-Project-Context-and-Dev-Plan.md`. Design rules: `docs/DESIGN-RULES.md` (tokens in `docs/DESIGN.md`). Admin console: `docs/ADMIN-SPEC.md`. User flows: `docs/FarmScale-User-Flows.md`.

## 2. Non-negotiable rules

1. **Never present invented numbers as real data.** Every value shown in the UI is one of: `live` (from the gateway), `sample` (clearly labeled "Sample data"), or `unavailable`. Do not hardcode realistic-looking measurements, scores, percentages, yields or success rates.
2. **No unprovable claims.** Do not write copy such as "validated by", "certified", "field-tested", partner names, accuracy figures or version marketing unless the human confirms it is true.
3. **No AI features yet.** Do not add AI endpoints, chat, generated advice or model calls. The only allowed AI-related UI is a **disabled "Coming soon"** assistant slot and a disabled "Ask about this recommendation" button. The admin console may contain an **AI registry** (records, feature flags, kill switch), but it must stay disabled and make no model calls.
4. **Every recommendation shows its "why"** and the data signal behind it. Never ship a ranking without an explanation.
5. **Every data card shows exactly one source label and a "last updated" time.**
6. **Do not invent API endpoints, dataset names, crop values or citations.** If a fact is missing, say so and ask. Mark placeholders with `TODO(human)`.
7. **Do not commit secrets.** API keys, tokens and `.env` files never go into the repo. Use `.env.example` with empty values.
8. **Ask before** adding a new dependency, changing the database schema, changing the public API shape, or deleting files.

## 3. Architecture

Separate frontend and backend. Do **not** convert the gateway to serverless.

```
apps/web        Next.js (React, TypeScript, Tailwind) - frontend
apps/api        Data gateway API (containerized) - backend
apps/admin      Admin console for developers (separate app, own subdomain)
packages/scoring  Pure scoring engine library (no web or DB code)
packages/ui-tokens  Design tokens (Tailwind config, tokens.css)
docs/           Context, design and API docs
```

- **Gateway:** long-running containerized service. Calls NASA POWER, SMAP, MODIS/VIIRS and SoilGrids. Handles caching, rate limiting, timeouts and retries.
- **Database:** Postgres with PostGIS. **Cache:** Redis.
- **Cache by grid cell**, not exact coordinates (NASA POWER is gridded).
- **Version the API** from day one: `/v1/...`. Keep an OpenAPI spec in `docs/openapi.yaml` and update it with every API change.
- The **scoring engine is a pure library**: no HTTP, no database, no framework imports. It takes data in and returns ranked results with explanation codes.
- **The gateway returns codes and numbers, not sentences** (for example `rain_onset: "later"`). The frontend translates them. This keeps i18n clean and lets a future AI service use the same data.
- AI will be a **separate service** later. Do not add it to the gateway or frontend.

## 4. Data rules

- Allowed sources: NASA POWER, SMAP, MODIS/VIIRS NDVI, GPM IMERG (optional), SoilGrids (ISRIC), and crop traits from FAO-56 / EcoCrop or a cited table. Anything else needs human approval.
- State known limits in the product: POWER grid is coarse (about 50 km); SMAP data starts in 2015.
- Crop trait values need a source field. Ratings used in the demo (for example Mustard water 8, income 5, soil 8) are **illustrative** and must stay labeled as sample until sourced.
- Upstream calls must have timeouts, retries with backoff, and a clear error response. Never let a NASA API failure crash a request; return `unavailable` with a reason code.
- Do not scrape websites or call undocumented endpoints.

## 5. Frontend rules

- **Mobile first** at 360 px, then tablet (768) and desktop (1280). No horizontal scrolling except deliberate carousels.
- Body text at least 16 px. Touch targets at least 44 px. WCAG AA contrast. Never rely on color alone: pair status colors with an icon or label.
- **Simple and Expert views.** Simple is the default: plain language a farmer can read, one chart per card. Technical terms go in Expert view or a tooltip.
- Layout: mobile uses a bottom tab bar, single column and bottom sheets. Desktop uses the 12-column grid, max content width about 1200 px. Planner is 4 + 8 columns, Dashboard is 8 + 4 with a sticky rail.
- Design for **skeleton loading, empty, partial, unavailable, error, rate-limited and offline states** on every data component.
- Lazy-load the map and charts. Use SVG for the rotation ring and icons. Respect `prefers-reduced-motion`.
- **No hotlinked images and no CDN-loaded Tailwind in production.** All assets are local.
- Charts need a text alternative and a "view as table" option. Chart labels are live text, never images.

## 6. Design system (summary)

Source of truth is `docs/DESIGN-RULES.md`, `docs/DESIGN.md` and the generated tokens in `packages/ui-tokens`. Never hardcode colors, fonts or spacing; use tokens.

| Token | Value | Use |
|---|---|---|
| Grain Gold | `#D9A21B` | Primary actions |
| Leaf Green | `#2F7D4F` | Growth, soil, NDVI |
| Water Blue | `#2E7DA6` | Rain, moisture |
| Heat Red | `#C2472D` | Heat, warnings |
| Deep Forest | `#14291F` | Text, dark surfaces |
| Soft Sage | `#F3F7F0` | Page background |

Fonts: Source Serif 4 (headings), Noto Sans (body), Noto Sans Bengali, Noto Sans JP, JetBrains Mono (numbers and coordinates only). Spacing uses the 8 px scale. Radius 8 / 16 / 24 px. Support light and dark themes.

## 7. Internationalization

- Locales: `en`, `bn`, `ja`. Routes: `/en`, `/bn`, `/ja`. Use `next-intl` (or the library the human chose).
- **All user-facing text lives in translation files.** No hardcoded strings in components.
- Set the `lang` attribute on every page. Load font subsets per script.
- Line heights: about 1.5 (en), 1.6-1.7 (bn), 1.7-1.8 (ja). No italics in Bangla or Japanese.
- Localize dates, numbers and units. Chart and map labels must be translatable.
- Test the **longest label** in all three languages on every component.
- Machine-written Bangla and Japanese farming terms (rotation, fallow, soil moisture) are provisional. Mark them `// NEEDS-NATIVE-REVIEW` in the translation file.

## 8. Code standards

- TypeScript strict mode for the frontend and shared packages. Python (type hints, `ruff`, `mypy`) or the language the human chose for the API.
- Small, focused functions and components. No dead code, no commented-out blocks, no unexplained magic numbers.
- Scoring engine: pure functions, deterministic, fully unit tested. Include tests with the known example: water-first weights 8/3/4 rank the Mustard rotation first; income-first weights 3/8/4 rank the Wheat rotation first (using the sample ratings).
- Validate all external input at the API boundary (query parameters, coordinates, priority weights). Coordinates must be in valid ranges; weights must be non-negative numbers.
- Handle errors explicitly with typed error codes. Never swallow exceptions silently.
- Log with structured logs. Never log secrets or personal data.
- Keep functions free of hidden global state so they can be tested and later moved to other services.

## 9. Testing and definition of done

A task is done only when all of these are true:

- [ ] Code compiles and lints cleanly
- [ ] Unit tests added or updated and passing (scoring engine and API logic always need tests)
- [ ] UI checked at 360 px and 1280 px, in English, Bangla and Japanese
- [ ] Loading, empty, error and offline states exist
- [ ] No invented data shown as real; sample data is labeled
- [ ] Accessibility basics pass (contrast, focus order, labels, 44 px targets)
- [ ] OpenAPI spec and docs updated if the API changed
- [ ] No secrets, no hotlinked assets, no unapproved dependencies

## 10. Workflow

1. **Plan before coding.** For any task larger than a small fix, state the plan and the files you will touch, then wait for approval.
2. Work in small steps and small commits. Use clear commit messages (`feat:`, `fix:`, `docs:`, `test:`, `refactor:`).
3. One concern per change. Do not mix refactors with features.
4. Do not edit files outside the task's scope. Do not reformat unrelated code.
5. When unsure about data, design or product behavior, **ask** instead of guessing.
6. After finishing, summarize what changed, what you tested, and what remains open.

## 11. Things agents must not do

- Do not add AI, chat, or text-generation features (the disabled admin AI registry is the only exception).
- Do not expose admin routes on the public API without role checks, or show secrets in the admin console.
- Do not fabricate data, citations, endpoints, statistics or partner claims.
- Do not hardcode secrets or commit `.env` files.
- Do not switch the backend to serverless or merge frontend and backend.
- Do not add heavy dependencies without approval (the app must stay light for low-bandwidth users).
- Do not bypass i18n by hardcoding text.
- Do not remove accessibility features to save time.


## 11a. Admin console rules

Full spec: `docs/ADMIN-SPEC.md`. These rules apply to everything under `apps/admin` and `/v1/admin/*`.

- The admin console is **separate from the public app**: own app, own subdomain, own login. Never mix admin and public routes or auth.
- **Server-side role checks on every admin route** (owner, developer, data editor, support, viewer). Deny by default. Never rely on hiding UI.
- **Multi-factor authentication is required.** Use an established auth provider or library. Never write a custom password system.
- **Never display, return or log a secret.** The database stores only a reference to a secret (secrets manager or platform store). API keys are stored as hashes and shown once at creation.
- **Every write is audited** (actor, action, target, before, after, time) through one shared function, in the same transaction. The audit log is append-only.
- **Crop and rotation values cannot be published without a source.** Values marked `sample` show the "Sample data" tag in the public app. Use draft, review, publish, with rollback.
- **Dangerous actions** (purge all cache, global maintenance, re-enable AI after kill switch, delete API key, change roles, publish to production, rotate production secrets) need the right role and an explicit confirmation.
- **AI registry stays disabled.** Master flag `ai.enabled` is off, a kill switch exists, and no code path may call a model. Do not build the AI test console or prompt tools until the human says so.
- Keep staging and production fully separate (databases, keys, admin accounts).
- Admin UI follows `DESIGN-RULES.md` for tokens, contrast and accessibility. Plain tables and forms are acceptable.
- Add tests for role checks, audit entries, secret masking and "AI disabled".

## 12. Open items (confirm with the human before relying on them)

- Exact endpoints and response format of the existing data gateway
- Final backend language and framework (Python FastAPI suggested)
- Hosting providers and budget
- Source of the crop trait table
- Final logo, domain and code license
- Admin login provider, admin hosting and first admin users