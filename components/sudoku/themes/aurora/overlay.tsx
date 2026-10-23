"use client";

import { memo, useEffect, useRef, useState, type CSSProperties } from "react";
import { mulberry32 } from "@/lib/random";
import type { SceneProps } from "../types";

// Aurora's surprises: sky phenomena over the game, each a couple of seconds and then gone. Aurora's
// look at rest is the base stylesheet's (no Backdrop): nothing here shows until a surprise plays.

/** How long each surprise stays on screen, in ms (its CSS timeline ends inside it). */
const LENGTH = { "star-trails": 2300, constellation: 2400, "meteor-shower": 2400, arrive: 2500 } as const;
type Surprise = keyof typeof LENGTH;
const SURPRISES = new Set<string>(Object.keys(LENGTH));
const isSurprise = (name: string): name is Surprise => SURPRISES.has(name);

/** The nine box centres drawn as an S, for a constellation with no count of its own (a dev cue, or a count begun before Aurora was on screen). */
const FALLBACK = [16, 13, 10, 37, 40, 43, 70, 67, 64];
const CENTRE_CELL = 40;
const METEORS = 9;
/** The specks of stardust the wish scatters where it lands. */
const DUST = 8;

type Point = { x: number; y: number };
type Box = Point & { width: number; height: number };
type Play = {
  token: number;
  surprise: Surprise;
  /** The overlay's size, the board's box and the 3×3 mark's centre, from the shell's top-left. */
  view: { width: number; height: number };
  board: Box;
  pole: Point;
  /** The constellation's cells, in counting order. */
  stars: readonly number[];
  /** The wish's cell: the 1 just placed (the board's centre if nothing was). */
  target: number;
};

/**
 * Measured as a surprise starts (in an effect), not kept up to date: the title moves as its text
 * changes with the game, which a resize observer on the shell would miss.
 */
function measure(): Pick<Play, "view" | "board" | "pole"> | null {
  const shell = document.querySelector(".sdk-shell")?.getBoundingClientRect();
  const board = document.querySelector(".sdk-board")?.getBoundingClientRect();
  const title = document.querySelector(".sdk-title")?.getBoundingClientRect();
  if (!shell || !board || !title) return null;
  return {
    view: { width: shell.width, height: shell.height },
    board: { x: board.left - shell.left, y: board.top - shell.top, width: board.width, height: board.height },
    // The mark is the title's first 14px.
    pole: { x: title.left - shell.left + 7, y: title.top - shell.top + title.height / 2 },
  };
}

const px = (n: number) => `${Math.round(n * 10) / 10}px`;
const RAD = Math.PI / 180;
const cellCentre = (board: Box, cell: number): Point => ({
  x: board.x + ((cell % 9) + 0.5) * (board.width / 9),
  y: board.y + (Math.floor(cell / 9) + 0.5) * (board.height / 9),
});

/** The longest run of angles (degrees; 0 is right, 90 straight down) at which a ring around the pole is on screen. */
function onScreen(pole: Point, r: number, view: Play["view"]): [number, number] {
  let best: [number, number] | null = null;
  let from: number | null = null;
  for (let a = -30; a <= 213; a += 3) {
    const x = pole.x + r * Math.cos(a * RAD);
    const y = pole.y + r * Math.sin(a * RAD);
    if (a <= 210 && x >= 0 && x <= view.width && y >= 0 && y <= view.height) from ??= a;
    else if (from !== null) {
      if (!best || a - 3 - from > best[1] - best[0]) best = [from, a - 3];
      from = null;
    }
  }
  return best ?? [60, 120];
}

/**
 * Star Trails: a long exposure of the sky turning around the 3×3 mark that was knocked on. Nine
 * stars, one per box (bright once that box is finished), wheel around the mark at nine distances,
 * each drawing its trail behind it, then the light drains back into the mark.
 */
