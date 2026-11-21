# angeronia.com

Angeronia Labs builds production AI agents on the Claude API for small software teams. It is also the maker of [Code.Socratic](https://www.code-socratic.com/).

This repository is the studio's site: one page that sets out the offer, the
proof and the process and asks for a call, plus `/privacy` and `/terms`. Three
games live under `/games`, outside the site's design; see
[The games](#the-games).

## Stack

| | |
|---|---|
| Framework | Next.js 15 (App Router), React 19, TypeScript. Statically prerendered, no backend. |
| Styles | Plain CSS: `styles/tokens.css`, `styles/base.css`, `styles/motion.css`, and one CSS Module per component. No component library, CSS framework or icon set. |
| Type | Imbue (capitals, for the name and titles) and Albert Sans (text), self-hosted through `next/font`. |
| Storybook | 10, with `@storybook/nextjs-vite`, `addon-a11y` and `addon-vitest`. Every component has a story before it is on a page, and `Pages/Home` is the page itself. |

## Commands

```bash
npm install
npm run dev            # Next dev (Turbopack)
npm run build          # strict build
npm run storybook      # Storybook on port 6006

npm run typecheck      # tsc --noEmit
npm run check:contrast # the tokens' pairings against WCAG 2.2; writes docs/design-system/contrast-report.md
npm run test:storybook # every story in Chromium; axe violations fail
npm test               # the games' unit tests (Vitest, node)
npm run test:e2e       # the games end to end (Playwright; first run: npx playwright install chromium webkit)
npm run games:parity -- baseline|compare   # prove a global CSS change left the games alone

npm run build:hero     # the first-screen photograph's served sizes, from scripts/sources/
npm run build:og       # the social image: a photograph of the first screen (needs a production server on 3417)
```

CI runs `typecheck`, `npm test`, `check:contrast`, `build` and
`test:storybook` on every pull request, with Color Tap's photo check
(`npm run color-tap:puzzles -- --check`). `test:e2e` runs locally.

## Where the rules live

* [`docs/design-system/DESIGN-RULES.md`](docs/design-system/DESIGN-RULES.md):
  the contract for every change to the studio pages.
* [`docs/design-system/DECISIONS.md`](docs/design-system/DECISIONS.md): every
  decision and deviation. ADR-023 explains the current look.
* [`docs/plans/monument-redesign/`](docs/plans/monument-redesign/): the
  specification the pages were built from (`design.md` for the look,
  `content.md` for every word).
* Every string the studio pages render is in `data/angeronia.ts`.

## The games

[Sudoku](docs/games/sudoku.md), [Solitaire](docs/games/solitaire.md) and
[Color Tap](docs/games/color-tap.md), at `/games/sudoku`, `/games/solitaire`
and `/games/paint-by-numbers`, with a launcher at `/games` meant to be saved to
a phone's home screen. They keep their own look, outside the site's design
rules (ADR-019); nothing on the studio pages links to them, and they are
`noindex`. Their notes, and their own scripts, are in `docs/games/` and
`CLAUDE.md`.

## Picture credit

The first-screen photograph is "Philadelphia Skyline" by Andrew Parlette,
taken on 13 March 2023 from the South Street Bridge, used under
[CC BY 2.0](https://creativecommons.org/licenses/by/2.0/)
([source](https://commons.wikimedia.org/w/index.php?curid=135482068)). It is
cropped; the page credits it in the footer, and
[`scripts/sources/CREDITS.md`](scripts/sources/CREDITS.md) records the change.

Imbue and Albert Sans are under the SIL Open Font License 1.1. The games use
Phosphor Icons (MIT), and Solitaire's card faces are rendered from Byron
Knoll's Vector Playing Cards, released into the public domain.

© 2026 Angeronia Labs LLC.
