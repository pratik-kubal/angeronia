"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import { mulberry32 } from "@/lib/random";
import { popcount } from "@/lib/sudoku/grid";
import { EMBLEM_TAP_MS } from "@/lib/sudoku/themes/types";
import type { SceneProps } from "../types";
import { useAnchor, type Anchor } from "../use-anchor";
import { Cabin, Chickadee, Crystal, Mitten, Pine, SmallMug, Sled, Snowman, type Vars } from "./art";
import { clothesline, type Line } from "./layout";
import { markThrow } from "./throw";

// Snow Day's scene, behind the game. Snow falls everywhere but behind the pad and the dock. A
// clothesline is strung between the round buttons, under the title, with a peg for every box, and
// a knitted mitten is pegged on for each finished one; at night fairy lights run along it. Where
// there's room, the yard grows too: on a wide screen a cabin whose nine window panes defrost box by
// box and a snowman built a part per box; on a tall screen (in the band under the board) or a phone
// on its side (in the free band over the pad), the snowman and a mug of cocoa. The drift along the
// bottom deepens as the board fills, up into the band over the dock. Solved: a chickadee lands on
// the line, the mittens hop (the lights chase, at night) and the snowman, hat on, waves.

/** The wool of box b's mitten. */
const YARN = ["#c64a5a", "#d9a441", "#6e9fd6", "#3f7f70", "#86609e", "#e07f68", "#4c6aa6", "#d98aa0", "#8aa45a"];
const SOLVED = 511;
/** The yard's scenery needs this much room beside the game, on each side. */
const PAGE_MIN = 180;
/** The snowman's nook needs a band at least this tall. */
const NOOK_MIN = 72;
/** The drift's crest rises at most this far over the dock (and never behind the keys). */
const DRIFT_PEEK = 24;
/** The dock's corner radius (sudoku.css): the drift is cut away behind it. */
const DOCK_RADIUS = 20;
/** A wide screen's yard stands on ground this far over the bottom. */
const GROUND = 50;
/** The yard's snowman throws on the third poke in a row (the snowball secret's scene target). */
const POKES = 3;
const THROW = `snowman-${POKES}`;

export function Backdrop({ boxes, filled, beat }: SceneProps) {
  const shell = useAnchor(".sdk-shell");
  const game = useAnchor(".sdk-game");
  const bar = useAnchor(".sdk-bar");
  const title = useAnchor(".sdk-title");
  const board = useAnchor(".sdk-board");
  const gapB = useAnchor(".sdk-gap-b");
  const pad = useAnchor(".sdk-pad");
  const dock = useAnchor(".sdk-dock");

  // The boxes already finished when the scene came up appear at rest; a box finished after that
  // arrives with a flourish (a new game clears the slate).
  const [still, setStill] = useState(boxes);
  if ((still & boxes) !== still) setStill(still & boxes);

  // All nine of a digit placed: every mitten on the line sways (never for a beat from before the
  // scene came up). Sways are counted, so each one swaps the animation's name and plays again.
  const [since] = useState(() => beat?.token ?? 0);
  const [sway, setSway] = useState({ token: 0, count: 0 });
  if (beat && beat.token > since && beat.token !== sway.token && beat.kind !== "deal" && beat.kind !== "miss" && beat.digitDone)
    setSway({ token: beat.token, count: sway.count + 1 });

  // The yard's snowman counts pokes in a row, each within EMBLEM_TAP_MS, and wobbles on every one.
  const [pokes, setPokes] = useState({ run: 0, total: 0 });
  const idle = useRef(0);
  useEffect(() => () => window.clearTimeout(idle.current), []);
  const poke = useCallback((e: MouseEvent<HTMLElement>) => {
    // The throw: the snowball starts at this snowman (the tap handler fires the secret right after).
    if (e.currentTarget.dataset.tap === THROW) markThrow(e.currentTarget);
    window.clearTimeout(idle.current);
    idle.current = window.setTimeout(() => setPokes((p) => ({ ...p, run: 0 })), EMBLEM_TAP_MS);
    setPokes((p) => ({ run: (p.run + 1) % POKES, total: p.total + 1 }));
  }, []);

  // The line hangs over the board, or on a phone on its side (the pad beside the board) over the pad.
  const line = useMemo(
    () => (bar && title && board && pad ? clothesline(bar, pad.x >= board.x + board.width ? pad : board, title) : null),
    [bar, title, board, pad],
  );
  if (!shell || !game || !bar || !title || !board || !pad || !dock || !line) return null;

  const wide = game.x >= PAGE_MIN;
  const stage = popcount(boxes);
  const snowman = {
    stage,
    from: popcount(still),
    // Only the rolling snowball (no box yet) follows the fill, so the yard redraws once a box, not once a digit.
    roll: stage ? 1 : Math.min(1, Math.max(0, (filled - 0.3) / 0.5)),
    done: boxes === SOLVED,
    wave: boxes === SOLVED && still !== SOLVED,
    // The third poke in a row reads as its own target: the tap handler sees it before this re-renders.
    target: pokes.run === POKES - 1 ? THROW : "snowman",
    wobble: pokes.total,
    poke,
  };
  const nook = wide ? null : nookBox(bar, line, board, pad, gapB);
  // No snow falls behind the pad and the dock (it would speckle the glass keys).
  const holeX = Math.min(pad.x, dock.x) - 4;
  const hole = {
    "--hx": `${holeX}px`,
    "--hy": `${pad.y - 4}px`,
    "--hw": `${Math.max(pad.x + pad.width, dock.x + dock.width) + 4 - holeX}px`,
    "--hh": `${dock.y + dock.height - pad.y + 8}px`,
  } as Vars;
  // The drift's crest, when the board is full: in the band over the dock, never behind the keys
  // (pale snow behind the glass keys would wash them out at night), and on a wide screen down by
  // the yard's ground, so it never buries the cabin. It sits a fifth of the way down the drift's box.
  const crest = Math.max(pad.y + pad.height + 2, dock.y - DRIFT_PEEK, wide ? shell.height - GROUND - 6 : 0);

  return (
    <div className="sdk-snow-scene" style={hole}>
      <Sky width={shell.width} height={shell.height} page={wide ? game.x : 0} bar={bar} title={title} />
      {wide && <Hills page={game.x} />}
      {wide && <Yard width={shell.width} height={shell.height} page={game.x} boxes={boxes} {...snowman} />}
      <Drift height={Math.max(16, (shell.height - crest) / 0.8)} filled={filled} dock={dock} />
      {nook && <Nook box={nook} {...snowman} />}
      <Flakes width={shell.width} />
      <Clothesline bar={bar} line={line} boxes={boxes} still={still} sway={sway.count} />
    </div>
  );
}

