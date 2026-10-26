# Plan: Lamplighter — an original firefly ribbon racer for /games (Stage 1)

## Context

The third /games title. The earlier draft (`~/.claude/plans/can-you-create-a-steady-papert.md`, "Shell Express")
was a rule-for-rule recreation of Snail Mail under a new name; it is **superseded and off the table**. On
2026-10-26 the user chose an **original game in the same genre** — a 3D racer on floating ribbon tracks with
tilt/touch steering, pickups and hazards — with an **original premise: a firefly lamplighter** racing moonlight
ribbons through a night sky over a sleeping hillside town, gathering sparks to light a lantern at each route's end.
Rules, tuning, layouts, art and sound are designed here from scratch: no parcels/post office, salt, turrets, slugs,
weapon rings, damage-meter frenzy, lives, or anyone's constants; no code from any decompile. Genre conventions
(steer, boost, shield, collectibles, checkpoints, par times) only.

Carried over (user decisions): **Chrome on iOS first** (WebKit; the user saves `/games` to the Home Screen);
**Stage 1 = a polished vertical slice** — Tutorial + 5 routes + the whole front end — with the architecture ready
for more routes, Time Trial + ghost and replays; **Tilt mode's horizon counter-rotation** is an Options switch,
on by default in Tilt mode; a **synthesized Web Audio voice** for the hero plus a speech bubble (no audio files).

**Provisional names (change freely at approval):** game *Lamplighter*, `/games/lamplighter`, CSS prefix `lmp-`;
hero firefly *Wick*; launcher line "Fly the night's ribbons. Light the town."

Work on branch `feat/lamplighter` (main is clean). Commit / PR only when the owner asks.

---

## 1. Game design (original, relaxed — fun from collection and animation, never punishment)

- **Flight.** Wick auto-flies forward along the ribbon (cruise 14 m/s); the player steers sideways; the one
  action is **hop** (≈0.65 s airborne, ≈1 m peak). Leaving the ribbon edge = "out of the current": eases to
  6 m/s and drifts back. Never a death.
- **Gaps** (dark breaks in the ribbon): hop across, or dip — a moth current carries Wick over, costing time and a
  little glow. Never a restart.
- **Glow** is the one resource, shown on Wick's halo and trail (the HUD meter just confirms it): sparks +1, big
  spark +3, hit −8, dip −5. No lives, no game over.
- **Way-lamps** mid-route: a chime and a glow flare; "Retry from last lamp" in Pause restores a sim snapshot.
- **Lantern** at the end lights up with brightness from glow. **Flames** (bitmask, accumulate across runs):
  finish = 1, glow ≥ goal = 2, time ≤ par = 4. Unlocks need only finish + glow flames on prior routes — par is
  never required (unit-tested). Each flame lights a window in the hillside town on the route map (the collection).
- **Pickups:** sparks (lines/arcs; each spark in a run plays the next pentatonic note — the sparks are the
  music), blossom (1.8 s tailwind), dewdrop (absorbs the next hit).
- **Hazards, one simple pattern each:** rain (fixed rhythm, growing shadow), gust (zone with steady sideways push),
  spider thread (≈0.5 m high across the ribbon: hop or stuck 0.5 s), bat (one sideways swoop pattern), gaps.
- **Routes** (names provisional; par is derived from the test bot, never hand-picked):

| # | id | Name | Introduces | ~Length |
|---|---|---|---|---|
| 0 | `first-light` | First Light (tutorial) | steer, hop, sparks, lamp, lantern | 650 m |
| 1 | `orchard-lane` | Orchard Lane | blossoms | 1000 m |
| 2 | `drizzle-hollow` | Drizzle Hollow | rain + dewdrop | 1100 m |
| 3 | `windmill-rise` | Windmill Rise | gusts | 1200 m |
| 4 | `weavers-gap` | Weaver's Gap | gaps + threads | 1200 m |
| 5 | `bell-tower` | Bell Tower | bats + spiral climb round the belfry | 1400 m |

- **Controls:** Tilt (device orientation; permission asked from a tap), Touch (relative horizontal drag anywhere;
  quick tap or second finger = hop; in Tilt mode any touch = hop), Keyboard (←/→/A/D, Space/↑/W hop, Esc/P pause).
  First run on a touch device asks Tilt or Touch. Portrait primary, landscape supported.
