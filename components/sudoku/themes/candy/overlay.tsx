"use client";

import { memo, useEffect, useRef, useState, type CSSProperties } from "react";
import { mulberry32 } from "@/lib/random";
import type { SceneProps } from "../types";

// Candy's surprises: sweets over the game, each a couple of seconds and then gone. Candy's look at
// rest is all in its stylesheet (no Backdrop): nothing here shows until a surprise plays.

/** How long each surprise stays on screen, in ms (its CSS timeline ends inside it). */
const LENGTH = { unwrap: 2400, jar: 2600, rainbow: 3200, arrive: 2000 } as const;
type Surprise = keyof typeof LENGTH;
const SURPRISES = new Set<string>(Object.keys(LENGTH));
const isSurprise = (name: string): name is Surprise => SURPRISES.has(name);

/** The wrapped sweets the burst and the jar throw. */
const SWEETS = ["🍬", "🍭", "🍫", "🍩", "🍪", "🧁"];
/** The rainbow's bands, outside in: Candy's digits in the order of their colours. */
const BANDS = [1, 2, 5, 4, 3, 7, 9, 8, 6];

type Point = { x: number; y: number };
type Box = Point & { width: number; height: number };
type Play = {
  token: number;
  surprise: Surprise;
  /** The overlay's size, the board's box and the emblem's centre, from the shell's top-left. */
  view: { width: number; height: number };
  board: Box;
  emblem: Point;
};

/** Measured as a surprise starts: the title's text changes with the game, so it is not kept up to date. */
function measure(): Pick<Play, "view" | "board" | "emblem"> | null {
  const shell = document.querySelector(".sdk-shell")?.getBoundingClientRect();
  const board = document.querySelector(".sdk-board")?.getBoundingClientRect();
  const title = document.querySelector(".sdk-title")?.getBoundingClientRect();
  if (!shell || !board || !title) return null;
  return {
    view: { width: shell.width, height: shell.height },
    board: { x: board.left - shell.left, y: board.top - shell.top, width: board.width, height: board.height },
    // The emblem is the title's first glyph.
    emblem: { x: title.left - shell.left + 8, y: title.top - shell.top + title.height / 2 },
  };
}

const px = (n: number) => `${Math.round(n * 10) / 10}px`;
const tile = (digit: number) => `var(--sdk-candy-t${digit})`;

/** Unwrapped: the sweet by the name twists open and bursts, and its sweets arc out and fall across the screen. */
const Unwrap = memo(function Unwrap({ play }: { play: Play }) {
  const rng = mulberry32(play.token * 7919);
  const { emblem, view } = play;
  return (
    <>
      <span className="sdk-candy-twist" style={{ "--x": px(emblem.x), "--y": px(emblem.y) } as CSSProperties}>
        🍬
      </span>
      {Array.from({ length: 18 }, (_, k) => {
        const angle = Math.PI * (0.05 + 0.9 * (k / 17)) + (rng() - 0.5) * 0.3;
        const reach = 50 + rng() * 120;
        const style = {
          "--x": px(emblem.x),
          "--y": px(emblem.y),
          // Out and up first, then down past the foot of the screen.
          "--ux": px(-Math.cos(angle) * reach),
          "--uy": px(-Math.sin(angle) * reach * 0.35 + 30),
          "--fx": px(-Math.cos(angle) * reach * 1.6),
          "--fy": px(view.height - emblem.y + 40),
          "--rot": `${Math.round((rng() - 0.5) * 720)}deg`,
          "--size": px(18 + rng() * 12),
          "--delay": `${420 + Math.round(rng() * 160)}ms`,
        } as CSSProperties;
        return (
          <span key={k} className="sdk-candy-sweet" style={style}>
            {SWEETS[k % SWEETS.length]}
          </span>
        );
      })}
    </>
  );
});

/** Candy Jar: the jar tips over the board, and round sweets in every digit's colour pour down and bounce. */
const Jar = memo(function Jar({ play }: { play: Play }) {
  const rng = mulberry32(play.token * 7919);
  const { board } = play;
  return (
    <>
      {Array.from({ length: 27 }, (_, k) => {
        const size = 14 + rng() * 10;
        const style = {
          left: px(board.x + rng() * (board.width - size)),
          top: px(board.y - size - 30),
          width: px(size),
          height: px(size),
          "--fall": px(board.height + 30 - rng() * board.height * 0.15),
          "--c": tile((k % 9) + 1),
          "--delay": `${Math.round((k / 27) * 700 + rng() * 120)}ms`,
        } as CSSProperties;
        return <span key={k} className="sdk-candy-drop" style={style} />;
      })}
    </>
  );
});