const StarTrails = memo(function StarTrails({ play, boxes }: { play: Play; boxes: number }) {
  const rng = mulberry32(play.token * 7919);
  const { pole, board, view } = play;
  const far = Math.max(
    Math.hypot(board.x - pole.x, board.y + board.height - pole.y),
    Math.hypot(board.x + board.width - pole.x, board.y + board.height - pole.y),
  );
  return (
    <>
      <svg className="sdk-aurora-trails" width={view.width} height={view.height}>
        {Array.from({ length: 9 }, (_, k) => {
          const r = 26 + (k * (far - 26)) / 8;
          const [from, to] = onScreen(pole, r, view);
          const span = Math.min(65 + rng() * 57, Math.max(40, to - from + 12));
          const mid = (from + to) / 2 + (rng() - 0.5) * Math.max(0, to - from - span);
          const arc = 2 * Math.PI * r * (span / 360);
          const style = {
            "--c": `var(--spark-${(k % 4) + 1})`,
            "--arc": px(arc),
            "--turn": `${Math.round(24 + rng() * 20)}deg`,
            "--delay": `${120 + k * 45}ms`,
            // The outer rings fade first, so the light drains back into the mark.
            "--out": `${1650 + (8 - k) * 30}ms`,
            transformOrigin: `${px(pole.x)} ${px(pole.y)}`,
          } as CSSProperties;
          const ring = { cx: pole.x, cy: pole.y, r, strokeDasharray: `${arc} ${2 * Math.PI * r}` };
          const lit = (boxes >> k) & 1 ? "" : undefined;
          return (
            <g key={k} className="sdk-aurora-ring" style={style} data-lit={lit}>
              <g transform={`rotate(${Math.round(mid - span / 2)} ${pole.x} ${pole.y})`}>
                <circle className="sdk-aurora-halo" {...ring} />
                <circle className="sdk-aurora-arc" {...ring} strokeWidth={1.5 + rng()} />
                {/* The star leads its trail: it turns through the trail's span as the trail draws. */}
                <g className="sdk-aurora-head" style={{ "--span": `${Math.round(span * 10) / 10}deg`, transformOrigin: style.transformOrigin } as CSSProperties}>
                  <circle cx={pole.x + r} cy={pole.y} r={lit === undefined ? 1.8 : 2.6} />
                </g>
              </g>
            </g>
          );
        })}
      </svg>
      <span className="sdk-aurora-glint sdk-aurora-pole" style={{ "--x": px(pole.x), "--y": px(pole.y) } as CSSProperties} />
    </>
  );
});

/**
 * A constellation's lines, as a sky chart draws them: the shortest tree joining the stars, so the
 * figure stays compact and never crosses itself (lines in counting order would zigzag across the
 * board). Each line runs from the star counted first to the later one, as [from, to] indexes.
 */
function figure(points: readonly Point[]): [number, number][] {
  const joined = [0];
  const lines: [number, number][] = [];
  while (joined.length < points.length) {
    let best: [number, number] = [0, 0];
    let shortest = Infinity;
    for (const a of joined) {
      for (let b = 0; b < points.length; b++) {
        const length = Math.hypot(points[b].x - points[a].x, points[b].y - points[a].y);
        if (!joined.includes(b) && length < shortest) [best, shortest] = [[a, b], length];
      }
    }
    joined.push(best[1]);
    lines.push(best[0] < best[1] ? best : [best[1], best[0]]);
  }
  return lines;
}

/**
 * Your Constellation: the nine digits just counted light up as stars, one by one in counting order
 * (a halo around each, so the digit stays readable), each joined to the figure as it lights; then
 * the whole constellation twinkles once.
 */
