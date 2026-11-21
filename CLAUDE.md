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

## Games (outside the design system)

Sudoku and Solitaire moved here from `../portfolio` (2026-10-23) and live under
`/games` (**ADR-021**): `/games/sudoku`, `/games/solitaire`, and `/games`
itself, a launcher of their icons meant to be saved to an iPhone's home screen.
The old `/sudoku`, `/solitaire` and `/Solitaire` redirect (308). Color Tap,
paint by numbers, was made here (2026-10-27) at `/games/paint-by-numbers`
(**ADR-022**, no short path): its puzzles are converted from the photos in
`public/paint-by-numbers/` **at build time** (`npm run color-tap:puzzles`, run
by `predev` and `prebuild`; the output is committed, and CI's `--check` fails a
PR with a bad or unconverted photo). They keep their
own look — their own CSS, tokens, type, motion and Phosphor icons — and the
contract above does not govern them: **ADR-019** draws the line (rule 9, the typecheck
and build gates, and rule 14 still apply), and the launcher sits
on their side of it. Nothing on the studio site
links to them (**ADR-024**). They are not
in the header, the footer or `sitemap.ts`, and they are `noindex`.

* **A new game** goes at `app/games/<slug>/` with its own `apple-icon.png`
  (180 × 180, opaque), plus one entry in `games` in `data/angeronia.ts`; the
  `/games` launcher reads that list. Then `npm run games:icon` to redraw the launcher's
  own icon, and give the game a link back to `/games` (there is no back button
  in a saved web app).

* Read `docs/games/sudoku.md`, `docs/games/solitaire.md` or
  `docs/games/color-tap.md` before touching a game's `components/` or `lib/`
  folder; they are the games' design and test notes (Sudoku's and Solitaire's
  carried over from the portfolio's `CLAUDE.md`).
* **A new Color Tap picture** is a JPG or PNG dropped into
  `public/paint-by-numbers/`; `npm run dev` converts it. Commit the photo with
  `public/paint-by-numbers/puzzles/` and `lib/color-tap/pictures.ts`. Changing
  anything in `lib/color-tap/` that alters a puzzle means bumping
  `PIPELINE_VERSION` in `lib/color-tap/levels.ts` by hand (code edits alone
  don't remake puzzles: players' progress comes first) and checking
  `npm run color-tap:preview`. Remade puzzles keep the old ones as retired, so
  paintings already begun carry on on them; never delete a retired puzzle.
* Their gates are `npm test` (Vitest, node) and `npm run test:e2e` (Playwright:
  desktop Chromium, and an iPhone and an iPad in WebKit), on top of typecheck
  and build.
* They render under the root layout. The studio's global CSS is four rules
  (`body`, `.site-root`, `.visually-hidden`, the skip link); everything else is scoped to `.studio`,
  so nothing reaches them.
  `components/games/base.css` puts back the browser defaults they were built
  on; keep its selectors at `html body :where(...)` and never use `:is()` there
  (the build prefixes it to `:-webkit-any()`, which counts as a class).
* Nothing in the studio site imports from the games, and the games import
  nothing from `components/site/`, `components/ui/` or `styles/`.

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
