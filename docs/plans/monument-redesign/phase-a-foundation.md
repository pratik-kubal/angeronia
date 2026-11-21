# Phase A: foundation

**One agent. Runs alone, first.** Read `README.md`, `content.md` and `design.md`
in this folder before anything else.

**Outcome:** Carbon, Sass, `next-themes` and the Möbius are gone. The new
tokens, base styles, fonts, data file and shared components are in. Every
section exists as a working stub with its final name. The games render exactly
as they did. All gates pass. One commit.

Do the steps in order. Do not skip step 1: it must run before any file changes.

---

## Step 1. Record how the games render today

The games share the root layout, so they currently receive Carbon's global
stylesheet. Removing it must not change them. Prove it by measurement.

Create `scripts/games-parity.ts`:

```ts
// Proves a change to the studio's global CSS did not change how the games render.
//
//   npx tsx scripts/games-parity.ts baseline     before the change
//   npx tsx scripts/games-parity.ts compare      after it
//
// Both need a PRODUCTION server on PARITY_PORT (default 3417):
//   npm run build && npx next start -p 3417
//
// It loads the launcher and each game in a fresh browser with the clock, the
// random source and motion pinned, and records the computed style of every
// element. `compare` fails if any element at or inside a game's shell differs.
import { chromium, type Page } from "playwright";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

const PORT = Number(process.env.PARITY_PORT ?? 3417);
const OUT = ".parity";
const ROUTES = ["/games", "/games/sudoku", "/games/solitaire", "/games/paint-by-numbers"];
const VIEWPORTS = [
  { name: "desktop", width: 1280, height: 800 },
  { name: "phone", width: 393, height: 852 },
];
const SHELLS = ".sdk-shell, .sol-shell, .gml-shell, .ctp-shell";

type Row = { key: string; inShell: boolean; style: Record<string, string> };

/** Same puzzle, same deal, same season on every run. */
const PIN = `(() => {
  let s = 20261120;
  const next = () => (s = (s * 16807) % 2147483647) / 2147483647;
  Math.random = next;
  const fill = (arr) => { for (let i = 0; i < arr.length; i++) arr[i] = Math.floor(next() * 256); return arr; };
  try { Object.defineProperty(globalThis.crypto, "getRandomValues", { value: fill }); } catch {}
})();`;

async function snapshot(page: Page): Promise<Row[]> {
  return page.evaluate((shells) => {
    const skip = new Set(["SCRIPT", "STYLE", "LINK", "META", "TITLE", "HEAD", "NEXTJS-PORTAL", "NEXT-ROUTE-ANNOUNCER"]);
    const path = (el: Element) => {
      const parts: string[] = [];
      let node: Element | null = el;
      while (node && node !== document.documentElement) {
        const parent: Element | null = node.parentElement;
        const index = parent ? Array.from(parent.children).indexOf(node) : 0;
        parts.unshift(`${node.tagName.toLowerCase()}[${index}]`);
        node = parent;
      }
      return "html/" + parts.join("/");
    };
    const rows: { key: string; inShell: boolean; style: Record<string, string> }[] = [];
    const all = [document.documentElement, ...Array.from(document.querySelectorAll("body, body *"))];
    for (const el of all) {
      if (skip.has(el.tagName)) continue;
      const computed = getComputedStyle(el);
      const style: Record<string, string> = {};
      for (let i = 0; i < computed.length; i++) {
        const prop = computed[i];
        if (prop.startsWith("--")) continue; // custom properties are not rendering
        style[prop] = computed.getPropertyValue(prop);
      }
      rows.push({ key: path(el), inShell: el.closest(shells) !== null, style });
    }
    return rows;
  }, SHELLS);
}

async function capture(): Promise<Record<string, Row[]>> {
  const browser = await chromium.launch();
  const result: Record<string, Row[]> = {};
  for (const viewport of VIEWPORTS) {
    for (const route of ROUTES) {
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
        reducedMotion: "reduce",
        colorScheme: "light",
      });
      const page = await context.newPage();
      await page.addInitScript(PIN);
      await page.clock.setFixedTime(new Date("2026-06-15T12:00:00"));
      await page.goto(`http://localhost:${PORT}${route}`, { waitUntil: "networkidle" });
      await page.waitForTimeout(1500);
      result[`${viewport.name} ${route}`] = await snapshot(page);
      await context.close();
    }
  }
  await browser.close();
  return result;
}