const Constellation = memo(function Constellation({ play }: { play: Play }) {
  const { board, stars } = play;
  const cell = board.width / 9;
  const points = stars.map((i) => ({ x: ((i % 9) + 0.5) * cell, y: (Math.floor(i / 9) + 0.5) * cell }));
  // The fallback is an S, a path in order; a real count is charted.
  const lines = stars === FALLBACK ? points.slice(1).map((_, k): [number, number] => [k, k + 1]) : figure(points);
  return (
    <div
      className="sdk-aurora-sky"
      style={{ left: px(board.x), top: px(board.y), width: px(board.width), height: px(board.height), "--cell": px(cell) } as CSSProperties}
    >
      <svg className="sdk-aurora-lines" width={board.width} height={board.height}>
        {lines.map(([from, to]) => {
          const a = points[from];
          const b = points[to];
          const length = Math.hypot(b.x - a.x, b.y - a.y);
          // Stop short of both stars, so a line never crosses their digits.
          const trim = (0.42 * cell) / length;
          const line = length * (1 - 2 * trim);
          if (line < 3) return null;
          return (
            <line
              key={`${from}-${to}`}
              x1={a.x + (b.x - a.x) * trim}
              y1={a.y + (b.y - a.y) * trim}
              x2={b.x - (b.x - a.x) * trim}
              y2={b.y - (b.y - a.y) * trim}
              strokeDasharray={line}
              style={{ "--len": px(line), "--delay": `${120 * to - 60}ms` } as CSSProperties}
            />
          );
        })}
      </svg>
      {stars.map((i, k) => (
        <span
          key={k}
          className="sdk-aurora-star"
          style={
            {
              "--x": `${(((i % 9) + 0.5) / 9) * 100}%`,
              "--y": `${((Math.floor(i / 9) + 0.5) / 9) * 100}%`,
              "--c": `var(--spark-${(k % 4) + 1})`,
              "--delay": `${k * 120}ms`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
});

/**
 * Make a Wish: a shower of nine meteors fanning out from a radiant past the top-right corner; then
 * the brightest one falls onto the 1 just placed, which twinkles and scatters a little stardust.
 */
const MeteorShower = memo(function MeteorShower({ play }: { play: Play }) {
  const rng = mulberry32(play.token * 7919);
  const { view, board } = play;
  const diag = Math.hypot(view.width, view.height);
  // Far off the top-right corner, along a 35° fall, so the streaks fan out only a little.
  const radiant = { x: view.width + 0.5 * diag * Math.cos(35 * RAD), y: -0.5 * diag * Math.sin(35 * RAD) };
  const angleTo = (p: Point) => Math.atan2(p.y - radiant.y, p.x - radiant.x) / RAD;
  const travel = Math.min(Math.max(0.32 * diag, 220), 520);
  const delays = Array.from({ length: METEORS }, () => Math.round(rng() * 1100)).sort((a, b) => a - b);
  const land = cellCentre(board, play.target);
  // It enters just off the screen's edge, so most of its flight is in view.
  const reach = Math.min(Math.hypot(land.x - radiant.x, land.y - radiant.y) - 40, 0.45 * diag);
  const wish = angleTo(land);
  const start = { x: land.x - Math.cos(wish * RAD) * reach, y: land.y - Math.sin(wish * RAD) * reach };
  return (
    <>
      {delays.map((delay, k) => {
        const head = { x: view.width * (0.2 + rng() * 0.85), y: view.height * (-0.04 + rng() * 0.24) };
        // Longer on a big screen, where the sky is wider.
        const length = (110 + rng() * 70) * Math.min(1.6, Math.max(1, diag / 760));
        const style = {
          left: px(head.x - length),
          top: px(head.y - 1),
          width: px(length),
          "--a": `${Math.round(angleTo(head))}deg`,
          "--d": px(travel),
          "--c": `var(--spark-${(k % 4) + 1})`,
          "--delay": `${delay}ms`,
          "--dur": `${Math.round(650 + rng() * 200)}ms`,
        } as CSSProperties;
        // Under reduced motion two of them stay as still streaks.
        return <span key={k} className="sdk-aurora-meteor" style={style} data-still={k < 2 ? "" : undefined} />;
      })}
      <span
        className="sdk-aurora-wish"
        style={{ left: px(start.x - 180), top: px(start.y - 1.5), "--a": `${Math.round(wish)}deg`, "--d": px(reach) } as CSSProperties}
      />
      <span className="sdk-aurora-ripple" style={{ "--x": px(land.x), "--y": px(land.y) } as CSSProperties} />
      <span className="sdk-aurora-glint sdk-aurora-land" style={{ "--x": px(land.x), "--y": px(land.y) } as CSSProperties} />
      {Array.from({ length: DUST }, (_, k) => {
        const angle = ((k + rng() * 0.6) / DUST) * 2 * Math.PI;
        const distance = 26 + rng() * 18;
        const style = {
          "--x": px(land.x),
          "--y": px(land.y),
          "--dx": px(Math.cos(angle) * distance),
          "--dy": px(Math.sin(angle) * distance),
          "--c": `var(--spark-${(k % 4) + 1})`,
        } as CSSProperties;
        return <span key={k} className="sdk-aurora-dust" style={style} />;
      })}
    </>
  );
});

/** The aurora is back: four curtains of light unfurl from the top of the sky, ripple and drift away. */
const Arrive = memo(function Arrive({ play }: { play: Play }) {
  // The hem stops a quarter of the way down the board, so the curtains only brush its top rows.
  const hem = play.board.y + play.board.height / 4;
  return (
    <>
      {[0, 22, 48, 70].map((x, k) => (
        <span
          key={k}
          className="sdk-aurora-curtain"
          style={{ height: px(hem), "--x": `${x}%`, "--c": `var(--sdk-aurora-c${k + 1})`, "--delay": `${k * 120}ms` } as CSSProperties}
        />
      ))}
    </>
  );
});

/**
 * Aurora's Overlay: plays a surprise whenever a new cue comes. It keeps this game's last nine
 * placed digits (from the beats) so a constellation can be drawn on the cells that counted it.
 */
export const AuroraOverlay = memo(function AuroraOverlay({ boxes, beat, cue }: SceneProps) {
  const trail = useRef<{ token: number; placed: { cell: number; digit: number }[] }>({ token: 0, placed: [] });
  // Declared before the cue's effect: the ninth digit's beat comes in the same commit as its cue.
  useEffect(() => {
    if (!beat || beat.token === trail.current.token) return;
    const { placed } = trail.current;
    trail.current = {
      token: beat.token,
      placed: beat.kind === "deal" ? [] : beat.kind === "miss" ? placed : [...placed, { cell: beat.cell, digit: beat.digit }].slice(-9),
    };
  }, [beat]);

  const [play, setPlay] = useState<Play | null>(null);
  // A cue from before this scene was on screen (another theme's) is not replayed.
  const seen = useRef(cue?.token ?? 0);
  useEffect(() => {
    if (!cue || cue.token <= seen.current) return;
    seen.current = cue.token;
    const { surprise } = cue;
    if (!isSurprise(surprise)) return;
    const at = measure();
    if (!at) return;
    const { placed } = trail.current;
    const counted = placed.length === 9 && placed.every((p, k) => p.digit === k + 1);
    setPlay({
      token: cue.token,
      surprise,
      ...at,
      stars: counted ? placed.map((p) => p.cell) : FALLBACK,
      target: placed.length ? placed[placed.length - 1].cell : CENTRE_CELL,
    });
  }, [cue]);

  useEffect(() => {
    if (!play) return;
    const id = window.setTimeout(() => setPlay(null), LENGTH[play.surprise]);
    return () => clearTimeout(id);
  }, [play]);

  if (!play) return null;
  return (
    <div key={play.token} className="sdk-aurora-fx" data-surprise={play.surprise}>
      {play.surprise === "star-trails" ? (
        <StarTrails play={play} boxes={boxes} />
      ) : play.surprise === "constellation" ? (
        <Constellation play={play} />
      ) : play.surprise === "meteor-shower" ? (
        <MeteorShower play={play} />
      ) : (
        <Arrive play={play} />
      )}
    </div>
  );
});
