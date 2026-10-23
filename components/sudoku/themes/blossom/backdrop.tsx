"use client";

import { memo, useState, type CSSProperties } from "react";
import { boxOf, colOf } from "@/lib/sudoku/grid";
import type { Beat, Cue, SceneProps } from "../types";
import { ButterflyShape, CornerBranch, Flower, HangingBranch, HiveShape, PetalShape, StarShape, Tree } from "./art";
import { firefliesIn, type Garden, type Pt, type Slot } from "./garden";
import { useDealt, useFresh, useGarden, useLive } from "./use-garden";

// Blossom's garden, behind the game. Nine flowers, one per 3×3 box, are buds until their box is
// finished, then pop open; the branch (a whole tree on a wide screen) fills with blossom as the
// board fills, and more petals drift down. A solved board brings butterflies by day and
// fireflies by night. The flowers nod when a unit is finished, a refused digit is a raindrop on
// the flower under it, a finished digit lets petals go from the branch, a hint glints on the sun.

/** How long a beat's reaction lives, and a surprise's part here (the Overlay plays the rest). */
const BEAT_MS = 2200;
const CUE_MS = 2600;
const BEE_MS = 2500;

type Nod = {
  token: number;
  kind: "nod" | "cheer" | "wave" | "dip" | "bob";
  delay: (slot: Slot) => number;
} | null;

/** The flower under a cell: in a row, the one under its column; in the bed, its box's. */
function slotUnder(garden: Garden, cell: number): number {
  if (garden.mode === "plot") return boxOf(cell);
  const s = colOf(cell);
  return (s % 3) * 3 + Math.floor(s / 3);
}

/** How the flowers move for a beat (or a surprise), whichever came last. */
function nodFor(garden: Garden, beat: Beat | null, cue: Cue | null): Nod {
  const plot = garden.mode === "plot";
  const fromBeat = (): Nod => {
    if (!beat || beat.kind === "deal") return null;
    if (beat.kind === "miss") {
      const target = slotUnder(garden, beat.cell);
      return {
        token: beat.token,
        kind: "bob",
        delay: (s) => (s.box === target ? 430 : -1),
      };
    }
    if (beat.kind === "win")
      return {
        token: beat.token,
        kind: "cheer",
        delay: (s) => (plot ? s.col + s.depth : s.col) * 60,
      };
    if (!beat.units.length) return null;
    const box = boxOf(beat.cell);
    return {
      token: beat.token,
      kind: "nod",
      delay: (s) =>
        plot ? Math.max(Math.abs(s.depth - Math.floor(box / 3)), Math.abs(s.col - (box % 3))) * 80 : Math.abs(s.col - colOf(beat.cell)) * 45,
    };
  };
  const fromCue = (): Nod => {
    if (!cue) return null;
    if (cue.surprise === "arrive")
      return {
        token: cue.token,
        kind: "wave",
        delay: (s) => 900 + (plot ? s.col + s.depth * 3 : s.col) * 50,
      };
    if (cue.surprise === "bumblebee")
      return {
        token: cue.token,
        kind: "dip",
        delay: (s) => Math.round(garden.bee.visits[s.box] * BEE_MS),
      };
    return null;
  };
  const a = fromBeat();
  const b = fromCue();
  return a && b ? (a.token > b.token ? a : b) : (a ?? b);
}

