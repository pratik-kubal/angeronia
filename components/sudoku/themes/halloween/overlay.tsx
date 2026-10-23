"use client";

import { useState, type CSSProperties } from "react";
import { mulberry32 } from "@/lib/random";
import type { SceneProps } from "../types";
import { BatArt, CandyCornArt, GhostArt, useSvgId } from "./art";
import { useLayout, usePlaying } from "./hooks";
import type { Layout } from "./layout";

// Over the game, for a surprise only (nothing here at rest, and nothing ever takes a tap):
// trick-or-treat (three knocks on the title: candy bursts out of the pumpkin, or now and then Boo
// pops out instead), board-o-lantern (the board glows as a carved face), ghost-parade (five ghosts
// in a line, at 10:31) and arrive (bats burst from the moon as the season comes in).

const px = (n: number) => `${Math.round(n * 10) / 10}px`;

/** The treat: candy corn and sweets, in a fixed order (the still frame shows the first ten). */
const CANDIES = ["corn", "🍬", "🍭", "corn", "🍫", "🍬", "corn", "🍭", "🍬", "corn", "🍫", "🍭", "corn", "🍬"];
const STILL = 10;

function Treat({ layout }: { layout: Layout }) {
  const { emblem, height, width, rest } = layout;
  const rng = mulberry32(1031);
  return (
    <>
      {CANDIES.map((candy, k) => {
        // The pumpkin is near the top of the screen, so the candy bursts out sideways with a little
        // hop and tumbles down, fanned out evenly left and right.
        const side = k % 2 ? 1 : -1;
        const reach = 40 + (Math.floor(k / 2) / (CANDIES.length / 2 - 1)) * 150 + rng() * 20;
        const size = 18 + rng() * 12;
        // At rest (reduced motion) the first ten sit in a row along the sill.
        const stillX = Math.min(width - 20, Math.max(20, emblem.x + 32 + (k - 4.5) * 30)) - emblem.x;
        const style = {
          left: px(emblem.x),
          top: px(emblem.y + 6),
          "--size": px(size),
          "--dx": px(side * reach),
          "--up": px(-(4 + rng() * 14)),
          "--fall": px(height * (0.62 + rng() * 0.2) - emblem.y),
          "--rot": `${Math.round(side * (180 + rng() * 360))}deg`,
          "--delay": `${Math.round(rng() * 220)}ms`,
          "--t": `${(1.7 + rng() * 0.35).toFixed(2)}s`,
          "--still-x": px(stillX),
          "--still-y": px(rest - emblem.y + (k % 2 ? 3 : -3)),
        } as CSSProperties;
        return (
          <div key={k} className="sdk-halloween-candy" data-extra={k >= STILL ? "" : undefined} style={style}>
            <span>{candy === "corn" ? <CandyCornArt /> : candy}</span>
          </div>
        );
      })}
    </>
  );
}

/** The trick: a puff of smoke, and Boo pops out of the pumpkin to say so (his landing is the layout's, clear of the board). */
function Trick({ layout }: { layout: Layout }) {
  const { emblem, boo } = layout;
  const { bubble } = boo;
  const style = {
    left: px(emblem.x),
    top: px(emblem.y),
    "--bx": px(boo.x),
    "--by": px(boo.y),
    "--bs": boo.scale,
    "--ax": px(boo.away.x),
    "--ay": px(boo.away.y),
  } as CSSProperties;
  return (
    <>
      {[0, 90, 180].map((delay, k) => (
        <i key={k} className="sdk-halloween-puff" style={{ left: px(emblem.x + (k - 1) * 12), top: px(emblem.y + 4), "--delay": `${delay}ms` } as CSSProperties} />
      ))}
      <div className="sdk-halloween-boo" style={style}>
        <span>
          <GhostArt wave />
        </span>
        {bubble.scale > 0 && (
          // Placed from Boo's middle (his box is 40×45 at his size), its type at its own size.
          <b
            className="sdk-halloween-bubble"
            data-under={bubble.under ? "" : undefined}
            style={{ left: px(20 * boo.scale + bubble.x), top: px(22.5 * boo.scale + bubble.y), fontSize: px(13 * bubble.scale) }}
          >
            boo!
          </b>
        )}
      </div>
    </>
  );
}

/**
 * The board as a jack-o'-lantern: an orange glow over it, the face's boxes carved and flickering
 * (each cut lit at its edge, with a soft halo of candlelight), a stem on top.
 */