- **Screens:** Title → Route map (SVG hillside, lantern `<button>`s, lit windows) → Race (countdown, HUD, bubble)
  → Results (lantern-lighting animation, flames, time, glow). Sheets: Options (steering, tilt sensitivity 1–3,
  level horizon, sound, haptics, chatter Lots/Some/Quiet), Pause (resume, recenter, retry from lamp, restart, map).

## 2. Technical approach

**Rendering — hand-rolled Canvas 2D projection, no new dependency.** The scene is one ribbon strip
(≤ ~250 quads) plus glowing sprites: a fill-rate load WebKit's 2D canvas handles well; additive glow is native
(`'lighter'` + pre-baked radial sprites); no WebGL context loss in Home Screen apps; projection/camera are pure TS
and testable. The technique is **copied** from `components/site/mobius-figure.tsx` (camera basis, perspective,
Lambert shading, painter's sort, IO/reduced-motion lifecycle) — not imported (ADR-019). Keep a
`render(view): void` seam so a WebGL backend could replace it later under its own ADR.
- Frame: opaque canvas (`alpha: false`); sky = pre-rendered DPR-1 offscreen canvas drawn once, rotated by camera
  roll; ribbon cross-sections from −5 m to draw distance, near-plane clipped, Lambert-shaded, depth-fogged, 2 m
  brightness stripes for speed; glowing edge polylines; far→near insertion-sorted draw list (preallocated);
  sprites from one code-drawn atlas (Wick, sparks, blossom, dew, rain, bat, thread, lamp, lantern, scenery
  props); render-only particles in typed arrays with their own RNG. Never `shadowBlur`, `filter`, per-frame
  gradients/canvases, `getImageData`.
- Quality governor (`render/quality.ts`, pure): tiers DPR 2 / 1.5 / 1.25 / 1 with draw distance, sample step and
  particle caps; EMA of frame interval; step down at >19 ms for 45 frames, up at <14 ms for 360; lock a tier dropped
  from twice; detect a steady 30 fps (Low Power Mode) and don't cascade.
- Canvas memory: exactly 3 canvases (visible, sky, atlas ≤ 1024×512), zeroed (`width = height = 0`) on unmount
  and route exit (the `win-canvas.tsx` precedent). Title and map are DOM/SVG — no loop off the race screen.

**Simulation — `lib/lamplighter/`, pure, deterministic, fixed step 1/60 s, relative imports.**
- Track space `(s, x, h)`; collisions never use world space.
- `track.ts`: `compileTrack(def): Track` — authored `Seg { len, yaw?, pitch?, bank?, half?, gap?, ease? }`
  integrated as a turtle at 0.5 m steps (smoothstepped curvature), **up-guided frame** (U = worldUp minus its
  T component, R = T×U, then bank) — not RMF, which would twist the Bell Tower spiral. Typed arrays `p, t, r, u,
  half, solid`, every value quantized to 1e-6 for cross-engine determinism. `poseAt()` for render only.
- `items.ts`: `expandPlaces(def, track)` turns authored `Place`s (sparks lines/arcs, blossom, dew, rain, gust,
  thread, bat, lamp, say) into `Item`s sorted by `s` with stable ids.
- `rules.ts` (constants, `STEP`, `SIM_VERSION`), `sim.ts`: `createSim`, `step(sim, input, route)` (mutates in
  place, no allocation, no trig — sine table only, no randomness), `snapshot`/`restore`, `hashSim`. Moving item
  cursor ±1.5 m; swept thread test (no tunnelling); rain by tick window; bats by tick; events array reused.
- `replay.ts`: 1 byte/tick input `pack`, `InputLog` (truncate on retry-from-lamp), `replay(route, log)`;
  run records stamped `{routeId, routeVersion, simVersion}` — the Stage 2 ghost hook.
- `scoring.ts`: flames, unlocks (`unlock` totals `[0,1,3,5,7,9]`), windows lit. `bot.ts`: `skilledBot`,
  `casualBot(seed)`, `idleBot` — inputs only, used by tests and the dev autopilot.
- `routes/<id>.ts` × 6 + `routes/index.ts` (`ROUTES`, memoised `compiled(id)`). `RouteDef = { id, version, par,
  glowGoal, unlock, start, segs, places, look: { tint, moon, props }, map: { x, y } }`.

**Loop and React** (`components/lamplighter/race.tsx` + `race/controller.ts`): `createRace({canvas, hud, route,
inputs, audio, settingsRef, onPhase, onFinish, onPause})` returns an idempotent `destroy()` (Strict Mode). Fixed-step
accumulator with `min(0.05, dt)` clamp (as `win-canvas.tsx`), render interpolated by the leftover fraction. HUD is
written straight to the DOM only on change (`--glow`, timer at 10 Hz, `data-phase`/`data-glow`); React state changes
only on phase/finish/pause; settings reach the loop through refs set in layout effects (Solitaire pattern).
Camera (`render/camera.ts`, pure): eye sampled on the track at `s − 6` (follows the spiral, biased outward), target
`s + 10`, critically damped; roll = 0.6 × bank (0 under reduced motion) + `viewRoll`, clamped ±35°; FOV by aspect.

**Input** (`components/lamplighter/input/`): `InputHub.sample()` merges keyboard/touch/tilt (largest steer wins),
latches hop once per tick, quantizes steer exactly as `pack` does. Touch copies `use-gesture.ts` hygiene (native
listeners, capture, non-passive `touchmove` preventDefault, cancel on blur/resize/hidden). Tilt math is pure
(`tilt-math.ts`): device up-vector `(−cosβ·sinγ, sinβ, cosβ·cosγ)` mapped by `screen.orientation.angle` (fallback
`window.orientation`) → steer angle `asin(−u.sx)` (no flip near β = 90°) and roll angle (null when flat); dead zone
2°, full lock 26/20/15° by sensitivity. `ensureTilt()` calls `DeviceOrientationEvent.requestPermission()`
synchronously inside the tap (Tilt choice, and each Go tap since iOS re-asks per session), then waits ≤1 s for a
real event → `"ok" | "denied" | "absent"`; denied/absent fall back to Touch with a note; tilt needs https (document
`next dev --experimental-https` / Vercel preview). Calibrate zero from the countdown's last 500 ms; Recenter in Pause.
**Horizon counter-rotation is view-only** (`viewRoll` into the camera and sky, never the HUD, never the sim or log).
Orientation change mid-race → pause + recalibrate.

**Audio** — share Sudoku's engine (game-to-game imports have precedent: Solitaire uses Sudoku's `Sheet`; ADR-019's
boundary is site ↔ games). Import `unlockAudio`, `tone`, `haptic`, `semis` from `@/components/sudoku/feedback`
(waking-tap queue, Silent Mode respected — never touch `navigator.audioSession`, iOS switch-tick haptics), and add
one export `audioGraph(): { ctx, out } | null` for continuous voices. `components/lamplighter/audio.ts`: wing hum
(triangle f + sine 2f, 22 Hz flutter, pitch follows speed, built only when the context is `running`, rebuilt on
`statechange`, ducks under babble, stops on pause/finish/hidden); babble (deterministic pentatonic blips per line);
effect sounds (spark scale, blossom whoosh from code-made noise, dew bloop, hit bonk, thread boing, dip sigh, lamp
chime, lantern arpeggio + flame chords). No music in Stage 1. `speech.ts` (pure): priority tutorial > milestone >
reaction > idle; cooldowns (4 s any, 6 s reactions), no repeats per route, caps by chatter level, quiet around Go;
tutorial prompts vary by input mode and are the only lines announced in the `aria-live` region.

