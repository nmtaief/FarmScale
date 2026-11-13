# FarmScale: Design Rules

The rules every designer, developer and AI agent follows when building FarmScale screens. It extends the approved "Agro-Scientific Tactile" visual style and applies the review fixes (honest data, farmer-friendly language, mobile first, three languages).

**Conflict rule:** if this file and an older mockup disagree, this file wins. If this file and `AGENTS.md` disagree, ask the human.

---

## 1. Principles

1. **Honest first.** Never show a number that is not real or clearly labeled as sample.
2. **Answer first, evidence second.** Lead with the plain-language result, then show why.
3. **Farmer first.** Plain words, large targets, light pages. Technical depth is available, never forced.
4. **Calm and grounded.** Warm, scientific, trustworthy. Not a generic corporate dashboard, not a flashy AI product.
5. **Accessible by default.** Contrast, targets, text alternatives and keyboard use are requirements, not polish.
6. **Light and fast.** The app must work on a mid-range Android phone with a weak connection.

---

## 2. Color

### Brand tokens

| Token | Hex | Meaning and use |
|---|---|---|
| `forest` | `#14291F` | Text, dark surfaces, deep borders |
| `sage` | `#F3F7F0` | Page background |
| `white` | `#FFFFFF` | Card surfaces |
| `gold` | `#D9A21B` | Primary action fill, active selection |
| `leaf` | `#2F7D4F` | Growth, soil, vegetation (NDVI), good fit |
| `water` | `#2E7DA6` | Rain, moisture, irrigation, water saving |
| `heat` | `#C2472D` | Heat, drought, warnings, risk |
| `muted` | `#4B6357` | Secondary text |

### Semantic meaning (never swap)

- **Blue** = water. **Red** = heat or risk. **Green** = soil and growth. **Gold** = the main action or the current selection.
- Every status color is paired with an **icon or text label**. Color alone never carries meaning.

### Contrast rules (WCAG AA: 4.5:1 for normal text, 3:1 for large text and UI shapes)

Measured on the light theme:

| Use | Colors | Ratio | Allowed for |
|---|---|---|---|
| Body text | forest on sage | 14.2 | All text |
| Button label | forest on gold | 6.7 | All text |
| Secondary text | muted on sage | 6.0 | All text |
| Green text | leaf on sage / white | 4.7 / 5.0 | Text and UI |
| Red text | heat on sage / white | 4.6 / 5.0 | Text and UI |
| White on fill | white on leaf / heat / water | 5.0 / 5.0 / 4.6 | Text on filled chips and buttons |
| Blue text on sage | water on sage | **4.2** | **Large text and graphics only** |
| Blue text on white | water on white | 4.6 | Text and UI |
| Gold as text | gold on sage | **2.1** | **Never use gold as text on light backgrounds** |

Rules that follow:
- **Gold is a fill, not a text color** on light backgrounds. Text on gold is always `forest`.
- For blue **body text on sage**, use the darker text variant `water-text` = `#256B8F` (5.4 on sage). Keep `#2E7DA6` for charts, icons and fills.
- For gold-toned text (rare, for example "Target" labels), use `gold-text` = `#7A5900` (6.0 on sage, 6.5 on white).
- Always verify new color pairs with a contrast checker before use.

### Dark theme

Support light and dark. Dark values: background `#0C1812`, card `#15281E`, text `#E8F0E4`, muted `#9DB3A5`, line `#28402F`, gold `#E3B23C`, leaf `#5BB27B`, water `#5BB0D8`, heat `#E8735A`. All of these pass 4.5:1 on the dark background (measured 6.1 to 15.6). Use `prefers-color-scheme` plus a manual toggle.

---

## 3. Typography

| Role | Font | Notes |
|---|---|---|
| Headings, big statements | Source Serif 4, weight 600 | Never for dense UI labels |
| Body and UI | Noto Sans | Default for all interface text |
| Bangla | Noto Sans Bengali | Same roles as Noto Sans |
| Japanese | Noto Sans JP (Noto Serif JP only for large headlines) | Never serif for body text |
| Numbers, coordinates, code | JetBrains Mono | Only for true data values, never for sentences |

### Scale

| Style | Mobile | Desktop | Line height |
|---|---|---|---|
| Display | 32 px | 48 px | 1.2 |
| Headline L | 24 px | 32 px | 1.25 |
| Headline M | 20 px | 24 px | 1.3 |
| Body | **16 px** | 16-18 px | 1.5 |
| Small | 14 px | 14 px | 1.45 |
| Label | 12 px (labels only) | 12-14 px | 1.35 |

Rules:
- **Body text is never below 16 px** on mobile. Nothing essential is below 14 px.
- 12 px is allowed only for non-essential labels such as tag names, never for values a farmer needs to read.
- Line length: 65-75 characters for paragraphs.
- Line heights by language: English 1.5, Bangla 1.6-1.7, Japanese 1.7-1.8 (at least +4 px over English).
- **No italics** in Bangla or Japanese. Use weight or color for emphasis.
- Load fonts as subsets with `font-display: swap`. Provide fallback stacks.
- Do not use all caps or letter spacing on Bangla or Japanese text.

