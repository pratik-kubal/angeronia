# Design rules — angeronia.com

Binding for every UI change in this repository. `CLAUDE.md` carries the same
rules in summary form for agent sessions; if the two ever disagree, this file
wins and `CLAUDE.md` is corrected to match.

Deviating from any rule below requires an entry in [`DECISIONS.md`](DECISIONS.md)
**before** the code changes.

**Scope.** These rules govern the studio site. The games (`/games`, the
launcher, and every game under it) keep their own look and sit outside them;
[ADR-019](DECISIONS.md) draws the boundary. Rules 1–9, 11 and 13 do not reach
the games; rule 10, rule 12's TypeScript and strict-build gates, and rule 14 do.

> Rewritten 2026-11-25 for **the spine** (ADR-023). The Carbon version this
> replaces is in the git history. The visual source of truth is the owner's
> chosen draft, `.taste-skill/round2/type-only-statement/` (kept outside git):
> `index.html`, `css/page.css`, `js/page.js`, and the screenshots in `final/`.

---

## 1. Plain CSS, nothing else

* Two global stylesheets, imported once by `app/layout.tsx`, in this order:
  `styles/tokens.css` (every design value) and `styles/base.css` (reset, type,
  focus). Nothing else is global. The layout also wraps every page in a plain
  flex-column frame at least a screen tall (`app/layout.module.css`), which the
  games' parity depends on (ADR-029); bands are its children.
* Every component styles itself with a **CSS Module** beside it:
  `components/site/<name>.tsx` + `<name>.module.css`. Class names are camelCase
  in the module (`styles.crossing`). Join them with `cx()` from `lib/cx.ts`.
* No CSS framework, no utility library, no CSS-in-JS, no Sass, no icon set. The
  spine is type; the few glyphs the Code.Socratic replica draws are inline SVG
  with `aria-hidden="true"`.
* **No inline `style`**, with one carve-out (ADR-005): the `style` attribute may
  carry a custom property whose value is *data* (a delay index, a measured
  length set by script), e.g. `style={{ "--i": 1 }}`. Never a colour, a size or a
  layout property.
* `:global` in a module only to key off one of three classes on `<html>`
  (rule 8): `html.js` (script is on), `html.spine-live` (the spine's script is
  running) and `html:not(.js)` (no script). Never to reach into another
  component (ADR-032).

## 2. Where a style goes

Reach for the first that works:

1. A token from `styles/tokens.css`, used in the component's module.
2. A type step from `styles/type.module.css` (rule 5), imported by the
   component.
3. A rule in the component's own module, built from tokens.
4. A **new token** in `tokens.css`, when a value is a property of the system
   rather than of one component (a colour, a type step, a duration, a step of
   space). A new colour token is not done until its contrast pairs are declared
   (rule 4).

A component never styles another component's elements. Pass a `className` in
instead.

## 3. Never hard-code, never re-assign

* **Never** a literal colour, type size, weight, line height, letter spacing,
  duration or easing outside `tokens.css`. Read the token.
* **Space** comes from the scale (`--space-1` … `--space-8` fixed,
  `--space-xs` … `--space-4xl` fluid, `--margin`, `--section-space`). A length in
  the draft that matches no step maps to the nearest step.
* A length that is a property of one component, not of the system, may be
  written in that component's module **with a comment saying so**: a measure in
  `em` (`max-width: 24em`), an aspect ratio, a fixed panel height, a hairline
  border.
* Tokens are **assigned only in `tokens.css`**. A component may set a
  component-local custom property of its own (`--pull`), never a token.