const Plant = memo(function Plant({
  slot,
  open,
  live,
  dealt,
  nod,
  nodKind,
  nodDelay,
  puff,
  rain,
}: {
  slot: Slot;
  open: boolean;
  live: boolean;
  dealt: number;
  /** The nod under way (its token, kind and this flower's delay), if any. */
  nod: number;
  nodKind: string | undefined;
  nodDelay: number;
  puff: number;
  rain: number;
}) {
  // A new nod restarts the animation by swapping to its twin keyframes (data-flip), never by
  // remounting: that would replay the flower's own entrance.
  const [track, setTrack] = useState({ nod, flip: false });
  if (track.nod !== nod) setTrack({ nod, flip: !track.flip });
  const style = {
    "--x": `${slot.x - slot.w / 2}px`,
    "--y": `${slot.y - slot.h}px`,
    "--w": `${slot.w}px`,
    "--h": `${slot.h}px`,
    "--hx": `${slot.head.x - slot.x + slot.w / 2}px`,
    "--hy": `${slot.head.y - slot.y + slot.h}px`,
    "--r": `${slot.r}px`,
    "--i": slot.col + slot.depth * 3,
    "--sprout": `${250 + (slot.col + slot.depth * 3) * 50}ms`,
    ...(slot.cut !== undefined && { "--below": `${slot.y - slot.cut}px` }),
  } as CSSProperties;
  return (
    <div className="sdk-blossom-plant" data-open={open ? "" : undefined} data-cut={slot.cut !== undefined ? "" : undefined} style={style}>
      <div className="sdk-blossom-sway">
        <div
          className="sdk-blossom-nod"
          data-nod={nodKind}
          data-flip={track.flip ? "" : undefined}
          style={nodKind ? ({ "--d": `${nodDelay}ms` } as CSSProperties) : undefined}
        >
          {open && <span className="sdk-blossom-halo" />}
          <Flower kind={slot.kind} open={open} live={live} dealt={dealt} />
        </div>
      </div>
      {puff > 0 && (
        <span key={puff} className="sdk-blossom-puff">
          {[0, 1, 2, 3, 4].map((k) => (
            <i key={k} style={{ "--a": `${k * 72 - 90 + 20}deg` } as CSSProperties}>
              <PetalShape deep={k % 2 === 1} />
            </i>
          ))}
        </span>
      )}
      {rain > 0 && <span key={rain} className="sdk-blossom-drop" />}
    </div>
  );
});

/** The sky: the sun by day, the moon (where the header has room for it) and stars by night, a cloud or two on a wide screen. */
const Sky = memo(function Sky({ garden, glint, glintDelay }: { garden: Garden; glint: number; glintDelay: number }) {
  const { sun, moon } = garden;
  const ring = glint ? <span key={glint} className="sdk-blossom-glint" style={{ "--d": `${glintDelay}ms` } as CSSProperties} /> : null;
  return (
    <>
      <div
        className="sdk-blossom-sun"
        style={
          {
            "--x": `${sun.x}px`,
            "--y": `${sun.y}px`,
            "--size": `${sun.size}px`,
          } as CSSProperties
        }
      >
        {ring}
      </div>
      {moon.size > 0 && (
        <div
          className="sdk-blossom-moon"
          style={
            {
              "--x": `${moon.x}px`,
              "--y": `${moon.y}px`,
              "--size": `${moon.size}px`,
              "--glint": moon.glint,
            } as CSSProperties
          }
        >
          <span className="sdk-blossom-crescent" />
          {ring}
        </div>
      )}
      {garden.stars.map((s, k) => (
        <span
          key={k}
          className="sdk-blossom-star"
          style={
            {
              "--x": `${s.x}px`,
              "--y": `${s.y}px`,
              "--dur": `${5 + ((k * 7) % 5)}s`,
              "--delay": `${-k * 1.3}s`,
            } as CSSProperties
          }
        >
          <StarShape />
        </span>
      ))}
      {garden.clouds.map((c, k) => (
        <span
          key={k}
          className="sdk-blossom-cloud"
          style={
            {
              "--x": `${c.x}px`,
              "--y": `${c.y}px`,
              "--s": c.size,
              "--delay": `${-k * 17}s`,
            } as CSSProperties
          }
        />
      ))}
    </>
  );
});

const Hills = memo(function Hills({ garden, layer }: { garden: Garden; layer: "back" | "front" }) {
  return (
    <svg className="sdk-blossom-hills" viewBox={`0 0 ${garden.width} ${garden.height}`} preserveAspectRatio="none" aria-hidden>
      <path d={garden.hills[layer]} className={layer === "back" ? "sdk-blossom-hill-back" : "sdk-blossom-hill-front"} />
    </svg>
  );
});

/** The branch over the garden, or the tree; it sways, shakes for a petal shower, bobs as the swallow passes. */
const Branch = memo(function Branch({ garden, open, haze, shake }: { garden: Garden; open: number; haze: number; shake: Cue | null }) {
  const { box, kind } = garden.branch;
  const style = {
    "--x": `${box.x}px`,
    "--y": `${box.y}px`,
    "--w": `${box.width}px`,
    "--h": `${box.height}px`,
  } as CSSProperties;
  return (
    <div className="sdk-blossom-branch" data-kind={kind} style={style}>
      <div key={shake?.token ?? 0} className="sdk-blossom-shake" data-shake={shake ? shake.surprise : undefined}>
        {kind === "tree" ? (
          <Tree open={open} haze={haze} />
        ) : kind === "hang" ? (
          <HangingBranch open={open} haze={haze} />
        ) : (
          <CornerBranch open={open} haze={haze} shown={garden.branch.shown} />
        )}
      </div>
    </div>
  );
});