async function main() {
  const mode = process.argv[2];
  if (mode !== "baseline" && mode !== "compare") {
    console.error("usage: tsx scripts/games-parity.ts baseline|compare");
    process.exit(2);
  }
  mkdirSync(OUT, { recursive: true });
  const file = `${OUT}/baseline.json`;
  const now = await capture();

  if (mode === "baseline") {
    writeFileSync(file, JSON.stringify(now));
    const count = Object.values(now).reduce((n, rows) => n + rows.length, 0);
    console.log(`baseline written: ${Object.keys(now).length} screens, ${count} elements`);
    return;
  }

  if (!existsSync(file)) {
    console.error("no baseline. Run `baseline` on the tree before the change.");
    process.exit(2);
  }
  const before: Record<string, Row[]> = JSON.parse(readFileSync(file, "utf8"));
  let failures = 0;
  for (const [screen, rows] of Object.entries(now)) {
    const old = new Map((before[screen] ?? []).map((row) => [row.key, row]));
    const outside = new Set<string>();
    for (const row of rows) {
      const was = old.get(row.key);
      if (!was) {
        if (row.inShell) { failures++; console.log(`FAIL ${screen}: new element in a shell: ${row.key}`); }
        continue;
      }
      for (const [prop, value] of Object.entries(row.style)) {
        if (was.style[prop] === value) continue;
        if (row.inShell) {
          failures++;
          console.log(`FAIL ${screen}: ${row.key} { ${prop}: ${was.style[prop]} -> ${value} }`);
        } else {
          outside.add(`${row.key.split("/").slice(0, 4).join("/")} ${prop}`);
        }
      }
    }
    for (const key of old.keys()) {
      if (!rows.some((row) => row.key === key) && old.get(key)!.inShell) {
        failures++;
        console.log(`FAIL ${screen}: element gone from a shell: ${key}`);
      }
    }
    if (outside.size) console.log(`note ${screen}: ${outside.size} differences outside the shells (expected: html, body, the skip link)`);
  }
  if (failures) {
    console.log(`\n${failures} difference(s) inside a game. The change is not safe yet.`);
    process.exit(1);
  }
  console.log("\nno difference inside any game.");
}

main();
```

Then, **on the untouched tree**:

```bash
echo ".parity/" >> .gitignore
echo ".taste-skill/" >> .gitignore
npm run build && (npx next start -p 3417 &) && sleep 4
npx tsx scripts/games-parity.ts baseline
npx tsx scripts/games-parity.ts compare        # must print "no difference inside any game."
lsof -ti tcp:3417 | xargs kill
```

The second command compares the tree with itself. If it reports differences,
the capture is not deterministic: find what still varies (a timer, an
animation, a random source) and pin it before going on. Do not continue until
a self-compare is clean.

---

## Step 2. Record the decisions before the code

Append to `docs/design-system/DECISIONS.md`, after ADR-022 and before
"## 4. Plan closure". Also add one line to the list at the top of the file:
"ADR-023 … ADR-028 (2026-11-20): the studio site leaves Carbon for a dealt art
direction. **Read ADR-023 first for the current state.**" and change the
existing "Read ADR-015 first" sentence to say ADR-015 is now history.

```markdown
### ADR-023 — The studio site leaves Carbon; the look is a dealt art direction

**Recorded 2026-11-20, before the code, per the rule at the top of this file.**

The owner's ruling: "Break away from Carbon and prioritize design taste skill.
You have permission to start a new." The site is becoming a consulting
credibility page for fixed-scope AI agent work, and its look is now set by the
`design-taste-frontend` skill, not by a component library.

**What ships.** The direction "The name as a monument" (draw seed 54426271),
chosen by the owner from built drafts: the studio name fitted to the full width
of the first screen over a night photograph of Philadelphia, then a small, calm
page. Type is Imbue in capitals for the name and titles and Albert Sans for
text, redrawn from the dealt Epilogue by the owner after a side-by-side
comparison. The palette is the dealt "Warm black, gold". The full specification
is `docs/plans/monument-redesign/design.md`.

**What this supersedes.**

| Superseded | By |
|---|---|
| ADR-015's choice of `@carbon/react` as the design system | No component library. Plain CSS: `styles/tokens.css`, `base.css`, `motion.css`, and one CSS Module per component. |
| ADR-016 (the grid wrapper, the card grid) | One 12-column `.frame` in `styles/base.css`. |
| ADR-017 (Carbon ships whole) | Carbon ships not at all. |
| ADR-018 (`check:theme`) | `check:contrast`, which checks the new tokens' pairings. |
| D10 and O12 (Carbon icons) | The studio pages use no icon set. One inline arrow marks an external link. |
| D11 and O11 (IBM Plex) | Imbue and Albert Sans, self-hosted through `next/font`. |
| Design rules 1 to 9 and 12 as written | `DESIGN-RULES.md`, rewritten the same day. |

**What it costs.** The site no longer shares a typeface, a hue or a geometry
with Code.Socratic; that convergence (ADR-015, C5) is given up on purpose.
Every component is now the site's own to maintain. And a contrast or layout
fault is caught by the axe pass, `check:contrast` and the skill's inspector,
not by a vendor's tokens.

**What does not change.** Storybook as the place a component is seen first
(D4), with axe failing the run. Copy in `data/angeronia.ts`. Next.js 15. No
`@salesforce-ux/*` package, ever. The games and their boundary (ADR-019).

### ADR-024 — The home page no longer lists the games

**Recorded 2026-11-20, before the code.** Supersedes ADR-020. ADR-019, ADR-021
and ADR-022 stand unchanged.