---

## 4. Spacing, grid and shape

- **8 px base unit.** Allowed steps: 4, 8, 16, 24, 40, 64, 96.
- **Grid:** 12 columns desktop (24 px gutters, 40 px margins), 8 columns tablet (16 px / 24 px), 4 columns mobile (16 px / 16 px).
- **Breakpoints:** 360 (mobile base), 768 (tablet), 1280 (desktop). Max content width about 1200 px, centered.
- **Radius:** 8 px (buttons, inputs, tags), 16 px (cards), 24 px (panels, sheets, modals), full (chips, slider thumbs, ring).
- **Elevation:** page is flat. Cards use a 1 px border `rgba(20,41,31,0.08)` and a soft shadow. Raised or active states use a larger soft shadow. Modals use a 40% forest overlay with an opaque white sheet.
- Space between sections is larger than space inside cards (sections 64-96 px, card padding 16-24 px).
- Card heights are equal within a row. No orphan cards.

---

## 5. Layout rules

### Placement
- **One primary action per screen**, placed at the top of the content on desktop and in the lower thumb zone on mobile.
- Order content: answer, then evidence, then technical detail behind an expand control.
- Keep the same element in the same place on every screen: language switcher, location chip, primary button, source labels.
- One slim header only. No stacked top bars and no status ticker. At most 4 top-level navigation items; the rest go in "More".

### Mobile (360 px)
- Single column. **Bottom tab bar** (Home, Explore, Plan, Crops, More), 56 px high, with safe-area padding.
- Sticky primary action above the tab bar when a clear next step exists.
- Filters, "Why this rotation" and technical detail open in **bottom sheets**.
- The rotation ring becomes a swipeable three-season selector with dots.
- Charts are full width with direct labels and at most 4 series. Tables become stacked key-value rows.
- No horizontal scrolling, except deliberate carousels with a visible peek of the next item.

### Tablet (768 px and up)
- 8-column grid. Side rail drops below the content or becomes collapsible. Top navigation replaces the bottom tab bar from about 900 px.

### Desktop (1280 px and up)
- **Dashboard:** 8-column main area, 4-column sticky right rail.
- **Planner:** 4-column sticky slider panel on the left, 8-column ranked cards on the right.
- **Crop Library:** 3-column collapsible filters, card grid of 2-3 columns.
- **Landing:** text left, rotation ring right, then at most 3 short sections.

---

## 6. Components

All components exist in light and dark themes and need these states: default, hover, focus, active, disabled, loading and error, where they apply.

### Buttons
- **Primary:** gold fill, forest text, weight 600. Pressed state is a deeper amber `#C28F13` and moves 1 px. One primary button per view.
- **Secondary:** white fill, 1.5 px leaf border, leaf text.
- **Ghost:** no fill, forest text, underline on hover. For exports and citations.
- **Disabled:** reduced opacity plus a tooltip or label explaining why (for example "Coming soon").
- Minimum size 44 x 44 px. Visible focus ring 3 px (gold outline with 2 px offset).

### Data card (the core component)
Required parts: a plain-language statement (headline), one simple chart, **exactly one source label**, a **"Last updated"** line, and a data-state tag.

| State | Treatment |
|---|---|
| Live | Value, source label, update time |
| Sample | Visible **"Sample data"** tag. Value is styled as placeholder |
| Unavailable | Short explanation, nearby alternatives, no empty chart |
| Stale | "Data may be old" note and a refresh action |
| Loading | Skeleton of the same shape |
| Error / rate limited | Plain message, Retry. Error code only in Expert view |

Simple view shows the statement and one chart. Expert view adds technical terms (with tooltips), raw values behind an expand control, and full source details.

### Priority sliders
Three sliders: **Save water, Earn income, Rebuild soil**. Range 0-10. Friendly labels, a visible value, and a 44 px thumb. Moving a slider re-ranks the cards with a short animation (under 300 ms). If all are zero, prompt the user to choose a priority. Sliders are keyboard operable with arrow keys.

### Rotation card
Rank, rotation name (three crops in season order), a score, a season timeline bar, "Why this rotation" (expandable), and a disabled "Ask about this recommendation" button. The top card is visually emphasized with gold. Scores and reasons come from the scoring engine only.

### Season selector (rotation ring)
Three arcs for the seasons: Kharif-1 (pre-monsoon), Kharif-2 (monsoon), Rabi (winter). Drawn as SVG. Desktop: interactive ring. Mobile: swipeable segmented selector. Season names are translated.

### Language switcher
Always visible in the header. Options: English, বাংলা, 日本語, each written in its own script. Keeps location and priorities after switching. Uses the `lang` attribute and a route prefix.

