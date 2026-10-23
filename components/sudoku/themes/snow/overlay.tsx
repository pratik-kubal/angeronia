"use client";

import { memo, useEffect, useState } from "react";
import { mulberry32 } from "@/lib/random";
import { colOf } from "@/lib/sudoku/grid";
import type { Beat, Cue, SceneProps } from "../types";
import { useAnchor, type Anchor } from "../use-anchor";
import { Crystal, type Vars } from "./art";
import { forgetThrow, thrower } from "./throw";

// Snow Day's surprises, over the game (never taking a tap). A snowball thrown by the snowman you
// poked (the title's, or the yard's) splats on the board's glass; a see-through snowman stacks
// itself up the column of boxes where three 8s were stacked; a mug of cocoa rises, gets a
// marshmallow and steams; and when the season comes in, a flurry falls, frost blooms in the
// corners and snow settles on the board and the round buttons. Each plays its still frame under
// reduced motion, briefly.

/** How long each surprise stays up, in ms (its animations end just before). */
const LENGTH: Record<string, number> = { snowball: 2300, stack: 2400, cocoa: 2400, arrive: 2500 };
const STILL_MS = 1500;
const WIDE = 180;

export function Overlay({ beat, cue }: SceneProps) {
  // A cue from before the scene came up (another theme's) is never played.
  const [since] = useState(() => cue?.token ?? 0);
  const [ended, setEnded] = useState(0);
  const live = cue && cue.token > since && cue.token !== ended && cue.surprise in LENGTH ? cue : null;
  const token = live?.token ?? 0;
  const surprise = live?.surprise ?? "";
  useEffect(() => {
    if (!token) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const id = window.setTimeout(() => setEnded(token), reduced ? STILL_MS : LENGTH[surprise] + 100);
    return () => window.clearTimeout(id);
  }, [token, surprise]);

  const shell = useAnchor(".sdk-shell");
  const game = useAnchor(".sdk-game");
  const bar = useAnchor(".sdk-bar");
  const title = useAnchor(".sdk-title");
  const board = useAnchor(".sdk-board");
  const rule = useAnchor(".sdk-rule");
  const pad = useAnchor(".sdk-pad");
  if (!live || !shell || !game || !bar || !board || !rule || !pad) return null;
  const wide = game.x >= WIDE;

  switch (live.surprise) {
    case "snowball":
      return <Snowball key={live.token} from={title ?? bar} board={board} wide={wide} />;
    case "stack":
      return <Stack key={live.token} board={board} band={bandOf(beat, live)} />;
    case "cocoa":
      return <Cocoa key={live.token} shell={shell} game={game} bar={bar} board={board} rule={rule} pad={pad} wide={wide} />;
    default:
      return <Arrive key={live.token} shell={shell} bar={bar} board={board} wide={wide} />;
  }
}

/** The column of boxes the stack was built in: the beat that found it, else the middle. */
function bandOf(beat: Beat | null, cue: Cue): number {
  return beat && beat.kind !== "deal" && beat.token <= cue.token ? Math.floor(colOf(beat.cell) / 3) : 1;
}

const CRUMBS = Array.from({ length: 6 }, (_, k) => {
  const a = (k / 6) * Math.PI * 2 + 0.4;
  return { dx: Math.cos(a), dy: Math.sin(a) };
});

/**
 * A snowball thrown at you, by the yard's snowman if it was his third poke, else by the title's
 * (`from`): it splats on the board's glass, slides and melts.
 */