**Lifecycle:** pause on `visibilitychange`/`blur`/`pagehide`, `pageshow` persisted → Pause; Wake Lock during races
(re-acquire when visible); `history.pushState` at race start so Chrome iOS's edge back-swipe pauses instead of
leaving. **Reduced motion:** level camera, no bob/twinkle/streaks, fewer particles, horizon switch defaults off,
results/map show final state immediately (`data-motion="reduced"`).

**Persistence** (`components/lamplighter/storage.ts`, Solitaire's try/catch + field-by-field validation pattern):
`lamplighter:progress` `{ v:1, routes: { [id]: { flames, best /*ticks*/, glow, ver } } }` merged on every write
(flames OR'd, best min, glow max — monotone, so no multi-tab owner protocol needed; a route `version` bump clears
best/glow, keeps flames); `lamplighter:settings` `{ steer, chosen, level, tilt, sound, haptics, chatter }`;
`lamplighter:seen`. `storage` events and `pageshow` refresh the map.

**Dev hook** (`race/dev-hook.ts`), gated like `window.__sudoku` (`sudoku-game.tsx:440`): installed from an effect
behind `process.env.NODE_ENV !== "production"` via dynamic import, so the build drops it and the bots.
`window.__lamplighter = { state(), view(), speed(1|2|4|8), autopilot("skilled"|"casual"|null), lamp(i) }`.
A `?debug` overlay (fps, tier, DPR) stays in production for device checks on Vercel previews.

## 3. Files

**New**
- `app/games/lamplighter/page.tsx` — server component on the Sudoku pattern: noindex/nofollow, `appleWebApp
  { capable, title: "Lamplighter", statusBarStyle: "default" }` (ADR-021), apple-capable `other`, `viewport
  { viewportFit: "cover", themeColor: "#0b1030" }`; imports `base.css` then `lamplighter.css`; renders
  `<div className="lmp-shell"><LamplighterGame /></div>`.
- `app/games/lamplighter/apple-icon.png` (180×180, opaque) from `scripts/build-lamplighter-icon.ts` (sharp, inline
  original SVG, `removeAlpha()`), script `lamplighter:icon` in `package.json`.
- `data/lamplighter.ts` — route names/blurbs, tutorial prompts per mode, Wick's line pools, options/results copy,
  `ALL_GAMES`.
- `lib/lamplighter/{math,route,track,items,rules,sim,replay,scoring,bot}.ts`, `lib/lamplighter/routes/*.ts`.
- `components/lamplighter/lamplighter-game.tsx` (`<main id="main">`, screens, settings, progress, sheets, the
  "All games" link), `{title,route-map,results,menus,race}.tsx`, `race/{controller,dev-hook}.ts`,
  `render/{project,camera,quality,scene,sprites,sky,particles}.ts`, `input/{index,keyboard,touch,tilt,tilt-math}.ts`,
  `{audio,speech,storage,hooks}.ts` (`hooks.ts` copies the 10-line `useReducedMotion` from
  `components/sudoku/themes/halloween/hooks.ts`), `lamplighter.css` (scoped `html:has(.lmp-shell)`, the
  `.lmp-sheet*` classes, Solitaire's `100dvh`/overscroll/touch-action shell rules, safe-area padding,
  `color-scheme: dark !important`).
- Tests co-located (§5), `e2e/lamplighter.spec.ts`, `docs/games/lamplighter.md` (shape of `docs/games/solitaire.md`).

**Changed**
- `docs/design-system/DECISIONS.md` — **ADR-022** after ADR-021, before "## 4. Plan closure" (+ a mention in the
  intro). Outline: what it is and its folders under ADR-019's carve-out; original design, all art code-drawn and all
  sound synthesized (rule 14); Canvas 2D projection copied from the Möbius, no new dependency/WebGL/3D library;
  motion and reduced motion; device-orientation permission (asked only from a tap, readings in memory only, Touch
  and keyboard always work); game-to-game imports (`Sheet` + Sudoku's audio engine and `audioGraph`); dev-only hook
  and the `?debug` overlay; Wake Lock and the history entry; costs (~50 KB gz on its own route, governor, pause when
  hidden).
- `components/games/base.css` — add `.lmp-shell` to every hand-listed selector (L18, L27–30 incl. `::backdrop`,
  L40, L45, L51–54, L58–59, L61, L65, L70, L80); `:where()` only.
- `components/sudoku/sheet.tsx` — `prefix: "sdk" | "sol" | "lmp"`.
- `components/sudoku/feedback.ts` (+ `feedback.test.ts`) — `audioGraph()`.
- `data/angeronia.ts` — one `games` entry; then `npm run games:icon` (launcher icon moves to the 2×2 layout).
- `playwright.config.ts` L25–26 — `iphone` regex gains `lamplighter`; `iphone-landscape` → `/(solitaire|lamplighter)\.spec\.ts/`.
- `e2e/games.spec.ts` L58–68 — the back-link test gains Lamplighter.
- `CLAUDE.md` Games section (three games, ADR-022, `lamplighter.md`, `lamplighter:icon`); `docs/games/sudoku.md`
  one line noting `sheet.tsx` / `feedback.ts` are shared.

## 4. Build steps (spine first; each must pass its "Done when" before the next)

0. Branch `feat/lamplighter`; copy this plan to `docs/plans/lamplighter-plan.md` so later sessions can resume it;
   save a memory that the third game is Lamplighter (original) and Shell Express is superseded.
1. **ADR-022.** Done when it is the only change in the diff.
2. **Wiring skeleton** — page, icon script + PNG, base.css lists, minimal CSS, `LamplighterGame` with `main#main`,
   h1, "All games" link; `games` entry + `games:icon`; Playwright regexes; games.spec back link; metadata spec.
   Done when typecheck, `npm test`, `check:theme`, build are green and `/games` shows three icons.
3. **`math`, `route`, `track`** + First Light's segments. Done when `track.test.ts` passes.
4. **`rules`, `items`, `sim` core** (forward, steer, edge, hop, gaps/dip, sparks, lamps, finish) + `replay`.
   Done when `sim.test.ts` and `replay.test.ts` pass (same inputs ⇒ same hash; replay = live).
5. **`bot`, `scoring`, `routes.test.ts`** for First Light; derive and commit par. Done when the fairness tests pass.
6. **Renderer + loop spine** — `project`, `camera` (tested), `sprites`, `sky`, `scene`, `controller`, keyboard,
   minimal HUD and results, Title → First Light → Results, dev hook, `?debug`. Done when First Light plays end to end
   by keyboard in desktop Chromium, the keyboard and autopilot e2e specs pass, and `grep -r __lamplighter
   .next/static` is empty after `npm run build`. **← the spine.**
7. **Governor + canvas memory**, then an **owner device check** on a Vercel preview (Chrome iOS tab and Home Screen
   app). Done when `quality.test.ts` passes, `?debug` shows median ≥ 58 fps over a First Light run on the owner's
   iPhone, and 20 route enter/exit cycles leave canvas memory flat in Web Inspector.
8. **Touch input.** Done when `input/index.test.ts` passes and iphone e2e drag/tap steer and hop.
9. **Tilt** — `tilt-math` (tested), `ensureTilt`, steering choice, Options, calibration, Recenter, horizon
   counter-rotation. Done when the tilt e2e (granted/denied/absent) passes and the owner confirms steering sign in
   portrait and both landscapes, in the tab and the Home Screen app.
10. **Audio + speech** — `audioGraph`, hum, babble, effects, `speech.ts` (tested), bubble. Done when the e2e
    OscillatorNode spec shows sounds starting only while `running`, and Silent Mode mutes them on the device.
11. **Lifecycle + sheets + storage** — Pause/Options (`Sheet prefix="lmp"`), visibility/blur/pagehide/orientation
    pauses, Wake Lock, history entry, `storage.ts` (tested), results write progress. Done when storage tests and the
    hidden/back-swipe e2e pass and progress survives a reload.
12. **Route map, unlocks, windows, results lantern animation, reduced motion.** Done when the seeded-progress and
    reduced-motion e2e pass.
13. **Breadth, one element per route** — for each: sim rule + test, sprite, sound, lines, route file, fairness green,
    owner play-through: 13a Orchard Lane (blossom) · 13b Drizzle Hollow (rain, dew) · 13c Windmill Rise (gust) ·
    13d Weaver's Gap (thread, gaps) · 13e Bell Tower (bat, spiral, belfry).
14. **Tutorial prompts per input mode, landscape layout and safe areas, title idle animation, copy pass.** Done when
    the tutorial-prompt and landscape e2e pass.
15. **Docs + full gate** — `lamplighter.md`, CLAUDE.md, sudoku.md note. Done when typecheck, `npm test`,
    `check:theme`, build and `npm run test:e2e` (all projects) are green.

## 5. Verification

**Unit (Vitest `unit`, node):**
- `track.test.ts` — every route: length = Σ len; 0.5 m sample spacing; orthonormal frames with U·up > 0;
  half-width in [1.5, 5]; no self-intersection (spiral layers ≥ 3 m apart); compiling twice is identical.
- `items.test.ts` — stable ids, sorted, spark spacing, arc heights.
- `sim.test.ts` — idle finish tick = length ÷ cruise ± 1; edge → `off`/slow/drift `back`; hop clears a thread,
  no hop → stuck 30 ticks; gap with/without hop; dew absorbs exactly one hit; tailwind duration; gust push;
  rain and bat windows; no re-taking; one `finish`; glow ≥ 0; **"never dies" fuzz**: 50 seeded random input streams
  per route all finish within 3× par, no NaN.
- `replay.test.ts` — pack/RLE round trips; replay hash = live; retry-from-lamp truncation still matches.
- `scoring.test.ts` — bitmask, union across runs, unlocks, windows; finish+glow flames alone unlock every route.
- `routes.test.ts` (`it.each(ROUTES)`) — skilled bot: 0.80–0.95 × par, reaches the glow goal, all 3 flames in one
  run; casual bot (250 ms lag, noise, misses 30% of hops) finishes within 2× par; idle bot within 3× par;
  `glowGoal` within [0.5 × max, 0.85 × skilled].
- `camera.test.ts` (Wick stays in frame every 5 m at aspects 0.46 and 2.16; eye never inside the belfry; roll
  clamp; reduced ⇒ no bank roll), `project.test.ts`, `quality.test.ts`, `tilt-math.test.ts` (4 orientations, no
  flip at β = 90°, flat ⇒ null roll), `speech.test.ts`, `input/index.test.ts`, `storage.test.ts`, `feedback.test.ts`.

**E2E (`e2e/lamplighter.spec.ts`, chromium + iphone, landscape on iphone-landscape):** noindex + web-app meta +
`main#main` + "All games"; keyboard steer/hop/pause (tick freezes in Pause, focus returns to the stage); hop the
tutorial gap with `dips === 0`; autopilot + `speed(8)` to the lantern → 3 flames, progress saved, Orchard Lane
unlocked, 3 lit windows; tilt granted/denied/absent via a stubbed `DeviceOrientationEvent`; touch drag/tap/second
finger (iphone); sound via the OscillatorNode patch (as `e2e/sudoku.spec.ts` L76–85); reduced motion
(`data-motion="reduced"`, `view().roll === 0`); pause on hidden and on `goBack()`; seeded progress from a
same-origin page without the game; landscape safe areas, no page scroll.

**Gates:** `npm run typecheck`, `npm test`, `npm run check:theme`, `npm run build`, `npm run test:e2e` (local; not in
CI). **Owner device checks** (steps 7, 9, 10, 13): Vercel preview over https on the owner's iPhone, in a Chrome tab
and as a Home Screen app — frame rate, tilt sign per orientation, Silent Mode, haptics, Wake Lock.

## 6. Risks

| Risk | Mitigation |
|---|---|
| Canvas fill rate / heat on iPhone | DPR ≤ 2, governor, opaque canvas, atlas, no `shadowBlur`/`filter`, preallocation |
| WebKit canvas memory cap | 3 canvases, zeroed on exit, DOM/SVG elsewhere, checked in step 7 |
| Tilt permission in Chrome iOS / Home Screen | ask synchronously in the tap, each session; 1 s no-event ⇒ absent; Touch always works; https |
| Sensor sign conventions | gravity-vector mapping unit-tested for 4 orientations + device check + Recenter |
| Audio unlock / interruptions | Sudoku's waking-tap queue; hum built on `running`, rebuilt on `statechange` |
| Screen lock during tilt play | Wake Lock on Go, re-acquired when visible (verify on device) |
| Back-swipe ends the race | history entry; `popstate` pauses |
| Determinism for future ghosts | no trig/RNG in `step`, quantized tables, versions stamped on logs |
