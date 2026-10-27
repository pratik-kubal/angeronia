# Color Tap (`/games/paint-by-numbers`)

Paint by numbers, made here on 2026-10-27. Like Sudoku and Solitaire it keeps its own look and sits outside the
design system: see [ADR-019](../design-system/DECISIONS.md) and, for this game, [ADR-022](../design-system/DECISIONS.md)
(the route, build-time conversion, and why a bad photo is stopped at the pull request). Read this before touching
`components/color-tap/` or `lib/color-tap/`.

On the `/games` launcher and the home page's Games section, both of which show this game's `apple-icon.png`
([ADR-020, ADR-021](../design-system/DECISIONS.md)). There is no short path (no `/paint-by-numbers` redirect: the
owner's call). Not in the header, the footer or `sitemap.ts`, and `noindex`. Saved to a home screen there is no back
button, so the game keeps its own link to `/games` (the bar's house, and a row in its sheets).

```bash
npm run color-tap:puzzles            # photos -> puzzles; runs before `npm run dev` and `npm run build`
npm run color-tap:puzzles -- --force # remake every puzzle
npm run color-tap:puzzles -- --check # CI: writes nothing, fails on a bad photo or puzzles not committed
npm run color-tap:preview -- <dir>   # blank sheet | painting | photo per photo and level, with metrics
npm run color-tap:icon               # the home-screen icon, from the butterfly's Easy puzzle
```

## The game

Every photo in `public/paint-by-numbers/` (a JPG, JPEG or PNG; today a blue morpho, berries and autumn leaves) is a
picture at five levels: **Easy 12, Medium 20, Hard 30, Expert 45 and Master 60 colours**. A harder level has more
colours *and* smaller areas, so its finished painting is closer to the photo (the ladder is measured and tested: more
areas and a lower ΔE against the photo at every step, for every photo). The player picks a colour in the paint box and
taps its areas. The look is a **dark studio** (the owner's call): a navy ground with a few still, soft lights, round
glass buttons, and the picture on white paper.

- **First visit:** the New painting sheet can't be dismissed. Picture cards (each with five dots, one per level:
  blank, started or done: it is also the gallery), five level chips ("12 Easy", with the real colour count), a line
  with the areas, the level's blurb and its magnifiers, and Start / Continue N %. Behind it, the chosen picture's
  **blank sheet** (outlines and numbers only), fitted into the space above the sheet on a phone.
- **Painting:** the selected colour's open areas get a quiet grey checker fixed to the screen; an area too small to
  see at the current zoom also gets a tint and a dot, so every remaining area can be found at fit. Tapping an area of
  that colour paints it: the paint spreads from the finger (260 ms), a few specks fly off big areas, a soft
  pentatonic pop climbs a step with each quick fill. A tap within 12 CSS px of an open area of the colour paints it
  (a forgiving finger). Another colour's area just says so: its number swells, its swatch wiggles, a gentle "bonk",
  nothing recorded, no penalty. Painted areas are locked.
- **The paint box:** one round swatch per colour, in number order (neutrals first, then by hue, light to dark), the
  number in black or white by contrast. A ring fills as the colour's areas are painted; the selected swatch lifts and
  shows how many are left (amber at 3 or fewer). A finished colour keeps its place with a tick, a chime plays, and
  600 ms later the next unfinished colour is picked (Settings can turn that off). The camera never moves on its own.
- **The magnifier** (3 / 4 / 5 / 6 / 8 uses per painting, more on harder levels: the owner's call) flies to an open
  area of the colour the player can't see (its number off screen or under 24 CSS px across): the smallest, ties to the
  one nearest the middle; it arrives with the area 72 CSS px across and rings it twice. A use is charged only when it
  arrives: a touch that cuts the flight short costs nothing. With nothing hidden it rings every remaining area for
  free; with none left it says so.
- **Zoom:** pinch (with a little give past the limits, springing back), the slider (logarithmic), − / + / Fit; a
  mouse wheel or trackpad pinch zooms at the pointer, a trackpad scroll pans. Double-click has no zoom of its own (its
  first click would paint: the owner's call). The most zoom is where the thinnest area is 40 CSS px across.
- **Auto-paint** fits the picture and paints the rest area by area, colour by colour, each colour as a
  nearest-neighbour chain, in 8–30 s whatever the level, with a breath between colours. A Stop pill, or any tap on the
  picture, stops it (that tap only stops it, and paints nothing); nothing it painted is undone.
- **The finish:** a beat of stillness, the outlines and numbers fade away (the kit's "after" has no lines), a fanfare,
  the painting held, then the player's own fills replayed in order in 8 s (skipped if auto-paint did most of it). The
  Finished sheet compares **Before** (the blank sheet), **After** (the painting) and the **Photo**, with the areas,
  colours, time and anything auto-painted, Replay, and Save image (a PNG through the share sheet, or a download).
- **Saves:** every painting (picture × level) is kept, so switching never loses one; the last one opened reopens. A
  change is saved 0.3 s after it is made; the clock on its own every 15 s, and whenever the page is hidden or left.

## How a photo becomes a puzzle (`lib/color-tap/`, pure, relative imports)

`scripts/build-color-tap-puzzles.ts` decodes each photo with sharp (EXIF-rotated, transparency on white, long edge
800 px: the **work grid**; every size below is in its px) and runs `generate()`:

1. **`color.ts`:** sRGB ↔ OKLab (Ottosson), ΔE, the black/white ink pick (luminance cut at 0.179).
2. **`smooth.ts`:** a bilateral filter in OKLab (r 3, σs 2, σr 0.06; two passes on Easy and Medium, one above), which
   flattens JPEG noise and texture and keeps edges.
3. **`quantize.ts`:** weighted k-means on an OKLab histogram (64 × 81 × 81 bins), each bin counting `count^0.65` so a
   big soft background can't take every colour and small distinct details keep one; k-means++ seeded (7707, `mulberry32`),
   best of three. Colours closer than the level's floor (ΔE 0.055 Easy → 0.022 Master) merge; the worst cluster is
   split to stay near the count.
4. **`regions.ts`:** two 3 × 3 mode filters; then up to six rounds in which every pixel of a strip thinner than a
   radius-2 opening, or of an area under the level's floors (area 220 → 30 px², inscribed radius 5 → 2.25 px), is
   dropped and the surviving areas **regrow** into it, each pixel taking the neighbouring colour nearest its own (so
   an anti-aliased edge band splits along the photo's edge, not along a straight Voronoi line); then a merge pass that
   only grows areas, smallest first, into the neighbour minimising ΔE ÷ (¼ + shared edge ÷ perimeter). Over the
   level's area cap, the floors rise and it runs again. Each colour is then the **geometric median** of the photo's
   own pixels painted with it (a mean lets highlights grey a blackberry), and colours lost or merged are asked for
   again so the count lands near the level's.
5. **`edt.ts`:** the exact Felzenszwalb–Huttenlocher distance transform, for inscribed radii and labels.
6. **`borders.ts`:** borders run along the cracks between pixels. Each stretch between two junctions (three or more
   areas meet, or a picture corner) is **one segment shared by both its areas**: traced once, smoothed once (edge
   midpoints, Douglas–Peucker at 0.55 px) and drawn as a quadratic B-spline, which is the same curve walked backwards,
   so neighbours never gap or overlap. Rings are chained from half-segments, left turn first.
7. **`labels.ts`:** each number at its area's pole of inaccessibility (ties to the centroid), sized to the circle
   that fits there; long areas get a few more, four radii apart.
8. **`puzzle.ts`:** the file format (JSON, little-endian typed arrays in base64, points in eighths of a px, each the
   step from the last): 15–40 KB gzipped for Easy, 65–125 KB for Master.

**The levels** (`levels.ts`; tune them with `color-tap:preview`):

| Level | Colours | Smoothing | Min area | Min radius | Area cap | Colour floor (ΔE) | Magnifiers |
|---|---|---|---|---|---|---|---|
| Easy | 12 | 2 | 220 | 5 | 260 | 0.055 | 3 |
| Medium | 20 | 2 | 130 | 4 | 480 | 0.042 | 4 |
| Hard | 30 | 1 | 75 | 3.25 | 850 | 0.033 | 5 |
| Expert | 45 | 1 | 48 | 2.7 | 1350 | 0.026 | 6 |
| Master | 60 | 1 | 30 | 2.25 | 2100 | 0.022 | 8 |

Measured on the three photos (areas, then mean OKLab ΔE of the finished painting against the photo):

| | Easy | Medium | Hard | Expert | Master |
|---|---|---|---|---|---|
| Butterfly | 127 · 0.042 | 247 · 0.036 | 441 · 0.033 | 663 · 0.031 | 972 · 0.028 |
| Berries | 160 · 0.099 | 309 · 0.097 | 692 · 0.086 | 1009 · 0.083 | 1902 · 0.075 |
| Leaves | 135 · 0.052 | 332 · 0.046 | 533 · 0.044 | 852 · 0.044 | 1409 · 0.041 |

**Build time, not the browser** (ADR-022): browsers decode and downscale JPEGs differently and Safari's fingerprinting
protection adds noise to canvas reads, so a picture made on the phone could differ between visits and break saves.
Output, all committed: `public/paint-by-numbers/puzzles/<picture>-<level>.<id>.json` and `<picture>.<hash>.webp`
(served `immutable`), and the manifest `lib/color-tap/pictures.ts`.

**Players' progress comes first** (the owner's call). The script remakes a puzzle only when something deliberate
changes: its photo, its level's conversion settings (not its name or magnifiers), the seed, the work size or
`PIPELINE_VERSION`. The conversion's code and
sharp are left out of that key on purpose (a comment edit or a library update must not remake puzzles people are
painting), so **a change to the conversion that alters a puzzle must bump `PIPELINE_VERSION` by hand**; look at
`color-tap:preview` before committing. A remade puzzle never takes a painting away: the old puzzle stays in the
folder, listed as `retired` (with its own area count), and a painting begun on it resumes and finishes on it; only
"Start this painting again" moves to the current puzzle. Nothing a manifest entry or a retired entry points at is
ever deleted; a retired puzzle goes only with its photo.

**A bad photo** (damaged, named the same as another once lower-cased and stripped of accents: `Leaves.jpg` and
`leaves.png`, an image in a format the conversion doesn't read such as HEIC or WebP, or one whose puzzle would break
its level's promises) never stops `npm run dev` or a deploy: the build leaves it out with a warning and the rest of the
site builds; a picture already listed keeps its earlier puzzles, current and retired. On a name clash the photo already in the manifest keeps its name. CI's **Color Tap photos** job
(`--check`) fails on all of these, and on a photo whose puzzles weren't committed, and as a required check in the
`main` ruleset it stops the pull request merging.

## The client (`components/color-tap/`)

- `color-tap-game.tsx`: the screen (`<main id="main">`), with the Sudoku/Solitaire skeleton: client-only state, the
  owner-tab protocol (`claimGame` / `ownsGame`, storage events, visibility, capture-phase presses, `pageshow`), saves
  300 ms after each change and on `pagehide`, the clock (only while painting, in view and in hand), keys, the
  finale and the dev-only `window.__colorTap` hook (state, puzzle, an area's point on screen, camera) the e2e specs use.
- `stage.tsx`: the canvas and everything that moves the view (native pointer listeners; React never re-renders during a
  gesture); the camera in a ref; flights; inertia; springs; the zoom slider's store; `?perf` shows frame times in
  development.
- `renderer.ts`: draws from vectors each frame, so it is sharp at any zoom: paper, painted colours (one path per
  colour, stroked a device px in its own colour so no seam shows), the checker, reveals, outlines, numbers (sized to
  the screen, hidden under 7 CSS px), specks, the magnifier's ring, the keyboard's focus ring. A frame is drawn only
  when something drawn changes. Measured with `?perf` on Berries Master (1,902 areas): p95 2–4 ms per frame in WebKit
  on an M2, at every zoom and half painted, so the cached raster layers and tile pyramid the plan held in reserve were
  not built; measure on the oldest iPhone to support before adding them.
- `palette.tsx`, `menus.tsx` (New painting, Settings, Finished, the Before/After snapshots and the PNG export),
  `feedback.ts` (sounds on Sudoku's synth: `unlockAudio`, `tone`, `haptic`), `storage.ts` (`color-tap:works`, `:current`,
  `:settings`, `:owner`, `:coach`; guarded), `color-tap.css` (every rule under `html:has(.ctp-shell)` / `.ctp-*`;
  motion only under `prefers-reduced-motion: no-preference`).
- `lib/color-tap/`: `game.ts` (the rules and the saved form: the fill order as base64 Uint16), `camera.ts` (fit, clamp,
  zoom about a point, the log slider, van Wijk–Nuij flights), `gesture.ts` (tap / pan / pinch / glide), `hit.ts` (a
  32 px grid of boxes, then point-in-outline).
- **Keyboard:** the palette, the New painting sheet's pictures and levels, and the Finished tabs are radiogroups or
  tabs with one tab stop each (arrows, Home, End). The picture is `role="application"` (described by a hidden line
  listing its keys, and How to play lists them too): N / Shift+N go to the next / previous open area of the colour (the
  view follows, a focus ring is drawn), Enter or Space paints it (with nothing found yet, Enter finds the first), arrows
  pan (Shift for more), + − 0 zoom, M is the magnifier, Escape stops auto-paint from anywhere. One polite live region
  says what happened (auto-paint only when it starts and stops). Focus goes to the picture when a painting starts.
- **iOS:** `viewport-fit=cover` and safe-area padding, `100dvh` with no page scroll, `touch-action: none` on the stage,
  Safari's `gesture*` events held off, `color-scheme: dark !important` (next-themes writes it inline), canvases capped
  at 2 device px per CSS px and sized to nothing on unmount. Web Audio is ambient: Silent Mode mutes it (Settings says so).
  Haptics are Sudoku's (`navigator.vibrate`, or the iOS 18 switch tick inside the tap).

## Research behind it (2026-10-27)

Four research agents and a critic; the findings that decided the design, with sources.

- **Generation.** The skeleton (quantise, clean, regions, merge small ones, share borders, place labels) follows
  [drake7707/paintbynumbersgenerator](https://github.com/drake7707/paintbynumbersgenerator), whose issues show what to
  avoid: labels outside nested facets ([#43](https://github.com/drake7707/paintbynumbersgenerator/issues/43)), labels
  too small or spilling ([#5](https://github.com/drake7707/paintbynumbersgenerator/issues/5),
  [#50](https://github.com/drake7707/paintbynumbersgenerator/issues/50)), small distinct colours averaged away
  ([#12](https://github.com/drake7707/paintbynumbersgenerator/issues/12)), arbitrary numbering
  ([#23](https://github.com/drake7707/paintbynumbersgenerator/issues/23)). Quantisation: k-means refined from a good
  start beats median cut and octree ([Celebi 2011](https://arxiv.org/abs/1101.0395)); weighted k-means on a histogram,
  as in [material-color-utilities](https://github.com/material-foundation/material-color-utilities). OKLab over CIELAB
  for hue ([Ottosson](https://bottosson.github.io/posts/oklab/)); ΔE ≈ 0.02 is a just-noticeable difference. Thin
  strips need a distance transform, not an area floor alone
  ([axecrafted](https://www.axecrafted.com/en/posts/an-attempt-at-paint-by-numbers-part-1/)); labels at the pole of
  inaccessibility ([polylabel](https://github.com/mapbox/polylabel)); shared, once-simplified borders as in
  [vtracer](https://github.com/visioncortex/vtracer)'s cutout mode.
- **Fun, for a person.** The emotional target is low-stakes calm: no fail state, no timer, no streaks
  ([Lake](https://blog.lakecoloring.com/the-slow-hobby-manifesto-why-coloring-is-the-most-sustainable-thing-you-can-do-for-yourself-this-earth-month/),
  [Happy Color reviews](https://justuseapp.com/en/app/1407852246/happy-color-coloring-games/reviews)); responsiveness
  before juice, and juice that doesn't become a crutch
  ([Wayline](https://www.wayline.io/blog/the-seductive-squeeze-when-juice-in-game-development-becomes-a-crutch)); the
  last tiny area is the classic frustration, so highlight, show what's left, auto-advance, and a scarce magnifier;
  progress rings use the goal-gradient effect; the ending decides the memory
  ([peak-end rule](https://lawsofux.com/peak-end-rule/)), hence the finale and the timelapse; numbers, not colours,
  carry the meaning ([Game Accessibility Guidelines](https://gameaccessibilityguidelines.com/full-list/)).
- **UI/UX on a phone.** Tools and palette in the thumb zone; 44–48 px targets
  ([WCAG 2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)); tap/pan/pinch from Pointer
  Events with slop ([Pointer Events](https://w3c.github.io/pointerevents/)); inertia and wheel zoom after
  [MapLibre](https://github.com/maplibre/maplibre-gl-js)'s handlers; flights by van Wijk–Nuij
  ([d3-interpolate zoom](https://d3js.org/d3-interpolate/zoom)); iOS page zoom held off with `touch-action` and
  [`GestureEvent`](https://developer.mozilla.org/en-US/docs/Web/API/GestureEvent); WebKit canvas memory limits; a real
  radiogroup and a polite live region for screen readers ([canvas accessibility](https://w3.org/Talks/2014/0510-canvas-a11y)).
- **Sound.** Short, soft, pentatonic, rising with progress, never punishing; fixed motifs so a sound means one thing;
  rate limits so auto-paint stays music ([web.dev on game audio](https://web.dev/articles/webaudio-games),
  [Material sound](https://m2.material.io/design/sound/applying-sound-to-ui.html),
  [Peggle Blast's peg hits](https://audiokinetic.com/fr/blog/peggle-blast-peg-hits-and-the-music-system)). Web Audio is
  ambient on iOS ([Audio Session](https://www.w3.org/TR/audio-session/)), and Safari's switch-tick haptic needs user
  activation ([WebKit 285120](https://bugs.webkit.org/show_bug.cgi?id=285120)); it may be silent on iOS 26.5 and later
  ([ios-haptics](https://github.com/tijnjh/ios-haptics)).

## Tests

Unit (`npm test`, Vitest in node, co-located):

- `lib/color-tap/borders.test.ts` — hand-drawn maps (one colour, two halves, a checkerboard corner, an area touching
  itself around diagonal holes, nested islands, noise): rings close, every half-segment used once, ring areas exactly
  the pixel counts, deep pixels inside the smoothed outline.
- `lib/color-tap/generate.test.ts` — a synthetic picture (gradient, sun, block, noise, 1-px lines): covered exactly
  once, every area above the floors, every number inside its area, colours told apart, 1-px lines gone, the same
  pixels give byte-identical puzzles, the file reads back as itself.
- `scripts/color-tap-puzzles.test.ts` — the committed puzzles against the photos: names usable, every photo fresh at
  every level, retired puzzles still readable, nothing else in the folder, each level's promises (`puzzleProblems`,
  shared with `--check` and the build), and the ladder (more areas at every level; ΔE never more than a hair worse
  than the level below, and Master well under Easy).
- `lib/color-tap/game.test.ts`, `camera.test.ts`, `gesture.test.ts`, `hit.test.ts`,
  `components/color-tap/storage.test.ts`, `feedback.test.ts`, `scripts/color-tap-icon.test.ts`, `next.config.test.ts`.

End to end (`npm run test:e2e`, `e2e/color-tap.spec.ts` on desktop Chromium, and in WebKit on an iPhone 15 upright
and on its side and an iPad): noindex web app on one screen with a way back; the first-visit sheet (no Close, every
photo, five levels) over a **blank sheet with no colour in it**; a tap paints the selected colour's area and the
swatch counts down, another colour's only says so; a reload resumes; a finished colour picks the next; the magnifier
flies and spends a use; **auto-paint finishes and the After is close to the photo** (mean RGB difference under 40,
and under half the blank sheet's); a tap stops auto-paint, and so does any sheet; keyboard play (desktop); every painting kept and
continued; two tabs; reduced motion; Settings asks before clearing a painting every time it opens; a second, smaller
painting finished after a first. `e2e/games.spec.ts` covers the launcher tile and the way back.
