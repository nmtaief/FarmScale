---
name: Agro-Scientific Tactile
colors:
  surface: '#e8fff0'
  surface-dim: '#c7e0d0'
  surface-bright: '#e8fff0'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#e1faea'
  surface-container: '#dbf4e4'
  surface-container-high: '#d5eede'
  surface-container-highest: '#d0e8d9'
  on-surface: '#0a1f16'
  on-surface-variant: '#4f4534'
  inverse-surface: '#20352a'
  inverse-on-surface: '#def7e7'
  outline: '#817662'
  outline-variant: '#d3c5ae'
  surface-tint: '#7a5900'
  primary: '#7a5900'
  on-primary: '#ffffff'
  primary-container: '#d9a21b'
  on-primary-container: '#533b00'
  inverse-primary: '#f8bd39'
  secondary: '#1a6c40'
  on-secondary: '#ffffff'
  secondary-container: '#a1f1b9'
  on-secondary-container: '#207044'
  tertiary: '#00658d'
  on-tertiary: '#ffffff'
  tertiary-container: '#6bb3df'
  on-tertiary-container: '#004460'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdea3'
  primary-fixed-dim: '#f8bd39'
  on-primary-fixed: '#261900'
  on-primary-fixed-variant: '#5d4200'
  secondary-fixed: '#a4f4bc'
  secondary-fixed-dim: '#89d7a1'
  on-secondary-fixed: '#00210e'
  on-secondary-fixed-variant: '#00522c'
  tertiary-fixed: '#c6e7ff'
  tertiary-fixed-dim: '#87cffc'
  on-tertiary-fixed: '#001e2d'
  on-tertiary-fixed-variant: '#004c6b'
  background: '#e8fff0'
  on-background: '#0a1f16'
  surface-variant: '#d0e8d9'
typography:
  display-lg:
    fontFamily: Source Serif 4
    fontSize: 48px
    fontWeight: '600'
    lineHeight: 56px
  display-lg-mobile:
    fontFamily: Source Serif 4
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  headline-lg:
    fontFamily: Source Serif 4
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  headline-lg-mobile:
    fontFamily: Source Serif 4
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: Source Serif 4
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-sm:
    fontFamily: Source Serif 4
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Noto Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Noto Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Noto Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-lg:
    fontFamily: Noto Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
  label-md:
    fontFamily: Noto Sans
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
  metric-num:
    fontFamily: JetBrains Mono
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 24px
  metric-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-mobile: 1rem
  margin: 2.5rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

The design system embodies grounded agricultural science, precision geospatial intelligence, and warm human stewardship. It bridges complex NASA POWER satellite telemetry with intuitive agronomic operations, communicating authoritative insight without academic friction or detached corporate sterility.

The visual style blends modern technical clarity with organic warmth:
- **Scientific Naturalism:** Deep organic greens paired with crisp, evidence-driven data metrics and clear territorial maps.
- **Tactile Utility:** Micro-interactions mimic field instrumentation—positive detents on season selectors, weighted sliders for rainfall and moisture modeling, and physical card surfaces.
- **Editorial Legibility:** Multi-script typographic harmony that honors localized seasonal calendars (Kharif-1, Kharif-2, Rabi) across international farming communities, development officers, and agronomy researchers.
- **Human Warmth & Urgency:** Mellow grain tones provide affirming action points, while precise moisture blues and thermal reds deliver urgent, readable environmental stress diagnostics.

## Colors

The palette balances agrarian warmth, living soil vigor, and satellite meteorological signals against an atmospheric, readable background.

- **Primary (`#D9A21B` - Grain Gold):** Reserved for primary decision triggers, confirmations, active rotation selections, and high-impact agronomic CTAs. Yields high contrast against deep forest text.
- **Secondary (`#2F7D4F` - Leaf Green):** Represents healthy vegetative index (NDVI), canopy cover, optimal crop rotation periods, and positive soil biological balance.
- **Tertiary (`#2E7DA6` - Water Blue):** Dedicated to precipitation models, evapotranspiration indices, irrigation cycles, and moisture telemetry.
- **Neutral (`#14291F` - Deep Forest):** Replaces pure black for all structural typography, deep borders, and primary card framing to maintain an organic, grounded base.
- **Canvas Base (`#F3F7F0` - Soft Sage):** The foundation canvas color. Reduces eye strain during field daylight use and anchors high-density data visualizations.
- **Warning & Stress (`#C2472D` - Heat Red):** Signals thermal stress, crop failure risk, drought anomalies, and frost damage alerts.

## Typography

The type hierarchy creates balanced authority and cross-cultural clarity:

- **Source Serif 4** provides an editorial, grounded foundation for seasonal titles, rotation cycles, and overarching agro-climatic synthesis statements.
- **Noto Sans** handles all core interface elements, narrative field guidance, and universal body text. Its broad language coverage natively bridges English, Bengali (Noto Sans Bengali), and Japanese (Noto Sans JP) without visual degradation or baseline shifts.
- **JetBrains Mono** surfaces satellite coordinates, NASA POWER solar radiation numbers ($MJ/m^2/day$), temperature ranges, precipitation millimeters, and timestamp identifiers.