/** The petals always drifting down; more of them as the board fills. */
const Petals = memo(function Petals({ garden, count }: { garden: Garden; count: number }) {
  return (
    <>
      {garden.lanes.map((lane, k) => (
        <span
          key={k}
          className="sdk-blossom-fall"
          data-off={k >= count ? "" : undefined}
          data-still={k % 2 === 0 ? "" : undefined}
          style={
            {
              "--x": `${lane.x}px`,
              "--rest": `${lane.rest}px`,
              "--dur": `${15 + ((k * 5) % 10)}s`,
              "--delay": `${-((k * 3.7) % 15) - 1}s`,
              "--sway": `${(k % 2 ? 1 : -1) * (14 + ((k * 7) % 10))}px`,
              "--spin": `${(k % 3 === 1 ? -1 : 1) * (360 + ((k * 90) % 270))}deg`,
            } as CSSProperties
          }
        >
          <i>
            <PetalShape deep={k % 3 === 1} />
          </i>
        </span>
      ))}
    </>
  );
});

/** Petals let go from the branch (a finished digit, a finished row or column). */
function Drops({ points, token }: { points: Pt[]; token: number }) {
  return (
    <>
      {points.map((p, k) => (
        <span
          key={`${token}-${k}`}
          className="sdk-blossom-let-go"
          style={
            {
              "--x": `${p.x}px`,
              "--y": `${p.y}px`,
              "--d": `${k * 160}ms`,
              "--sway": `${k % 2 ? 16 : -14}px`,
            } as CSSProperties
          }
        >
          <PetalShape deep={k % 2 === 1} />
        </span>
      ))}
    </>
  );
}

/**
 * The payoff of a solved board: a butterfly by day and two fireflies by night in each zone, about
 * the branch (where it has room beside the gear) and the flowers. Under reduced motion each
 * butterfly rests on a flower.
 */
const Payoff = memo(function Payoff({ garden, enter }: { garden: Garden; enter: boolean }) {
  const perches = garden.slots.length ? [garden.slots[6], garden.slots[2]] : [];
  return (
    <>
      {garden.zones.map((z, k) => (
        <span
          key={`fly-${k}`}
          className="sdk-blossom-butterfly"
          data-enter={enter ? "" : undefined}
          style={
            {
              "--x": `${z.x}px`,
              "--y": `${z.y}px`,
              "--w": `${z.width}px`,
              "--h": `${z.height}px`,
              "--px": `${perches[k] ? perches[k].head.x - z.x : z.width / 2}px`,
              "--py": `${perches[k] ? perches[k].head.y - perches[k].r - z.y : z.height / 2}px`,
              "--dur": `${k ? 11 : 9}s`,
              "--size": `${garden.mode === "plot" ? 26 : 18}px`,
            } as CSSProperties
          }
        >
          <i>
            <ButterflyShape tone={k ? "b" : "a"} />
          </i>
        </span>
      ))}
      {garden.zones.flatMap((z, k) =>
        firefliesIn(z, k).map((f, j) => (
          <span
            key={`glow-${k}-${j}`}
            className="sdk-blossom-firefly"
            data-enter={enter ? "" : undefined}
            style={
              {
                "--x": `${f.x}px`,
                "--y": `${f.y}px`,
                "--dx": `${f.dx}px`,
                "--dy": `${f.dy}px`,
                "--dur": `${7 + k * 1.5 + j}s`,
                "--delay": `${-(k * 2 + j * 3)}s`,
              } as CSSProperties
            }
          />
        )),
      )}
    </>
  );
});

/**
 * Whether a beat has a reaction in the garden. A plain placement has none, so it never cuts one
 * short; a deal does, as it clears the old board's reactions before the buds sprout again.
 */
const reacts = (b: Beat) =>
  b.kind === "deal" || b.kind === "miss" || b.kind === "hint" || b.kind === "win" || b.units.length > 0 || b.digitDone;