The home page argues for one thing now, and asks for one action. "Games for a
break" is removed from it. The games stay at `/games`, reachable by anyone with
the link or the saved home-screen app; nothing on the studio site links to
them, they stay out of the header, the footer and `sitemap.ts`, and they stay
`noindex`. `games` stays in `data/angeronia.ts` because the launcher reads it.

### ADR-025 — The Möbius and the session replica are retired

**Recorded 2026-11-20, before the code.** Supersedes ADR-012, ADR-013 and
ADR-014.

The first screen is a photograph and a name, so the hand-drawn Möbius has no
place; the owner chose to retire it. `mobius-figure.tsx`, its stories, its two
colour tokens and the `roughjs` dependency are deleted, and with them the
autoplay waiver.

The Code Socratic session replica is replaced by four small product panels in
Proof of work (`proof-panels.tsx`). They are rebuilt in HTML in the product's
current look, dark aubergine and blush, with every word taken from the
product's own public pages. The replica it replaces copied a preview the
product itself removed on 2026-11-07, which is the drift ADR-014 warned about.
The panels carry the product's palette locally; that one file is the exception
to "tokens only".

### ADR-026 — One colour scheme

**Recorded 2026-11-20, before the code.** Supersedes O4.

The dealt direction is a dark page with one white closing section, and the
owner chose not to design a light variant. The light/dark switch, the
`ThemeProvider`, `lib/theme.ts` and `next-themes` are removed. `color-scheme:
dark` is set on the studio pages only, so the games keep following the device.

### ADR-027 — Motion returns

**Recorded 2026-11-20, before the code.** Supersedes design rule 8 and the part
of D5 that removed enter-reveals.

The page gets a motion layer: the first screen settles in 1.2 seconds, the
photograph drifts slowly, the parts of each section arrive once as they enter
view, and every control answers the hand. Transform, opacity and clip-path
only. Nothing is tied to scroll position, nothing replays, and with
JavaScript off or reduced motion on the page is simply in its finished state.
The dealt signature move, a crossfade between photographs of one framing,
needs photographs that do not exist; it was redrawn to the settle and drift of
the one photograph.

### ADR-028 — The first-screen photograph is found, credited and self-hosted

**Recorded 2026-11-20, before the code.**