const Snowball = memo(function Snowball({ from, board, wide }: { from: Anchor; board: Anchor; wide: boolean }) {
  // Read once, as the throw starts; the mark is then spent.
  const [yard] = useState(thrower);
  useEffect(() => forgetThrow(), []);
  const at = { x: board.x + board.width * 0.68, y: board.y + board.height * 0.28 };
  const start = yard ?? { x: from.x + 8, y: from.y + from.height / 2 };
  const size = wide ? 150 : 112;
  return (
    <div className="sdk-snow-throw" style={{ left: at.x, top: at.y, "--size": `${size}px` } as Vars}>
      <span className="sdk-snow-ball" style={{ "--dx": `${start.x - at.x}px`, "--dy": `${start.y - at.y}px`, "--lift": `${wide ? -110 : -70}px` } as Vars} />
      <span className="sdk-snow-splat">
        <svg viewBox="-50 -50 100 100" width="100%" height="100%" aria-hidden>
          <defs>
            <radialGradient id="sdk-snow-splat" cx="42%" cy="40%" r="62%">
              <stop offset="0.45" stopColor="var(--sdk-snow-splat)" />
              <stop offset="1" stopColor="var(--sdk-snow-splat-shade)" />
            </radialGradient>
          </defs>
          <path
            d="M0 -30 C9 -31 12 -42 18 -38 C24 -34 17 -26 24 -20 C31 -14 42 -18 43 -9 C44 0 32 0 31 8 C30 16 40 24 33 30 C26 36 19 27 11 31 C4 35 2 46 -6 44 C-14 42 -9 31 -17 28 C-25 25 -33 33 -38 25 C-43 17 -31 12 -32 4 C-33 -4 -45 -8 -41 -16 C-37 -24 -27 -18 -21 -24 C-15 -30 -9 -29 0 -30 Z"
            fill="url(#sdk-snow-splat)"
            stroke="var(--sdk-snow-splat-shade)"
            strokeWidth="1.4"
          />
          <circle cx="-30" cy="30" r="4" fill="var(--sdk-snow-splat)" stroke="var(--sdk-snow-splat-shade)" strokeWidth="1" />
          <circle cx="38" cy="-28" r="3" fill="var(--sdk-snow-splat)" stroke="var(--sdk-snow-splat-shade)" strokeWidth="1" />
          <ellipse cx="-8" cy="-10" rx="13" ry="8" fill="#ffffff" opacity="0.7" />
          <path d="M14 8 C18 14 12 20 6 18" stroke="var(--sdk-snow-splat-shade)" strokeWidth="2.2" fill="none" strokeLinecap="round" opacity="0.7" />
        </svg>
        <span className="sdk-snow-drip" style={{ "--x": "38%", "--h": "22%", "--delay": "0.75s" } as Vars} />
        <span className="sdk-snow-drip" style={{ "--x": "58%", "--h": "30%", "--delay": "0.95s" } as Vars} />
      </span>
      {CRUMBS.map((c, k) => (
        <span key={k} className="sdk-snow-crumb" style={{ "--cx": `${c.dx * size * 0.62}px`, "--cy": `${c.dy * size * 0.52}px` } as Vars} />
      ))}
    </div>
  );
});

const POOF = Array.from({ length: 8 }, (_, k) => {
  const a = (k / 8) * Math.PI * 2;
  return { dx: Math.cos(a), dy: Math.sin(a) };
});

/**
 * A see-through snowman stacking itself up a column of boxes: the base rolls up into the bottom
 * box, the body and the head drop on, then his face and hat; he blinks, hops and goes poof.
 */
const Stack = memo(function Stack({ board, band }: { board: Anchor; band: number }) {
  // The column the 8s were stacked in, fixed as the cue starts: a move made during the surprise must not move him.
  const [col] = useState(band);
  const c = board.width / 3;
  return (
    <div className="sdk-snow-stack" style={{ left: board.x + col * c, top: board.y, width: c, height: board.height }}>
      <svg viewBox="0 0 100 300" width="100%" height="100%" aria-hidden>
        <defs>
          <radialGradient id="sdk-snow-ghost" cx="40%" cy="34%" r="70%">
            <stop offset="0" stopColor="var(--sdk-snow-ghost)" />
            <stop offset="1" stopColor="var(--sdk-snow-ghost-shade)" />
          </radialGradient>
        </defs>
        <g className="sdk-snow-stack-all">
          <circle className="sdk-snow-stack-base" cx="50" cy="250" r="44" fill="url(#sdk-snow-ghost)" stroke="var(--sdk-snow-ghost-edge)" strokeWidth="2" />
          <circle className="sdk-snow-stack-body" cx="50" cy="160" r="35" fill="url(#sdk-snow-ghost)" stroke="var(--sdk-snow-ghost-edge)" strokeWidth="2" />
          <circle className="sdk-snow-stack-head" cx="50" cy="95" r="27" fill="url(#sdk-snow-ghost)" stroke="var(--sdk-snow-ghost-edge)" strokeWidth="2" />
          <g className="sdk-snow-stack-face">
            <g className="sdk-snow-stack-eyes" fill="var(--sdk-snow-coal)">
              <circle cx="41" cy="90" r="3.4" />
              <circle cx="59" cy="90" r="3.4" />
            </g>
            <path d="M50 96 L70 100 L50 103 Z" fill="var(--sdk-snow-carrot)" />
            <path d="M40 108 Q50 115 60 108" stroke="var(--sdk-snow-coal)" strokeWidth="2.6" strokeDasharray="0.1 5" strokeLinecap="round" fill="none" />
            <path d="M24 118 Q50 132 76 118 L77 128 Q50 142 23 128 Z" fill="var(--sdk-snow-knit)" opacity="0.55" />
          </g>
          {/* The hat sits on a cell of the top box: see-through enough to read its digit. */}
          <g className="sdk-snow-stack-hat" opacity="0.55">
            <path d="M28 76 Q28 46 50 46 Q72 46 72 76 Z" fill="var(--sdk-snow-knit-2)" />
            <rect x="25" y="70" width="50" height="9" rx="4" fill="#fff3e3" />
            <circle cx="50" cy="42" r="8" fill="#fff3e3" />
          </g>
        </g>
      </svg>
      {POOF.map((p, k) => (
        <span key={k} className="sdk-snow-poof" style={{ "--cx": `${p.dx * c * 0.6}px`, "--cy": `${p.dy * c * 0.8}px`, "--delay": `${1.9 + (k % 3) * 0.04}s` } as Vars}>
          <Crystal />
        </span>
      ))}
    </div>
  );
});