/**
 * The empty room a snowman can stand in: a tall screen's band under the board, or on a phone on
 * its side the free band between the header (and the mittens under it) and the pad.
 */
function nookBox(bar: Anchor, line: Line, board: Anchor, pad: Anchor, gapB: Anchor | null): Anchor | null {
  if (gapB && gapB.height >= NOOK_MIN) return gapB;
  if (pad.x < board.x + board.width) return null;
  const top = bar.y + Math.max(bar.height, line.bottom) + 4;
  return pad.y - 4 - top >= NOOK_MIN ? { x: pad.x, y: top, width: pad.width, height: pad.y - 4 - top } : null;
}

type Star = { x: number; y: number; size: number; twinkle: number };

/** The sun by day and a crescent moon by night, and stars at night. */
const Sky = memo(function Sky({ width, height, page, bar, title }: { width: number; height: number; page: number; bar: Anchor; title: Anchor }) {
  const sky = useMemo(() => {
    const rng = mulberry32(1201);
    const stars: Star[] = [];
    if (page) {
      const sc = Math.min(1, page / 380);
      const sun = { x: width - page * 0.3, y: 112, r: 30 * sc };
      const moon = { x: page * 0.3, y: 116, r: 26 * sc };
      for (let tries = 0; stars.length < 12 && tries < 200; tries++) {
        const side = stars.length % 2;
        const x = side ? width - page + 14 + rng() * (page - 28) : 14 + rng() * (page - 28);
        const y = 14 + rng() * height * 0.42;
        if (Math.hypot(x - moon.x, y - moon.y) < moon.r * 2.6) continue;
        stars.push({ x, y, size: 1.6 + rng() * 1.8, twinkle: stars.length < 4 ? 3.4 + stars.length * 0.9 : 0 });
      }
      return { sun, moon, stars, clouds: [{ x: page * 0.42, y: 232, s: sc }, { x: width - page * 0.55, y: 300, s: 0.8 * sc }] };
    }
    // A phone: the sun or moon sits in the pocket between the title and the home button, where it
    // fits (a long title on a narrow phone leaves none).
    const right = bar.x + bar.width - 44;
    const orb = { x: (title.x + title.width + right) / 2, y: bar.y + 13, r: Math.min(9, (right - title.x - title.width) / 2 - 3) };
    const shown = orb.r >= 5;
    const top = bar.y + bar.height + 24;
    for (let tries = 0; stars.length < 6 && tries < 200; tries++) {
      const x = 6 + rng() * (width - 12);
      const y = 4 + rng() * top;
      // (On a phone on its side the header is only over the right-hand column.)
      const inBar = y < bar.y + bar.height + 4 && x > bar.x - 8 && x < bar.x + bar.width + 8;
      if (inBar && x > title.x - 26 && x < title.x + title.width + 26) continue;
      if (inBar && (x < bar.x + 52 || x > right - 8)) continue;
      if (shown && Math.hypot(x - orb.x, y - orb.y) < 20) continue;
      stars.push({ x, y, size: 1.6 + rng() * 1.6, twinkle: stars.length < 3 ? 3.6 + stars.length * 1.1 : 0 });
    }
    return { sun: shown ? { ...orb, r: orb.r + 1 } : null, moon: shown ? orb : null, stars, clouds: [] };
  }, [width, height, page, bar, title]);

  return (
    <>
      {sky.sun && <span className="sdk-snow-sun sdk-snow-day" style={{ left: sky.sun.x, top: sky.sun.y, "--r": `${sky.sun.r}px` } as Vars} />}
      {sky.moon && <span className="sdk-snow-moon sdk-snow-night" style={{ left: sky.moon.x, top: sky.moon.y, "--r": `${sky.moon.r}px` } as Vars} />}
      {sky.clouds.map((c, k) => (
        <span key={k} className="sdk-snow-cloud sdk-snow-day" style={{ left: c.x, top: c.y, "--s": c.s, "--dur": `${48 + k * 12}s` } as Vars} />
      ))}
      {sky.stars.map((s, k) => (
        <span
          key={k}
          className="sdk-snow-star sdk-snow-night"
          data-twinkle={s.twinkle ? "" : undefined}
          style={{ left: s.x, top: s.y, "--size": `${s.size}px`, "--dur": `${s.twinkle}s` } as Vars}
        />
      ))}
    </>
  );
});

