# FarmScale: User Flows

This file describes how each type of user moves through FarmScale. The diagrams use Mermaid, which renders in GitHub, GitLab, Notion, VS Code (with a Mermaid extension) and most documentation tools.

**Scope of this version:** no AI features. The assistant slot and the "Ask about this recommendation" button are visible but disabled ("Coming soon").

**Public screens:** Landing, Location Explorer, Climate and Soil Dashboard, Rotation Planner, Crop Library, Data Gateway page.
**Internal:** Admin console (separate app, see Flow D).

---

## 1. Map of all screens

```mermaid
flowchart LR
    L[Landing] --> E[Location Explorer]
    L --> C[Crop Library]
    E --> D[Climate and Soil Dashboard]
    D --> P[Rotation Planner]
    P --> C
    C --> P
    E --> P
    M[More menu] --> G[Data Gateway page]
    M --> S[Settings and language]
    L --> M
```

Navigation: bottom tab bar on mobile (Home, Explore, Plan, Crops, More). Top navigation on tablet and desktop. The Data Gateway page lives under "More".

---

## 2. Flow A: Farmer (primary flow)

**Goal:** find my field, understand what the climate is doing, and get rotation options that fit my priorities.
**Device:** mid-range Android phone, unstable internet.
**Success:** within about 60 seconds the farmer sees a top recommendation and understands why.

```mermaid
flowchart TD
    A([Open FarmScale]) --> B{Language saved?}
    B -- No --> B1[Suggest language from browser: English, Bangla or Japanese]
    B1 --> C
    B -- Yes --> C[Landing page]
    C --> D[Search or tap location]
    D --> E{Location found?}
    E -- No --> E1[Show suggestions and map option]
    E1 --> D
    E -- Yes --> F[Location summary sheet]
    F --> G{Data available?}
    G -- Yes --> H[Simple dashboard: plain-language cards]
    G -- Partial --> H1[Dashboard with Unavailable tags on missing cards]
    H1 --> H
    G -- No --> G1[No-data message and nearby locations]
    G1 --> D
    H --> I[Tap See rotations]
    I --> J[Planner with priority sliders: Save water, Earn income, Rebuild soil]
    J --> K[Adjust sliders]
    K --> L[Ranked top 3 rotations re-rank live]
    L --> M[Open Why this rotation]
    M --> N[Evidence: data signals and sources]
    N --> O{Next step}
    O -- Correct my soil values --> O1[Override soil and field values] --> L
    O -- Compare crops --> O2[Crop Library] --> L
    O -- Save or share --> O3[Save result or export sheet]
    O -- Done --> P([Finish])
```

**Key screens and what the farmer sees**

| Step | Screen | What happens |
|---|---|---|
| 1 | Landing | One headline, a location search box, the rotation ring, three trust points |
| 2 | Explorer | Map or search. Selecting a place opens a bottom sheet with 3-4 summary cards |
| 3 | Dashboard (Simple) | One plain sentence per card, one chart, one source label and update time |
| 4 | Planner | Three sliders. Ranked cards update live with a short animation |
| 5 | Why this rotation | The data signals behind the rank, in plain language |
| 6 | Optional | Override soil values, browse crops, save or share |

---

## 3. Flow B: Extension officer

**Goal:** advise many farmers quickly, compare locations, and explain recommendations.
**Device:** laptop or tablet. Uses Expert view.

```mermaid
flowchart TD
    A([Open FarmScale]) --> B[Landing or Explorer]
    B --> C[Search location]
    C --> D[Dashboard]
    D --> E[Switch to Expert view]
    E --> F[Inspect data cards: trends, sources, update times]
    F --> G[Open technical detail and tooltips]
    G --> H[Go to Planner]
    H --> I[Set priorities for this farmer]
    I --> J[Review ranked rotations and evidence]
    J --> K{Adjust inputs?}
    K -- Yes --> K1[Override soil or field values] --> J
    K -- No --> L[Export or print advice sheet]
    L --> M{Another farmer or location?}
    M -- Yes --> C
    M -- No --> N([Finish])
```

Notes: Expert view shows technical terms with tooltips, raw values behind expand controls, and sources. The Simple view stays available so the officer can show it to the farmer.

---

## 4. Flow C: Developer or partner (data gateway)

**Goal:** get an API key and fetch climate, soil and crop data for a location.

```mermaid
flowchart TD
    A([Open More menu]) --> B[Data Gateway page]
    B --> C[Read endpoint list and examples]
    C --> D{Have an API key?}
    D -- No --> E[Request or create key] --> F[Key shown once, with copy button]
    D -- Yes --> F
    F --> G[Copy example request]
    G --> H[Run request in own tool]
    H --> I{Response status}
    I -- 200 OK --> J[Read data: codes and numbers, source, updated time]
    I -- Rate limited --> K[Show limit info and retry time] --> H
    I -- Error --> L[Show error code and fix hint] --> G
    J --> M([Build integration])
```

