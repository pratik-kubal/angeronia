# Sudoku (`/sudoku`)

Moved here from `../portfolio` on 2026-10-23, as it stood at `0e53c81` (portfolio #36 and #38). It keeps its own
look and sits outside the design system: see [ADR-019](../design-system/DECISIONS.md). This is the game's section of
the portfolio's `CLAUDE.md`, carried over; read it before touching `components/sudoku/` or `lib/sudoku/`.

Unlisted: not in the header, the footer or `sitemap.ts`, and `noindex`.

## The game

A relaxed Sudoku built for an iPhone held upright: one screen, no page scroll, with its **own look**, "Aurora"
(a pastel dawn in light, an indigo night with teal and magenta neon in dark, the iOS system font; the page ignores
the studio site's Carbon tokens and its `data-theme`). There are no mistakes and no losing: a digit that
doesn't fit is simply refused (accepted: a player can try digits until one fits). Every solved board wins one of
**100 collectible trophies**. **Themes**: Aurora is the default (the owner's ruling); Candy (all year, the owner's
reference look: every digit a tile in its colour until all nine are placed), Beach, Halloween, Snow Day and Blossom,
or "Seasonal" (the theme whose season the local date is in, else Aurora), are opt-in from the dock's Themes (or
Settings → Theme). Every theme hides **three secrets** (easter eggs) that play a surprise and are listed in the
picker. **Layout** (every theme, after the owner's reference screenshot): the gear (Settings) left, the title ("Medium
Puzzle 12", the player's Nth board) and a home link right; the board; a divider; the pad, `1 2 3 4 5` over the pencil
and `6 7 8 9` (staggered half a key), a stack beside each key with one bar per digit still to place (a spent key is
a bare numeral), a square clock mirroring the pencil (`04:12`, from an hour `1h05`, from ten `12h`); and a dock:
Themes, Hint, Play (the New game sheet) and the Collection. **Every digit has its own colour** in every theme
(`--d1…--d9`, per scheme), on the board, the pad, the pencil marks, the reels and the fireworks; a clue is told from
your own digit by weight (700 against 500; Candy's tiles 900 against 700).

- **Domain (`lib/sudoku/`, pure, relative imports):** `grid.ts` (81 cells row by row, units, peers, digit
  bitmasks), `solver.ts` (bitmask backtracking branching on the fewest candidates: `countSolutions`, `solve`,
  `randomSolution`; `solveBySingles` grades a puzzle by naked and hidden singles), `generate.ts`
  (`generate(difficulty, seed)`, seeded by `mulberry32` from `lib/random.ts`: a random full grid dug in mirrored pairs; easy (38 clues) and medium (30) stay
  solvable by singles alone, hard (24) keeps one solution and always needs more than singles), `game.ts` (state,
  actions and the pure reducer: a correct digit locks, a wrong one is refused as a `miss` move that changes
  nothing; 3 hints; notes toggle; `finishedBy`: the rows, columns, boxes and digit set a placement finished; the
  `award` action keeps the trophy a won game drew, so a reload never draws again;
  `parseSaved` reads version 3 only), `trophies.ts` (`drawTrophy(seed, collection)`: a rarity by `RARITY_ODDS`,
  common 52 / uncommon 26 / rare 14 / epic 6 / legendary 2 %, then one of that rarity not found yet).
- **Themes (`lib/sudoku/themes/`, pure, relative imports):** `types.ts` (`THEME_IDS`, `ThemeChoice` = a theme or
  `"seasonal"`, `ThemeDef`: name, emoji, blurb, season, swatch, title emblem, win sparks, result heading, arrival
  line and exactly three `SecretDef`s; the `Moment`s a secret listens for, every one possible on a phone (the owner
  ruled out keyboard-only secrets): deal, move, win, emblem (title taps in a row), scene (a `data-tap` piece; never
  a secret's only moment, since a piece may not show on every screen), idle (30 / 90 s)), `keypad.ts` (`spells`: a
  word spelled on the number pad by a phone keypad's letters, one placed digit at a time; Beach's gull, Snow Day's
  cocoa, Blossom's buzz and Candy's candy; on `placedInOrder`, which Candy's rainbow (1-2-5-7-9) shares), `index.ts` (the registry `THEMES`,
  `inSeason`, `seasonalTheme`, `resolveTheme`, `SEASON_TABLE` for the pre-paint script, `formatSeason`,
  `secretsAt`: a secret's `test` runs only on its `on` kinds, a throw is "not met"), and one file per theme
  (`aurora.ts`, `candy.ts`, `beach.ts`, `halloween.ts`, `snow.ts`, `blossom.ts`: its definition, copy and secrets
  together; Aurora and Candy have no season).
  Seasons never overlap: Blossom Mar 20–May 15, Beach Jun 1–Aug 31, Halloween Oct 1–Nov 2, Snow Day Dec 1–Jan 31.
- **Client (`components/sudoku/`):** `sudoku-game.tsx` (the screen, a `<main id="main">` so the root layout's
  skip link lands on it; the game is client-only, generated and saved
  in localStorage, so the server renders an empty board and the mount resumes it or opens the New game sheet; it
  lays out the header, board, divider, pad and clock, and dock; it resolves
  the look, renders the theme's Backdrop behind the game and Overlay above it, turns moves into scene `Beat`s,
  checks every moment against the theme's secrets (a secret met plays its surprise as a `Cue` each time; the
  first find is saved, toasted (over the bar, after the surprise's best part) and listed in that game's result),
  tells a season's arrival once under Seasonal (in view, with no sheet up and no won board waiting; Aurora's
  return says "Between seasons"),
  and in development exposes `window.__sudoku.cue(name)`), `board.tsx`
  (a flat 9×9 grid under one lines overlay, its hairlines repeating exactly every ninth; each cell carries
  `data-digit` and `data-done` (all nine placed); pills for the selection and its digit's twins (a tint of the
  digit's colour); a band per finished unit; the number reels), `pad.tsx` (two staggered rows on twelve half-key
  columns, a stack of bars by each key, the pencil), `fireworks.tsx`, `sheet.tsx` (a native `<dialog>` bottom sheet with a drag-away
  grabber; it reopens itself if the browser force-closes a sheet that must stay; sheets stack: the picker over
  Settings, Settings over the first New game sheet, the collection or New game over the result), `menus.tsx`
  (`NewGamePanel`: a difficulty, how to play and, before the first game (when the sheet can't close), a Settings
  row that opens Settings over it, Play's sheet; `SettingsPanel`: theme, sound, haptics, appearance and a note that
  Silent Mode mutes the game on an iPhone or iPad, the gear's; the theme picker (`ThemePanel`: Seasonal
  and every theme with its swatch, season and secrets found, then the shown theme's secrets: found ones, or a
  riddle); the result with the trophy won and any secrets found; the collection shelves by rarity), `use-move-fx.ts` (the animations, after the reducer: a new game **deals in** with every
  cell's number reel spinning onto its clue; a placed digit drops in; a finished row, column or box gets a mint
  band (`--sweep`, a registered property) while its digits lift outward; a refused digit shakes and fades; a
  solved board spins all its reels outward from the last cell and bursts into **number fireworks** before the
  result; the result sheet waits for it), `feedback.ts` (a Web Audio synth on a pentatonic scale, woken on every
  gesture for iOS; WebKit starts the context suspended in the waking tap, so the notes asked for meanwhile wait for
  it (up to 300 ms each, at most 64, every theme's phrases whole) and play as far apart as they were asked for,
  instead of being lost, the first game's deal among them; on an iPhone or iPad, Web Audio is ambient sound, so
  Silent Mode mutes it (always in a Home Screen web app; in a Safari or Chrome tab unless another tab's media has
  lifted the browser's shared audio session to playback), and Settings says so (no `navigator.audioSession`
  "playback": it would pause the player's music); `sound` speaks in the theme's `Voice` (`setVoice`; what a theme leaves out stays Aurora's); haptics through `navigator.vibrate` or, on iOS 18+, a hidden `<input switch>` toggled inside
  the tap), `storage.ts` (the game, best time per difficulty, the trophy collection, the settings (theme defaults to
  `"aurora"`), the secrets found per theme and the last theme Seasonal brought in;
  several tabs: the tab the player last used owns the game (`claimGame` / `ownsGame`) and alone saves it and
  runs its clock, the others follow its saves at rest; `LOOK_SCRIPT` resolves the appearance (System follows the
  OS) to `data-sdk-scheme="light|dark"` and the theme (Seasonal by the local date) to `data-sdk-theme="<id>"` on
  `<html>` before paint, the two switches the stylesheets read, and tints `theme-color`; `EMBLEM_STYLE` draws the
  theme's title emblem in place of the 3×3 mark until the game loads), `sudoku.css` (the Aurora
  tokens, the defaults (the digit colours `--d1…--d9` among them): light then one dark block keyed on `data-sdk-scheme`; `color-scheme` is `!important`
  because next-themes writes the site's inline; the scene and overlay layers (the game lets taps through
  its gaps only); imported by the page only, so it never reaches the studio pages' CSS).
- **Theme skins (`components/sudoku/themes/`):** `types.ts` (`SceneProps`: finished `boxes` as a 9-bit mask,
  `filled`, the latest `beat`, the `cue` to play; `Skin`: an optional Backdrop, Overlay and voice), `index.ts`
  (`SKINS` by id), `use-anchor.ts` (`useAnchor(".sdk-board" | ".sdk-gap-b" | …)`: a piece's box, kept measured, so
  a scene can sit beside it; its header lists the pieces: bar, gap-a, board, gap-b, rule, pad, clock, gap-c, dock),
  and a folder per theme (Candy's has no Backdrop; its tiles are CSS on the board's cells and keys): `<id>.css` (its tokens for both schemes: every token Aurora
  defines, under `html[data-sdk-theme="<id>"]:has(.sdk-shell)` and the same plus `[data-sdk-scheme="dark"]`
  (Aurora's folder has none: its tokens are sudoku.css's, and its `aurora.css` holds only its surprises);
  then its scene styles, every selector scoped to the theme, keyframes `sdk<Id>…`, motion only under
  `prefers-reduced-motion: no-preference`; imported by `app/sudoku/page.tsx`), `index.ts` (its skin) and its
  scene and voice files. Copy in `data/sudoku.ts`; the 100 trophies
  (id, name, one Emoji 13.0-or-older emoji, rarity, blurb; 50 / 25 / 15 / 7 / 3) in `data/sudoku-trophies.ts`.
- **iOS:** `viewport-fit=cover` and safe-area padding, `100dvh` without rubber-banding, `touch-action:
  manipulation`, a landscape layout for phones on their side (the controls only as wide as full-size keys need, the
  board takes the rest), and an `apple-touch-icon`
  (`app/sudoku/apple-icon.png`) with the web-app meta, so Add to Home Screen opens it full screen.

## Tests

Unit tests run in node through the Vitest `unit` project (`npm test`), co-located with the code:

- `lib/sudoku/solver.test.ts`, `generate.test.ts`, `game.test.ts`, `trophies.test.ts` — the solver on a known
  puzzle, seed-stable grids, puzzles with one solution near their clue target and the half-turn symmetry (easy
  and medium solvable by singles, hard never), the rules (a correct digit locks, a wrong one is refused and counts
  for nothing, a win stops the clock and clears the selection, one trophy per win, notes, hints, `finishedBy`,
  saved versions), and the trophies (100 with unique ids, names and single emoji, the rarity split,
  odds within 1.5 points over 20,000 draws, missing ones first until all 100 are found; `winCount`, the boards won)
- `lib/sudoku/themes/themes.test.ts` — the theme registry (every id, copy lengths, single-emoji glyphs, hex
  swatches), the calendar (no two seasons overlap on any day of a leap year; each season's edges; a chosen theme
  ignores the date; the pre-paint table; Aurora and Candy have no season), and the secrets (three per theme, none
  met by a deal, a plain placement or one tap on the title, every one findable on a phone, only asked about their
  own moments, a throw is not met); `keypad.test.ts` (the letters, and `spells`: refused digits skipped, a hint
  breaks the word); one `lib/sudoku/themes/<id>.test.ts` per theme meets each of its secrets and misses near it
- `lib/sudoku/themes/accidents.test.ts` — no play secret is met by habit: seeded games played at random, row by row,
  bottom up, by columns, box by box, digit by digit and cycling the pad up or down (refused digits and hints
  sprinkled in, an ordinary afternoon in season) meet each secret in at most 5% of one style's games
- `components/sudoku/themes/tokens.test.ts` — every theme's stylesheet: every Aurora token in light and dark,
  WCAG contrast of the board's and the sheets' text (and the selection pill's text on each of its colours), nine
  digit colours per scheme that each read on the cells, a peer and a twin's tinted pill (4.5:1) and no two alike
  (OKLab distance ≥ 0.07), Candy's tiles (a white numeral at 3:1 on each, as WCAG large text: bold and never under
  14pt, the board's numeral floored at 18.67px; no two alike, every digit colour legible on an empty tile), every
  rule scoped to the theme, keyframes named for it, animation only under `prefers-reduced-motion: no-preference`
- `components/sudoku/board-lines.test.ts` — the board's hairlines repeat exactly every ninth (a period half a pixel
  long drifted them over the last rows' selected pill)
- `components/sudoku/feedback.test.ts` — the synth on a context that starts suspended, as WebKit's does: the waking
  tap's notes wait and play in order, as far apart as they were asked for, once it runs (and after an interruption,
  or before its statechange fires), each once; none older than 300 ms, at most 64; every theme's deal and win kept
  whole; nothing before the first gesture; one context, a failed resume caught and retried on the next tap; no Web
  Audio, no sound
- `components/sudoku/themes/halloween/layout.test.ts` — the Halloween scene's layout at each measured screen size:
  nine pumpkins, one per box, kept with the moon on screen, off the game and apart, inside the game column (clear of
  an iPhone's safe-area insets on its side), the sill never shrinking as the gap under the board grows; the moon's
  phase, from a sliver at the deal to full when the board is; Boo (the trick) and his "boo!" on screen and clear of
  the board, the buttons and the title's words, on the way off too, with short and long titles; on its side the
  parade stepping out from behind the board's right edge
- `components/sudoku/themes/beach/layout.test.ts` — the Beach scene's layout at each measured screen size: nothing
  on the sand behind a key, the clock, the dock or the board; on a desktop the panorama stays beside the column (the
  pad and the dock included, wider than the board in a short window) and on screen; a window with less than 220px
  beside the column is compact
- `components/sudoku/themes/blossom/garden.test.ts` — Blossom's garden on the pieces measured at each size, with a
  short and a long title: a solved board's butterflies and fireflies keep off the header's see-through round
  buttons (the butterflies off the title too), and the moon, where it shows, keeps off the title and the home
  button (it hides where a long title leaves it no room)
- `components/sudoku/storage.test.ts` — `LOOK_SCRIPT` picks the scheme and theme the game resolves, for any saved
  settings (none, junk, blocked storage) on any day; Aurora by default whatever the season; `EMBLEM_STYLE` draws
  each theme's emblem before the game loads; secrets read back clean

End to end (`npm run test:e2e`, Playwright, kept out of `npm test`): `e2e/sudoku.spec.ts` runs on desktop Chromium
and, as the `iphone` project, on an iPhone 15 in WebKit: the first-visit New game sheet (and Settings from it, which
hands back to the sheet and notes Silent Mode), one screen, the first deal sounding though its tap wakes the sound
(every note counted as it starts), the deal's reels, placing and refusing, notes, resuming on reload, solving (the
fireworks, the trophy in the result and the collection, never drawn twice, the best time), the title's board count
(Puzzle 1 through the first win, then 2), the dock's Themes (the picker on its own) and Play (New game, closable once
there is a game), hints, the pad (a stack per digit losing a bar as one is placed, nine colours, 1–5 over the pencil
and 6–9 staggered), the appearance setting surviving a reload before paint, Aurora by default and a picked theme
before paint, Seasonal's calendar and its arrival told once, every theme's title-tap secret (found, toasted, listed in
the picker; the taps counted from its own test), the keypad words spelled on the pad, Halloween O'Clock under a fixed
clock and listed in the result, landscape (the board keeps 23px cells at 568×320), repeated Escapes, color-scheme,
held keys, two tabs, and keyboard play. Set `E2E_PORT` when port 3000 is taken. First run needs
`npx playwright install chromium webkit`.