The studio has no photographs of its own. The first screen uses "Philadelphia
Skyline" by Andrew Parlette, taken from the South Street Bridge on 2023-03-13,
under CC BY 2.0. It is cropped (the left 27% is removed, where a tower carries
a company's sign), the crop is committed at
`scripts/sources/hero-schuylkill-night.jpg`, and `scripts/build-hero.mjs`
makes the served sizes. The credit, the licence and the word "cropped" are in
the page footer, as the licence requires.

The first photograph tried was a Library of Congress scan that turned out to
be mirrored, 20 to 30 years old, and showing a bank's sign. Check any found
photograph for mirroring, age and visible brand names before using it.
```

Replace `docs/design-system/DESIGN-RULES.md` with:

```markdown
# Design rules — angeronia.com

Binding for every UI change to the studio pages. `CLAUDE.md` carries the same
rules in summary; if the two disagree, this file wins.

Deviating from a rule needs an entry in [`DECISIONS.md`](DECISIONS.md) **before**
the code changes.

**Scope.** The studio pages: `/`, `/privacy`, `/terms`. The games keep their own
look and sit outside these rules; [ADR-019](DECISIONS.md) draws the boundary.

> Rewritten 2026-11-20. The version this replaces described IBM Carbon and is
> in the git history; the reasoning for the move is [ADR-023](DECISIONS.md).

## 1. The look is a dealt direction, not a library

"The name as a monument": the studio name is the headline, fitted to the full
width of the first screen; everything after it is small and calm. The
specification is `docs/plans/monument-redesign/design.md`. There is no
component library, CSS framework, utility library or icon set.

## 2. Tokens only

Colour, type sizes, spacing, durations and easings come from
`styles/tokens.css`. No raw value in a component. One exception:
`components/site/proof-panels.module.css` carries Code.Socratic's palette,
because those panels are pictures of another product (ADR-025).

## 3. Colour

One ground (`--bg`), one ink (`--ink`), one accent (`--accent`). Running text
is the full ink; `--muted` is for secondary notes. Gold marks the action and
one price, and nothing else. Surfaces are told apart by tone, never by a line
or a shadow. The closing section inverts to white.

## 4. Type

Imbue, in capitals, for the name, titles and statements. Albert Sans for
everything read at length. Six sizes, no others. A heading never runs past two
lines at any width; author the break.

## 5. Space and frame

One 12-column grid (`.frame`), one pair of equal outer margins, three anchor
lines (columns 1, 4 and 8). No section sits on one side with the other half
empty. Sections are `--section` apart.

## 6. Shape

Square corners everywhere. No shadows, no gradients except the neutral scrims
on the photograph, no hairline rules, no outlined boxes. The only bar is 4px.

## 7. Motion

Transform, opacity and clip-path. Entrances once, staggered, varied by content.
Nothing tied to scroll position. Finished state without JavaScript or with
reduced motion (ADR-027).

## 8. Pictures

Real ones only: the credited photograph and real product panels. No stock
illustration, no abstract shapes, no icons in tiles. A found photograph is
checked for mirroring, age and brand names, and credited in the footer
(ADR-028).

## 9. Accessibility

Semantic HTML, a skip link, a visible focus ring, one `h1`, a heading on every
section, 44px touch targets, no colour-only meaning, WCAG 2.2 AA.

## 10. Story before page

Every component has a story before it is used on a page. `Pages/Home` renders
`HomePage`, the same component `app/page.tsx` renders.

## 11. Truth

Nothing untrue ships. No customer names, logos, quotes or counts. "Built",
never "shipped". The copy is checked against the product's code, not its
plans. Prices live once, in `PRICES`.

## 12. Gates

`typecheck`, the strict build, `test:storybook` (axe), `check:contrast`, the
games' `npm test` and `test:e2e`, and the design skill's inspector at 0 FAIL.
Styles live in `.css` files; the `style` attribute may carry only a custom
property whose value is data.

## 13. Content

Copy lives in `data/angeronia.ts`, not in components.

## 14. Never

No `@salesforce-ux/*` package (ADR-015). No tracker, cookie or third-party
embed without a decision recorded here and a change to the privacy policy.
```

Update `CLAUDE.md`: keep the "Games (outside the design system)" section as it
is except (a) delete the sentence "The home page's Games section links to them
too (**ADR-020**); nothing else does." and write "Nothing on the studio site
links to them (**ADR-024**)." and (b) in the bullets, replace "They render
under the root layout, so Carbon's reset reaches them" with "They render under
the root layout. The studio's global CSS is three rules (`body`, `.site-root`,
the skip link); everything else is scoped to `.studio`, so nothing reaches
them" and delete the bullet about `[data-hidden]`. Replace everything above the
Games section with:

```markdown
# CLAUDE.md — angeronia.com

The site for Angeronia Labs LLC (Next.js 15 App Router, React 19, TypeScript):
one page that sells fixed-scope AI agent work, plus privacy and terms. Its look
is an art direction dealt by the `design-taste-frontend` skill, "The name as a
monument". There is no component library.

## Current state (2026-11-20)

The site ran on IBM Carbon until 2026-11-20 and on SLDS 2 before that. Both are
gone from the studio pages. The live documents are:

* **`docs/design-system/DESIGN-RULES.md`** — the binding contract.
* **`docs/design-system/DECISIONS.md`** — every decision. **Read ADR-023 first.**
* **`docs/plans/monument-redesign/`** — the specification the pages were built from.

Record any deviation in `DECISIONS.md` **before** writing the code that deviates.

## Design contract (summary of DESIGN-RULES.md)

1. No component library, CSS framework or icon set. Plain CSS: `styles/tokens.css`,
   `styles/base.css`, `styles/motion.css`, and one CSS Module per component.
2. Tokens only. No raw colour, size or duration in a component, except in
   `proof-panels.module.css`, which pictures another product.
3. One ground, one ink, one accent. Gold marks the action and one price.
4. Imbue capitals for the name and titles, Albert Sans for text. Six sizes.
   Headings never run past two lines.
5. One 12-column `.frame`, equal margins, anchor lines at columns 1, 4 and 8.
6. Square corners. No shadows, hairlines or outlined boxes. No gradients except
   the scrims on the photograph.
7. Motion: transform, opacity, clip-path; once; finished state without JS.
8. Real pictures only, credited. Check a found photograph for mirroring, age
   and brand names.
9. One `h1`, a heading on every section, a skip link, visible focus, AA.
10. A story before the page. `Pages/Home` renders `HomePage`.
11. Nothing untrue ships. Prices live once, in `PRICES`.
12. Copy lives in `data/angeronia.ts`.
13. Global CSS may hold only `body`, `.site-root`, `.visually-hidden`,
    `.skip-link` and rules that start with `.studio`, `html:has(.studio)` or
    `.js .studio`. Nothing global may reach a game.
14. No `@salesforce-ux/*` package is ever reinstalled.
```

and replace the "Adding a component" and "Commands" sections (and the closing
"Sister product" paragraph) with:

```markdown
## Adding a component

A section goes in `components/site/` as `name.tsx`, `name.module.css` and
`name.stories.tsx`. It takes its words from `data/angeronia.ts`, lays out on
`.frame`, and uses tokens only. Client components are the exception: today
only `fit-text.tsx`, `header-state.tsx` and `reveal.tsx`.

## Commands

```bash
npm run dev            # Next dev (Turbopack)
npm run build          # strict build
npm run storybook      # Storybook 10 (nextjs-vite)

npm run typecheck      # tsc --noEmit
npm run check:contrast # the tokens' pairings against WCAG 2.2
npm run test:storybook # every story in Chromium; axe violations fail
npm test               # the games' unit tests (Vitest, node)
npm run test:e2e       # the games end to end (Playwright)
npm run games:parity -- baseline|compare   # prove a global CSS change left the games alone

npm run build:hero     # the first-screen photograph's served sizes, from scripts/sources/
npm run build:og       # the social image
npm run solitaire:cards / solitaire:deals / games:icon / color-tap:* # unchanged
```

Code.Socratic (`../code-socratic`) is the studio's own product. The two sites
no longer share a look (ADR-023). Its current interface is aubergine and blush;
`proof-panels.tsx` pictures it.
```

---

## Step 3. Dependencies

```bash
npm uninstall @carbon/react @carbon/icons-react @carbon/themes @carbon/colors next-themes roughjs sass-embedded @fontsource/ibm-plex-sans @fontsource/ibm-plex-mono
npm install --save-dev @fontsource-variable/imbue @fontsource/albert-sans
```

In `package.json` `scripts`: delete `build:favicon`, `build:logos` and
`check:theme`; add

```json
"check:contrast": "node scripts/check-contrast.mjs",
"build:hero": "node scripts/build-hero.mjs",
"build:og": "tsx scripts/build-og.ts",
"games:parity": "tsx scripts/games-parity.ts"
```

(`check-contrast.mjs`, `build-hero.mjs` and `build-og.ts` are written in later
phases; adding the script names now keeps `package.json` out of their way.)

In `next.config.mjs`: delete the `experimental.optimizePackageImports` block
and the `sassOptions` line, with their comments. Leave redirects, rewrites and
headers exactly as they are.

In `.github/workflows/ci.yml`: delete the "Theme gate" step and its comment.
Phase C adds the contrast step.

Delete: `scripts/carbon-tokens.mjs`, `scripts/check-contrast.mjs`,
`scripts/retint-favicon.mjs`, `scripts/build-logos.mjs`, `scripts/oklab.mjs`,
`docs/design-system/theme-report.md`, `lib/theme.ts`, `globals.d.ts` only if it
declares nothing but Sass or Carbon modules (read it first; keep anything else).

---

## Step 4. Global styles

Delete `styles/_config.scss`, `styles/_themes.scss`, `styles/_site.scss`,
`styles/globals.scss`.

Create `styles/tokens.css` from `design.md` §1 and `styles/motion.css` from
`design.md` §6.3, both verbatim.

Create `styles/base.css`:

```css
/* Global to every route, the games included. Keep it to what cannot be scoped:
   everything else is under .studio or in a CSS Module (ADR-019, ADR-023). */
body {
  margin: 0;
}

/* The root layout's wrapper. The games sit inside it too, as a flex child. */
.site-root {
  display: flex;
  flex-direction: column;
  min-block-size: 100dvh;
}

.visually-hidden {
  position: absolute;
  inline-size: 1px;
  block-size: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
}

/* System colours, because this link also serves the games, which have no tokens. */
.skip-link:focus {
  position: fixed;
  z-index: 9000;
  inset-block-start: 1rem;
  inset-inline-start: 1rem;
  inline-size: auto;
  block-size: auto;
  margin: 0;
  padding: 0.75rem 1rem;
  overflow: visible;
  clip-path: none;
  white-space: normal;
  background: Canvas;
  color: CanvasText;
  font: 1rem/1.5 system-ui, sans-serif;
  outline: 3px solid Highlight;
}

/* ── The studio's own base. Nothing below reaches a game. ─────────────────── */
html:has(.studio) {
  background: var(--bg);
  color-scheme: dark;
  scroll-padding-block-start: calc(var(--header) + 1rem);
  -webkit-text-size-adjust: 100%;
  text-size-adjust: 100%;
}

.studio {
  flex: 1 0 auto;
  display: flex;
  flex-direction: column;
  background: var(--bg);
  color: var(--ink);
  font-family: var(--text);
  font-size: var(--step-body);
  line-height: 1.55;
  font-kerning: normal;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
}

.studio *,
.studio *::before,
.studio *::after {
  box-sizing: border-box;
}

.studio :where(h1, h2, h3, h4, p, ul, ol, dl, dd, figure, blockquote, fieldset, pre) {
  margin: 0;
}

.studio :where(ul, ol) {
  padding: 0;
  list-style: none;
}

.studio :where(h1, h2, h3, h4) {
  font: inherit;
  text-wrap: balance;
}

.studio :where(p) {
  text-wrap: pretty;
}

.studio :where(img, picture, svg) {
  display: block;
  max-inline-size: 100%;
}

.studio :where(a) {
  color: inherit;
  text-underline-offset: 0.18em;
  text-decoration-thickness: 0.07em;
}

.studio :where(mark) {
  background: none;
  color: inherit;
}

.studio :focus-visible {
  outline: var(--focus) solid var(--accent);
  outline-offset: var(--focus);
}

.studio ::selection {
  background: var(--accent);
  color: var(--accent-ink);
}

.studio main {
  flex: 1 0 auto;
}

/* ── Helpers every section uses. ──────────────────────────────────────────── */
.studio .frame {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  column-gap: var(--gutter);
  padding-inline: var(--m);
}

.studio .section {
  padding-block: var(--section);
}

.studio .display {
  font-family: var(--display);
  font-weight: 400;
  font-optical-sizing: auto;
  text-transform: uppercase;
  letter-spacing: -0.01em;
  line-height: 0.9;
}

.studio .h-head {
  font-family: var(--display);
  font-weight: 400;
  font-optical-sizing: auto;
  text-transform: uppercase;
  letter-spacing: -0.01em;
  line-height: 0.9;
  font-size: var(--step-head);
}

.studio .h-statement {
  font-family: var(--display);
  font-weight: 400;
  font-optical-sizing: auto;
  text-transform: uppercase;
  letter-spacing: -0.01em;
  line-height: 0.9;
  font-size: var(--step-statement);
}

.studio .lines > span {
  display: block;
  white-space: nowrap;
}

.studio .lead {
  font-size: var(--step-lead);
  line-height: 1.35;
}

.studio .small {
  font-size: var(--step-small);
  line-height: 1.45;
  color: var(--muted);
}

/* On a phone a section's own children take the whole width. Rows that use
   subgrid set their inner columns themselves. */
@media (max-width: 47.4375rem) {
  .studio .frame > * {
    grid-column: 1 / -1;
  }
}
```

---

## Step 5. `app/layout.tsx`

Replace the file:

```tsx
import type React from "react";
import type { Metadata } from "next";
import { Albert_Sans, Imbue } from "next/font/google";
import { SkipLink } from "@/components/site/skip-link";
import { BRAND, LINKS, SITE_URL, product, seo } from "@/data/angeronia";
import "@/styles/tokens.css";
import "@/styles/base.css";
import "@/styles/motion.css";

// Self-hosted by next/font: no request reaches Google at runtime. The two CSS
// variables are read by styles/tokens.css and nowhere else.
const display = Imbue({
  subsets: ["latin"],
  axes: ["opsz"],
  variable: "--font-display",
  display: "swap",
});

const text = Albert_Sans({
  subsets: ["latin"],
  variable: "--font-text",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: seo.title, template: `%s | ${BRAND.name}` },
  description: seo.description,
  authors: [{ name: BRAND.legal, url: SITE_URL }],
  creator: BRAND.legal,
  openGraph: {
    type: "website",
    url: SITE_URL,
    title: seo.ogTitle,
    description: seo.ogDescription,
    siteName: BRAND.name,
  },
  twitter: {
    card: "summary_large_image",
    title: seo.ogTitle,
    description: seo.ogDescription,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  alternates: { canonical: SITE_URL },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  name: BRAND.legal,
  alternateName: BRAND.name,
  url: SITE_URL,
  email: LINKS.email,
  description: seo.description,
  areaServed: "Worldwide",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Philadelphia",
    addressRegion: "PA",
    addressCountry: "US",
  },
  founder: { "@type": "Person", name: BRAND.founder, url: LINKS.linkedin },
  knowsAbout: ["AI agents", "Claude API", "LLM evaluation", "Agent cost modelling"],
  makesOffer: {
    "@type": "Offer",
    itemOffered: {
      "@type": "SoftwareApplication",
      name: product.name,
      applicationCategory: "EducationalApplication",
      url: LINKS.codeSocratic,
    },
  },
  sameAs: [LINKS.linkedin, LINKS.github],
};

// Motion is gated on this class. If the page's scripts never run, it comes off
// again, so nothing can stay hidden (design.md §6.1).
const GATE = `document.documentElement.classList.add("js");setTimeout(function(){if(!window.__angReady)document.documentElement.classList.remove("js")},3000);`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${display.variable} ${text.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: GATE }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        <SkipLink />
        <div className="site-root">{children}</div>
      </body>
    </html>
  );
}
```

`suppressHydrationWarning` stays on `<html>` because the gate script adds a
class before React hydrates.

If `next/font` rejects `axes: ["opsz"]` for Imbue, remove that line and report
it; do not substitute another typeface.

---

## Step 6. Data

Replace `data/angeronia.ts` with the file in `content.md` §2, verbatim.

---

## Step 7. Components

### 7.1 Delete

`components/site/`: `about.*`, `code-block.tsx`, `code-socratic-demo.*`,
`color-scheme-switcher.*`, `contact.*`, `games.*`, `mobius-figure.*`,
`philosophy.*`, `process.*`, `product-spotlight.*`, `services.*`,
`site-footer.*`, `theme-provider.tsx`, and the old `hero.*`, `site-header.*`,
`legal-page.*`, `brand-mark.*`, `skip-link.*` (all are rewritten below).

`components/ui/`: everything (`avatar`, `card`, `cluster`, `external-link`,
`grid`, `media-object`, `section`, `text`, with their stories).

`stories/foundations/`: everything. `stories/pages/Home.stories.tsx`.
`.storybook/foundations.css`.

### 7.2 Shared components, final in this phase

`components/site/skip-link.tsx`

```tsx
import { copy } from "@/data/angeronia";