Rules reflected here: the API is versioned (`/v1/...`), returns codes and numbers rather than sentences, and every response includes its source and an update time.

---

## 4b. Flow D: Developer or maintainer (admin console)

**Goal:** keep the platform healthy and keep data and settings up to date. Internal only, on a separate subdomain. Full spec: `ADMIN-SPEC.md`.

```mermaid
flowchart TD
    A([Open admin subdomain]) --> B[Sign in with MFA]
    B --> C[Overview: health, errors, recent changes]
    C --> D{Task}
    D -- Gateway --> E[Endpoints, upstream sources, cache, prefetch]
    D -- Data --> F[Crop and rotation editor: add source, save draft]
    D -- Access --> G[API keys, users, roles]
    D -- Settings --> H[Feature flags, site settings, translations, feedback]
    D -- AI registry --> I[View integrations: disabled, kill switch ready]
    F --> F1[Preview ranking] --> F2[Review and publish]
    E --> J{Risky action?}
    G --> J
    H --> J
    J -- Yes --> K[Confirm with role check] --> L[Save]
    J -- No --> L
    F2 --> L
    L --> M[Audit entry written]
    M --> N([Done])
```

Rules reflected here: MFA, server-side roles, confirmation for dangerous actions, audit entry on every write, sources required for crop values, and the AI registry kept disabled.

---

## 5. Priority sliders and ranking (detail)

```mermaid
flowchart LR
    A[Location data: climate, soil] --> D[Scoring engine]
    B[Crop traits: water need, heat tolerance, legume] --> D
    C[Farmer priorities: water, income, soil] --> D
    D --> E[Ranked rotations with scores]
    E --> F[Top 3 cards]
    E --> G[Explanation codes]
    G --> H[Why this rotation: plain-language reasons with data signals]
```

Behavior: moving a slider recalculates the ranking immediately. If a data input is unavailable, the card shows an Unavailable tag and the engine states which inputs it used.

---

## 6. Data states (every data card)

```mermaid
stateDiagram-v2
    [*] --> Loading
    Loading --> Live: Gateway returns data
    Loading --> Unavailable: No data for this place
    Loading --> Error: Request failed
    Loading --> RateLimited: Too many requests
    Live --> Stale: Data older than expected
    Error --> Loading: Retry
    RateLimited --> Loading: Retry after wait
    Live --> Offline: Connection lost
    Offline --> Live: Back online, refresh
    Stale --> Loading: Refresh
```

| State | What the user sees |
|---|---|
| Loading | Skeleton placeholder for the card |
| Live | Value, one source label, "Last updated" time |
| Sample | Value with a visible "Sample data" tag (design and demo only) |
| Unavailable | Short plain explanation and nearby alternatives |
| Stale | Value with a "Data may be old" note and a refresh action |
| Error | Plain message, error code in Expert view, Retry button |
| Rate limited | Message with a wait time |
| Offline | "Showing saved data" banner and the last known values |

---

## 7. Language switching flow

```mermaid
flowchart TD
    A([Any screen]) --> B[Tap language switcher: English, Bangla, Japanese]
    B --> C[Route changes to /en, /bn or /ja]
    C --> D[Same screen and same data in new language]
    D --> E{Translation missing?}
    E -- Yes --> F[Show English text for that item]
    E -- No --> G[Show translated text]
    D --> H[Save choice for next visit]
```

Notes: the location, priorities and results stay as they were after a language change. Dates, numbers and units are localized.

---

## 8. Reserved AI slot (not active in this version)

```mermaid
flowchart LR
    A[Why this rotation] --> B[Ask about this recommendation: disabled, Coming soon]
    C[Assistant panel: collapsed, Coming soon] --> D[No action in this version]
```

These are visual placeholders only. They must not call any AI service.

---

## 9. Decision points and edge cases

| Situation | Expected behavior |
|---|---|
| User denies location permission | Fall back to search and map selection |
| Location outside supported data coverage | Say what is missing and suggest the nearest supported location |
| Slow or lost connection | Show skeletons, then saved data with an "Offline" note |
| User sets all sliders to zero | Show a gentle prompt to choose at least one priority, or use equal weights and say so |
| User overrides soil values | Re-rank immediately and mark the result "Using your values" |
| Gateway rate limit reached | Show wait time, keep the last result visible |
| Unsupported language string | Show English and keep the app usable |

---

## 10. Success measures

| Measure | Target |
|---|---|
| Time from landing to first recommendation | About 60 seconds or less, without help |
| Farmer can say why the top rotation was chosen | Yes, from the "Why this rotation" text alone |
| Task completion on slow mobile connection | Works with saved data and skeleton states |
| Language switch keeps context | No lost location or priorities |