type Spot = { shell: Anchor; game: Anchor; bar: Anchor; board: Anchor; rule: Anchor; pad: Anchor; wide: boolean };

/** The smallest mug worth standing on the divider. */
const MUG_MIN = 44;

/**
 * Where the mug stands (the middle of its base) and how big it is: in the left page on a wide
 * screen; on a phone on its side on the pad, in the free band under the header. Upright it stands
 * on the divider, in the band under the board, its opaque part (the marshmallows down to its base:
 * 33 to 108 of its 120 high box) clear of the board, so only the see-through steam crosses the last
 * row; where that band is too short for a mug worth seeing, it stands on the pad's top edge, in
 * front of the divider.
 */
function cocoaSpot({ shell, game, bar, board, rule, pad, wide }: Spot) {
  if (wide) return { size: 140, spot: { x: game.x / 2, y: shell.height * 0.5 } };
  if (pad.x >= board.x + board.width) return { size: Math.min(108, pad.y - 4 - (bar.y + bar.height)), spot: { x: pad.x + pad.width / 2, y: pad.y - 4 } };
  const fit = (base: number) => Math.min(108, Math.floor((base - (board.y + board.height) - 1) / 0.625));
  const base = fit(rule.y) >= MUG_MIN ? rule.y : pad.y - 2;
  return { size: fit(base), spot: { x: board.x + board.width / 2, y: base } };
}

/** A mug of cocoa: it rises, a marshmallow plops in, the steam curls up (one wisp ends as a snowflake) and it sinks away, in a warm glow. */
const Cocoa = memo(function Cocoa(props: Spot) {
  const { size, spot } = cocoaSpot(props);
  return (
    <>
      <div className="sdk-snow-warmth" />
      {/* The mug's base is at 108 of its 120 high box. */}
      <div className="sdk-snow-cocoa" style={{ left: spot.x - size / 2, top: spot.y - size * 0.9, width: size, height: size }}>
        <svg viewBox="0 0 120 120" width="100%" height="100%" aria-hidden>
          <g stroke="var(--sdk-snow-steam)" strokeWidth="3" strokeLinecap="round" fill="none">
            <path className="sdk-snow-wisp" style={{ "--delay": "0.6s" } as Vars} d="M44 30 C38 22 50 16 44 6" />
            <path className="sdk-snow-wisp" style={{ "--delay": "0.76s" } as Vars} d="M58 28 C52 18 64 12 58 2" />
            <path className="sdk-snow-wisp" style={{ "--delay": "0.92s" } as Vars} d="M72 30 C66 22 78 16 72 6" />
          </g>
          <path d="M92 52 h6 a14 14 0 0 1 0 28 h-6" stroke="var(--sdk-snow-mug)" strokeWidth="7" fill="none" />
          <path d="M22 40 H94 V92 Q94 108 78 108 H38 Q22 108 22 92 Z" fill="var(--sdk-snow-mug)" />
          <rect x="22" y="58" width="72" height="14" fill="var(--sdk-snow-knit)" />
          <path d="M28 62 l3 4 l3 -4 M42 62 l3 4 l3 -4 M56 62 l3 4 l3 -4 M70 62 l3 4 l3 -4 M84 62 l3 4 l3 -4" stroke="#fff3e3" strokeWidth="1.6" fill="none" strokeLinecap="round" />
          <ellipse cx="58" cy="40" rx="36" ry="7" fill="var(--sdk-snow-cocoa)" stroke="var(--sdk-snow-mug)" strokeWidth="3" />
          <g fill="#fffaf2" stroke="#e8dccd" strokeWidth="0.8">
            <rect x="36" y="34" width="11" height="8" rx="2.5" transform="rotate(-12 41 38)" />
            <rect x="50" y="33" width="11" height="8" rx="2.5" transform="rotate(8 55 37)" />
            <rect x="66" y="35" width="11" height="8" rx="2.5" transform="rotate(-4 71 39)" />
          </g>
          <ellipse className="sdk-snow-ring" cx="62" cy="40" rx="14" ry="3.4" fill="none" stroke="#fffaf2" strokeWidth="1.6" />
          <rect className="sdk-snow-plop" x="57" y="30" width="11" height="8" rx="2.5" fill="#fffaf2" stroke="#e8dccd" strokeWidth="0.8" />
        </svg>
        <span className="sdk-snow-wisp-flake">
          <Crystal />
        </span>
      </div>
    </>
  );
});