/** Rainbow Drops: a rainbow of the nine sweets' colours arcs over the board, and drops fall from it. */
const Rainbow = memo(function Rainbow({ play }: { play: Play }) {
  const rng = mulberry32(play.token * 7919);
  const { board } = play;
  const cx = board.x + board.width / 2;
  const base = board.y + board.height * 0.62;
  const outer = board.width * 0.46;
  const band = Math.max(4, outer * 0.06);
  // Where the drops come to rest: just under the board, or, where the board reaches down to the foot
  // of the screen (a phone on its side), as low as a whole drop stays on it.
  const land = Math.min(board.y + board.height + 5, play.view.height - 13);
  return (
    <>
      <svg className="sdk-candy-arc" width={play.view.width} height={play.view.height}>
        {BANDS.map((digit, k) => {
          const r = outer - k * band;
          const length = Math.PI * r;
          return (
            <path
              key={digit}
              d={`M ${cx - r} ${base} A ${r} ${r} 0 0 1 ${cx + r} ${base}`}
              stroke={tile(digit)}
              strokeWidth={band + 0.5}
              strokeDasharray={length}
              style={{ "--len": px(length), "--delay": `${k * 60}ms` } as CSSProperties}
            />
          );
        })}
      </svg>
      {Array.from({ length: 14 }, (_, k) => {
        const along = Math.PI * (0.12 + 0.76 * rng());
        const r = outer - Math.floor(rng() * 9) * band;
        const top = base - Math.sin(along) * r - 5;
        const style = {
          left: px(cx - Math.cos(along) * r - 5),
          top: px(top),
          "--fall": px(land - top),
          "--c": tile(BANDS[k % 9]),
          "--delay": `${900 + Math.round(rng() * 700)}ms`,
        } as CSSProperties;
        return <span key={k} className="sdk-candy-drop sdk-candy-rain" style={style} />;
      })}
    </>
  );
});

/** The sweet shop opens: a sprinkle of sprinkles falls across the top of the screen. Seasonal never brings
 *  Candy in, so only the dev cue plays it; the overlay answers every cue, as the other themes' do. */
const Arrive = memo(function Arrive({ play }: { play: Play }) {
  const rng = mulberry32(play.token * 7919);
  const reach = play.board.y + play.board.height / 3;
  return (
    <>
      {Array.from({ length: 24 }, (_, k) => {
        const style = {
          left: px(rng() * play.view.width),
          "--fall": px(reach * (0.6 + rng() * 0.4)),
          "--rot": `${Math.round(rng() * 180)}deg`,
          "--c": tile((k % 9) + 1),
          "--delay": `${Math.round(rng() * 700)}ms`,
        } as CSSProperties;
        return <span key={k} className="sdk-candy-sprinkle" style={style} />;
      })}
    </>
  );
});

/** Candy's Overlay: plays a surprise whenever a new cue comes. */
export const CandyOverlay = memo(function CandyOverlay({ cue }: SceneProps) {
  const [play, setPlay] = useState<Play | null>(null);
  // A cue from before this scene was on screen (another theme's) is not replayed.
  const seen = useRef(cue?.token ?? 0);
  useEffect(() => {
    if (!cue || cue.token <= seen.current) return;
    seen.current = cue.token;
    const { surprise } = cue;
    if (!isSurprise(surprise)) return;
    const at = measure();
    if (at) setPlay({ token: cue.token, surprise, ...at });
  }, [cue]);

  useEffect(() => {
    if (!play) return;
    const id = window.setTimeout(() => setPlay(null), LENGTH[play.surprise]);
    return () => clearTimeout(id);
  }, [play]);

  if (!play) return null;
  return (
    <div key={play.token} className="sdk-candy-fx" data-surprise={play.surprise}>
      {play.surprise === "unwrap" ? (
        <Unwrap play={play} />
      ) : play.surprise === "jar" ? (
        <Jar play={play} />
      ) : play.surprise === "rainbow" ? (
        <Rainbow play={play} />
      ) : (
        <Arrive play={play} />
      )}
    </div>
  );
});