function Lantern({ board }: { board: Layout["board"] }) {
  const halo = useSvgId();
  const radius = (20 / board.width) * 9;
  const carved = [
    // Eyes in the top corner boxes, a nose in the centre box, a toothy grin across the bottom row.
    { d: "M0.55 2.55L2.45 2.55L1.5 0.65Z", delay: 300 },
    { d: "M6.55 2.55L8.45 2.55L7.5 0.65Z", delay: 400 },
    { d: "M3.95 5.2L5.05 5.2L4.5 4.05Z", delay: 500 },
    {
      d: "M0.55 6.45L1.4 6.95L1.95 6.5L2.65 7.15L3.35 6.7L4.5 7.35L5.65 6.7L6.35 7.15L7.05 6.5L7.6 6.95L8.45 6.45Q8.2 8.75 4.5 8.85Q0.8 8.75 0.55 6.45Z",
      delay: 600,
    },
  ];
  return (
    <>
      <div className="sdk-halloween-lantern" style={{ left: px(board.x), top: px(board.y), width: px(board.width), height: px(board.height) }}>
        <svg viewBox="0 0 9 9" preserveAspectRatio="none" aria-hidden>
          <defs>
            <filter id={halo} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="0.16" />
            </filter>
          </defs>
          <rect className="sdk-halloween-skin" width="9" height="9" rx={radius} />
          {carved.map(({ d, delay }) => (
            <g key={delay} className="sdk-halloween-carved" style={{ "--delay": `${delay}ms` } as CSSProperties}>
              <path className="sdk-halloween-halo" d={d} filter={`url(#${halo})`} />
              <path d={d} vectorEffect="non-scaling-stroke" />
            </g>
          ))}
        </svg>
      </div>
      {/* The stem stands 19px over the board, shorter where the board starts nearer the top of the screen. */}
      <div className="sdk-halloween-stem" style={{ left: px(board.x + board.width / 2), top: px(board.y - 19), "--fit": Math.min(1, (board.y + 3) / 22) } as CSSProperties}>
        <svg viewBox="0 0 26 22" aria-hidden>
          <path d="M15 8.6c2-5.2 7-6.2 9.6-3.2" fill="none" stroke="var(--sdk-halloween-vine)" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M10.6 22c-.2-6.4.6-11.6 3.4-15.4l3.2 1.8c-2 3-2.6 7.6-2.2 13.6z" fill="var(--sdk-halloween-stem)" />
        </svg>
      </div>
    </>
  );
}

/** Five ghosts in a line, the tiny last one hurrying to keep up (from behind the board, where the lane has a clip). */
function Parade({ lane }: { lane: Layout["parade"] }) {
  const sizes = [30, 26, 28, 24, 16].map((size) => size * lane.scale);
  const gap = 40 * lane.scale;
  const line = gap * (sizes.length - 1) + sizes[0];
  const style = {
    left: px(lane.from),
    top: px(lane.y),
    "--dx": px(lane.to - lane.from + line),
    "--still": px((lane.to - lane.from) / 2 + line / 2 - sizes[0] / 2),
  } as CSSProperties;
  return (
    <div className="sdk-halloween-lane" style={lane.clip ? { clipPath: `inset(0 0 0 ${px(lane.clip)})` } : undefined}>
      <div className="sdk-halloween-parade" style={style}>
        {sizes.map((size, k) => (
          <div
            key={k}
            data-tiny={k === sizes.length - 1 ? "" : undefined}
            style={{ left: px(-k * gap - size / 2), "--size": px(size), "--delay": `${-k * 0.13}s` } as CSSProperties}
          >
            <span>
              <GhostArt wave={k === 0} />
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Where each bat of a phone's flock heads, as a share of the screen's width and px down: most fan
 * out leftwards across the sky over the board, two dart right, none off the top before it's seen.
 */
const NARROW_FLOCK: readonly [number, number][] = [
  [-0.62, 26],
  [-0.46, -10],
  [-0.3, 40],
  [0.2, -6],
  [0.26, 30],
];

/** The season come in: a flock of bats bursts from the moon and fans out across the sky. */
function Flock({ layout }: { layout: Layout }) {
  const { moon, mode, width, board } = layout;
  const rng = mulberry32(1031 * 7);
  const size = mode === "wide" ? 30 : 24;
  return (
    <>
      {Array.from({ length: 5 }, (_, k) => {
        let fx: number;
        let fy: number;
        if (mode === "wide") {
          const angle = ((196 + k * 17 + rng() * 8) * Math.PI) / 180;
          const reach = 240 + rng() * 160;
          fx = Math.cos(angle) * reach;
          fy = Math.sin(angle) * reach;
        } else {
          fx = NARROW_FLOCK[k][0] * width * (0.9 + rng() * 0.2);
          fy = NARROW_FLOCK[k][1] + rng() * 8;
          // An upright phone's moon tucked under the title sits low: the flock keeps above the board.
          if (mode === "tall") fy = Math.min(fy, board.y - 8 - moon.y);
        }
        const style = {
          left: px(moon.x - size / 2),
          top: px(moon.y - size / 4),
          width: px(size),
          height: px(size / 2),
          "--fx": px(fx),
          "--fy": px(fy),
          "--delay": `${500 + k * 90}ms`,
        } as CSSProperties;
        return (
          <div key={k} className="sdk-halloween-flock" style={style}>
            <BatArt />
          </div>
        );
      })}
    </>
  );
}

export function HalloweenOverlay({ cue }: SceneProps) {
  const layout = useLayout();
  const playing = usePlaying(cue);
  // The first trick-or-treat since the scene came up is always a treat; after that, one in three is a trick.
  const [firstTreat, setFirstTreat] = useState(0);
  const knock = playing?.surprise === "trick-or-treat" ? playing.token : 0;
  if (knock && !firstTreat) setFirstTreat(knock);
  if (!layout || !playing) return null;
  let surprise = null;
  if (playing.surprise === "trick-or-treat") {
    const trick = firstTreat !== 0 && firstTreat !== knock && mulberry32(knock * 7919)() < 1 / 3;
    surprise = trick ? <Trick layout={layout} /> : <Treat layout={layout} />;
  } else if (playing.surprise === "board-o-lantern") surprise = <Lantern board={layout.board} />;
  else if (playing.surprise === "ghost-parade") surprise = <Parade lane={layout.parade} />;
  else if (playing.surprise === "arrive") surprise = <Flock layout={layout} />;
  if (!surprise) return null;
  return (
    <div key={playing.token} className="sdk-halloween-over" data-surprise={playing.surprise}>
      {surprise}
    </div>
  );
}