/** The crystals in each corner's frost, as fractions of the corner's size from its corner. */
const FROST = [
  { x: "8%", y: "10%", size: 0.2, turn: 10 },
  { x: "30%", y: "6%", size: 0.11, turn: -20 },
  { x: "7%", y: "34%", size: 0.13, turn: 25 },
];

/** Snow Day comes in: a flurry, frost blooming in from the corners, snow settling on the board and the round buttons. */
const Arrive = memo(function Arrive({ shell, bar, board, wide }: { shell: Anchor; bar: Anchor; board: Anchor; wide: boolean }) {
  const rng = mulberry32(1231);
  const flurry = Array.from({ length: 14 }, (_, k) => {
    const crystal = k % 7 < 3;
    const fall = 0.75 + rng() * 0.3;
    return {
      crystal,
      style: {
        "--x": `${rng() * 100}%`,
        "--size": `${crystal ? 12 + rng() * 8 : 6 + rng() * 6}px`,
        "--fall": `${fall * shell.height}px`,
        "--still": `${fall * shell.height * (0.2 + rng() * 0.6)}px`,
        "--sway": `${(rng() - 0.5) * 60}px`,
        "--turn": `${(rng() - 0.5) * 280}deg`,
        "--dur": `${1.6 + rng() * 0.6}s`,
        "--delay": `${rng() * 0.3}s`,
      } as Vars,
    };
  });
  const frost = wide ? 300 : 170;
  return (
    <>
      {["tl", "tr", "bl", "br"].map((corner) => (
        <span key={corner} className="sdk-snow-frost" data-corner={corner} style={{ "--size": `${frost}px` } as Vars}>
          {FROST.map((f, k) => (
            <span key={k} className="sdk-snow-frost-flake" style={{ "--fx": f.x, "--fy": f.y, "--fs": `${f.size * frost}px`, rotate: `${f.turn}deg` } as Vars}>
              <Crystal />
            </span>
          ))}
        </span>
      ))}
      {flurry.map((f, k) => (
        <span key={k} className="sdk-snow-flurry" data-crystal={f.crystal ? "" : undefined} style={f.style}>
          {f.crystal && <Crystal />}
        </span>
      ))}
      <svg className="sdk-snow-cap" viewBox="0 0 100 12" preserveAspectRatio="none" style={{ left: board.x + 6, top: board.y - (wide ? 9 : 7), width: board.width - 12, height: wide ? 13 : 10 }} aria-hidden>
        <path d="M0 12 C2 4 8 2 14 4 C22 0 30 3 38 2 C46 0 54 4 62 2 C70 0 78 3 86 2 C92 1 98 4 100 12 Z" fill="var(--sdk-snow-flake)" stroke="var(--sdk-snow-cap-edge)" strokeWidth="0.8" />
      </svg>
      {[bar.x + 6, bar.x + bar.width - 38].map((x, k) => (
        <svg key={k} className="sdk-snow-cap" viewBox="0 0 32 12" style={{ left: x, top: bar.y + 2 - 6, width: 32, height: 12 }} aria-hidden>
          <path d="M1 11 C2 4 8 1 16 1 C24 1 30 4 31 11 C26 8 22 10 16 9 C10 10 6 8 1 11 Z" fill="var(--sdk-snow-flake)" stroke="var(--sdk-snow-cap-edge)" strokeWidth="0.8" />
        </svg>
      ))}
    </>
  );
});