* **The Code.Socratic replica is the one exception.** It shows the product as it
  looks, in the product's own light theme: its palette, radii and 13–16px type
  are literal `--ui-*` values declared at the top of the replica's own module,
  scoped to it, and used nowhere else (ADR-023, ADR-014's intent).

## 4. Colour by role, in pairs, in one scheme

One colour scheme (ADR-024): near-black ink on off-white paper, **one charcoal
band** (the belief), and **sage only on buttons**. No dark mode, no
`prefers-color-scheme`.

**The palette** — raw values, private to `tokens.css`; a component never reads a
`--palette-*` token:

| Token | Value | What it is |
|---|---|---|
| `--palette-paper` | `#f1f1ef` | the ground |
| `--palette-ink` | `#1c1c1c` | the ink, and the spine on paper |
| `--palette-ink-soft` | `#5c5d58` | secondary ink on paper (5.9:1) |
| `--palette-charcoal` | `#1c1c1c` | the one dark band |
| `--palette-muted` | `#9a9b96` | secondary ink on charcoal (6.1:1) |
| `--palette-frame-paper` / `--palette-frame-charcoal` | `#e3e2dd` / `#262626` | the ground behind a photograph while it loads |

**The band roles** — what components read. `:root` (and `[data-band="paper"]`)
holds the paper set; `[data-band="dark"]` swaps in the charcoal set:

| Role | Paper band | Charcoal band | Use |
|---|---|---|---|
| `--band-ground` | paper | charcoal | the band's background |
| `--band-ink` | ink | paper | text, statements |
| `--band-soft` | ink-soft | muted | secondary text, captions, credits, a service's parts |
| `--band-spine` | ink | paper | the spine line |
| `--band-focus` | ink | sage | the focus ring |
| `--band-frame` | frame-paper | frame-charcoal | behind a photograph |

**The button** reads `--button` (sage, `#8fa68e`) for its fill, `--button-ink`
(`#1c1c1c`) for its label and `--button-hover` (`#a6b9a5`) on hover. Sage appears
nowhere else (the charcoal band's focus ring is sage through `--band-focus`).

**Names.** Tokens live on `:root`, which the games share, and a game's
`html:has(...)` rules outrank `:root`. So no token takes a name a game defines
(the games already use `--ink`, `--accent`, `--ground`, `--muted`, `--bg`,
`--font` and more): the colour tokens are namespaced `--palette-*`, `--band-*`
and `--button*`, and any new token is checked against the games' names first
(ADR-029).

**Pairs.** Every foreground is used only on the background it is paired with,
and every pair is declared in `tokens.css` as an `@contrast` line and checked by
`npm run check:contrast` in every band (ADR-030):

| Pair | Kind | Minimum |
|---|---|---|
| `--band-ink` on `--band-ground` | text | 4.5:1 |
| `--band-soft` on `--band-ground` | text | 4.5:1 |
| `--band-ground` on `--band-ink` (selection, the skip link) | text | 4.5:1 |
| `--band-spine` on `--band-ground` | ui | 3:1 |
| `--band-focus` on `--band-ground` | ui | 3:1 |
| `--button-ink` on `--button`, and on `--button-hover` | text | 4.5:1 |

Sage against paper is about 2.3:1 and is **not** a pair: the button is
identified by its label, which is paired, not by its fill (WCAG 1.4.11).

A band sets its roles with `data-band="paper"` or `data-band="dark"` on its
outermost element. **Every studio band carries `data-band`**, the paper ones
too: the focus ring and selection colour are scoped to it, which is what keeps
them out of the games (ADR-029).

## 5. Type

* **Hanken Grotesk** for everything: 400 for text, 500 for buttons, labels and
  names, 600 for statements. Never 700.
* **IBM Plex Mono 400** only for code, and only inside the Code.Socratic replica.
* Both are files in the repo (`assets/fonts/`, latin subset, each with its
  OFL), loaded by `next/font/local` in `app/fonts.ts` (ADR-034: never
  `next/font/google`, whose build-time download breaks on CI), applied to
  `<html>` by `app/layout.tsx` as `--font-hanken` and `--font-plex-mono`. They
  are read only by `--font-sans` and `--font-code` in `tokens.css`.
* **Five steps**, each a size, a line height and a tracking:

  | Step | Size | Leading | Tracking | Weight | Use |
  |---|---|---|---|---|---|
  | `display` | `--step-display` (38 → 136px) | 0.9 | -0.05em | 600 | statements on the spine |
  | `head` | `--step-head` (28 → 56px) | 0.95 | -0.04em | 600 | a service, a step, the footer heading |
  | `lead` | `--step-lead` (20 → 30px) | 1.2 | -0.018em | 400 | the lines beside the spine |
  | `body` | `--step-body` (17 → 19px) | 1.5 | -0.005em | 400 | running text; set on `<body>` once |
  | `small` | `--step-small` (13 → 14px) | 1.45 | — | 400 | captions, credits |

* `styles/type.module.css` has one class per step: `display`, `head`, `lead`,
  `body`, `small`. Import it as `typeStyles`
  (`import typeStyles from "@/styles/type.module.css"`) and use the class
  (`typeStyles.display`), or read the same tokens in your own module. (Not
  `type`: `import type from` reads as a type-only import.)
* A heading's look comes from a step, **never from its level**: `base.css` sets
  every `h1`–`h6` to inherit its size and weight, so the outline is chosen for
  meaning and the step for the eye.
* Numerals in a figure use `font-variant-numeric: tabular-nums`.

## 6. Space, measures and breakpoints

* **Fixed steps** for the inside of a component: `--space-1` 4px, `--space-2`
  8px, `--space-3` 10px, `--space-4` 14px, `--space-5` 20px, `--space-6` 28px,
  `--space-7` 32px, `--space-8` 44px.
* **Fluid steps** for the rhythm between blocks: `--space-xs` (12 → 18px),
  `--space-s` (18 → 26), `--space-m` (28 → 44), `--space-l` (32 → 52), `--space-xl`
  (44 → 64), `--space-2xl` (56 → 88), `--space-3xl` (64 → 96), `--space-4xl`
  (72 → 112).
* `--margin` (16 → 32px) is the page's side margin; `--section-space` (56 →
  96px) the padding above and below a section.
* `--measure` (34em) is the running-text measure; other measures are a
  component's own (rule 3).
* **Breakpoints** are fixed numbers, because custom properties cannot be used in
  a media query. Use exactly these:
  * `(max-width: 899px)` — the **narrow** layout: the axis moves to 22%, pairs
    stack and hang right of the axis, the navigation hides, the pull and the
    held scene are off.
  * `(max-width: 599px)` — the **phone**: a heading may regroup its words to stay
    at two lines.
  * `(min-width: 900px) and (max-width: 1099px)` — the replica's two panes
    stack.

## 7. The spine

The page's one idea: a single vertical line that every statement steps across,
the reader's need on one side, the studio's build on the other.

* **The axis** sits at `--axis`: 38% of the viewport width, 22% under 900px. Its
  distance from the content edge is `--axis-inset`
  (`calc(var(--axis) - var(--margin))`).
* **The line** is `--spine-width` (**2px**, the owner's ruling) in `--band-spine`,
  the ink of its band. It runs the length of the page, through every band. It is
  never drawn through a word: where something crosses the axis, the line breaks.
* **Three positions** for a statement (`display` or `head`):
  * **crossing** — split at the axis into a left part that ends on it and a right
    part that starts `--spine-gap` after it; at rest they meet with a word space
    and hide the line.
  * **hanging** — starts `--hang` from the content edge
    (`calc(var(--axis-inset) + var(--spine-gap))`), just right of the axis.
  * **pushed** — starts `--push` past the axis (12vw; 14vw narrow).
* **Pairs.** Two paragraphs side by side: the reader's side (the need) ends at the
  axis, right-aligned; the studio's side (the build) starts after it. Under 900px
  a pair stacks and hangs right of the axis. Paragraphs and captions never cross
  the axis, so they never cut the line.
* **What may cross it:** statements, the Code.Socratic replica (full width), the
  photographs' frames and the button. The line breaks around each with 0.14em of
  air for type and 18px for a block, and never leaves a piece shorter than 40px.
* **Without script** the line is one continuous rule per band
  (`::before` at the axis), and each crossing part paints its band's ground
  behind itself to hide it. With script (`html.spine-live`) it is drawn in pieces
  between the crossings (rule 8).
* **Square.** No border radius and no shadow anywhere on the studio site (the
  replica excepted, rule 3). A photograph sits in a frame of `--band-frame`.

## 8. Motion

Scroll-linked motion is allowed for the spine (ADR-025). The conditions:

* **The finished page is the default.** No script, a failed script, or
  `prefers-reduced-motion: reduce`: everything in place, the line whole, nothing
  hidden waiting for a reveal. Motion styles key off `html.js` (added by a
  one-line script in `<head>`) **and** sit inside
  `@media (prefers-reduced-motion: no-preference)`.
* **Native scroll only.** No wheel capture, no smooth-scroll library, no scroll
  hijack.
* **Transforms and opacity only** for anything that moves with the scroll; one
  `requestAnimationFrame` loop, idle when nothing changes.
* **Durations and easings are tokens:** `--dur-press` 140ms, `--dur-hover`
  180ms, `--dur-ui` 240ms, `--dur-enter` 600ms, `--dur-settle` 820ms,
  `--dur-arrive-lead` 1050ms, `--dur-arrive` 1150ms, `--stagger` 80ms;
  `--ease-out`, `--ease-expo`. `--dur-script-wait` (2.5s) is not motion: it is
  how long the page waits for the script before it shows what the script would
  have drawn (the whole line, the replica's every panel; ADR-031, ADR-032).
* **No layout change when the script starts.** Anything the script will hold
  in place (the belief's height) is reserved by CSS from the first paint, so a
  link to a section lands where it points (ADR-032).
* **Press feedback is motion too:** a press scale or an underline sweep sits
  inside `prefers-reduced-motion: no-preference`.
* **No loop that plays on its own.** Nothing autoplays.
* The pull and the held scene are desktop only (900px and up); a phone gets the
  finished composition.
* Plain TypeScript in client components; no GSAP (ADR-027).

## 9. Pictures

* The footer tells the story of the name with **two photographs**: the Angerona
  statue at Schönbrunn (CC BY-SA 4.0, Herzi Pinki) and the Fasti Antiates (CC0,
  Fabrizio Garrisi), both via Wikimedia Commons. Their credits are printed in the
  footer, linked to their source pages and licences. Every photograph added later
  is credited as its licence asks.
* The Code.Socratic replica is the page's one interface picture.
* No stock photography of people, and never the Möbius (ADR-026).
* Every picture has a real `alt`, or `alt=""` when the text beside it says the
  same thing.

## 10. Accessibility

WCAG 2.2 AA, enforced by `check:contrast` (the token pairs) and by axe over
every story (what renders).

* Semantic HTML: one `h1` per page, no skipped heading level, landmarks
  (`header`, `nav`, `main`, `footer`), lists for lists (add `role="list"` where a
  list's markers are removed and the list matters to a screen reader).
* The **skip link** (`components/site/skip-link.tsx`, rendered by the layout) is
  the first focusable element and lands on `<main id="main">`.
* A **visible focus ring** on everything focusable: 2px in `--band-focus`, offset 4px
  (`base.css`). Never `outline: none` without a replacement.
* Focus management for anything that opens; the replica's tabs follow the tabs
  pattern (roving `tabindex`, arrows, Home, End).
* Every SVG labelled or `aria-hidden`. No meaning carried by colour alone.
* Text split for the spine (crossing parts) still reads as one sentence: the
  parts are inline spans inside one heading, with a real space between them.
* Reduced motion and no script give the whole page (rule 8).

## 11. Stories

* **Every component has a story before a page uses it**, in
  `<name>.stories.tsx` beside it. Cover the default, every variant, long
  content, and the narrow layout (a story with a 390px viewport) where the
  component changes under 900px.
* Stories render on a band: the preview wraps each in `data-band="paper"`.
  Set `parameters: { band: "dark" }` to render on charcoal, or `band: false` for
  a story that brings its own bands (a page).
* Pages are compositions of storied components, with a page story
  (`stories/pages/`) that renders the page component itself, so the two cannot
  drift.
* `stories/foundations/Tokens.stories.tsx` shows the tokens: the roles and their
  pairs in both bands, the type steps, the space scale and the spine's geometry.

## 12. Gates

Every one passes before a merge:

* `npm run typecheck` — TypeScript, strict.
* `npm run build` — the strict Next build; no `ignoreBuildErrors`.
* `npm run test:storybook` — every story in Chromium; play functions run and
  **axe violations fail**.
* `npm run check:contrast` — every declared pair at AA, in every band. It is
  the gate for **text contrast**: axe cannot judge most text on the studio
  pages, because the spine's `::before` line sits behind it, and reports it as
  "incomplete", not as a pass (ADR-032).
* For the games, also `npm test` and `npm run test:e2e`; and, whenever
  anything global changes (`styles/`, `app/layout.tsx`, `app/fonts.ts`,
  `components/games/base.css`), `npm run games:parity -- compare` against a
  baseline taken before the change (ADR-029).

There is no CSS linter.

## 13. Copy and voice

* Every string the site renders lives in `data/angeronia.ts`. Components take
  content from it (or as props), never inline copy of their own.
* **Third person** (ADR-028): no "I", "me", "my", "we", "our" or "us" in what the
  studio says about itself. Name Pratik Kubal, or say "the studio" or "Angeronia
  Labs". **Never a pronoun for Pratik** (no he, she or they). "You" for the
  reader stays. Product UI inside the replica stays as the product shows it.
* No sample-test or hidden-test metrics on the page (the owner's ruling,
  ADR-023); the replica's Results tab is product UI and keeps them.

## 14. Packages never reinstalled

No `@salesforce-ux/*` package (ADR-015), no `@carbon/*` package and no
`next-themes` (ADR-023, ADR-024), and no `@fontsource/*` (fonts come from
`assets/fonts/` through `next/font/local`, ADR-034).
