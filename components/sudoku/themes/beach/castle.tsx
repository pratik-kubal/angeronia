"use client";

import { memo, type CSSProperties, type ReactNode } from "react";

// The sandcastle: the board seen from above, in three-quarter view (viewBox 120×80). Box b is the
// piece in the same place: towers on the four corners, walls on the four edges, the keep in the
// middle. A piece not built yet is a dashed plan drawn in the sand; a finished box packs its piece
// (it pats into shape when the move finished it here, never on a load). At night every built piece
// lights a lantern window. A solved board raises the flag and fills the moat.

type Piece = { b: number; body: string; detail: ReactNode; glow: [number, number] | null };

function tower(b: number, cx: number, gy: number, w: number, h: number): Piece {
  const t = gy - h;
  const tw = w * 0.42;
  return {
    b,
    body: `M${cx - w / 2} ${gy} L${cx - tw} ${t} L${cx + tw} ${t} L${cx + w / 2} ${gy} Q${cx} ${gy + w * 0.22} ${cx - w / 2} ${gy} Z`,
    detail: (
      <>
        <path className="sdk-beach-ridge" d={`M${cx - w * 0.47} ${gy - h * 0.36} Q${cx} ${gy - h * 0.36 + w * 0.16} ${cx + w * 0.47} ${gy - h * 0.36} M${cx - w * 0.45} ${gy - h * 0.68} Q${cx} ${gy - h * 0.68 + w * 0.15} ${cx + w * 0.45} ${gy - h * 0.68}`} />
        <ellipse className="sdk-beach-top" cx={cx} cy={t} rx={tw} ry={w * 0.14} />
        {[-0.3, 0, 0.3].map((f) => (
          <rect key={f} className="sdk-beach-merlon" x={cx + f * w - w * 0.08} y={t - w * 0.16} width={w * 0.16} height={w * 0.17} rx="0.6" />
        ))}
        <rect className="sdk-beach-window" x={cx - 1.5} y={gy - h * 0.6} width="3" height="4.2" rx="1.5" />
      </>
    ),
    glow: [cx, gy - h * 0.6 + 2],
  };
}

function wall(b: number, x0: number, x1: number, gy: number, h: number, gate: boolean): Piece {
  const merlons: number[] = [];
  for (let x = x0 + 2; x + 5 <= x1 - 1; x += 9) merlons.push(x);
  return {
    b,
    body: `M${x0} ${gy} L${x0} ${gy - h} L${x1} ${gy - h} L${x1} ${gy} Z`,
    detail: (
      <>
        {merlons.map((x) => (
          <rect key={x} className="sdk-beach-merlon" x={x} y={gy - h - 3} width="5" height="3.2" rx="0.6" />
        ))}
        <rect className="sdk-beach-top" x={x0} y={gy - h} width={x1 - x0} height="2" />
        {gate && <path className="sdk-beach-window" d={`M54 ${gy} L54 ${gy - 6} Q60 ${gy - 12} 66 ${gy - 6} L66 ${gy} Z`} />}
      </>
    ),
    glow: gate ? [60, gy - 5] : null,
  };
}

function side(b: number, x0: number, x1: number): Piece {
  return {
    b,
    body: `M${x0} 62 L${x0} 38 L${x1} 34 L${x1} 58 Z`,
    detail: <path className="sdk-beach-top-line" d={`M${x0} 38 L${x1} 34`} />,
    glow: null,
  };
}

const KEEP: Piece = {
  b: 4,
  body: "M43 56 L43 22 L77 22 L77 56 Z",
  detail: (
    <>
      {[44, 53, 62, 71].map((x) => (
        <rect key={x} className="sdk-beach-merlon" x={x} y="16" width="6" height="6" rx="0.8" />
      ))}
      <rect className="sdk-beach-top" x="43" y="22" width="34" height="2.4" />
      <path className="sdk-beach-window" d="M56 42 L56 33 Q60 28 64 33 L64 42 Z" />
      <line className="sdk-beach-flagpole" x1="60" y1="16" x2="60" y2="1" />
    </>
  ),
  glow: [60, 37],
};

/** Back to front, so nearer pieces overlap farther ones. */
const PIECES: readonly Piece[] = [
  wall(1, 33, 87, 40, 12, false),
  tower(0, 24, 40, 22, 22),
  tower(2, 96, 40, 22, 22),
  side(3, 12, 26),
  side(5, 108, 94),
  KEEP,
  wall(7, 33, 87, 72, 13, true),
  tower(6, 21, 72, 25, 25),
  tower(8, 99, 72, 25, 25),
];

