"use client";

import { memo, useState, type CSSProperties, type ReactNode } from "react";
import { CORNER_CLUSTERS, HANG_CLUSTERS, TREE, TREE_CLUSTERS, type FlowerKind, type Pt } from "./garden";

// The garden's drawings: inline SVG, coloured by the theme's tokens through class names (so the
// same drawing is the day's and the night's).

/** A cherry petal pointing up from (0, 0): round, with the notch at its tip. */
const PETAL = "M0 0C-2.8-1.4-3.8-5.4-2-7.6L0-6.4L2-7.6C3.8-5.4 2.8-1.4 0 0Z";

/** A five-petal cherry blossom centred at (0, 0), about 15 across. */
function Blossom({ x, y, scale = 1, turn = 0 }: { x: number; y: number; scale?: number; turn?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${turn}) scale(${scale})`}>
      {[0, 1, 2, 3, 4].map((k) => (
        <path key={k} d={PETAL} className={k % 2 ? "sdk-blossom-p2" : "sdk-blossom-p1"} transform={`rotate(${k * 72})`} />
      ))}
      <circle r={1.7} className="sdk-blossom-eye" />
    </g>
  );
}

/**
 * A head of the plant (an open flower or a bud): whatever mounts after the scene's first paint
 * animates in (a flower pops open, a dealt bud sprouts); what was there on load shows at rest.
 */
function Grow({ live, className, children }: { live: boolean; className: string; children: ReactNode }) {
  const [grow] = useState(live);
  return (
    <g className={className} data-grow={grow ? "" : undefined}>
      {children}
    </g>
  );
}

function Head({ kind }: { kind: FlowerKind }) {
  if (kind === "daisy") {
    return (
      <>
        {Array.from({ length: 10 }, (_, k) => (
          <ellipse key={k} cx={12} cy={5.2} rx={1.9} ry={4.5} className="sdk-blossom-daisy" transform={`rotate(${k * 36} 12 10)`} />
        ))}
        <circle cx={12} cy={10} r={2.9} className="sdk-blossom-daisy-eye" />
      </>
    );
  }
  if (kind === "cherry") {
    return (
      <>
        <g transform="translate(12 10) scale(1.08)">
          {[0, 1, 2, 3, 4].map((k) => (
            <path key={k} d={PETAL} className={k % 2 ? "sdk-blossom-p2" : "sdk-blossom-p1"} transform={`rotate(${k * 72 + 18})`} />
          ))}
        </g>
        <circle cx={12} cy={10} r={2} className="sdk-blossom-eye" />
        {[0, 1, 2, 3, 4].map((k) => (
          <circle
            key={k}
            cx={12 + 3.4 * Math.sin((k * 72 * Math.PI) / 180)}
            cy={10 - 3.4 * Math.cos((k * 72 * Math.PI) / 180)}
            r={0.55}
            className="sdk-blossom-eye"
          />
        ))}
      </>
    );
  }
  return (
    <>
      <path d="M5 4.6Q4.4 15.4 12 17.6Q19.6 15.4 19 4.6L15.4 8.6L12 2.6L8.6 8.6Z" className={`sdk-blossom-${kind}`} />
      <path d="M12 2.6L9.2 8.8Q12 15.6 14.8 8.8Z" className="sdk-blossom-sheen" />
    </>
  );
}

/** One of the nine: a bud on its stem until its box is finished, then the open flower. ViewBox 0 0 24 40. */
export const Flower = memo(function Flower({ kind, open, live, dealt }: { kind: FlowerKind; open: boolean; live: boolean; dealt: number }) {
  const leaves = (
    <>
      <path d="M12 32C8 31.4 5 28.6 4.4 25C8.4 25.2 11.2 28 12 32Z" className="sdk-blossom-leaf" />
      <path d="M12 28C16 27.4 19 24.6 19.6 21C15.6 21.2 12.8 24 12 28Z" className="sdk-blossom-leaf" />
    </>
  );
  return (
    <svg className="sdk-blossom-flower" viewBox="0 0 24 40" preserveAspectRatio="xMidYMax meet" aria-hidden>
      {open ? (
        <>
          <path d="M12 40C12 33 10.8 24 12 13" className="sdk-blossom-stem" />
          {leaves}
          <Grow key="head" live={live} className="sdk-blossom-head">
            <Head kind={kind} />
          </Grow>
        </>
      ) : (
        // A dealt bud sprouts whole, stem and all, from the ground.
        <Grow key={`bud-${dealt}`} live={live} className="sdk-blossom-bud">
          <path d="M12 40C12 33 11 26 12 19" className="sdk-blossom-stem" />
          {leaves}
          <ellipse cx={12} cy={15.6} rx={3.9} ry={5.4} className="sdk-blossom-bud-body" />
          <path d="M9.4 13Q12 6.6 14.6 13Q12 14.2 9.4 13Z" className="sdk-blossom-bud-tip" />
          <path d="M12 21L8.6 17.6Q9 20.6 12 21ZM12 21L15.4 17.6Q15 20.6 12 21Z" className="sdk-blossom-leaf" />
        </Grow>
      )}
    </svg>
  );
});

/** A cluster on the branch: two buds until it opens, then three blossoms. */
function Cluster({ at, open, scale, turn }: { at: Pt; open: boolean; scale: number; turn: number }) {
  return (
    <g className="sdk-blossom-cluster" data-open={open ? "" : undefined} transform={`translate(${at.x} ${at.y})`}>
      <g className="sdk-blossom-buds">
        <circle cx={-1} cy={0} r={2.3 * scale} className="sdk-blossom-bud-tip" />
        <circle cx={3.6 * scale} cy={2.6 * scale} r={1.9 * scale} className="sdk-blossom-bud-tip" />
      </g>
      <g className="sdk-blossom-bloom">
        <Blossom x={5.4 * scale} y={4.2 * scale} scale={0.62 * scale} turn={turn + 20} />
        <Blossom x={-5 * scale} y={4.6 * scale} scale={0.58 * scale} turn={turn - 14} />
        <Blossom x={0} y={0} scale={0.74 * scale} turn={turn} />
      </g>
    </g>
  );
}

const TURNS = [0, 24, 50, 12, 36, 60, 8, 44, 18, 30, 54, 4, 40, 22, 66, 14, 48, 28, 6, 58, 34];

/**
 * A soft cloud of blossom behind the clusters (those `shown`, by index, where given), thickening
 * as the board fills (a gradient, never a filter).
 */
function Haze({ at, r, haze, shown }: { at: readonly Pt[]; r: number; haze: number; shown?: readonly number[] }) {
  return (
    <>
      <defs>
        <radialGradient id="sdk-blossom-haze-fill">
          <stop offset="0%" className="sdk-blossom-haze-in" />
          <stop offset="100%" className="sdk-blossom-haze-out" />
        </radialGradient>
      </defs>
      <g style={{ opacity: haze }}>
        {at.map((c, k) =>
          shown && !shown.includes(k) ? null : (
            <circle key={k} cx={c.x} cy={c.y + r * 0.1} r={k % 3 ? r : r * 1.25} fill="url(#sdk-blossom-haze-fill)" />
          ),
        )}
      </g>
    </>
  );
}

/** The twig each corner cluster hangs from, down from the bark (those on the bark have none). */
const CORNER_TWIGS: readonly string[] = ["M68 16C74 24 79 33 84 42", "", "M104 15C107 22 110 29 112 35", "", "M128 13C132 19 135 24 139 29", "M146 12.4C148 15 150 18 152 20", ""];

/** The corner branch over the gear, with the clusters `shown` (by index, the k-th to open k-th). ViewBox 0 0 170 64. */
export const CornerBranch = memo(function CornerBranch({ open, haze, shown }: { open: number; haze: number; shown: readonly number[] }) {
  return (
    <svg className="sdk-blossom-art" viewBox="0 0 170 64" preserveAspectRatio="xMinYMin meet" aria-hidden>
      <Haze at={CORNER_CLUSTERS} r={20} haze={haze} shown={shown} />
      <path d="M-6 7C30 3 58 13 92 12.5C120 12 146 9 168 15C146 13.6 122 17.6 92 18.4C58 19.4 28 15 -6 18Z" className="sdk-blossom-bark" />
      <path d="M-6 8.2C30 4.4 58 14 92 13.6" className="sdk-blossom-bark-hi" />
      <path d={shown.map((k) => CORNER_TWIGS[k]).join("")} className="sdk-blossom-twig" />
      {shown.map((k, i) => (
        <Cluster key={k} at={CORNER_CLUSTERS[k]} open={i < open} scale={1.15} turn={TURNS[k]} />
      ))}
    </svg>
  );
});

/** A weeping branch hanging from the top of the strip beside the board. ViewBox 0 0 70 220. */
export const HangingBranch = memo(function HangingBranch({ open, haze }: { open: number; haze: number }) {
  return (
    <svg className="sdk-blossom-art" viewBox="0 0 70 220" preserveAspectRatio="xMidYMin meet" aria-hidden>
      <Haze at={HANG_CLUSTERS} r={22} haze={haze} />
      <path d="M30 -6C36 30 44 60 40 96C36 132 28 160 36 200" className="sdk-blossom-limb" style={{ "--wide": 3.6 } as CSSProperties} />
      <path
        d="M38 22C42 26 44 28 44 30M37 48C32 52 28 54 26 56M41 76C45 79 47 80 48 82M39 104C32 106 26 108 22 110M36 130C40 132 43 134 44 136M32 158C29 160 27 162 26 164"
        className="sdk-blossom-twig"
      />
      {HANG_CLUSTERS.map((at, k) => (
        <Cluster key={k} at={at} open={k < open} scale={1.3} turn={TURNS[k]} />
      ))}
    </svg>
  );
});

/** The cherry tree of a wide screen's left panel (grown in garden.ts). ViewBox 0 0 380 800. */
export const Tree = memo(function Tree({ open, haze }: { open: number; haze: number }) {
  return (
    <svg className="sdk-blossom-art" viewBox="0 0 380 800" preserveAspectRatio="xMidYMax meet" aria-hidden>
      {/* The crown's blossom, a soft cloud that thickens as the board fills. */}
      <Haze at={TREE_CLUSTERS} r={54} haze={haze} />
      <path
        d="M144 800C164 772 170 724 170 672C170 626 168 594 174 562C176 552 180 546 186 540C192 546 196 552 198 562C204 594 202 626 202 672C202 724 208 772 230 800Z"
        className="sdk-blossom-bark"
      />
      <path d="M180 790C184 720 178 630 184 556" className="sdk-blossom-bark-hi" />
      {TREE.limbs.map(({ d, w }, k) => (
        <path key={k} d={d} className="sdk-blossom-limb" style={{ "--wide": w } as CSSProperties} />
      ))}
      {/* The other tips: buds that open too, a beat behind the clusters. */}
      {TREE.buds.map((b, k) => (
        <g
          key={k}
          className="sdk-blossom-cluster"
          data-open={k * 21 < (open - 2) * TREE.buds.length ? "" : undefined}
          transform={`translate(${b.x} ${b.y})`}
        >
          <circle r={3} className="sdk-blossom-bud-tip sdk-blossom-buds" />
          <g className="sdk-blossom-bloom">
            <Blossom x={0} y={0} scale={0.82} turn={TURNS[k % TURNS.length]} />
          </g>
        </g>
      ))}
      {TREE_CLUSTERS.map((at, k) => (
        <Cluster key={k} at={at} open={k < open} scale={2} turn={TURNS[k % TURNS.length]} />
      ))}
    </svg>
  );
});

/** A falling petal. ViewBox 0 0 10 12. */
export const PetalShape = memo(function PetalShape({ deep }: { deep?: boolean }) {
  return (
    <svg className="sdk-blossom-art" viewBox="0 0 10 12" aria-hidden>
      <path d="M5 12C0 8 0 3 3 0L5 2L7 0C10 3 10 8 5 12Z" className={deep ? "sdk-blossom-p3" : "sdk-blossom-p1"} />
    </svg>
  );
});

/** A four-point star. ViewBox 0 0 10 10. */
export function StarShape() {
  return (
    <svg className="sdk-blossom-art" viewBox="0 0 10 10" aria-hidden>
      <path d="M5 0L6 4L10 5L6 6L5 10L4 6L0 5L4 4Z" className="sdk-blossom-star-path" />
    </svg>
  );
}

/** A butterfly facing up, its wings flapping (the .sdk-blossom-wings group). ViewBox 0 0 24 20. */
export function ButterflyShape({ tone }: { tone: "a" | "b" }) {
  return (
    <svg className="sdk-blossom-art" viewBox="0 0 24 20" aria-hidden>
      <g className="sdk-blossom-wings" data-tone={tone}>
        <path
          d="M12 9C9 1.6 2.4 1.4 2.6 6.6C2.8 10.4 8.4 11 12 10ZM12 9C15 1.6 21.6 1.4 21.4 6.6C21.2 10.4 15.6 11 12 10Z"
          className="sdk-blossom-wing-up"
        />
        <path
          d="M12 11C9.4 12 5.6 13.6 6.6 16.8C7.6 19.2 11 15.6 12 11ZM12 11C14.6 12 18.4 13.6 17.4 16.8C16.4 19.2 13 15.6 12 11Z"
          className="sdk-blossom-wing-down"
        />
        <circle cx={6.2} cy={5.8} r={1.2} className="sdk-blossom-wing-spot" />
        <circle cx={17.8} cy={5.8} r={1.2} className="sdk-blossom-wing-spot" />
      </g>
      <ellipse cx={12} cy={10.4} rx={1.1} ry={5} className="sdk-blossom-bee-stripe" />
      <path d="M11.6 5.6Q10.6 3 9.4 2.4M12.4 5.6Q13.4 3 14.6 2.4" className="sdk-blossom-antenna" />
    </svg>
  );
}

/** A round bumblebee facing left, wings buzzing. ViewBox 0 0 24 20. */
export function BeeShape() {
  return (
    <svg className="sdk-blossom-art" viewBox="0 0 24 20" aria-hidden>
      <g className="sdk-blossom-buzz">
        <ellipse cx={10} cy={5.6} rx={3.6} ry={4.6} transform="rotate(-24 10 5.6)" className="sdk-blossom-bee-wing" />
        <ellipse cx={14.6} cy={5.8} rx={3.2} ry={4.2} transform="rotate(20 14.6 5.8)" className="sdk-blossom-bee-wing" />
      </g>
      <path d="M19.4 12.6L22.6 13.2L19.4 14Z" className="sdk-blossom-bee-stripe" />
      <ellipse cx={12} cy={12.6} rx={7.6} ry={5.8} className="sdk-blossom-bee-body" />
      <path d="M10.4 7.2V18M14.2 7.4V17.8" className="sdk-blossom-bee-band" />
      <circle cx={6.6} cy={11.6} r={1.1} className="sdk-blossom-bee-stripe" />
    </svg>
  );
}

/** A swallow flying right, its wing beating (the .sdk-blossom-beat path). ViewBox 0 0 34 22. */
export function SwallowShape() {
  return (
    <svg className="sdk-blossom-art" viewBox="0 0 34 22" aria-hidden>
      <path d="M17 10.6C13.6 4.4 9.6 0.6 4.2 -0.6C8.8 3.4 11.6 7.8 14.6 11.6Z" className="sdk-blossom-beat" />
      <path
        d="M31 11C28 8.2 22 8.2 17 9.6C12 11 7.4 10 1.6 5.6C4.8 9.8 7 11.8 10.2 13C6.4 14 3.2 16 1 19.2C6 17.2 10 15.4 14.4 14.4C19.4 14.6 26.6 14 31 11Z"
        className="sdk-blossom-bird"
      />
      <path d="M30.6 11.4C27 13.4 21 14.4 16 14C20 15.2 26 14.6 30.6 11.4Z" className="sdk-blossom-bird-belly" />
      <circle cx={27.6} cy={11.6} r={1.5} className="sdk-blossom-bird-throat" />
      <circle cx={28.6} cy={10.2} r={0.6} className="sdk-blossom-bird-belly" />
    </svg>
  );
}

/** A straw skep beehive. ViewBox 0 0 40 40, standing on y 40. */
export const HiveShape = memo(function HiveShape() {
  return (
    <svg className="sdk-blossom-art" viewBox="0 0 40 40" aria-hidden>
      <path d="M3 39C3 19 11 6 20 6C29 6 37 19 37 39Z" className="sdk-blossom-skep" />
      <path d="M8 16.5Q20 12 32 16.5M5.4 23Q20 18 34.6 23M4 29.6Q20 24.6 36 29.6M3.2 35.6Q20 31 36.8 35.6" className="sdk-blossom-hive-line" />
      <path d="M16.6 39C16.6 34.4 23.4 34.4 23.4 39Z" className="sdk-blossom-bee-stripe" />
    </svg>
  );
});