For non-Latin scripts, maintain line-height values at an extra `+4px` minimum above the English baseline to accommodate diacritics and complex script ascenders/descenders.

## Layout & Spacing

The layout is built around a responsive 12-column adaptive fluid grid that transforms down to a 4-column stack on handheld mobile devices.

- **Desktop (1280px+):** 12 columns, 24px (`1.5rem`) gutters, and 40px (`2.5rem`) outer canvas margins. Complex layouts place the Three-Season Rotation Wheel in an 8-column primary stage, flanked by a 4-column contextual NASA climate summary rail.
- **Tablet (768px - 1279px):** 8 columns, 16px (`1rem`) gutters, and 24px (`1.5rem`) margins. Multi-metric tables fold into vertically stacked split cards.
- **Mobile (< 768px):** 4 columns, 16px (`1rem`) gutters, and 16px (`1rem`) margins. Rotation rings reflow into a linear, swipeable seasonal dial or tabbed segment.

Vertical rhythm follows a strict 8px base unit. Internal component spacing uses `space-sm` (8px) for tightly grouped metadata and `space-md` (16px) for interior card padding.

## Elevation & Depth

Visual hierarchy uses physical material stratification rather than heavy digital drops:

- **Flat Natural Base:** Background rests cleanly at `#F3F7F0` without canvas-level shadow or gradient noise.
- **Surface Elevation (Level 1):** Primary white containers (`#FFFFFF`) receive an ultra-subtle organic border (`1px solid rgba(20, 41, 31, 0.08)`) and an ambient, warm soil-tinted diffuse shadow: `0 2px 8px -2px rgba(20, 41, 31, 0.06), 0 1px 3px 0 rgba(20, 41, 31, 0.04)`.
- **Raised & Active States (Level 2):** Hovered rotation nodes, active data callouts, and tactile sliders elevate with `0 8px 24px -4px rgba(20, 41, 31, 0.10), 0 2px 6px -1px rgba(20, 41, 31, 0.04)`.
- **Modal & Dial Overlays (Level 3):** Seasonal deep-dive drawers and satellite inspectors use a backdropped translucent mask (`rgba(20, 41, 31, 0.40)`) with a crisp, opaque `#FFFFFF` surface sheet.

## Shapes

The interface balances biological softness with structural precision using a balanced rounding scale:

- **Base Radius (0.5rem / 8px):** Standard buttons, text inputs, telemetry metric badges, and seasonal segment pills.
- **Large Radius (1rem / 16px):** Evidential data cards, NASA POWER summary blocks, and rotation ring tooltips.
- **Extra-Large Radius (1.5rem / 24px):** Container panels and full-screen modal overlays.
- **Circular (9999px):** Seasonal rotation ring rings, slider thumbs, status indicators, and language-switch toggles.

## Components

### Buttons
- **Primary:** Background in Grain Gold (`#D9A21B`), text in Deep Forest (`#14291F`), font weight 600. Pressed state compresses by 1px with a deeper amber tone (`#C28F13`).
- **Secondary:** Surface `#FFFFFF` with a crisp `1.5px solid #2F7D4F` border and Leaf Green text.
- **Ghost/Tertiary:** No background, Deep Forest text, subtle underline on hover for academic citations and raw data exports.

### Three-Season Rotation Ring Motif
- Interactive radial control divided into three continuous segments: **Kharif-1** (Pre-monsoon/Summer), **Kharif-2** (Monsoon), and **Rabi** (Winter).
- Active season expands dynamically by 4px radial thickness with a distinct color indicator (Leaf Green for active cover, Grain Gold for harvest-ready, Water Blue for flood/fallow).
- Center hub contains aggregate soil depletion and cumulative moisture retention calculations.

### Evidential NASA POWER Cards
- Built on a solid white surface with a top accent bar (2px) color-coded to the data domain (Water Blue for precipitation, Heat Red for solar thermal anomalies).
- Header presents the plain-language agricultural deduction first (e.g., *"Favorable sowing moisture window detected"*), followed by monospaced technical telemetry below (`PRECTOTCORR: 12.4 mm/day`).

### Tactile Sliders
- Designed with high-density physical metaphors: a wide 8px track using an organic sage inset, with marked seasonal detents.
- Slider thumb is a 24px circular white dial with a tactile center dot and physical shadow, providing responsive feedback when scrubbing through 30-year historical climate baselines.

### Multi-Language Switcher
- Segmented control displaying native script identities: `English`, `বাংলা`, and `日本語`.
- Active segment transitions cleanly without layout jumping, accounting for character height differences with fixed label line bounds.

### Input Fields & Checkboxes
- **Inputs:** Clean white interior, `1px solid rgba(20, 41, 31, 0.20)` border, focusing to a solid 2px Leaf Green ring with zero offset.
- **Checkboxes & Radios:** Custom 20px inputs with Leaf Green active fills and high-contrast white glyphs.