/** The first focusable thing on every page, the games included: jumps to #main. */
export function SkipLink() {
  return (
    <a href="#main" className="visually-hidden skip-link">
      {copy.skipLink}
    </a>
  );
}
```

`components/site/reveal.tsx`

```tsx
"use client";

import * as React from "react";

declare global {
  interface Window {
    __angReady?: boolean;
  }
}

type RevealProps<T extends keyof React.JSX.IntrinsicElements> = {
  as?: T;
  children: React.ReactNode;
} & Omit<React.JSX.IntrinsicElements[T], "children" | "ref">;

/**
 * Marks a block so its `data-reveal` children arrive once when it enters view
 * (styles/motion.css). It only sets an attribute: with scripts off, or reduced
 * motion on, the children are simply there.
 */
export function Reveal<T extends keyof React.JSX.IntrinsicElements = "div">({
  as,
  children,
  ...rest
}: RevealProps<T>) {
  const Tag = (as ?? "div") as React.ElementType;
  const ref = React.useRef<HTMLElement>(null);
  const [seen, setSeen] = React.useState(false);

  React.useEffect(() => {
    window.__angReady = true;
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setSeen(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setSeen(true);
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag ref={ref} data-reveal-root="" data-in={seen ? "true" : undefined} {...rest}>
      {children}
    </Tag>
  );
}
```

`components/ui/button-link.tsx` and `button-link.module.css`: build to
`design.md` §5.1. Signature:

```tsx
export interface ButtonLinkProps {
  href: string;
  variant?: "accent" | "ink";
  size?: "md" | "sm";
  className?: string;
  children: React.ReactNode;
}
export function ButtonLink(props: ButtonLinkProps): React.JSX.Element;
```

`components/ui/external-link.tsx` and `external-link.module.css`: build to
`design.md` §5.2. Signature
`ExternalLink({ href, className, children }: { href: string; className?: string; children: React.ReactNode })`.
It is a server component (no icon library, nothing to pass across the
boundary).

`components/site/brand-mark.tsx` and `brand-mark.module.css`: build to
`design.md` §5.3. Signature `BrandMark({ size = 22 }: { size?: number })`.
The SVG and its two shapes are in the old `brand-mark.tsx` in git history:

```
<circle cx="17.5" cy="16" r="12.5" />
<path d="M11.2 7.6 L23.4 14.1 L16.9 15.4 L20.2 22.1 L17.1 23.5 L13.8 16.8 L9.4 21.2 Z" />
```

Each of the three gets a story file with `Default` (and, for `ButtonLink`,
`Ink` on a white ground and `Small`).

### 7.3 Section stubs

Create each file below as a **stub**: the final export name, the final outer
element with its final `id` and `aria-labelledby`, and the section's heading
from the data file inside a `.frame section`. No further layout. Each gets an
empty `.module.css` and a `.stories.tsx` with one `Default` story
(`parameters: { layout: "fullscreen" }`, title `Sections/<Name>`). Phase B
replaces all three files of each.

| File | Export | Outer element | Heading shown by the stub |
|---|---|---|---|
| `site-header.tsx` | `SiteHeader({ variant }: { variant: "overlay" \| "solid" })` | `<header>` | brand name and the four links |
| `header-state.tsx` | `HeaderState({ variant, className, children })`, `"use client"` | `<header data-stuck=…>` | (stub: renders `<header data-stuck="true">`) |
| `hero.tsx` | `Hero()` | `<section aria-labelledby="hero-name">` | `<h1 id="hero-name">{hero.name}</h1>` |
| `fit-text.tsx` | `FitText({ children }: { children: string })`, `"use client"` | `<span data-fit>` | (stub: renders the span, no fitting) |
| `intro.tsx` | `Intro()` | `<section aria-labelledby="intro-heading">` | `intro.heading` as `h2` |
| `problems.tsx` | `Problems()` | `<section aria-labelledby="problems-heading">` | `problems.heading.join(" ")` |
| `offers.tsx` | `Offers()` | `<section id="offers" aria-labelledby="offers-heading">` | `offers.headline.line` + price |
| `proof.tsx` | `Proof()` | `<section id="proof" aria-labelledby="proof-heading">` | `proof.heading` |
| `proof-panels.tsx` | `ProofPanel({ id, className }: { id: ProofPanelId; className?: string })` | `<figure>` | (stub: the caption only) |
| `process.tsx` | `Process()` | `<section id="process" aria-labelledby="process-heading">` | `process.heading` |
| `faq.tsx` | `Faq()` | `<section id="faq" aria-labelledby="faq-heading">` | `faq.heading` |
| `product.tsx` | `Product()` | `<section aria-labelledby="product-heading">` | `product.heading.join(" ")` |
| `close.tsx` | `Close({ variant = "full" }: { variant?: "full" \| "compact" })` | `<footer id="contact">` | `close.heading.join(" ")` when full |
| `legal-page.tsx` | `LegalPage({ document }: { document: LegalDocument })` | `<div className="studio">` | the whole document, unstyled, with `SiteHeader variant="solid"`, `<main id="main">` and `Close variant="compact"` |

`components/site/home-page.tsx`, **final**:

```tsx
import { SiteHeader } from "@/components/site/site-header";
import { Hero } from "@/components/site/hero";
import { Intro } from "@/components/site/intro";
import { Problems } from "@/components/site/problems";
import { Offers } from "@/components/site/offers";
import { Proof } from "@/components/site/proof";
import { Process } from "@/components/site/process";
import { Faq } from "@/components/site/faq";
import { Product } from "@/components/site/product";
import { Close } from "@/components/site/close";

/**
 * The home page. `app/page.tsx` and the `Pages/Home` story both render this,
 * so the page and its story cannot drift (design rule 10).
 */
export function HomePage() {
  return (
    <div className="studio">
      <SiteHeader variant="overlay" />
      <main id="main">
        <Hero />
        <Intro />
        <Problems />
        <Offers />
        <Proof />
        <Process />
        <Faq />
        <Product />
      </main>
      <Close />
    </div>
  );
}
```

`app/page.tsx` becomes:

```tsx
import { HomePage } from "@/components/site/home-page";

export default function Home() {
  return <HomePage />;
}
```

`app/privacy/page.tsx` and `app/terms/page.tsx` keep calling
`<LegalPage document={…} />`; change nothing in them unless an import moved.

`stories/pages/Home.stories.tsx`: one `Default` story that renders
`<HomePage />`, `layout: "fullscreen"`. Phase C adds its tests.

---

## Step 8. Storybook

`.storybook/preview.tsx`: remove the Plex and `foundations.css` imports, the
`globals.scss` import, the `lib/theme` import, the `withColorScheme` decorator,
and the `colorScheme` global and toolbar. Import instead:

```ts
import "@fontsource-variable/imbue/opsz.css";   // if the package has no opsz.css, use its default index.css and report it
import "@fontsource/albert-sans/400.css";
import "@fontsource/albert-sans/500.css";
import "@fontsource/albert-sans/600.css";
import "../styles/tokens.css";
import "../styles/base.css";
import "../styles/motion.css";
import "./preview.css";
```

and decorate every story with `<div className="studio"><Story /></div>`.
Keep `a11y: { test: "error" }`, `backgrounds: { disable: true }` and the story
sort (`["Foundations", "Components", "Sections", "Pages"]`).

`.storybook/preview.css`: replace its contents with

```css
/* The same two families next/font serves in production, wired up for stories. */
.studio {
  --font-display: "Imbue Variable";
  --font-text: "Albert Sans";
}
```

`.storybook/main.ts`: remove the `GAMES` / `gameIcons` block and its entry in
`staticDirs` (no story shows the games any more), and remove the `viteFinal`
Sass options. Leave the rest.

Add `stories/foundations/Tokens.stories.tsx`: one story, title
`Foundations/Tokens`, that shows the nine colour tokens as flat swatches with
their names and the six type sizes each set in its own face with its name. No
copy beyond the token names.

Stories do not add the `js` class, so nothing is hidden in Storybook and axe
sees the finished state.

---

## Step 9. Prove the games are untouched

```bash
npm run build && (npx next start -p 3417 &) && sleep 4
npx tsx scripts/games-parity.ts compare
lsof -ti tcp:3417 | xargs kill
```

It must print "no difference inside any game."

If it reports differences inside a shell, they are properties the games used
to inherit from Carbon's `<body>` rules (for example font smoothing, a font
feature, letter spacing or colour). **Restore them in
`components/games/base.css`**, on the shell selector that file already uses,
giving each the value shown before the arrow in the report. That file exists
to hold the defaults the games were built on, and it is the one games file
this plan lets you edit. Then update its opening comment, which still says the
root layout gives the games Carbon's reset: say the studio's global CSS is now
three rules and that the values below reproduce what the games were measured
against. Do not edit any other game file, and do not add a global rule to fix
a game.

Re-run until the compare is clean. Then:

```bash
npm test
E2E_PORT=3417 npm run test:e2e
```

---

## Step 10. Gates, then commit

All must pass:

```bash
npm run typecheck
npm run build
npm test
npm run test:storybook
grep -rIl -E "@carbon|cds--|next-themes|roughjs|\.scss" app components lib styles data stories .storybook scripts package.json next.config.mjs   # prints nothing
```

Open `http://localhost:3417/` on a dev server and check: warm-black page, the
stub headings in white, the skip link appears on Tab, `/privacy` and `/terms`
render, `/games` and one game look as before.

Commit everything except `.parity/` and `.taste-skill/`:

```
Leave Carbon: new tokens, base, fonts and data; sections stubbed (ADR-023 to ADR-028)

The studio pages drop @carbon/react, Sass, next-themes and the Möbius for
plain CSS and the dealt direction in docs/plans/monument-redesign/. Every
section is a stub with its final name; Phase B fills them. The games' computed
styles are unchanged (scripts/games-parity.ts).
```

End the message with the co-author line your session's instructions give.

## Report back

* The parity result before and after, and anything you had to restore in
  `components/games/base.css`.
* Any place the plan did not match the repository (a file that was not where
  the plan said, an import that had to change).
* Whether `axes: ["opsz"]` and `@fontsource-variable/imbue/opsz.css` worked.
* The gate outputs.
