# angeronia.com — SLDS 2 redesign plan

**Status: IMPLEMENTED (2026-09-04).** This document is kept as the historical
hand-off. The live documents are `docs/design-system/DESIGN-RULES.md` (the
binding contract) and `docs/design-system/DECISIONS.md`, whose §4 records what
each acceptance criterion actually produced and where the implementation
deviated (ADR-001 … ADR-011). Where this plan and DECISIONS.md disagree,
DECISIONS.md is what shipped.
**Written:** 2026-09-04. **Rev 2 (same day):** Cosmos is *extended* with an
Angeronia theme layer whose accent is Code Socratic's teal; Salesforce icons,
illustrations and trademarks are removed from scope; icons come from IBM
Carbon (the set Code Socratic already uses). **Rev 3 (final, same day):**
typography = IBM Plex Sans + Plex Mono (O11); logo re-tinted to teal (O10);
every remaining open decision closed with its recommended default except O7
(licensing acceptance, the user's call). This revision is the hand-off:
implement §8 in order.
**Audience:** the agents/engineers who will implement it, phase by phase.
**Scope:** replace the current "citron-on-paper editorial" design with the
Salesforce Lightning Design System 2 (SLDS 2) — Cosmos theme extended by an
Angeronia brand layer — stand up a Storybook that becomes the single source
of truth for UI, and make SLDS 2 the non-negotiable core of all future
design work on this repo.

Facts below were verified on 2026-09-04 against npm, GitHub,
lightningdesignsystem.com and `../code-socratic`. Re-verify versions before
installing.

---

## 0. TL;DR — decisions already made by this plan

| # | Decision | Why |
|---|----------|-----|
| D1 | Consume **`@salesforce-ux/design-system-2`** (npm, v2.264.1, "Summer '26") — *not* the archived GitHub repo, *not* SLDS 1 (`@salesforce-ux/design-system`). | The GitHub repo the user linked (`salesforce-ux/design-system`) is **archived / read-only** (last push 2026-06-02); it is the SLDS 1 Sass source with a Storybook 5. SLDS 2 is published only as an npm dist (its monorepo is private). |
| D2 | Theme = **Cosmos + an Angeronia theme layer** (`app/theme.angeronia.css`) that swaps the brand/accent reference palette to **Carbon Teal** (Code Socratic's accent: Teal 60 light / Teal 40 dark) and re-tints the handful of semantic hooks Cosmos hard-codes in blue. Light + dark + system via `color-scheme`. | The user asked to extend the theme with Code Socratic's teal. SLDS 2's own architecture reserves value assignment for the *theme layer* ("value assignment is reserved for theming tools"), so a theme file is the sanctioned place. Luminance-matched mapping keeps every Cosmos contrast pairing (§2.8). |
| D3 | Framework stays **Next.js App Router + React 19 + TypeScript**; SLDS 2 CSS is consumed as plain CSS with SLDS class names ("component blueprints"), wrapped in thin React components. | SLDS 2's *Lightning Base Components* are LWC-only. Blueprints are explicitly for "external applications or environments where Salesforce's Lightning Component framework isn't available" — this site. |
| D4 | **Storybook 10.x with `@storybook/nextjs-vite`** is the design source of truth: every UI component ships with stories; pages are composed only from storied components. | Requested; matches how Salesforce ships SLDS 2 (their dist is built from Storybook 10) and how Code Socratic works (`pnpm --filter @repo/web storybook`). |
| D5 | **Remove** everything not expressible in SLDS 2: rough.js Möbius canvas, scroll-scrubbed continuity line / process rail / meter graph, scroll spine, enter-reveals, Noir theme + grain, citron UI palette, hard "block" shadows, 0–2 px radii, Google fonts, Tailwind + tw-animate-css. | §4 audit maps each to the guideline it violates. |
| D6 | The Angeronia **logo mark** (disc + cursor) is kept as a brand SVG and **re-tinted to teal** (decided 2026-09-04, was O10): disc = `--slds-g-color-accent-container-1` (Teal 60 in both schemes), cursor = `--slds-g-color-on-accent-1`; the faceted favicon `app/icon.svg` is re-mapped onto the Carbon teal ramp at equal OKLab lightness; the raster logos in `public/` are regenerated from the SVG. Citron leaves the repo entirely. See §2.8.6. | Matches Code Socratic's teal Möbius favicon; one accent across the family. |
| D7 | Global hooks (`--slds-g-*`), shared hooks (`--slds-s-*`) and reference hooks (`--slds-r-*`) are **referenced in components, never reassigned**. The **only** file allowed to assign them is `app/theme.angeronia.css`. | Hard rule from the Global Styling Hooks and Develop pages; the theme file is the one sanctioned exception. |
| D8 | Styles live in `.css` files (never inline `style={}`, never Tailwind) so **`@salesforce-ux/slds-linter`** can lint them in CI. | The linter is ESLint-based and reads `.css` / `.html` / `.js`, not TSX. |
| D9 | Install the Salesforce **AI development skills** (`forcedotcom/sf-skills`: `design-systems-slds-apply`, `design-systems-slds-validate`, `design-systems-slds2-migrate`, Apache-2.0) for every future agent session. | Official, Claude-Code-compatible; ship search scripts for hooks / blueprints / utilities so agents verify artifacts exist before using them. |
| D10 | **No Salesforce icons, illustrations, product assets or trademarks.** `@salesforce-ux/icons` (CC-BY-ND, Salesforce object/product/Einstein artwork) is not installed; the SLDS Illustration set, Global Header / Global Navigation chrome, Brand Band, Dynamic (Einstein) Icons, App Launcher, Welcome Mat, Trial Bar, Setup Assistant are out of scope; no attribution line, no "Salesforce" wording in the UI. Icons come from **`@carbon/icons-react`** (IBM Carbon, Apache-2.0), the set Code Socratic uses. | User request; keeps the two Angeronia properties on one icon language and one accent hue. SLDS class names (`slds-*`) are CSS identifiers, not trademark use; the SLDS 2 Terms of Use require no attribution. |
| D11 | **Typeface = IBM Plex Sans (300/400/600/700) + IBM Plex Mono (400)**, self-hosted through `next/font/google` and assigned to `--slds-g-font-family-base` / `--slds-g-font-family-monospace` in the theme layer (block C, §2.8.7). Decided 2026-09-04 (was O11). | Brand-family consistency with Code Socratic (IBM Plex there); real 300/600 cuts on every OS; one mono family for code, tags and numerals. Costs ≈171 KB latin woff2 (measured) and a size-adjusted fallback to keep CLS at 0. SLDS 2 guidance prefers system fonts, but font family is a theme-layer value, so this is sanctioned theming, not a violation. |

§10 is the decision log; only O7 (licensing acceptance) is still the user's
to confirm. `CLAUDE.md` at the repo root points every future agent session
here.

---

## 1. Research findings (verified 2026-09-04)

### 1.1 Packages

| Package | Version | Published | License | Role in this plan |
|---------|---------|-----------|---------|-------------------|
| `@salesforce-ux/design-system-2` | 2.264.1 (`latest`) | 2026-08-08 | Salesforce **Terms of Use** (`LICENSE.txt`; non-OSI; royalty-free right to reproduce, derive, distribute; indemnification clause; "AS IS") | **The** SLDS 2 CSS. Required. |
| `@salesforce-ux/design-tokens` | 4.1.0 | 2026-08-08 | same Terms of Use | Token JSON/CSS (`dist/themes/cosmos/*.tokens.{css,flat.json,raw.json}`) — drives Foundations stories and the theme-parity test. |
| `@salesforce-ux/slds-linter` | 1.2.1 | 2026-03-05 | ISC | CI lint of CSS/HTML against SLDS 2 rules (`lint`, `report` → SARIF, `--fix`). Node ≥ 18.18. |
| `@carbon/icons-react` | 11.87.0 | current | **Apache-2.0** | Icon set (≈ 2 000 glyphs, 16/20/24/32 grids). Replaces `@salesforce-ux/icons`. |
| `@carbon/colors` | 11.57.0 | current | Apache-2.0 | devDependency for `scripts/build-theme.mjs` (source of the ten teal hexes); may be dropped once the ramp is committed with provenance comments. |
| `@salesforce-ux/icons` | 10.17.0 | 2026-06-25 | CC-BY-ND-4.0 | **Not used** (D10). |
| `@salesforce-ux/design-system` (SLDS 1) | 2.264.0 | 2026-08-10 | BSD-3-Clause | **Not installed** (ships Salesforce brand/icon assets). Blueprint *HTML* is read online from the archived repo `salesforce-ux/design-system/ui/components/**/*.html` or through the `design-systems-slds-apply` skill's `search-blueprints.cjs`. |
| `@salesforce-ux/sds-styling-hooks` | 1.1.0-alpha.4 | 2026-06-01 | BSD-3 | Deprecated `--sds-*` namespace — **never install**. |
| `@salesforce/design-system-react` | 0.10.65 | 2026-04 | BSD-3 | **Not used** — SLDS 1 only. |
| `forcedotcom/sf-skills` (GitHub) | — | active | Apache-2.0 | Agent skills; `npx skills add forcedotcom/sf-skills`. |
| `salesforce-ux/design-system-2-starter-kit` (GitHub) | 1.0.0 | 2026-08-21 | Apache-2.0 | Reference for a working SLDS 2 + Vite setup (LWC, not React). |
| `storybook`, `@storybook/nextjs-vite`, `@storybook/addon-a11y`, `@storybook/addon-docs`, `@storybook/addon-vitest`, `@storybook/addon-links` | 10.6.0 | — | MIT | Storybook. |
| `next` (repo) / latest | 15.5.12 / 16.3.4 | — | MIT | Stay on 15.x during the migration (O5). |

### 1.2 What is inside `@salesforce-ux/design-system-2/dist`

```
dist/
  css/bundled/  slds2.cosmos.css (997 KB)  slds2.lightning-blue.css
                slds2.scoped.cosmos.css    slds2.scoped.lightning-blue.css   (wrapped in .slds-scope)
  css/modular/  slds2.base.css (942 KB)    slds2.theme.cosmos.css (55 KB)   slds2.theme.lightning-blue.css
                slds2.scoped.base.css
  components/<name>/<name>.css              79 component folders, structure CSS only (+ *.deprecated.css, *.behavior.ts)
  components/utilities/*.css                reset, grid, layout, text, margin, padding, box, borders, color,
                                            alignment, position, sizing, floats, visibility, print, truncate,
                                            lineClamp, hyphenation, interactions, scrolling, mediaObject,
                                            verticalList, horizontalList, descriptionList, nameValueList, darkMode
  README.md  CHANGELOG.md  LICENSE.txt
```

Mechanics (from the dist README and the CSS):

* Cascade layers: every base/bundled file starts with
  `@layer deprecated, defaults, shared, theme, component;` and sets
  `:root { --slds-is-v2-enabled: true }`.
* Theme files declare tokens on `:where(html)` inside `@layer theme`; colours
  use **`light-dark()`**, so dark mode is a `color-scheme` switch:
  `.slds-color-scheme_light | _dark | _system` (also
  `html:has(body.slds-color-scheme_dark)`), from `utilities/darkMode.css`.
* Base sets `html { font-family: var(--slds-g-font-family-base); background:
  var(--slds-g-color-surface-2); color: var(--slds-g-color-on-surface-3) }`,
  `body { font-size: var(--slds-g-font-size-base, 0.8125rem) }`.
* Component CSS consumes `--slds-c-<component>-*` → falls back to shared
  `--slds-s-*` → falls back to global `--slds-g-*`
  (e.g. `.slds-button` radius →
  `var(--slds-c-button-radius-border, var(--slds-s-button-radius-border, var(--slds-g-radius-border-2)))`).
* `.slds-icon { fill: var(--slds-c-icon-color-foreground, var(--slds-g-color-neutral-base-100)); width/height: var(--slds-g-sizing-9) }`,
  sizes `slds-icon_xx-small` 14px, `_x-small` 16px, `_small` 24px, default 32px,
  `_large` 48px; `.slds-icon-text-default` → `--slds-s-icon-color-foreground`;
  `.slds-current-color .slds-icon` → `currentColor`. Any inline `<svg>` with
  these classes is styled — the SVG's origin does not matter (basis of D10).
* Per-component CSS files need the layer order + a theme file loaded
  alongside them (they contain no token values).

Cosmos token facts (`slds2.theme.cosmos.css` / `design-tokens` 4.1.0):

* 524 global hooks: 326 colour, 60 font, 48 spacing, 44 shadow, 27 sizing,
  8 duration, 6 radius, 5 ratio. 107 shared `--slds-s-*`. 85 reference
  `--slds-r-*`: five 17-step families `brand|error|info|success|warning`
  with steps `5 10 15 20 30 35 40 45 50 55 60 65 70 80 85 90 95`
  (5 = darkest, 95 = lightest). Cosmos brand = electric blue
  (`--slds-r-color-brand-50: #066afe`).
* Every `--slds-g-color-brand-base-*`, `accent-1/2/3`,
  `accent-container-1/2/3`, `border-accent-1/2/3`, `on-accent-2/3` (dark)
  and the focus-ring shadows derive from `--slds-r-color-brand-*` via
  `light-dark()` — **swapping the 17 reference steps re-brands all of them**.
* Semantic hooks that hard-code blue hex instead of referencing the ramp
  (these need explicit overrides in the Angeronia theme): `on-surface-3`
  `light-dark(#03234d, #d8e6fe)`, `surface-inverse-1` `light-dark(#032d60, #aacbff)`,
  `surface-inverse-2` `light-dark(#03234d, #d8e6fe)`, `surface-container-inverse-1`
  `light-dark(#032d60, #aacbff)`, `surface-container-inverse-2`
  `light-dark(#03234d, #78b0fd)`, `on-surface-inverse-2` `light-dark(#a8cbff, #002775)`,
  `border-inverse-2` `light-dark(#032d60, #aacbff)`, `accent-light-1/2`
  `#edf4ff / #d6e6ff`, `accent-dark-1/2` `#002775 / #001642`. Everything
  else semantic is neutral grey/white.
* Font: `--slds-g-font-family-base` = system stack; scale `base` 0.8125rem,
  `1` 0.875, `2` 1rem, `3` 1.25, `4` 1.5, `5` 1.75, `6` 2, `7` 2.5, `8` 3rem;
  weights 3/4/6/7 in use; line-heights `1`..`6` = 1 → 2.
* Spacing `1`..`12` = 0.25 → 5rem (4-pt); density-aware `--slds-g-spacing-var-*`.
* Radius: `border-1` 0.25rem, `border-2` 0.5rem, `border-3` 0.75rem,
  `border-4` 1.25rem, `border-pill` 15rem, `border-circle`. Buttons pill,
  containers `border-4`.
* Shadows `1`..`4` (+ directional, + focus rings `outline-focus-1` /
  `outset-focus-1` / `inset-focus-1`, all built on `brand-base-15`).
* Durations: `quickly` .1s, `promptly` .2s, `slowly` .4s, … ; brand-button
  hover lifts `translateY(-2px)` (`--slds-s-button-brand-transform-hover`).
* Sizing: `content-1/2/3` = 20/45/60ch, `heading-1/2/3` = 20/25/35ch.

### 1.3 The SLDS 2 documentation site

zeroheight SPA (needs a browser, not plain HTTP). Paths relative to
`https://www.lightningdesignsystem.com/2e1ef8501/p/`:

* Get Started `76969d-get-started` → Transition `8184ad`, Admins `771012`,
  Design `874349`, Develop `547b38`, Resources `63cfc2`, FAQs `313db3`,
  Glossary `81aa72`
* Icons `96f44b-icons`, Usage `63cc01-usage`
* AI and SLDS 2 `52a7c7`
* Visual Language `67a7b2` → Accessibility `641741` (Text and Color Contrast
  `99d436`, Global Focus `92a50f`, Keyboard Interaction `3491fd`, Mobile
  Design `391e54`, Global Accessibility Standards `23a1dd`), Borders and
  Radius `7770b4`, Color `655b28`, Display Density `805bbe`, Illustrations
  `759a28`, Shadows `64b580`, Spacing and Sizing `03d6b0`, Typography `93288f`
* Styling API `7708aa` → Styling Hook Index `98b493`, Global Styling Hooks
  `777f5a`, Component-Level Styling Hooks `0213f9` (developer preview)
* Utility Classes `05098e`
* Components `755aff` (Overview / Lightning Base Components / Component
  Blueprints / Component Architecture). Documented SLDS 2 components:
  Accordion, Avatar, Badge, Breadcrumbs, Button, Button Groups, Button Icons,
  Cards, Carousel, Checkbox, Checkbox Button, Checkbox Toggle, Color Picker,
  Combobox, Data Table, Datepicker, Datetime Picker, Dynamic Icons, Dual
  Listbox, Empty State, File Selector, Form Element, Icons, Input, Map, Menu,
  Modals, Pills, Progress Indicator, Progress Bar, Progress Ring, Prompt,
  Radio Button Group, Radio Group, Rich Text Editor, Scoped Tabs, Select,
  Slider, Spinners, Tabs, Textarea, Tiles, Timepicker, Toast, Tooltip, Tree
  Grid, Tree, Vertical Navigation. Blueprint-only (SLDS 1 site): Activity
  Timeline, Alert, App Launcher, Avatar Group, Brand Band, Chat, Checkbox
  Button Group, Counter, Expandable Section, Files, Global Header, Global
  Navigation, Illustration, List Builder, Lookups, Notifications, Page
  Headers, Panels, Path, Picklist, Popovers, Publishers, Scoped
  Notifications, Setup Assistant, Split View, Summary Detail, Trial Bar,
  Vertical Tabs, Visual Picker, Welcome Mat.
* Patterns `355656`; Tools `05b46d` → AI Development Skills `8225d4`, Figma
  Kits `2963ba`, SLDS 2 AI Starter Kit `057d3b`, SLDS Linter, SLDS Scope
  Customizer, SLDS Validator.

### 1.4 Guideline statements that drive the audit (§4)

* **Global Styling Hooks:** "Reference styling hooks. Don't re-assign the
  styling hook values. Provide a fallback value." Layered model: token value
  → global hook → component hook → implementation.
* **Develop:** ladder Base Components → blueprints → custom with hooks;
  "Always reference existing variables rather than hardcoding values";
  "Don't assign direct values to global styling hooks, as value assignment is
  reserved for theming tools."
* **Color:** "white surfaces with intentional pops of bright color";
  semantic hooks by role; "always pair `on-*` with its container"; accent
  colours "are configured through Themes and Branding".
* **Typography:** system fonts; weights light/regular/semibold/bold; type
  styles body/title/display; `on-surface-3` only for headings; links
  `accent-2`; bold for emphasis, not headings.
* **Spacing and Sizing:** 4-pt scale; spacing for margin/padding, sizing for
  width/height.
* **Borders and Radius:** "Less is best"; "Don't mix sharp and rounded".
* **Shadows:** shadow-1 rest, 2 default, 3 hover, 4 floating; never stack.
* **Illustrations:** at most one per page; enhance text.
* **Accessibility:** WCAG 2.2 AA; never colour alone; global focus hook;
  skip link; logical focus order.
* **Component Blueprints:** style-only; behaviour, ARIA and keyboard are ours.

### 1.5 Code Socratic brand facts (`../code-socratic`, read 2026-09-04)

* Design system there: **IBM Carbon v11** (`@carbon/react`,
  `@carbon/icons-react` 11.87.0, `@carbon/colors` 11.57.0). Contract:
  `apps/web/DESIGN.md`; theme remap: `apps/web/styles/_themes.scss`.
* **Brand accent = Carbon Teal 60 (light) / Teal 40 (dark)**, replacing
  Carbon's Blue 60/40 across the interactive family; button-primary stays
  Teal 60 in both themes, hover `mix(teal-60, teal-70)`, active Teal 80,
  links Teal 60 → hover Teal 70 (light), Teal 40 → Teal 30 (dark),
  highlight Teal 20 / Teal 90. Rationale (DESIGN.md): "Teal 60/40 are
  luminance twins of Blue 60/40 (5.0:1 on White, 7.8:1 on Gray 100)";
  green was rejected because it collides with `support-success`.
* Carbon teal palette (`@carbon/colors`): 10 `#d9fbfb`, 20 `#9ef0f0`,
  30 `#3ddbd9`, 40 `#08bdba`, 50 `#009d9a`, 60 `#007d79`, 70 `#005d5d`,
  80 `#004144`, 90 `#022b30`, 100 `#081a1c`.
* The Code Socratic favicon is a **Möbius strip in brand teal** (raster,
  re-tinted "teal-80 shadows to teal-40 faces").
* Fonts IBM Plex Sans/Mono (`next/font`, exposed as `--font-sans` /
  `--font-mono`); geometry radius 0, no shadows. **Angeronia imports the hue
  and the typeface (D11) — not the geometry.** SLDS 2's pill buttons,
  `border-4` cards and shadows stay: they are the design system; teal and
  Plex are the brand.

---

## 2. Target architecture

### 2.1 Directory layout (after migration)

```
app/
  layout.tsx               fonts removed; <html> gets color-scheme class; skip link; CSS imports
  page.tsx                 composes section components only
  slds.css                 single CSS entry: layer order + Cosmos theme + Angeronia theme + components + utilities
  theme.angeronia.css      THE theme layer (generated header + hand-maintained semantic overrides) — see §2.8
  site.css                 site-level composition rules only (containers, section rhythm) — hooks only
components/
  slds/                    reusable SLDS 2 wrappers (one folder per component, §5)
  site/                    page sections built from components/slds (SiteHeader, Hero, …, BrandMark, ColorSchemeSwitcher)
data/angeronia.ts          content (copy) — kept, motion params removed
lib/slds/                  cx(), colour-scheme helpers
scripts/build-theme.mjs    generates the reference-palette block of theme.angeronia.css from Carbon teal (§2.8)
scripts/check-theme.mjs    theme-parity + contrast test (§2.8.4)
.storybook/                main.ts, preview.ts (globals: colorScheme, density?, rtl?), manager.ts
stories/foundations/       MDX + token-driven stories (Color, Brand, Typography, Spacing, …, Icons)
docs/
  plans/slds2-redesign-plan.md   (this file)
  design-system/                 DESIGN-RULES.md, DECISIONS.md (Phase 0)
CLAUDE.md                  repo instructions for agents (Phase 0, from §3)
```

Deleted: `components/angeronia/*`, `lib/angeronia/*`,
`components/theme-provider.tsx` (re-created under `components/site/` if kept),
`lib/utils.ts` (tailwind-merge), `postcss.config.mjs`, `app/globals.css`,
deps `tw-animate-css`, `roughjs`, `animejs`, `tailwindcss`,
`@tailwindcss/postcss`, `tailwind-merge`; Google fonts in `layout.tsx`.
No `public/assets/icons/` (icons are React components, D10).

### 2.2 CSS loading strategy

Two options; Phase 1 runs a spike and picks one.

* **Option A — bundled:** `app/slds.css`:
  ```css
  @import "@salesforce-ux/design-system-2/dist/css/bundled/slds2.cosmos.css";
  @import "./theme.angeronia.css";          /* declares @layer theme { :where(html) { … } } — loaded after Cosmos, same layer ⇒ wins */
  @import "./site.css";
  ```
  ~1 MB uncompressed (measure gzip; expect 120–150 KB). Correct by
  construction. Use during Phases 1–3.
* **Option B — modular per-component (production target):**
  ```css
  @layer deprecated, defaults, shared, theme, component;
  @import "@salesforce-ux/design-system-2/dist/css/modular/slds2.theme.cosmos.css";
  @import "./theme.angeronia.css";
  @import "@salesforce-ux/design-system-2/dist/components/utilities/reset.css" layer(defaults);
  @import "@salesforce-ux/design-system-2/dist/components/utilities/darkMode.css" layer(defaults);
  @import "@salesforce-ux/design-system-2/dist/components/button/button.css" layer(component);
  /* …only what is used… */
  ```
  Verify: theme file supplies every `--slds-c-*`/`--slds-s-*` default the
  imported components need; `reset.css` ≈ base reset; visual parity with A
  in Storybook. Never hand-edit vendor CSS; never PurgeCSS the bundle.

Unscoped CSS in both cases (no other CSS framework remains).

### 2.3 Theming / colour scheme

* `<html>` carries one of `slds-color-scheme_light | _dark | _system`
  (default `system`). `next-themes` (kept) with `attribute="class"`,
  `themes={["light","dark","system"]}`,
  `value={{ light: "slds-color-scheme_light", dark: "slds-color-scheme_dark", system: "slds-color-scheme_system" }}`,
  `enableSystem`, `defaultTheme="system"`. Delete the custom motion-gate
  script and inline `<style>` in `layout.tsx`.
* Two colour schemes only; Noir removed (D5).
* Theme stack (cascade order inside `@layer theme`): Cosmos → Angeronia
  (§2.8). No other file may declare `--slds-r-*`, `--slds-g-*`, `--slds-s-*`
  or `--slds-c-*` values (D7).

### 2.4 Typography (IBM Plex, decided)

* **IBM Plex Sans** weights 300 / 400 / 600 / 700 and **IBM Plex Mono** 400
  (SIL OFL 1.1), loaded with `next/font/google` in `app/layout.tsx`:
  ```ts
  const plexSans = IBM_Plex_Sans({ subsets: ["latin"], weight: ["300","400","600","700"], variable: "--font-plex-sans", display: "swap" });
  const plexMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400"], variable: "--font-plex-mono", display: "swap" });
  // <html className={`${plexSans.variable} ${plexMono.variable}`}>
  ```
  `next/font` self-hosts the files (no request to Google at runtime) and
  generates a size-adjusted fallback (`adjustFontFallback`, default on) so
  the swap causes no layout shift. Measured latin woff2 from Google Fonts,
  2026-09-04: Sans 40.2 KB per weight, Mono 10.1 KB → ≈171 KB total;
  `next/font` subsets further. Do not add 500 or Mono 600 unless a component
  needs them.
* The hooks are assigned **only** in `app/theme.angeronia.css` block C
  (§2.8.7): `--slds-g-font-family-base: var(--font-plex-sans), system-ui, …`
  and `--slds-g-font-family-monospace: var(--font-plex-mono), Consolas, …`.
  The system stack stays as the fallback tail so no-JS / font-blocked
  renders still match Cosmos.
* Storybook loads the same faces (§6.1); stories must never render in the
  fallback without the reviewer noticing — the Foundations/Typography story
  prints `document.fonts.check('1em "IBM Plex Sans"')`.
* Body copy on the marketing page consumes `--slds-g-font-scale-2` (1rem) on
  the page root (a consumption, not a reassignment). Headings: display
  `scale-8`/weight-3, page title `scale-7`/weight-4, section title
  `scale-6`/weight-4, card title `scale-4`/weight-6, body `scale-2`/weight-4,
  caption `scale-1`. Text utilities (`slds-text-heading_*`, `slds-text-title`,
  `slds-text-body_*`, `slds-text-color_weak`) before custom CSS.
* Measure: `--slds-g-sizing-content-3` (60ch) prose, `heading-2` (25ch) headings.

### 2.5 Icons (Carbon, no Salesforce assets)

* `@carbon/icons-react` (Apache-2.0). Wrapper `components/slds/icon/Icon.tsx`:
  ```tsx
  <Icon icon={ArrowRight} size="small" assistiveText="Next" />
  // renders: <span class="slds-icon_container slds-current-color">
  //            <ArrowRight class="slds-icon slds-icon_small" aria-hidden="true" size={32}/>
  //            <span class="slds-assistive-text">Next</span></span>
  ```
  Size map: SLDS `xx-small` 14px ↔ Carbon glyph 16; `x-small` 16 ↔ 16;
  `small` 24 ↔ 24; default 32 ↔ 32; `large` 48 ↔ 32 glyph scaled. Colour via
  SLDS classes only (`slds-icon-text-default | -weak | -light | -error |
  -success | -warning`, `slds-current-color`); Carbon's `fill="currentColor"`
  attribute is overridden by `.slds-icon { fill: … }` as intended.
* Exactly one of `assistiveText` or `decorative` is required (TypeScript
  discriminated union) — the SLDS Icons accessibility rule.
* Same glyph names as Code Socratic where the concept overlaps (e.g. `Sun`,
  `Moon`, `Laptop` for the colour-scheme switcher; `ArrowRight`, `Launch`
  for links; `Checkmark` for path steps) — verify names against
  `@carbon/icons-react` exports in Phase 2.
* Not used, ever: `@salesforce-ux/icons`, SLDS standard/action/doctype/
  product icon containers (`slds-icon-standard-*`, `slds-icon-action-*`),
  Dynamic Icons (Einstein), SLDS illustrations. No attribution UI.
* The Angeronia mark stays a hand-authored SVG (`components/site/brand-mark.tsx`).

### 2.6 Motion

Only SLDS durations (`--slds-g-duration-*`) and the transitions the theme
already defines. No scroll-linked animation, no canvas, no autoplay.

### 2.7 Tooling & quality gates

* `npm run lint:slds` → `npx @salesforce-ux/slds-linter lint "{app,components,stories}/**/*.css"`;
  `lint:slds:report` → SARIF. Zero violations to merge.
* `npm run check:theme` → `scripts/check-theme.mjs` (§2.8.4). Runs in CI.
* Storybook: `addon-a11y` (axe) on every story; `addon-vitest` runs stories
  headlessly (Playwright/Chromium) in CI.
* TypeScript strict; remove `typescript.ignoreBuildErrors` and
  `eslint.ignoreDuringBuilds` from `next.config.mjs`.
* Optional Chromatic (light + dark modes).
* Agent skills: `npx skills add forcedotcom/sf-skills` (three
  `design-systems-*` skills) committed under `.claude/skills/`.

### 2.8 The Angeronia theme layer (`app/theme.angeronia.css`)

#### 2.8.1 Mechanism

* One file, declared as `@layer theme { :where(html) { … } }` so it has the
  same layer and specificity as Cosmos and wins by source order. It never
  introduces new hook names; it only re-values hooks Cosmos defines
  (checked by `check-theme.mjs`).
* Three blocks: **(A) generated** reference palette — the 17 `--slds-r-color-brand-*`
  steps, emitted by `scripts/build-theme.mjs` (do not hand-edit); **(B)
  hand-maintained** semantic overrides for the blue literals listed in §1.2;
  **(C) typography** — the two font-family hooks (§2.8.7).
* Everything else (neutrals, feedback colours, spacing, radius, shadows,
  fonts, durations) stays Cosmos. `error/success/warning/info` families are
  untouched — teal (~hue 180°) is distinct from SLDS success green (~140°);
  the Brand board (§6.2) shows them side by side for a visual check.
* Dark mode needs no extra work: Cosmos maps `brand-base-N` to
  `light-dark(r-N, r-(100−N))`, so the ramp is used mirrored.

#### 2.8.2 Reference palette mapping (block A)

Anchor: SLDS `r-brand-50` (brand button fill, white text) ↔ Carbon **Teal 60**
`#007d79` — the luminance twin of Cosmos's `#066afe` (Y 0.160 vs 0.175).
Adjacent SLDS steps that fall between Carbon stops are OKLab midpoints of the
neighbouring Carbon stops; step 5 is Teal 100 mixed 55 % toward black.
Generated values (re-run the script; these are the expected outputs):

| SLDS step | Source | Hex | Y (rel. lum.) | Cosmos Y | ≥ on `#fff` | ≥ on `#242424` |
|---|---|---|---|---|---|---|
| 95 | Teal 10 | `#d9fbfb` | 0.907 | 0.899 | 1.10 | 14.15 |
| 90 | Teal 20 | `#9ef0f0` | 0.759 | 0.781 | 1.30 | 11.96 |
| 85 | mid(20,30) | `#75e6e4` | 0.660 | 0.688 | 1.48 | 10.49 |
| 80 | Teal 30 | `#3ddbd9` | 0.567 | 0.583 | 1.70 | 9.12 |
| 70 | Teal 40 | `#08bdba` | 0.400 | 0.429 | 2.33 | 6.65 |
| 65 | mid(40,50) | `#04adaa` | 0.328 | 0.344 | 2.78 | 5.59 |
| 60 | Teal 50 | `#009d9a` | 0.264 | 0.291 | 3.34 | 4.65 |
| 55 | mid(50,60) | `#008d89` | 0.209 | 0.225 | 4.06 | 3.82 |
| **50** | **Teal 60** | **`#007d79`** | 0.160 | 0.175 | **4.99** | 3.11 |
| 45 | mid(60,70) | `#006d6b` | 0.120 | 0.139 | 6.18 | 2.51 |
| 40 | Teal 70 | `#005d5d` | 0.086 | 0.108 | 7.71 | 2.01 |
| 35 | mid(70,80) | `#004f50` | 0.062 | 0.079 | 9.40 | 1.65 |
| 30 | Teal 80 | `#004144` | 0.042 | 0.055 | 11.42 | 1.36 |
| 20 | Teal 90 | `#022b30` | 0.020 | 0.027 | 15.10 | 1.03 |
| 15 | mid(90,100) | `#062226` | 0.013 | 0.017 | 16.61 | 1.07 |
| 10 | Teal 100 | `#081a1c` | 0.009 | 0.010 | 17.87 | 1.15 |
| 5 | Teal 100 → black | `#010303` | 0.001 | 0.001 | 20.68 | 1.33 |

What the swap yields (all derived automatically by Cosmos's `light-dark()`
formulas): brand button `accent-container-1` = Teal 60 with white text
(**4.99:1**, Cosmos: 4.67:1); links/text `accent-2` = Teal 70 on white
(**7.71:1**) and Teal 40 on dark surface-1 (**6.65:1**, on surface-2 7.61:1);
hover `accent-3` = Teal 80 / Teal 30 (11.4 / 9.1); dark-mode hover fill
`accent-container-2` = Teal 20 with `on-accent-2` Teal 70 text (**5.94:1**);
`accent-container-3` dark = Teal 30 with Teal 80 text (6.70:1); focus rings
(`brand-base-15`) = `#062226` on white (16.6:1) / `#75e6e4` on `#242424`
(10.5:1, non-text minimum 3:1). This reproduces Code Socratic's Teal 60
light / Teal 40 dark accent exactly where SLDS has an equivalent slot.

#### 2.8.3 Semantic overrides (block B, hand-maintained)

| Hook (Cosmos value) | Angeronia value | Pairing check |
|---|---|---|
| `--slds-g-color-on-surface-3` `light-dark(#03234d, #d8e6fe)` — heading/title ink | `light-dark(var(--slds-r-color-brand-10), var(--slds-r-color-brand-95))` → Teal 100 / Teal 10 | 17.9:1 on `#fff`, 16.1:1 on `#f3f3f3`; dark 16.2:1 on `#181818` |
| `--slds-g-color-surface-inverse-1` `light-dark(#032d60, #aacbff)` | `light-dark(var(--slds-r-color-brand-20), var(--slds-r-color-brand-80))` → Teal 90 / Teal 30 | white on Teal 90 15.1:1; `#181818` on Teal 30 10.4:1 |
| `--slds-g-color-surface-inverse-2` `light-dark(#03234d, #d8e6fe)` | `light-dark(var(--slds-r-color-brand-10), var(--slds-r-color-brand-90))` | as above |
| `--slds-g-color-surface-container-inverse-1` `light-dark(#032d60, #aacbff)` | same as `surface-inverse-1` | — |
| `--slds-g-color-surface-container-inverse-2` `light-dark(#03234d, #78b0fd)` | `light-dark(var(--slds-r-color-brand-10), var(--slds-r-color-brand-70))` | — |
| `--slds-g-color-on-surface-inverse-2` `light-dark(#a8cbff, #002775)` | `light-dark(var(--slds-r-color-brand-80), var(--slds-r-color-brand-20))` → Teal 30 / Teal 90 | Teal 30 on Teal 90 8.9:1 |
| `--slds-g-color-border-inverse-2` `light-dark(#032d60, #aacbff)` | `light-dark(var(--slds-r-color-brand-20), var(--slds-r-color-brand-80))` | non-text |
| `--slds-g-color-accent-light-1 / -2` `#edf4ff / #d6e6ff` | `var(--slds-r-color-brand-95)` / `var(--slds-r-color-brand-90)` | — |
| `--slds-g-color-accent-dark-1 / -2` `#002775 / #001642` | `var(--slds-r-color-brand-20)` / `var(--slds-r-color-brand-10)` | — |

Rule: block B may only reference `--slds-r-color-brand-*`; never a hex.
If a future `@salesforce-ux/design-system-2` bump adds or removes a blue
literal, `check-theme.mjs` (below) fails the build and this table is updated.

#### 2.8.4 Validation (`scripts/check-theme.mjs`, CI)

1. **Parity:** every property assigned in `theme.angeronia.css` exists in
   `@salesforce-ux/design-tokens/dist/themes/cosmos/cosmos.{reference,global}.tokens.css`;
   nothing else is assigned; block A matches `build-theme.mjs` output byte for byte.
2. **Blue-literal sweep:** parse Cosmos `global.tokens.css`, list semantic
   hooks (not `palette-`, not `-base-`) whose value contains a hex with hue
   in the blue range (200–260°) — the list must equal the keys of block B.
3. **Contrast matrix:** resolve both schemes and assert WCAG AA for the
   pairs SLDS defines (`on-accent-N` on `accent-container-N`, `accent-2/3`
   on `surface-1/2/3` and `surface-container-1/2/3`, `on-surface-3` on all
   surfaces, `on-surface-inverse-N` on `surface-inverse-N`, focus rings vs
   surfaces ≥ 3:1). Print the matrix; it is also rendered by the Brand board.
4. Output is committed as `docs/design-system/theme-report.md` for review.

#### 2.8.6 Logo & favicon re-tint (decided)

* `components/site/brand-mark.tsx`: `<circle fill="var(--slds-g-color-accent-container-1)">` +
  cursor `<path fill="var(--slds-g-color-on-accent-1)">`; wordmark
  `on-surface-3`, weight 6, `scale-3`; sub-line `slds-text-title_caps`. White
  cursor on Teal 60 = 4.99:1.
* `app/icon.svg` (112 facet polygons, currently citron `rgb()` fills/strokes):
  `scripts/retint-favicon.mjs` converts each colour to OKLab, keeps L, and
  takes a/b from the Carbon teal ramp interpolated at that L (ends clamp
  toward white/black). Spot values: `rgb(213,237,62)` → `#9befef`,
  `rgb(106,118,31)` → `#007f7b`. Output committed; the script is re-runnable.
* `public/angeronia-logo-light.png` / `-dark.png` (OG/social, 500×500):
  regenerated from the mark SVG on `surface-1` / `surface-1` dark (`#fff` /
  `#242424`) with `sharp` or ImageMagick; verify at 16 px over both grounds.
#### 2.8.7 Block C — typography (decided)

```css
@layer theme {
  :where(html) {
    /* IBM Plex via next/font (app/layout.tsx); the Cosmos system stack stays as the tail */
    --slds-g-font-family-base: var(--font-plex-sans), system-ui, -apple-system, BlinkMacSystemFont,
      "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji";
    --slds-g-font-family-monospace: var(--font-plex-mono), Consolas, Menlo, Monaco, Courier, monospace;
  }
}
```
Nothing else about type changes: scale, weights (3/4/6/7), line-heights and
the text utilities are Cosmos's. `check-theme.mjs` treats these two hooks as
allowed assignments (they exist in Cosmos) and verifies no other `font-*`
hook is touched.

#### 2.8.8 What the theme does *not* change

Neutrals, surfaces (white / `#f3f3f3` / dark greys), feedback families,
fixed `palette-*` hooks, type scale / weights / line-heights, spacing,
radius, shadows, durations, component structure. The `Lightning Blue` theme
is never loaded.

### 2.9 Trademark & third-party asset hygiene

* No "Salesforce", "Lightning", "Cosmos", "Einstein" wording in the rendered
  site (UI, footer, `<title>`, OG copy). README/docs may state factually
  that the site is built on SLDS 2 (no endorsement implied; the Terms of Use
  and BSD-3 notices are kept in `node_modules` and cited in README).
* No Salesforce artwork: no `@salesforce-ux/icons`, no SLDS illustrations,
  spinners from `assets/images` of SLDS 1, or product icons. Spinner uses the
  SLDS 2 CSS-only `slds-spinner` (pure CSS, no image) — verify in Phase 2.
* No Salesforce application chrome: Global Header, Global Navigation
  (`slds-context-bar`), App Launcher, Brand Band, Builder Header, Setup
  Assistant, Trial Bar, Welcome Mat, Docked * are out of scope; the site
  header is built from SLDS layout/text utilities + `Button`/`ButtonIcon`.
* Carbon icons: Apache-2.0 — keep the license in `node_modules`; no UI
  attribution required. Do not modify glyphs.
* `slds-*` class names and `--slds-*` custom properties stay (they are the
  API of the CSS, not trademark use).

---

## 3. Design contract (becomes `CLAUDE.md` + `docs/design-system/DESIGN-RULES.md` in Phase 0)

Every future design/UI change in this repo MUST obey:

1. **SLDS 2 (Cosmos + the Angeronia theme layer) is the design system.** No
   other CSS framework, utility library or icon set (icons: `@carbon/icons-react`
   only). Sources of truth: lightningdesignsystem.com (SLDS 2),
   `@salesforce-ux/design-system-2`, `app/theme.angeronia.css`.
2. **Selection ladder:** existing `components/slds/*` → SLDS 2 component
   blueprint (add wrapper + stories) → SLDS utility classes → custom CSS that
   consumes `--slds-g-*` hooks with fallbacks. Custom CSS is last resort and
   carries a comment naming the guideline it follows.
3. **Never** hard-code colours, radii, shadows, font sizes/weights, spacing
   or durations. **Never** assign `--slds-r-*`, `--slds-g-*`, `--slds-s-*` or
   `--slds-c-*` outside `app/theme.angeronia.css`; inside it, never a hex in
   block B. **Never** override `.slds-*` selectors; add a `site-*` class.
4. **Colour by role, in pairs:** text on a container uses that container's
   `on-*` hook. Links = `accent-2`. Headings = `on-surface-3`. Feedback
   colours only for feedback. Brand teal appears only through
   `accent-*`/`brand-base-*` hooks — never as a literal.
5. **Typography:** IBM Plex Sans / Mono, loaded only in `app/layout.tsx`
   (`next/font`) and assigned only in theme block C; never a `font-family`
   literal elsewhere. Weights 3/4/6/7; bold for emphasis, not headings; text
   utilities before custom sizes.
6. **Spacing** hooks for margin/padding/gap; **sizing** hooks for
   width/height; 4-pt rhythm.
7. **Radius/borders/shadows:** buttons pill, cards `border-4`, inputs
   `border-2`; `border-1` decorative, `border-2` interactive; one shadow
   level per element.
8. **Motion:** SLDS durations only; nothing scroll-linked; no autoplay.
9. **Illustration:** at most one per page; supports text.
10. **Accessibility:** semantic HTML, skip link, visible focus (theme
    default), focus management for dialogs/menus, every icon labelled or
    `aria-hidden`, 44 px touch targets, no colour-only meaning, AA in both
    schemes (`npm run check:theme` covers the theme; stories cover components).
11. **Every component has a story** before it is used on a page; pages are
    compositions of storied components with a page-level story.
12. **Lint gates:** `slds-linter` clean, `check:theme` clean, Storybook a11y
    clean, TypeScript clean. Styles in `.css` files only.
13. Content stays in `data/angeronia.ts`.
14. **No Salesforce trademarks, artwork or app chrome** in the product (§2.9).

---

## 4. Audit of the current site — keep / replace / remove

Current stack: Next 15.5 App Router, React 19, Tailwind v4 (+
`tw-animate-css`), `next-themes` (light/dark/bw "Noir"), `roughjs` Möbius on
canvas, `animejs` (unused), hand-written tokens in `app/globals.css`
(~900 lines, `.ang-*` classes), scroll-scrubbed hooks in `lib/angeronia`.
Repo has **no commits yet** — see Phase 0.

| Current element (file) | Verdict | SLDS 2 replacement | Guideline basis |
|---|---|---|---|
| `app/globals.css` — citron/paper palette, `--step-*` fluid type, `--radius-0/1`, `--shadow-block`, Noir grain, custom focus ring, custom `::selection` | **Remove** (→ `app/slds.css` + `theme.angeronia.css` + `site.css`) | Cosmos hooks re-branded teal; theme focus ring / selection | Hard-coded values; light surfaces; radius consistency; single shadow level |
| Tailwind v4 + `tw-animate-css` + `tailwind-merge` | **Remove** | SLDS utility classes | One design system; 4-pt scales |
| Google fonts Space Grotesk / Geist / Geist Mono (`next/font`) | **Replace** | IBM Plex Sans 300/400/600/700 + Plex Mono 400 via `next/font`, wired through theme block C (§2.4, §2.8.7) | D11; font family is a theme-layer value |
| Three themes incl. **Noir** | **Remove Noir**; Light/Dark/System stay | `slds-color-scheme_*` | Only light/dark schemes exist |
| Citron accent `#c7dd3a` in UI | **Remove** | Teal via `accent-*` hooks (§2.8) | Brand accent through the theme layer, never literals |
| `theme-toggle.tsx` (3-segment `.ang-toggle`) | **Replace** | `ButtonGroup` of stateful `ButtonIcon`s (Carbon `Sun` / `Moon` / `Laptop`) with `aria-pressed`, or a `Menu` | Button Groups / Menu |
| `nav.tsx` (`.ang-nav` sticky, backdrop blur) | **Replace** | `SiteHeader`: `slds-grid slds-grid_align-spread slds-grid_vertical-align-center` + `slds-p-*`, brand lockup, text links, `ColorSchemeSwitcher`, neutral `Button` CTA; **not** `slds-context-bar` (D10) | Layout utilities; §2.9 |
| `brand-mark.tsx` (SVG citron disc + cursor) | **Keep, re-tint** | Disc `--slds-g-color-accent-container-1`, cursor `--slds-g-color-on-accent-1` (§2.8.6) | Brand ≠ UI; one accent across the family |
| `mobius-figure.tsx` (rough.js canvas, drag/fling) | **Remove** | none; optional single static illustration (O3) | One illustration per page; no sketch language; no pointer/scroll motion |
| `hero.tsx` (`.ang-hero`, mono kicker, scroll hint) | **Replace** | Hero: `slds-grid slds-wrap`; display heading (`scale-8`/w-3), lede, brand + neutral `Button`; no scroll hint | Type styles; Buttons |
| `philosophy.tsx` + `continuity-line.tsx` + `use-continuity-scrub.ts` | **Remove** | Three `Card`s (Carbon icon in header, tag as title, text as body) | No scroll-scrub; Cards |
| `services.tsx` (editorial rows, hover tint, `.ang-tag`) | **Replace** | `slds-grid slds-wrap slds-gutters` of `Card`s; tags as `Badge`s | Cards; Badge vs Pill semantics |
| `process.tsx` + `use-process-scrub.ts` | **Replace** | `Path` (static, all complete/current) + 4-col `Tile` grid with step copy | Path; no scroll motion |
| `product-spotlight.tsx` (offset citron shadow, cycling loop) | **Replace** | `Card` (`shadow-2`): header icon + name + `Badge` "Flagship product"; headline; static 3-step `ProgressIndicator`; body; dotted list; badges; footer external `Link` | Cards; no autoplay; one shadow |
| `metrics.tsx` + `use-metrics-meters.ts` | **Replace** | `ProgressBar` per metric with label/value text; footnote small/weak | Progress Bar; no colour-only meaning |
| `about.tsx` (`.ang-range-seg` pills) | **Replace** | `MediaObject` + `Avatar`; coverage strip as horizontal `Badge` list | Media Object / Avatar / Badge |
| `contact.tsx` (full-bleed panel) | **Replace** | `Box` (`slds-theme_shade`) + title + body + brand `Button` + link | Box utility; link colour rule |
| `site-footer.tsx` (mono uppercase columns) | **Replace** | `slds-grid` columns of `slds-list_vertical`, `slds-text-title_caps` headings, legal row — **no** attribution line | Vertical List; §2.9 |
| `scroll-spine.tsx` | **Remove** | — | Not an SLDS pattern; inline styles |
| `reveals.tsx` + `use-section-reveals.ts` | **Remove** | none | Motion rule |
| `lib/angeronia/scroll.ts` | **Remove** | — | no consumers |
| `data/angeronia.ts` | **Keep, trim** | drop `hero.mobius/scrollHint/figureAlt`, `philosophy.lineAlt/caption`, metric `barFrac/beforeFrac`; theme labels Light/Dark/System | content stays data-driven |
| `app/layout.tsx` metadata + JSON-LD | **Keep** | fonts/scripts/provider changed only | — |
| `app/icon.svg`, `public/*.png` logos | **Keep, re-tint** | `scripts/retint-favicon.mjs` + regenerated PNGs (§2.8.6) | brand assets |
| `animejs` | **Remove** | — | unused |
| `next.config.mjs` ignore flags | **Remove flags** | strict builds | quality gate |
| `README.md` | **Rewrite** (Phase 6) | — | — |

Page after migration (top → bottom): Skip link → Site header → Hero →
Philosophy cards → Services cards → Process path → Product spotlight card →
Proof progress bars → About media object → Contact box → Footer. Same
information architecture, same copy, teal accent, no scroll theatre.

---

## 5. Component library plan (`components/slds/`)

Conventions: one folder per component (`Name.tsx`, `Name.stories.tsx`,
optional `name.css` — hooks only, `index.ts`); named exports; `className`
pass-through; `ref` forwarding; markup copied from the SLDS blueprint and
checked against the SLDS 2 component page ("Develop" tab); behaviour per
the "Accessibility" tab; story checklist: Default, every variant/size,
states, long content, dark mode, a11y clean, docs with guideline links.

### Tier 1 — needed to rebuild the home page (Phase 2)

| Component | SLDS classes (root) | Props | Notes |
|---|---|---|---|
| `Icon` | `slds-icon_container`, `slds-icon`, `slds-icon_xx-small … _large`, `slds-icon-text-*`, `slds-current-color` | `icon` (Carbon component), `size`, `assistiveText` \| `decorative`, `tone` | Carbon glyph inside SLDS classes (§2.5) |
| `Button` | `slds-button` + `_neutral|_brand|_outline-brand|_destructive|_text-destructive|_success|_inverse`, `_stretch`, `_full-width` | `variant`, `href` (→ `<a>`), `iconLeft/Right`, `disabled`, `loading` | pill radius + hover lift from theme |
| `ButtonIcon` | `slds-button slds-button_icon` + `_icon-bare|container|border|border-filled|brand|inverse`, sizes | `icon`, `assistiveText` (required), `pressed` | colour-scheme switcher |
| `ButtonGroup` | `slds-button-group` / `_list` | children | `role="group"` + label |
| `Badge` | `slds-badge` + `_inverse|_lightest`, `slds-theme_success|warning|error` | `variant`, icon | tags |
| `Card` | `slds-card` → `__header` (`slds-media`), `__body`, `__footer` | `heading`, `icon`, `actions`, `footer`, `bodyInner` | |
| `MediaObject` | `slds-media`, `__figure`, `__body`, `_center`, `_responsive` | `figure`, children | |
| `Avatar` | `slds-avatar` + sizes, `_circle`, `__initials` | `src`, `initials`, `size`, `alt` | |
| `Path` | `slds-path`, `__track`, `__nav`, `__item slds-is-complete|is-current|is-incomplete`, `__link` | `steps[]`, `current`, `interactive=false` | Carbon `Checkmark` in complete markers |
| `ProgressIndicator` | `slds-progress`, `__list`, `__item`, `__marker`, inner `slds-progress-bar` | `steps[]`, `current`, `vertical` | |
| `ProgressBar` | `slds-progress-bar` + `__value`, sizes, label row | `value`, `label`, `valueText`, `size` | |
| `Heading` / text recipes | `slds-text-heading_large|medium|small`, `slds-text-title(_caps)`, `slds-text-body_regular|small`, `slds-text-color_weak|error|success`, `slds-truncate`, `slds-line-clamp` | `level`, `size` | semantic level ≠ visual size |
| `Grid` / `Col` (thin) or class recipes | `slds-grid`, `slds-wrap`, `slds-gutters`, `slds-grid_align-*`, `slds-col`, `slds-size_*`, `slds-medium-size_*`, `slds-large-size_*` | — | decide in Phase 2 |
| `Box` | `slds-box(_small|_x-small|_xx-small)`, `slds-theme_shade|default` | — | |
| `List` | `slds-list_vertical|_horizontal|_dotted`, `slds-has-dividers_*`, `slds-list__item` | `variant`, `dividers` | |
| `SiteHeader` (site) | utilities + Tier-1 parts (no context bar) | `items[]`, `cta` | §2.9 |
| `ColorSchemeSwitcher` (site) | `ButtonGroup` + `ButtonIcon`×3 or `Menu` | — | writes `next-themes` |
| `SkipLink` (site) | `slds-assistive-text slds-assistive-text_focus` | — | first in `<body>` |
| `Link` | theme `a` styles (`--slds-s-link-*`) | `href`, `external` (Carbon `Launch` icon + assistive text) | |

### Tier 2 — core coverage (Phase 5.5, before new pages)

Accordion, Alert (blueprint), Breadcrumbs, Expandable Section, Form Element
(+ Input, Textarea, Select, Checkbox, Checkbox Toggle, Radio Group), Menu (+
`ButtonMenu`), Modal (focus trap, Escape, return focus), Popover, Tooltip,
Pill, Spinner (CSS-only), Tabs, Scoped Tabs, Tile, Toast, Empty State (text +
optional Carbon pictogram-free layout), Page Header (base).

### Tier 3 — on demand

Carousel, Combobox, Data Table, Datepicker/Timepicker, Dual Listbox, File
Selector, Progress Ring, Prompt, Rich Text Editor, Slider, Tree, Tree Grid,
Vertical Navigation, Notifications, Panels, Split View, Summary Detail,
Vertical Tabs, Visual Picker.

**Out of scope (D10 / Salesforce-app-only):** Illustration, Dynamic Icons,
App Launcher, Global Header, Global Navigation, Brand Band, Builder Header,
Docked Composer / Utility Bar / Form Footer, Setup Assistant, Trial Bar,
Welcome Mat, Chat, Publishers, Feeds, Files, Lookups, Expression, Map, Color
Picker, List Builder, Einstein Header, Activity Timeline.

---

## 6. Storybook plan

### 6.1 Setup

* `npx storybook@latest init` → framework `@storybook/nextjs-vite` 10.6.x;
  addons `addon-docs`, `addon-a11y`, `addon-vitest` (+ `vitest`,
  `@vitest/browser`, `playwright`), `addon-links`; optional `addon-themes`,
  `storybook-addon-rtl`, `@chromatic-com/storybook`.
* `.storybook/preview.ts` imports **the same `app/slds.css`** as production
  (Cosmos + Angeronia theme); never a different stylesheet. Fonts: verify
  that `@storybook/nextjs-vite` resolves `next/font/google` (it does for the
  webpack framework; confirm for Vite in Phase 2). If it does not, add
  `.storybook/preview-head.html` with the Google Fonts `<link>` for the same
  weights and define `--font-plex-sans` / `--font-plex-mono` on `:root` there,
  so block C resolves identically in stories and in production.
* Globals toolbar: `colorScheme` light/dark/system (decorator sets
  `slds-color-scheme_*` on `<html>`); `density` comfy/compact only if the
  Phase 2 spike finds a supported mechanism; `direction` ltr/rtl optional.
  Backgrounds addon disabled (surfaces come from hooks).
* Manager theme: "Angeronia Design System" using theme hook values.

### 6.2 Story taxonomy

```
Foundations/
  Introduction   (MDX: design contract §3, links, how to add a component)
  Brand          (the teal ramp vs Cosmos blue, side-by-side; contrast matrix from check-theme; brand vs success/warning/error swatches; logo lockups)
  Color          (semantic roles with on-pairs, system palettes, fixed palettes — rendered from design-tokens flat.json + computed values, both schemes)
  Typography     (font stack, scale, weights, line-heights, type styles, text utilities)
  Spacing & Sizing · Borders & Radius · Shadows · Motion
  Icons          (Carbon icon browser: search, SLDS sizes, tone classes, assistive-text rules)
  Utilities      (grid recipes, layout, text, lists, visibility)
Components/<Name>
Sections/<Name>  (SiteHeader, Hero, Philosophy, Services, Process, ProductSpotlight, Proof, About, Contact, SiteFooter)
Pages/Home       (full composition; light + dark; a11y run)
```

### 6.3 Quality gates

`addon-a11y` violations fail the vitest run; `play` tests for Button, Menu,
Modal, Tabs, Accordion, ColorSchemeSwitcher; light/dark matrix per Tier-1
component; `check:theme` output embedded in the Brand board.

### 6.4 Hosting

`build-storybook` → `storybook-static/`, deployed as a separate Vercel
project (e.g. `design.angeronia.com`) — not under the Next app's `public/`.

### 6.5 Definition of "designed"

Story exists → a11y clean → slds-linter clean → check:theme clean → reviewed
in light and dark → used on a page. Goes into the PR template (Phase 6).

---

## 7. Page redesign spec (home page)

Container: `slds-container_x-large slds-container_center`; section rhythm
`slds-p-vertical_xx-large`. All copy from `data/angeronia.ts`.

1. **Skip link** → `#main`.
2. **Site header** — grid header (§4): brand lockup (mark + wordmark in
   `slds-text-title`), links Services / How we work / Proof / About,
   `ColorSchemeSwitcher`, neutral `Button` "Start a project".
3. **Hero** — two-column `slds-grid slds-wrap slds-grid_vertical-align-center`;
   kicker (`slds-text-title_caps slds-text-color_weak`), `<h1>` display
   (`scale-8`/w-3, `max-width: heading-2`), lede (`scale-3`, `on-surface-2`),
   brand "Start a project" + neutral "See what we build". Right column empty
   or the single illustration (O3). No scroll hint.
4. **Philosophy** — three `Card`s (Carbon icon, tag title, body).
5. **Services** — four `Card`s (2×2 on medium+), `Badge` tags in footer.
6. **How we work** — `Path` (4 steps, static) + 4 `Tile`s.
7. **Code Socratic** — one `Card` (`shadow-2`), 3-step `ProgressIndicator`,
   dotted list, badges, footer external `Link`.
8. **Proof** — four `ProgressBar`s with label/value; notes small/weak; footnote.
9. **About** — `MediaObject` + `Avatar`; horizontal `Badge` list; coda.
10. **Contact** — `Box` shade: title, body, brand `Button`, mailto `Link`.
11. **Footer** — 3 link columns + brand column; legal row (© only).

Responsive via `slds-*-size_*`; no custom media queries unless a hook needs it.

---

## 8. Phased roadmap (acceptance criteria are binding)

### Phase 0 — Baseline, contract, tooling skeleton (½ day)

1. `git add -A && git commit -m "Baseline: citron editorial design before SLDS 2 migration"`; tag `pre-slds2`.
2. `CLAUDE.md` already exists (created 2026-09-04 with the §3 contract and pointers) — extend it only if Phase 0 changes anything.
3. Create `docs/design-system/DESIGN-RULES.md` and `DECISIONS.md` (record D1–D10 and the §10 answers).
4. `npx skills add forcedotcom/sf-skills` (three `design-systems-*` skills) → commit `.claude/skills/`.
5. Add `lint:slds`, `check:theme` script stubs.

Acceptance: commit + tag; `CLAUDE.md`; linter runs; skills visible in `/skills`.

### Phase 1 — SLDS 2 foundations + Angeronia theme (1–2 days)

1. `npm i @salesforce-ux/design-system-2 @salesforce-ux/design-tokens @carbon/icons-react`; `npm i -D @salesforce-ux/slds-linter @carbon/colors`.
2. Remove Tailwind, `tw-animate-css`, `tailwind-merge`, `postcss.config.mjs`, `roughjs`, `animejs`, `app/globals.css`; replace the Space Grotesk / Geist `next/font` imports with `IBM_Plex_Sans` + `IBM_Plex_Mono` (§2.4).
3. `scripts/build-theme.mjs`: reads Carbon teal from `@carbon/colors`, emits block A of `app/theme.angeronia.css` per §2.8.2 (OKLab midpoints; commit the output; header comment with provenance + "generated — do not edit").
4. Hand-write block B (§2.8.3). `scripts/check-theme.mjs` per §2.8.4; `npm run check:theme` green; commit `docs/design-system/theme-report.md`.
4b. Re-tint brand assets per §2.8.6: `scripts/retint-favicon.mjs` → `app/icon.svg`; regenerate `public/angeronia-logo-*.png`; `brand-mark.tsx` fills switched to hooks.
4c. Block C (§2.8.7) in `theme.angeronia.css`; confirm in DevTools that `.slds-button` computes to "IBM Plex Sans" and `code` to "IBM Plex Mono"; Lighthouse shows no CLS from the swap.
5. `app/slds.css` (Option A) importing Cosmos → Angeronia → site; `app/site.css` (root font-size consumption, containers).
6. `layout.tsx`: CSS imports; `next-themes` per §2.3; remove motion-gate script and inline style; skip link.
7. Spike Option B (modular): compare computed styles for Button/Card/Badge/ProgressBar under A vs B in both schemes; record in `DECISIONS.md`.
8. Remove `ignoreBuildErrors` / `ignoreDuringBuilds`; fix fallout.
9. Placeholder `app/page.tsx` (`<main id="main">` + one brand button) so the build is green.

Acceptance: build green (strict); light/dark/system switch with no flash;
brand button renders **Teal 60** with white text in both schemes, links Teal
70 / Teal 40; all text in IBM Plex Sans, code in IBM Plex Mono, fonts
self-hosted under `/_next/static/media` (no `fonts.googleapis.com` request);
`slds-linter` + `check:theme` clean; no Salesforce artwork in the bundle
(`grep -ri "salesforce" .next/static` finds only CSS comments).

### Phase 2 — Storybook + Tier-1 components (3–4 days)

1. Storybook per §6.1; CI job `test:storybook`.
2. Foundations stories incl. **Brand** board (§6.2).
3. Tier-1 components (§5) in order: Icon → Button → ButtonIcon/ButtonGroup →
   Badge → Card → MediaObject → Avatar → Heading/text → Grid/Box/List →
   ProgressBar → ProgressIndicator → Path → Link → SkipLink → SiteHeader →
   ColorSchemeSwitcher. Verify Carbon icon names used.
4. Density spike result → `DECISIONS.md`.

Acceptance: every Tier-1 component: Docs + Default + variants + dark story;
`test:storybook` zero a11y violations; slds-linter clean; no inline styles;
Storybook preview URL.

### Phase 3 — Rebuild the home page (2–3 days)

1. `components/site/*` per §7 with `Sections/*` stories fed by `data/angeronia.ts`.
2. `Pages/Home` story; `app/page.tsx` composes the same sections.
3. Trim `data/angeronia.ts`. Metadata/JSON-LD unchanged.

Acceptance: story ≡ `localhost:3000`; keyboard walk-through both schemes;
axe clean; CLS 0; no `ang-*`, citron literal, `roughjs`, `space-grotesk`,
`geist`, or "Salesforce" string in rendered HTML.

### Phase 4 — Delete the old design (½ day)

1. Remove `components/angeronia/`, `lib/angeronia/`, `components/theme-provider.tsx` (if replaced), `lib/utils.ts` → `lib/slds/cx.ts`.
2. `npm prune`; `grep -rn "ang-\|citron\|#c7dd3a\|roughjs\|space-grotesk\|geist\|salesforce-ux/icons" --include=*.ts --include=*.tsx --include=*.css .` returns nothing (except the logo file if O10 keeps citron).

### Phase 5 — Quality, performance, hardening (1–2 days)

1. Bundled vs modular decision for production; CSS ≤ 150 KB gzip target.
2. Lighthouse mobile `/`: performance ≥ 90, a11y 100, best-practices ≥ 95.
3. Contrast audit of every pairing actually used (extends `check:theme` with the page's real combinations).
4. CI: typecheck+lint, `lint:slds` (SARIF), `check:theme`, `test:storybook`; optional Chromatic.
5. Tier-2 components (§5).

### Phase 6 — Documentation & workflow (½ day)

1. Rewrite `README.md` (stack, Storybook, how to add a component, licensing
   notes: SLDS 2 Terms of Use, Carbon Apache-2.0; explicit "no Salesforce
   assets" note).
2. PR template with the §6.5 checklist.
3. Close the plan in `DECISIONS.md`.

Estimated total ≈ 10–14 working days for one implementer; Phase 2 and Tier 2
parallelise per component.

---

## 9. File-level change list

**Delete**
```
app/globals.css  postcss.config.mjs
components/angeronia/*  components/theme-provider.tsx  (re-created under components/site/ if kept)
lib/angeronia/*  lib/utils.ts
```
**Keep (modify)**
```
app/layout.tsx  app/page.tsx  data/angeronia.ts  next.config.mjs  package.json  README.md
app/icon.svg, public/angeronia-logo-*.png  (re-tint only if O10 = teal)
```
**Create**
```
CLAUDE.md
docs/design-system/DESIGN-RULES.md  DECISIONS.md  theme-report.md (generated)
app/slds.css  app/theme.angeronia.css  app/site.css
scripts/build-theme.mjs  scripts/check-theme.mjs  scripts/retint-favicon.mjs
components/slds/**  components/site/**  lib/slds/{cx.ts,scheme.ts}
.storybook/{main.ts,preview.ts,manager.ts,vitest.setup.ts}  stories/foundations/*
.github/workflows/ci.yml  .claude/skills/design-systems-*
```

---

## 10. Decision log (all closed 2026-09-04 except O7)

Implementers: treat every row as decided. Record any deviation in
`docs/design-system/DECISIONS.md` before acting on it.

| # | Decision | Outcome |
|---|----------|---------|
| O1 | Accent colour | **Carbon Teal via the Angeronia theme layer** (D2, §2.8). |
| O2 | Tailwind | **Removed entirely**; SLDS utilities replace it. |
| O3 | Hero illustration | **None** in Phase 3. A static flat teal Möbius SVG (hooks only, one per page) may be added later as its own storied `Illustration` component — separate ADR. |
| O4 | Scheme persistence | **Keep `next-themes`** (§2.3). |
| O5 | Next.js version | **Stay on 15.5.x** for the migration; upgrade to 16 in a separate PR after Phase 5. |
| O6 | Storybook hosting | **Separate Vercel project** (e.g. `design.angeronia.com`). |
| O7 | Licensing | **Open — user to confirm before Phase 1 ships to production:** SLDS 2 CSS/tokens are under the Salesforce Terms of Use (non-OSI, indemnification clause); Carbon icons and IBM Plex are Apache-2.0 / OFL 1.1. Nothing else in the plan blocks on this. |
| O8 | Density toggle | **Spike in Phase 2**; expose only if SLDS 2 offers a supported switch, else document "comfy only". |
| O9 | Proof numbers | **Static** (Progress Bar values, no counting). |
| O10 | Logo mark colour | **Re-tinted to teal** (D6, §2.8.6). |
| O11 | Typeface | **IBM Plex Sans 300/400/600/700 + IBM Plex Mono 400** (D11, §2.4, §2.8.7). Demo used for the decision: https://claude.ai/code/artifact/40fd70c4-b3b1-4589-8b5a-3124f1ee1fc0 (note: the artifact viewer clipped the page below the first section on 2026-09-04; the measured facts in its table and in §2.4 stand). |
| O12 | Icon set | **Carbon** (`@carbon/icons-react`, D10, §2.5). |

---

## 11. Risks & mitigations

| Risk | Mitigation |
|---|---|
| SLDS 2 dist is CSS-only; blueprint HTML lives on the SLDS 1 site / archived repo and some class names changed. | Cross-check the SLDS 2 "Develop" tab; use the `design-systems-slds-apply` skill's blueprint search; do **not** install the SLDS 1 package (brand assets). |
| A `design-system-2` bump changes a blue literal or a ramp formula and the teal theme silently drifts. | `check:theme` parity + blue-literal sweep fails CI; pin exact versions; bump deliberately with Chromatic diff. |
| Teal vs SLDS success green look similar in badges/progress. | Brand board shows them adjacent; if confusable, keep `slds-theme_success` for feedback only (already the rule) and use neutral badges for tags. |
| Carbon icons are drawn on a 32-grid, SLDS icons on 24 — optical weight differs slightly at 16px. | Use Carbon's 16/20/24 glyph variants at matching SLDS sizes; review in the Icons board. |
| Cosmos base font 13px too small for marketing. | Consume `--slds-g-font-scale-2` on the page root. |
| Plex swap causes layout shift or stories render in the fallback face. | `next/font` size-adjusted fallback + `display: swap`; Storybook font wiring per §6.1; Foundations/Typography story asserts `document.fonts.check`. Plex Sans runs ~5–8 % wider than SF Pro — check heading wraps at `heading-2` (25ch) in Phase 3. |
| 1 MB CSS payload. | Modular spike (Phase 1/5); compression; shared cache with Storybook. |
| `slds-linter` ignores TSX. | Styles in `.css`; Storybook a11y; `design-systems-slds-validate` as partial signal. |
| Component-level hooks (`--slds-c-*`) are developer preview. | Never override them; use blueprint variants + global hooks. |
| Trademark exposure via class names or docs. | §2.9: no marks in UI; class names are API; README states facts only. |

---

## 12. References

* SLDS 2 home: https://www.lightningdesignsystem.com/2e1ef8501/p/85bd85-lightning-design-system-2 — section IDs in §1.3
* SLDS Linter guide: https://developer.salesforce.com/docs/platform/slds-linter/overview
* npm: `@salesforce-ux/design-system-2`, `@salesforce-ux/design-tokens`, `@salesforce-ux/slds-linter`, `@carbon/icons-react`, `@carbon/colors`
* GitHub: https://github.com/salesforce-ux/design-system (archived; blueprint HTML) · https://github.com/salesforce-ux/slds-linter · https://github.com/forcedotcom/sf-skills · https://github.com/salesforce-ux/design-system-2-starter-kit · https://github.com/carbon-design-system/carbon (icons)
* Developer guide: https://developer.salesforce.com/docs/platform/lwc/guide/create-components-css-custom-properties.html · https://developer.salesforce.com/docs/platform/lwc/guide/create-components-css-slds1-slds2.html
* Code Socratic brand: `../code-socratic/apps/web/DESIGN.md` (§ Brand accent), `../code-socratic/apps/web/styles/_themes.scss`
* Storybook: https://storybook.js.org/docs/get-started/frameworks/nextjs-vite