export function BlossomBackdrop({ boxes, filled, beat, cue }: SceneProps) {
  const garden = useGarden();
  const live = useLive(garden !== null);
  // The latest beat with a reaction. It starts with the mount's beat, so useFresh's `born` token
  // still keeps a beat from before the mount at rest.
  const [shown, setShown] = useState<Beat | null>(beat);
  if (beat && beat.token !== shown?.token && reacts(beat)) setShown(beat);
  const fresh = useFresh(shown, BEAT_MS, 0);
  const cued = useFresh(cue, CUE_MS, 1600);
  const dealt = useDealt(beat);
  if (!garden) return null;

  const full = boxes === 511;
  // The branch fills from a third full: a cluster opens at each step on the way to a full board.
  const clusters = garden.branch.clusters.length;
  const grown = Math.max(0, (filled - 0.3) / 0.7);
  const open = full ? clusters : Math.min(clusters, Math.floor(grown * clusters + 1e-9));
  const haze = full ? 0.85 : 0.12 + 0.55 * grown;
  const petals = Math.round(garden.lanes.length * (0.55 + 0.45 * filled));

  const nod = nodFor(garden, fresh, cued);
  const placed = fresh && fresh.kind !== "deal" && fresh.kind !== "miss" ? fresh : null;
  const popped = new Set(placed ? placed.units.filter((u) => u.kind === "box").map((u) => u.index) : []);
  const rainOn = fresh?.kind === "miss" ? slotUnder(garden, fresh.cell) : -1;
  const lines = placed ? placed.units.filter((u) => u.kind !== "box").length : 0;
  const letGo = placed ? (placed.digitDone ? 3 : 0) + Math.min(lines, 1) : 0;
  const tips = garden.branch.clusters.slice(0, Math.max(open, 3)).slice(-3);
  const glint = fresh?.kind === "hint" ? fresh.token : cued?.surprise === "rainbow" ? cued.token : 0;
  const shake = cued && (cued.surprise === "petal-shower" || cued.surprise === "arrive") ? cued : null;

  return (
    <div
      className="sdk-blossom-scene"
      data-mode={garden.mode}
      data-full={full ? "" : undefined}
      style={{ "--fall": `${garden.height + 40}px` } as CSSProperties}
    >
      <Sky garden={garden} glint={glint} glintDelay={fresh?.kind === "hint" ? 0 : 900} />
      <Hills garden={garden} layer="back" />
      <Branch garden={garden} open={open} haze={haze} shake={shake} />
      {garden.bed && (
        <>
          <svg className="sdk-blossom-hills" viewBox={`0 0 ${garden.width} ${garden.height}`} preserveAspectRatio="none" aria-hidden>
            <path d={garden.bed.front} className="sdk-blossom-plank" />
            <path d={garden.bed.soil} className="sdk-blossom-soil" />
            {garden.slots.map((s) => (
              <ellipse key={s.box} cx={s.x} cy={s.y} rx={s.w * 0.85} ry={s.w * 0.26} className="sdk-blossom-mound" />
            ))}
          </svg>
          <span
            className="sdk-blossom-hive"
            style={
              {
                "--x": `${garden.bed.hive.x}px`,
                "--y": `${garden.bed.hive.y}px`,
                "--size": `${garden.bed.hive.size}px`,
              } as CSSProperties
            }
          >
            <HiveShape />
          </span>
        </>
      )}
      <Hills garden={garden} layer="front" />
      {garden.slots.map((slot) => {
        const d = nod ? nod.delay(slot) : -1;
        return (
          <Plant
            key={slot.box}
            slot={slot}
            open={(boxes & (1 << slot.box)) !== 0}
            live={live}
            dealt={dealt}
            nod={nod && d >= 0 ? nod.token : 0}
            nodKind={nod && d >= 0 ? nod.kind : undefined}
            nodDelay={d}
            puff={popped.has(slot.box) && placed ? placed.token : 0}
            rain={rainOn === slot.box && fresh ? fresh.token : 0}
          />
        );
      })}
      <Petals garden={garden} count={petals} />
      {placed && letGo > 0 && <Drops points={tips.slice(-letGo)} token={placed.token} />}
      {full && <Payoff garden={garden} enter={fresh?.kind === "win"} />}
    </div>
  );
}
