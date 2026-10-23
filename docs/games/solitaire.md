# Solitaire (`/solitaire`)

Moved here from `../portfolio` on 2026-10-23, where it was an open pull request (portfolio #37). Like Sudoku it keeps
its own look and sits outside the design system: see [ADR-019](../design-system/DECISIONS.md). This is the game's
section of the portfolio's `CLAUDE.md`, carried over; read it before touching `components/solitaire/` or
`lib/solitaire/`. It shares `components/games/base.css` with Sudoku (the browser defaults both were built on), and
its sheets are Sudoku's `components/sudoku/sheet.tsx`.

Unlisted: not in the header, the footer or `sitemap.ts`, and `noindex`.

```bash
npm run solitaire:cards  # Rasterize the card faces from the Vector Playing Cards pack (see Assets)
npm run solitaire:deals  # Re-prove the bank of winnable deals (lib/solitaire/deals.ts, ~5 min)
```

## The game

Klondike, turn three, the classic Windows way: green felt, red lattice backs, Byron Knoll's public-domain Vector
Playing Cards (the traditional court art), Windows Standard scoring, unlimited passes through the stock. Built for a
phone on its side first and upright too, and for Chrome on iPhone and iPad (WebKit) and on Mac. **Every deal can be
won**: the game deals only from a bank of seeds a solver proved. Tapping a card flies it to its best place (its
foundation first, then the first column it fits); cards also drag. Each win plays the next of four win shows. Its
own look (`solitaire.css`, every rule under `html:has(.sol-shell)` / `.sol-*`), not the studio site's Carbon.

- **Domain (`lib/solitaire/`, pure, relative imports):** `cards.ts` (a card is 0–51 = suit × 13 + rank − 1, suits
  ♥ ♠ ♦ ♣, also the fixed foundation order; `cardCode` "QS" / "TH" names the face files), `deal.ts` (`deal(seed)`:
  a seeded Fisher–Yates (`shuffle` and `mulberry32` from `lib/random.ts`, Sudoku's too) dealt row by row; `DEAL_VERSION`: bump it when the
  shuffle or layout changes, which voids the bank and every save), `game.ts` (the `Table`; the pure reducer; a
  game is its seed plus a **move log** of tokens (`"s"` taps the stock, `"wt3"`, `"t6f1"`, `"t2t5"`, `"f0t3"`
  move cards), so undo replays all but the last and `parseSaved` keeps the longest legal prefix; `legalCount` is
  the one legality rule (a face-up run's base is never a choice); the latest draw's `fan`; `finishMoves` once
  every card is face up; the first `FREE_RECYCLES` (3) turns of the waste free, then −20 each, as in Windows' draw
  three; `score()`: the moves' points, −2 every 10 s, a win's 700,000 ÷ seconds; the clock starts
  at the first move), `talon.ts` (the stock and waste as one sequence and a pointer: `reachable` lists the waste
  tops stock taps alone can bring up, with the fewest taps), `solver.ts` (a depth-first search over the whole deal,
  face-down cards included: draws folded into talon moves, safe cards played up unasked, no cards off the
  foundations, pointless swaps skipped, a sorted-column visited key; a node budget, so it is deterministic; it says
  only "won" (with the player's own tokens) or "unknown"), `deals.ts` (**generated** by `npm run solitaire:deals`,
  `scripts/build-solitaire-deals.ts`: a seed is kept only once its solution replays through the reducer to a win;
  1,000 of seeds 1–1,334 at 250,000 positions each), `targets.ts` (`runAt`: what a press on a card moves;
  `bestTarget`: the tap rule (never down off a foundation, an empty column only for a King that uncovers
  something or comes off the waste); `locate`), `hint.ts` (`hintList`: the solver's next move from the current
  position within ~60 ms, then helpful moves by rule of thumb (a column emptied only for a King that waits for
  it); presses cycle; it never claims a game is lost;
  loaded by dynamic import on the first press, so the solver stays out of the first load).
- **Client (`components/solitaire/`):** `layout.ts` (pure: from the measured table, every card's place, every
  pile's slot and drop zone and the controls; **classic** (stock, waste, foundations over seven columns, a bar
  below) or **rails** (a phone on its side: stock and waste down a left rail, the foundations 2×2 on the right, the
  columns between with the whole height) — rails only when classic's cards would be under 72 px and rails' are
  10% bigger; cards sized for the longest possible column; below 72 px the cards draw a big corner index over the
  art's), `animator.ts` (**the one owner of every card's transform, stacking and face**: React renders the 52 card
  nodes once, in a fixed order, and never sets them; flights on the Web Animations API (transform only,
  `fill: "backwards"` for staggers, interrupted flights restart from their drawn position), a 2D squash to turn a
  card over, the deal-in, draw and finish staggers, grab / drag / release / fly home, `whenIdle`), `card.tsx` and
  `table.tsx` (memoised; waits for every face to decode before showing the cards; a new motion key plays its motion,
  any other layout change snaps; the playable cards are one Tab stop, the card focused last, and the arrows and
  Home / End walk them in table order, since the nodes' DOM order is the deck's), `use-gesture.ts` (native pointer listeners on the table with capture on it: a
  press past the slop drags, a still press taps; mouse and touch alike; a non-passive `touchmove` while holding),
  `solitaire-game.tsx` (the screen, a `<main id="main">` for the root layout's skip link, after `sudoku-game.tsx`: load on mount (a ref-guarded deal pick, so Strict
  Mode doesn't skip a deal), save while this tab owns the game (the same owner protocol as Sudoku, plus
  `pageshow`; a follower takes only the clock and the stats marks from a save of the same position, and another
  deal drops its win show, result and hints), the clock, stats (played at a deal's first move, a win recorded once
  by the tab that made it), Hint, the live region, keys (D / Space, U / ⌘Z, H, F; Space on a focused control
  presses that control; any key skips a win show, and so does a click, never the press, or the tap's own click
  would land on the result sheet's backdrop and close it); the native listeners read the state
  through refs set in layout effects, so an input right after a change never acts on the one before), `menus.tsx`
  (menu, statistics, how to play, the result), `storage.ts` (`solitaire:game` (seed and moves), `:stats`, `:deals`
  (this browser's shuffled way through the bank, so no deal repeats until all have been dealt), `:fx`, `:owner`),
  `win/` (four pure simulations stepped at a fixed 60 Hz: `cascade` (Windows' bouncing cards; never clears, so the
  trails stay), `fountain`, `spiral`, `waterfall`) and `win-canvas.tsx` (one canvas, DPR ≤ 2, the faces drawn once
  into an atlas; zeroed on unmount for WebKit's canvas memory limit; `data-fx` names the show). The controls step
  aside during a show; reduced motion snaps every move and skips the shows. Sheets reuse `components/sudoku/
  sheet.tsx` with `prefix="sol"` (a required prop; Sudoku passes `"sdk"`). Copy in `data/solitaire.ts`.
- **Assets:** `npm run solitaire:cards` (`scripts/build-solitaire-cards.ts`) renders the pack's SVGs (the court cards
  are 400–600 KB each) to 320 px WebP in `public/solitaire/cards/v1/` (716 KB in all) and writes
  `app/solitaire/apple-icon.png`; all committed. The pack lives outside the repo at `../Vector-Playing-Cards/
  cards-svg` (github.com/notpeter/Vector-Playing-Cards; override with `CARDS_SVG_DIR`). `next.config.mjs` serves
  the faces as `immutable` (bump the `v1` folder and `CARD_DIR` with new art) and rewrites `/Solitaire` to
  `/solitaire` (a redirect would loop: custom routes match case-insensitively).
- **iOS and Chrome:** `viewport-fit=cover` with the felt under the notch and safe-area padding, `100dvh`,
  `overscroll-behavior: none` (no rubber-banding or Chrome's pull to refresh), `touch-action: none` on the stage,
  no callouts or image drags, cards 10 px clear of the screen's edges, suits as SVG symbols (text suits can turn
  into emoji), and the web-app meta and icon for Add to Home Screen.

## Tests

Unit tests run in node through the Vitest `unit` project (`npm test`), co-located with the code:

- `next.config.test.ts` — /Solitaire is a rewrite (never a redirect) and the card faces are cached as immutable
- `lib/solitaire/cards.test.ts`, `deal.test.ts`, `game.test.ts`, `talon.test.ts` — the cards; seed 1's deal pinned
  (a change voids the bank); the rules (turn three, a short stock, recycling keeps the order, the fan, alternating
  colours, Kings on empty columns, fixed-suit foundations, one legal count per move, auto-flip, every Windows
  points rule (three free turns of the waste) and `score()`, the clock from the first move, undo deep-equal to before, restart, finish, no undo
  after a win, tokens, `parseSaved`: junk, the longest legal prefix, versions, the cap); `reachable` matches tapping
  the real stock for every talon and waste size
- `lib/solitaire/solver.test.ts`, `deals.test.ts`, `targets.test.ts`, `hint.test.ts` — every win the solver returns
  replays to a won game, deterministic, "unknown" out of budget, solving from mid-game; the bank was proven under
  the current `DEAL_VERSION`, holds ≥ 1,000 distinct seeds, and a sample re-solves and replays to a win; the tap
  rule; hints (the solver's move first, no pointless swaps, a column emptied only for a waiting King, nothing on a
  stuck table)
- `components/solitaire/layout.test.ts`, `storage.test.ts`, `win/win.test.ts` — the layout at real screen sizes
  (phones upright and on their side with Chrome's bars, iPads, desktops: the arrangement, everything on the table
  and apart, the longest column above the controls with 13 px per card, 10 px from the edges, the big index exactly
  below 72 px, drop targets); storage (the saved game, junk and blocked storage, stats, every banked deal once
  before any repeats, the win shows in turn); the win shows (each ends in time, shows all 52, finite, seeded; the
  cascade keeps its trails and never sinks through the floor)
- `scripts/solitaire-cards.test.ts` — 52 WebP faces at 320 px in the art's proportions with transparent corners,
  ≤ 60 KB each and 1.3 MB in all; nothing else in the folder; an opaque 180 × 180 icon

End to end (`npm run test:e2e`, Playwright, kept out of `npm test`): `e2e/solitaire.spec.ts` runs on desktop
Chromium and in WebKit on an iPhone 15 upright (`iphone`) and on its side (`iphone-landscape`) and an iPad
(`ipad-landscape`), setting positions up from `lib/solitaire` (it solves the first banked deal in node): both URLs and
noindex, one screen with every slot in view and the arrangement per device, a banked deal with all 52 faces, the
stock turning three fanned, a tapped waste card flying to its place, drag and drop and an illegal drop flying home
(desktop), Hint / Undo / resume on reload with every card in place, a win playing the cascade then the result (a tap
near the top skips it and the sheet stays) and the next three shows in turn, reduced motion, two tabs (and a new game
in one closing the other's result), and keys (Space on a focused button presses it; the playable cards are one Tab
stop and the arrows walk them in table order). Storage is seeded from a same-origin page without the game, since the
game saves itself as it unloads. Set `E2E_PORT` when port 3000 is taken. First run needs
`npx playwright install chromium webkit`.
