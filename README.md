# angeronia.com

Marketing site for **Angeronia Labs LLC**, a software engineering studio in
Philadelphia, and the maker of [Code.Socratic](https://www.code-socratic.com).

Built on **the spine**: plain CSS, Hanken Grotesk, near-black ink on off-white
paper, and one 2px line down the page that every statement steps across. The
owner chose the design on 2026-11-25
([`DECISIONS.md`](docs/design-system/DECISIONS.md) ADR-023). Storybook is the
source of truth for the UI: every component has a story before it appears on a
page, and the page itself is a story.

> The port of the draft is in place (ADR-031) and Carbon is gone.

## Stack

| | |
|---|---|
| Framework | Next.js 15 (App Router), React 19, TypeScript — statically prerendered, no backend |
| Styles | Plain CSS: `styles/tokens.css` + `styles/base.css`, and a CSS Module per component |
| Type | Hanken Grotesk 400/500/600; IBM Plex Mono 400 for code only — self-hosted via `next/font` |
| Colour | One scheme: paper and ink, one charcoal band, sage only on buttons |
| Storybook | 10.x with `@storybook/nextjs-vite`, `addon-a11y`, `addon-vitest` |

No CSS framework, no utility library, no CSS-in-JS, no Sass and no icon set on
the studio site. The games below are the one exception.

## Develop

```bash
npm install
npm run dev              # http://localhost:3000 (npm run dev -- --port <n> if it is taken)
npm run storybook        # http://localhost:6006
npm run build            # production build (fully static)
```

### Gates

All four must pass to merge, and CI runs them on every pull request.

```bash
npm run typecheck        # tsc --noEmit, strict
npm run check:contrast   # every colour pair declared in styles/tokens.css, at AA, in every band
npm run test:storybook   # every story in Chromium, axe violations fail
npm run build            # the strict build
```

There is no CSS linter: the axe pass over every story is the gate that catches
real problems ([`DECISIONS.md`](docs/design-system/DECISIONS.md) ADR-018,
ADR-030).

### The games

[`/games/sudoku`](docs/games/sudoku.md), [`/games/solitaire`](docs/games/solitaire.md)
and [`/games/paint-by-numbers`](docs/games/color-tap.md) (Color Tap), and the `/games`
launcher of their icons (ADR-021), are games, not pages of the studio site. Sudoku and
Solitaire moved here from the founder's portfolio; Color Tap was made here (ADR-022). They
keep their own look — their own CSS, type, motion and Phosphor
icons — outside the design system
([`DECISIONS.md`](docs/design-system/DECISIONS.md) ADR-019). The home page
links to them (ADR-020); they stay out of the nav and the sitemap, and
`noindex`. Their gates are their own:

```bash
npm test                 # unit tests (Vitest, node)
npm run test:e2e         # Playwright: desktop Chromium, an iPhone and an iPad in WebKit
                         # first run: npx playwright install chromium webkit
npm run solitaire:cards  # Solitaire's card faces, from the Vector Playing Cards pack
npm run solitaire:deals  # re-prove Solitaire's bank of winnable deals (~5 min)
npm run color-tap:puzzles  # Color Tap: convert the photos in public/paint-by-numbers/ (runs before dev and build)
npm run color-tap:puzzles -- --check  # CI: fail on a bad photo or puzzles not committed
npm run color-tap:preview -- <dir>    # blank sheet | painting | photo, per photo and level, with metrics
npm run color-tap:icon   # Color Tap's home-screen icon, from the butterfly's Easy puzzle
```

To add a picture to Color Tap, drop a JPG (or PNG) into `public/paint-by-numbers/`, run
`npm run dev` once (it converts it, about 20 s), look at it, and commit the photo with what the
conversion wrote (`public/paint-by-numbers/puzzles/` and `lib/color-tap/pictures.ts`).

A change to anything global (`styles/`, `app/layout.tsx`, `app/fonts.ts`,
`components/games/base.css`) must leave the games exactly as they were. Prove it
against a production server:

```bash
npm run build && npx next start -p 3417
npm run games:parity -- baseline   # on the tree before the change
npm run games:parity -- compare    # after it: fails if anything inside a game moved
```

## The tokens

`styles/tokens.css` is the **only** file that assigns a design value. It holds
the palette (private to the file), the band roles components read
(`--band-ground`, `--band-ink`, `--band-soft`, `--band-spine`, `--band-focus`,
`--band-frame`), the button's colours, five type steps, the space scale, the
spine's geometry and the motion durations. A band sets `data-band="paper"` or
`data-band="dark"` and its components never need to know which.

Every colour pair is declared beside the tokens as an `@contrast` line, and
`npm run check:contrast` checks each one in every band against WCAG 2.2 AA.

## Adding a component

1. Find it in the draft (`.taste-skill/round2/type-only-statement/`, kept
   outside git): the spine's components are already drawn there.
2. Build `components/site/<name>.tsx` with `<name>.module.css`, reading only
   tokens, and `<name>.stories.tsx`: default, variants, long content, and the
   `phone` viewport where it changes under 900px.
3. Run the gates.

The full contract is
[`docs/design-system/DESIGN-RULES.md`](docs/design-system/DESIGN-RULES.md).
Every decision and every deviation is recorded in
[`docs/design-system/DECISIONS.md`](docs/design-system/DECISIONS.md).

## Layout

```
app/
  layout.tsx              fonts, tokens + base, metadata, JSON-LD, skip link, page frame
  fonts.ts                next/font: Hanken Grotesk, IBM Plex Mono
  page.tsx                composes storied sections and nothing else
  privacy/  terms/        the legal pages, through components/site/legal-page.tsx
  icon.svg                favicon: the spine's mark (ADR-031)
  opengraph-image.tsx  twitter-image.tsx   the social image, both drawn by social-card.tsx
  robots.ts  sitemap.ts
assets/og/                Hanken Grotesk TTFs (OFL) for the social image
public/name/              the footer's two photographs (credited in the footer)
styles/
  tokens.css              every design value, and the contrast pairs
  base.css                reset, body type, focus ring, selection
  type.module.css         the five type steps as classes
components/
  site/                   the studio's components, each with a CSS Module and a story
lib/cx.ts                 class names joined
data/angeronia.ts         every string the site renders
scripts/                  the contrast gate, the games parity gate, the games' tools
stories/foundations/      Tokens
stories/pages/            the whole page, as a story
docs/design-system/       DESIGN-RULES.md, DECISIONS.md
```

The games sit outside that tree's rules (ADR-019):

```
app/games/page.tsx        the /games launcher (its CSS: components/games/launcher.css)
app/games/sudoku/         the page: metadata, the pre-paint look script, its CSS
components/sudoku/        the screen, sheets, themes and their stylesheets
lib/sudoku/               the rules, solver, generator, themes and trophies (pure)
data/sudoku*.ts           the game's copy and its 100 trophies
app/games/solitaire/      the page, its suit symbols, its CSS
components/solitaire/     the table, its animator and gestures, sheets, win shows
lib/solitaire/            the rules, solver, hints and the bank of winnable deals (pure)
data/solitaire.ts         the game's copy
public/solitaire/cards/   the 52 card faces (generated, versioned, served immutable)
scripts/*solitaire*       the card rasterizer and the deal prover (npm run solitaire:*)
app/games/paint-by-numbers/  Color Tap's page and its home-screen icon
components/color-tap/     the screen, the canvas renderer and stage, palette, sheets, sounds, saves
lib/color-tap/            photo to puzzle (quantise, regions, shared borders, labels), rules, camera, gestures (pure)
lib/color-tap/pictures.ts the generated manifest of the photos and their puzzles
public/paint-by-numbers/  the photos; puzzles/ holds their generated puzzles (named by hash, served immutable)
scripts/*color-tap*       the converter, its --check, the preview harness and the icon (npm run color-tap:*)
data/color-tap.ts         the game's copy
components/games/         base.css: the browser defaults the games were built on
lib/random.ts             the seeded PRNG and shuffle they share
e2e/                      Playwright specs
docs/games/               each game's design and test notes
```

## Accessibility

WCAG 2.2 AA, enforced rather than asserted: `check:contrast` covers every
declared colour pair without a browser, and `test:storybook` runs axe over every
story, including the whole page, with violations failing the run.

Semantic HTML throughout, a skip link that works before hydration, a visible
focus ring, every SVG either labelled or `aria-hidden`, no meaning carried by
colour alone, and the whole page without script or with reduced motion.

## Licensing and third-party assets

* **Hanken Grotesk** and **IBM Plex Mono** are SIL OFL 1.1, self-hosted through
  `next/font`.
* **Phosphor Icons** (`@phosphor-icons/react`, MIT) draw the games' icons, and
  only theirs.
* Solitaire's card faces are rendered from Byron Knoll's **Vector Playing
  Cards**, released into the public domain.
* The footer's photographs are credited on the page:
  "N06 Angerona, Schönbrunn (03)" by Herzi Pinki (CC BY-SA 4.0) and the Fasti
  Antiates by Fabrizio Garrisi (CC0), both via Wikimedia Commons.

**On earlier design systems.** This site ran on Salesforce Lightning Design
System 2 until 2026-09-08 and on IBM Carbon until 2026-11-25. Neither remains.
No `@salesforce-ux/*` package may come back: the SLDS 2 Terms of Use are not an
OSI licence, and their indemnity clause covers claims arising from *any
application you develop with the Software*
([`DECISIONS.md`](docs/design-system/DECISIONS.md) ADR-015). Carbon left by the
owner's choice of a new design, not for its licence (ADR-023).

© 2026 Angeronia Labs LLC.