type SnowmanSpot = {
  stage: number;
  from: number;
  roll: number;
  done: boolean;
  wave: boolean;
  target: string;
  wobble: number;
  poke: (e: MouseEvent<HTMLElement>) => void;
};

/** The drawn snowman's top in his 100×150 frame, by stage: the ball, the base, the body, the head (through the buttons), the hat. */
const TOP = [118, 88, 54, 27, 27, 27, 27, 27, 27, 10];

/**
 * The snowman you can poke: he wobbles each time (two names, so every poke restarts it). Only what
 * is drawn takes the poke (at least 32px square): early on, most of his frame is sky and snow.
 */
function Yardman({ left, bottom, height, ...s }: SnowmanSpot & { left: number; bottom: number; height: number }) {
  const width = (height * 100) / 150;
  const hit = { width: Math.max(32, (s.stage ? 0.62 : 0.3) * width), height: Math.max(32, ((150 - TOP[s.stage]) / 150) * height) };
  // Before the first box, only the rolling snowball (centred at x 42) is there.
  const mid = (s.stage ? 0.5 : 0.42) * width;
  return (
    <div
      className="sdk-snow-yardman"
      data-wobble={s.wobble ? (s.wobble % 2 ? "a" : "b") : undefined}
      style={{ left: left - width / 2, top: bottom - height, width, height }}
    >
      <Snowman stage={s.stage} from={s.from} roll={s.roll} done={s.done} wave={s.wave} />
      <span className="sdk-snow-poke" data-tap={s.target} onClick={s.poke} style={{ left: mid - hit.width / 2, ...hit }} />
    </div>
  );
}