### Other components
Bottom tab bar, bottom sheet (drag handle, close button, focus trap), status tag, tooltip (also opens on tap), skeleton loader, offline banner, search box with suggestions, filter chip, table-as-text fallback for charts.

### Reserved AI slot (disabled)
A collapsed assistant panel and the "Ask about this recommendation" button, both showing "Coming soon". They never call a service and never display generated text.

---

## 7. Data visualization

- Simple charts only: line, bar, and small progress or range bars. No decoration, no 3D.
- **Direct labels** on lines and bars. Avoid legends when possible; maximum 4 series.
- Use the semantic colors (blue water, red heat, green vegetation). Use pattern or label as well, never color alone.
- Every chart has a text alternative and a **"View as table"** option.
- Axis and value labels are real text (not images) so they can be translated.
- Show the unit with the value, localized (mm, °C, days).
- Compare against a clear baseline (for example the long-term average) and name it.
- Empty or partial data is shown as such. Never draw a chart from placeholder data without the Sample tag.

---

## 8. Content and tone

- **Plain language.** Write for a farmer: short sentences, everyday words. Prefer "Rain starts later than it used to" over technical phrasing.
- Technical terms (for example evapotranspiration, NDVI, root zone) appear in Expert view or behind a tooltip, with a one-line explanation.
- Name the source on every data card (for example "Source: NASA POWER").
- **Do not write** unprovable claims: "validated by", "certified", partner names, accuracy figures, success rates, version marketing, or "AI-powered".
- Honest limits are good copy: "Data is for a 50 km area" or "Soil moisture data starts in 2015".
- Buttons start with a verb: "See rotations", "Open dashboard". Keep labels short.
- Copy tone: calm, respectful, never alarmist. Warnings state the risk and a next step.
- All text lives in translation files. No text inside images.

---

## 9. Languages

- Locales: English, Bangla, Japanese. Test every screen in all three.
- **Text length:** Bangla is often longer than English, Japanese is shorter but wider. Components must not break. Test the longest label on every button, tab, chip, chart label and card.
- Japanese: allow natural line breaks, avoid a single character alone on a line, use full-width punctuation as appropriate.
- Localize dates (for example 2026年10月26日), numbers and units.
- Farming terms (rotation, fallow, soil moisture) need native-speaker review before launch. Machine translation is provisional.
- Layout must not depend on English word order or length. Avoid fixed-width containers for text.

---

## 10. Motion

- Short and purposeful: 150-300 ms for state changes, such as re-ranking cards and opening a sheet.
- No autoplay or looping decorative animation.
- Respect `prefers-reduced-motion` by removing movement and keeping instant state changes.
- Loading uses skeletons, not spinners over blank pages.

---

## 11. Accessibility checklist (applies to every screen)

- [ ] Text contrast at least 4.5:1 (3:1 for large text and UI shapes)
- [ ] Touch targets at least 44 x 44 px with at least 8 px between them
- [ ] Body text at least 16 px on mobile
- [ ] Full keyboard use, logical focus order, visible focus ring
- [ ] Labels for every input and icon button. Screen-reader text for charts
- [ ] Color never the only signal
- [ ] Correct `lang` attribute per page and per language switch
- [ ] Works at 200% zoom with no loss of content
- [ ] Reduced motion respected
- [ ] Bottom sheets and menus trap focus and close with Escape

---

## 12. Performance rules

- Show page structure immediately with skeletons. Load charts and the map **after** the main content (lazy loading).
- SVG for the ring and icons. No large photos and no autoplay media.
- Keep the first mobile screen light (target under about 150 KB of design assets, excluding fonts).
- **All assets are local.** No hotlinked images and no CDN-loaded styling in production.
- Font subsets per script. Avoid loading all weights.
- Cache-friendly: show "Last updated" on data, and an "Offline: showing saved data" state.

---

## 13. Handoff requirements

- Export tokens as CSS variables and a Tailwind config (`packages/ui-tokens`), light and dark.
- Component list with all states: data card (live, sample, unavailable, stale, loading, error), priority slider, rotation card, season selector, language switcher, bottom tab bar, bottom sheet, status tag, tooltip.
- Frames for mobile (360), tablet (768) and desktop (1280) in English, Bangla and Japanese, plus a longest-text stress test.
- Spacing and behavior notes for sticky elements.

---

## 14. Do and don't

| Do | Don't |
|---|---|
| Lead with a plain-language answer | Open with technical telemetry or version badges |
| Label sample data clearly | Show realistic made-up numbers |
| Use gold as a button fill with forest text | Use gold text on light backgrounds |
| Pair every color status with an icon or label | Depend on red and green alone |
| Use bottom sheets on mobile | Use side panels or tiny modals on mobile |
| Show one source and one update time per card | Stack several source badges or hide the date |
| Keep one primary button per view | Place several competing gold buttons |
| Keep AI slots disabled and labeled | Show AI chat, agronomist cards or generated advice |
| Test Bangla and Japanese early | Design in English only and translate later |
