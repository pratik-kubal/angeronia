"use client";

import type { CSSProperties } from "react";
import type { SceneProps } from "../types";
import { Crab, Feather, SwoopGull } from "./art";
import { clamp, useBeachLayout, type BeachLayout } from "./layout";
import { useSurprise } from "./use-surprise";

// The surprises that cross above the game (never taking a tap, gone within 2.5 s): the season's
// arrival, a storybook tide that rises over the pad and the dock with the crab riding its crest;
// the Fry Thief, a gull that swoops down, steals a fry from the sand and makes off; and Four
// Towers' corner flags.

/**
 * The tide coming in for the season, translucent so the pad reads through: up to the gap under the
 * board, or on a phone on its side up the right-hand column only, so it never washes over the board.
 */
function Arrive({ layout }: { layout: BeachLayout }) {
  const { tide } = layout;
  return (
    <div className="sdk-beach-tide" data-edge={tide.x > 0 ? "" : undefined} style={{ left: tide.x, top: tide.y }}>
      <i className="sdk-beach-tide-glow sdk-beach-night" />
      <i className="sdk-beach-tide-crest" />
      <div className="sdk-beach-tide-rider">
        <Crab />
      </div>
    </div>
  );
}

/**
 * The gull's swoop: across (linear) and down then up (eased), so it dips through the fry's spot at
 * the halfway mark. On a phone held upright it skims the header and bottoms out between the gear and
 * the title (the fry lies at the water's edge there). On its side it dips into the free band by the
 * castle and climbs out over the header; on a desktop it dives into the right-hand panel to the
 * towel and climbs out over the top. In both it stays beside the board, never over it: both ends are
 * high above the screen, so the span only has to keep the way out right of the board (at worst the
 * gull drops straight down and climbs straight back up).
 */
function Swoop({ layout }: { layout: BeachLayout }) {
  const { fry, mode, W, board, thief: size } = layout;
  const span = mode === "compact" ? 300 : Math.max(0, Math.min(W + 40 - fry.x, fry.x - (board.x + board.w) - size));
  return (
    <div
      className="sdk-beach-swoop"
      style={{ left: fry.x, top: fry.y, "--sdk-beach-span": `${span}px`, "--sdk-beach-rise": `${-(fry.y + 100)}px`, "--sdk-beach-g": `${size}px` } as CSSProperties}
    >
      {mode !== "wide" && (
        <span className="sdk-beach-fry" style={{ fontSize: fry.s }}>
          🍟
        </span>
      )}
      <div className="sdk-beach-swoop-x">
        <div className="sdk-beach-swoop-y">
          <SwoopGull />
          <span className="sdk-beach-beakfry">🍟</span>
        </div>
      </div>
      {[0, 1].map((k) => (
        <i key={k} className="sdk-beach-feather" data-k={k}>
          <Feather />
        </i>
      ))}
    </div>
  );
}

/**
 * Four Towers: a pennant planted at each of the board's corners (the corner boxes are the castle's
 * towers), in the gutters beside the rounded corners; the castle raises its own as well. Each pole
 * hugs the board and its pennant fits the gutter, so a phone's 16px never clips it.
 */
function CornerFlags({ layout }: { layout: BeachLayout }) {
  const { board, mode, W } = layout;
  const pole = mode === "wide" ? 44 : 30;
  const boardRight = board.x + board.w;
  /** Each side's pole (2px wide) and how wide its pennant can fly. */
  const poles = {
    left: { x: board.x - 4, w: clamp(8, board.x - 5, 14) },
    right: { x: boardRight + 2, w: clamp(8, W - boardRight - 5, 14) },
  };
  const corners: ["left" | "right", number][] = [
    ["left", board.y + 20],
    ["right", board.y + 20],
    ["left", board.y + board.h],
    ["right", board.y + board.h],
  ];
  return (
    <>
      {corners.map(([side, base], i) => (
        <i
          key={i}
          className="sdk-beach-cornerflag"
          data-side={side}
          style={{ left: poles[side].x, top: base - pole, height: pole, "--i": i, "--sdk-beach-pennant": `${poles[side].w}px` } as CSSProperties}
        >
          <b />
        </i>
      ))}
    </>
  );
}

export function BeachOverlay({ cue }: SceneProps) {
  const layout = useBeachLayout();
  const live = useSurprise(cue);
  if (!layout || !live) return null;
  if (live.surprise === "arrive") return <Arrive key={live.token} layout={layout} />;
  if (live.surprise === "gull-swoop") return <Swoop key={live.token} layout={layout} />;
  if (live.surprise === "towers") return <CornerFlags key={live.token} layout={layout} />;
  return null;
}