const CORNER = new Set([0, 2, 6, 8]);
/** The corner towers' pennant poles for the Four Towers surprise: x, foot, top. */
const POLES: readonly [number, number, number][] = [
  [24, 18, 1],
  [96, 18, 1],
  [21, 47, 30],
  [99, 47, 30],
];
/** Sand glitter bursting out of the castle: where each speck flies, in viewBox units. */
const GLITTER: readonly [number, number][] = [
  [-46, -22],
  [-38, -40],
  [-20, -50],
  [0, -56],
  [22, -48],
  [40, -38],
  [48, -18],
  [-54, 2],
  [56, 4],
  [-8, 14],
];

/** Pennants on the four corner towers, a gull perching on the keep and a burst of sand glitter. */
function TowersFx() {
  return (
    <g className="sdk-beach-towers">
      {POLES.map(([x, foot, top], i) => (
        <g key={x} className="sdk-beach-pennant" style={{ transformOrigin: `${x}px ${foot}px`, "--i": i } as CSSProperties}>
          <line className="sdk-beach-pennant-pole" x1={x} y1={foot} x2={x} y2={top} />
          <path className="sdk-beach-pennant-flag" d={`M${x} ${top} L${x + 14} ${top + 3.8} L${x} ${top + 7.6} Z`} />
        </g>
      ))}
      <g className="sdk-beach-perch">
        <path className="sdk-beach-perch-bird" d="M47 13 Q53.5 4 60 11.5 Q66.5 4 73 13" />
      </g>
      {GLITTER.map(([gx, gy], i) => (
        <circle key={i} className="sdk-beach-speck" cx="60" cy="50" r="2" style={{ "--gx": `${gx}px`, "--gy": `${gy}px`, "--i": i } as CSSProperties} />
      ))}
    </g>
  );
}

type Props = {
  /** The castle's box in px (the layout's, stable while the layout is). */
  box: { x: number; y: number; w: number; h: number };
  boxes: number;
  /** The boxes a move finished just now (they pat into shape), and that move's beat token. */
  patMask: number;
  patToken: number;
  /** A new deal just now (the plan sketches itself in), by its beat token. */
  deal: number | null;
  /** The board was solved just now: the flag unfurls and the moat fills (loaded solved, they just stand). */
  won: boolean;
  /** The Four Towers surprise playing, by its cue token. */
  towers: number | null;
};

export const Castle = memo(function Castle({ box, boxes, patMask, patToken, deal, won, towers }: Props) {
  const complete = boxes === 511;
  return (
    <div
      className="sdk-beach-castle"
      style={{ left: box.x, top: box.y, width: box.w, height: box.h }}
      data-size={box.h < 40 ? "s" : undefined}
      data-complete={complete ? "" : undefined}
      data-won={complete && won ? "" : undefined}
      data-towers={towers !== null ? "" : undefined}
    >
      <svg key={deal ?? 0} viewBox="0 0 120 80" data-deal={deal !== null ? "" : undefined} aria-hidden>
        <defs>
          <radialGradient id="sdk-beach-mound" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0.55" className="sdk-beach-mound-in" />
            <stop offset="1" className="sdk-beach-mound-out" />
          </radialGradient>
          <radialGradient id="sdk-beach-lantern" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0.2" className="sdk-beach-lantern-in" />
            <stop offset="1" className="sdk-beach-lantern-out" />
          </radialGradient>
        </defs>
        <ellipse cx="60" cy="70" rx="60" ry="12" fill="url(#sdk-beach-mound)" />
        {complete && (
          <g className="sdk-beach-moat">
            <ellipse className="sdk-beach-moat-glow sdk-beach-night" cx="60" cy="66" rx="62" ry="15" />
            <ellipse className="sdk-beach-moat-water" cx="60" cy="66" rx="62" ry="15" />
          </g>
        )}
        {PIECES.map((p, i) => {
          const built = (boxes >> p.b) & 1;
          const patted = (patMask >> p.b) & 1;
          return (
            <g
              key={patted ? `${p.b}:${patToken}` : p.b}
              className="sdk-beach-piece"
              data-pat={patted ? "" : undefined}
              style={{ "--i": i } as CSSProperties}
            >
              {built ? (
                <>
                  <path className="sdk-beach-body" d={p.body} />
                  {p.detail}
                </>
              ) : (
                <path className="sdk-beach-plan" d={p.body} />
              )}
            </g>
          );
        })}
        {PIECES.map((p) =>
          p.glow && (boxes >> p.b) & 1 ? (
            <circle
              key={p.b}
              className="sdk-beach-glow sdk-beach-night"
              data-corner={CORNER.has(p.b) ? "" : undefined}
              cx={p.glow[0]}
              cy={p.glow[1]}
              r="9"
            />
          ) : null,
        )}
        {complete && <path className="sdk-beach-flag" d="M60 1 L76 5 L60 9.5 Z" />}
        {towers !== null && <TowersFx key={towers} />}
      </svg>
    </div>
  );
});