/** A wide screen's yard: the cabin on the left page, the snowman and a sled on the right, spruces, far hills. */
const Yard = memo(function Yard({ width, height, page, boxes, ...snowman }: SnowmanSpot & { width: number; height: number; page: number; boxes: number }) {
  const sc = Math.min(1, page / 380);
  const base = height - GROUND;
  const right = width - page;
  const cabin = { width: 230 * sc, height: 172.5 * sc };
  const cabinLeft = page * 0.54 - cabin.width / 2;
  const cabinTop = base + 6 - cabin.height;
  const pine = (x: number, bottom: number, h: number, tone: 1 | 2) => (
    <div className="sdk-snow-pine" style={{ left: x - h * 0.32, top: bottom - h, width: h * 0.64, height: h }}>
      <Pine tone={tone} />
    </div>
  );
  return (
    <>
      {pine(page * 0.14, base - 10, 170 * sc, 2)}
      {pine(page * 0.9, base - 2, 124 * sc, 1)}
      <div className="sdk-snow-cabin" style={{ left: cabinLeft, top: cabinTop, width: cabin.width, height: cabin.height, "--lit": 0.35 + (0.65 * popcount(boxes)) / 9 } as Vars}>
        <span className="sdk-snow-glow" />
        <Cabin boxes={boxes} />
        <span className="sdk-snow-smoke" style={{ "--delay": "0s" } as Vars} />
        <span className="sdk-snow-smoke" style={{ "--delay": "-2.6s" } as Vars} />
        <span className="sdk-snow-steam" />
      </div>
      {pine(right + page * 0.84, base - 14, 150 * sc, 2)}
      {pine(right + page * 0.97, base, 110 * sc, 1)}
      <div className="sdk-snow-sled" style={{ left: right + page * 0.64 - 35 * sc, top: base - 24 * sc, width: 74 * sc, height: 30 * sc }}>
        <Sled />
      </div>
      <Yardman left={right + page * 0.4} bottom={base + 4} height={216 * sc} {...snowman} />
    </>
  );
});

/**
 * A wide screen's far hills and the bank the yard stands on, one per page (the right one mirrored),
 * each sloping away before the game's column so no snow shows behind its glass.
 */
const Hills = memo(function Hills({ page }: { page: number }) {
  const hill = (side: "left" | "right") => (
    <svg className="sdk-snow-hills" data-side={side} viewBox="0 0 400 100" preserveAspectRatio="none" style={{ width: page + 24, height: 180 }} aria-hidden>
      <path d="M0 22 C80 6 160 14 240 30 C300 42 350 70 400 98 V100 H0 Z" fill="var(--sdk-snow-far)" />
      <path d="M0 64 C100 54 220 70 310 74 C356 76 384 90 400 100 H0 Z" fill="var(--sdk-snow-shade)" />
      <path d="M0 70 C110 62 230 76 322 80 C364 82 388 94 400 100 H0 Z" fill="var(--sdk-snow-ground)" />
    </svg>
  );
  return (
    <>
      {hill("left")}
      {hill("right")}
    </>
  );
});

/**
 * The snow along the bottom: it deepens as the board fills. It is cut away behind the dock, so the
 * dock's glass stays as dark as the keys' at night, sunk in the snow.
 */
const Drift = memo(function Drift({ height, filled, dock }: { height: number; filled: number; dock: Anchor }) {
  const cut = `<svg xmlns="http://www.w3.org/2000/svg" width="${dock.width}" height="${dock.height}"><rect width="100%" height="100%" rx="${DOCK_RADIUS}"/></svg>`;
  const mask = {
    "--dock": `url("data:image/svg+xml,${encodeURIComponent(cut)}")`,
    "--dx": `${dock.x}px`,
    "--dy": `${dock.y}px`,
    "--dw": `${dock.width}px`,
    "--dh": `${dock.height}px`,
  } as Vars;
  return (
    <div className="sdk-snow-bank" style={mask}>
      <svg className="sdk-snow-drift" viewBox="0 0 1000 100" preserveAspectRatio="none" style={{ height, "--fill": 0.35 + 0.65 * filled } as Vars} aria-hidden>
        <path d="M0 30 C140 14 300 38 480 24 C660 12 820 34 1000 20 V100 H0 Z" fill="var(--sdk-snow-shade)" />
        <path d="M0 40 C160 26 320 50 500 36 C680 24 840 46 1000 32 V100 H0 Z" fill="var(--sdk-snow-ground)" />
      </svg>
    </div>
  );
});

/** The snowman and a mug of cocoa in the empty room under the board or over the pad. */
function Nook({ box, ...snowman }: SnowmanSpot & { box: Anchor }) {
  // As big as the room allows: a phone on its side has ~140px, a tablet's band under the board more.
  const h = Math.min(box.height - 4, box.width * 0.45, 200);
  const mug = Math.round(Math.max(32, h * 0.34));
  return (
    <div className="sdk-snow-nook" style={{ left: box.x, top: box.y, width: box.width, height: box.height }}>
      <svg className="sdk-snow-lip" viewBox="0 0 100 14" preserveAspectRatio="none" aria-hidden>
        <path d="M0 14 C10 4 30 2 50 6 C70 10 88 2 100 8 V14 Z" fill="var(--sdk-snow-ground)" />
      </svg>
      <Yardman left={box.width * 0.3} bottom={box.height - 3} height={h} {...snowman} />
      <div className="sdk-snow-nook-mug" style={{ left: box.width * 0.7 - mug / 2, top: box.height - mug - 2, width: mug, height: mug }}>
        <SmallMug />
        <span className="sdk-snow-steam" />
      </div>
    </div>
  );
}

type Flake = { x: number; y: number; size: number; opacity: number; dur: number; delay: number; sway: number; crystal: boolean };

/** Falling snow (never behind the pad and the dock). */
const Flakes = memo(function Flakes({ width }: { width: number }) {
  const count = width < 600 ? 12 : 16;
  const flakes = useMemo(() => {
    const rng = mulberry32(2026);
    return Array.from({ length: count }, (_, k): Flake => {
      const crystal = k % 5 === 4;
      const dur = 14 + rng() * 12;
      return {
        x: rng() * 100,
        y: rng() * 100,
        size: crystal ? 9 + rng() * 4 : 2.5 + rng() * 3.5,
        opacity: 0.55 + rng() * 0.4,
        dur,
        delay: -rng() * dur,
        sway: (rng() < 0.5 ? -1 : 1) * (6 + rng() * 12),
        crystal,
      };
    });
  }, [count]);
  return (
    <div className="sdk-snow-clear">
      {flakes.map((f, k) => (
        <span
          key={k}
          className="sdk-snow-flake"
          data-crystal={f.crystal ? "" : undefined}
          style={
            {
              "--x": `${f.x}%`,
              "--y": `${f.y}%`,
              "--size": `${f.size}px`,
              "--o": f.opacity,
              "--dur": `${f.dur}s`,
              "--delay": `${f.delay}s`,
              "--sway": `${f.sway}px`,
            } as Vars
          }
        >
          {f.crystal && <Crystal />}
        </span>
      ))}
    </div>
  );
});

/**
 * The line: a peg per box, a mitten per finished box (a new one swings on), the fairy lights at
 * night, and the chickadee when the board is solved.
 */
const Clothesline = memo(function Clothesline({ bar, line, boxes, still, sway }: { bar: Anchor; line: Line; boxes: number; still: number; sway: number }) {
  const solved = boxes === SOLVED;
  const fresh = solved && still !== SOLVED;
  const { width: mw, height: mh } = line.mitten;
  const bird = line.perch.size;
  return (
    <div className="sdk-snow-line" style={{ left: bar.x, top: bar.y, "--mw": `${mw}px`, "--mh": `${mh}px` } as Vars} data-solved={solved ? "" : undefined}>
      <svg className="sdk-snow-wire" width={bar.width} height={bar.height + 40} aria-hidden>
        <path d={line.path} />
        {line.ends.map((e, k) => (
          <circle key={k} cx={e.x} cy={e.y} r="1.8" />
        ))}
      </svg>
      {line.bulbs.map((b, k) => (
        <span
          key={k}
          className="sdk-snow-bulb sdk-snow-night"
          data-twinkle={!solved && k % 3 === 1 ? "" : undefined}
          data-chase={fresh ? "" : undefined}
          style={{ left: b.x, top: b.y, "--i": k } as Vars}
        />
      ))}
      {line.pegs.map((p, b) => {
        const on = (boxes & (1 << b)) !== 0;
        return (
          <span key={b} className="sdk-snow-slot" style={{ left: p.x, top: p.y, "--tilt": `${p.tilt}deg` } as Vars}>
            {on && (
              <span className="sdk-snow-mitten" data-swing={still & (1 << b) ? undefined : ""}>
                <span
                  className="sdk-snow-knit"
                  data-flip={b % 2 ? "" : undefined}
                  data-hop={fresh ? "" : undefined}
                  data-sway={!fresh && sway ? (sway % 2 ? "a" : "b") : undefined}
                  style={{ "--i": b } as Vars}
                >
                  <Mitten yarn={YARN[b]} />
                </span>
              </span>
            )}
            <span className="sdk-snow-peg" />
          </span>
        );
      })}
      {solved && (
        <span
          className="sdk-snow-bird"
          data-fly={fresh ? "" : undefined}
          style={{ left: line.perch.x - bird * 0.45, top: line.perch.y - bird * 0.68, width: bird, height: bird * 0.67 } as Vars}
        >
          <Chickadee />
        </span>
      )}
    </div>
  );
});
