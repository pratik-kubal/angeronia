"use client";

import { memo, useState, type CSSProperties } from "react";
import type { Beat, SceneProps } from "../types";
import { BatArt, CottageArt, GhostArt, MoonArt, PumpkinArt, SleepyBatArt, TreeArt, type Face } from "./art";
import { useFresh, useLatest, useLayout, usePlaying } from "./hooks";
import { moonPhase, type Flight, type Layout, type Pumpkin, type Scenery } from "./layout";

// Behind the game: the moon waxing as the board fills, bats and stars, the nine pumpkins of the
// sill (box b's pumpkin carved and lit once box b is finished) and, on a wide screen, the hill with
// its cottage, tree, patch and resident ghost. A solved board lights every pumpkin, the moon smiles
// and Boo peeks out from behind it. Beats react (a finished box carves its pumpkin, a digit's last
// one sends a bat across the moon, a win hops the row); surprises move the moon and the sill.

const SOLVED = 0x1ff;
const FACES: readonly Face[] = ["classic", "happy", "wink", "happy", "classic", "wink", "wink", "classic", "happy"];
/** The few lit pumpkins whose candles flicker, by slot, so the row never shimmers. */
const FLICKER: Record<number, string> = { 1: "3.2s", 4: "2.8s", 7: "3.6s" };
/** Each ember's drift as it rises from a pumpkin just carved. */
const EMBERS: CSSProperties[] = [
  { "--ex": "-5px", "--delay": "40ms" } as CSSProperties,
  { "--ex": "1px", "--delay": "0ms" } as CSSProperties,
  { "--ex": "6px", "--delay": "120ms" } as CSSProperties,
];

/** The boxes a beat finished, as bits. */
function carvedBy(beat: Beat | null): number {
  if (!beat || beat.kind === "deal" || beat.kind === "miss") return 0;
  return beat.units.reduce((mask, unit) => (unit.kind === "box" ? mask | (1 << unit.index) : mask), 0);
}

const px = (n: number) => `${Math.round(n * 10) / 10}px`;

type PieceProps = {
  pumpkin: Pumpkin;
  slot: number;
  lit: boolean;
  /** The beat that just carved it (its token), else 0. */
  carve: number;
  /** Whether the row is hopping now, and the latest hop (its token: a new one hops it again). */
  hop: boolean;
  hopKey: number;
  flicker?: string;
  delay?: number;
};

const PumpkinPiece = memo(function PumpkinPiece({ pumpkin, slot, lit, carve, hop, hopKey, flicker, delay = 0 }: PieceProps) {
  const height = (pumpkin.size * 30) / 32;
  const style = {
    left: px(pumpkin.x - pumpkin.size / 2),
    top: px(pumpkin.y - height),
    width: px(pumpkin.size),
    height: px(height),
    rotate: `${pumpkin.tilt}deg`,
    "--slot": slot,
    "--delay": `${delay}ms`,
    "--flicker": flicker,
  } as CSSProperties;
  return (
    <div className="sdk-halloween-pk" data-lit={lit ? "" : undefined} style={style}>
      <i key={`glow:${carve}`} className="sdk-halloween-pk-glow" data-in={carve ? "" : undefined} data-flicker={lit && flicker ? "" : undefined} />
      <span key={`body:${hopKey}:${carve}`} className="sdk-halloween-pk-body" data-carve={carve ? "" : undefined} data-hop={hop ? "" : undefined}>
        <PumpkinArt face={FACES[pumpkin.box]} />
      </span>
      {carve ? (
        <span key={`embers:${carve}`} className="sdk-halloween-embers">
          {EMBERS.map((style, k) => (
            <i key={k} style={style} />
          ))}
        </span>
      ) : null}
    </div>
  );
});

function Sill({ sill, width, height, boxes, carved, carve, hop, arrive }: {
  sill: NonNullable<Layout["sill"]>;
  width: number;
  height: number;
  boxes: number;
  carved: number;
  carve: number;
  hop: number;
  arrive: number;
}) {
  const hopKey = useLatest(hop);
  const arriveKey = useLatest(arrive);
  return (
    <div key={arriveKey} className="sdk-halloween-sill" data-arrive={arrive ? "" : undefined}>
      <svg className="sdk-halloween-vine" style={{ width, height }} aria-hidden>
        <path d={sill.vine} />
      </svg>
      {sill.pumpkins.map((pumpkin, slot) => (
        <PumpkinPiece
          key={slot}
          pumpkin={pumpkin}
          slot={slot}
          lit={(boxes & (1 << pumpkin.box)) !== 0}
          carve={carved & (1 << pumpkin.box) ? carve : 0}
          hop={hop !== 0}
          hopKey={hopKey}
          flicker={FLICKER[slot]}
        />
      ))}
    </div>
  );
}

function Moon({ moon, k, won, arrive, bong, wisp }: { moon: Layout["moon"]; k: number; won: boolean; arrive: number; bong: number; wisp: boolean }) {
  const { x, y, r } = moon;
  const arriveKey = useLatest(arrive);
  const bongKey = useLatest(bong);
  const style = { left: px(x - r), top: px(y - r), width: px(2 * r), height: px(2 * r), "--r": px(r), "--k": k.toFixed(3) } as CSSProperties;
  return (
    <div className="sdk-halloween-moon" style={style}>
      <div key={arriveKey} className="sdk-halloween-moon-rise" data-arrive={arrive ? "" : undefined}>
        <div key={bongKey} className="sdk-halloween-moon-bong" data-bong={bong ? "" : undefined}>
          <i className="sdk-halloween-moon-glow" />
          {won && (
            <div className="sdk-halloween-peek">
              <GhostArt wave />
            </div>
          )}
          <div className="sdk-halloween-moon-disc">
            <MoonArt k={k} smile={won} />
          </div>
          {wisp && <i className="sdk-halloween-wisp" />}
        </div>
      </div>
    </div>
  );
}

const Bat = memo(function Bat({ flight }: { flight: Flight }) {
  const style = {
    left: px(flight.from),
    top: px(flight.y - flight.size / 4),
    width: px(flight.size),
    height: px(flight.size / 2),
    "--dx": px(flight.to - flight.from),
    "--rest": px(flight.rest - flight.from),
    "--t": `${flight.seconds}s`,
    "--d": `${flight.delay}s`,
  } as CSSProperties;
  return (
    <div className="sdk-halloween-bat" style={style}>
      <BatArt />
    </div>
  );
});

/** A bat flitting across the moon. */
function Flit({ moon }: { moon: Layout["moon"] }) {
  const size = Math.max(16, moon.r * 0.5);
  const style = {
    left: px(moon.x - moon.r * 2.4),
    top: px(moon.y - moon.r * 0.35 - size / 4),
    width: px(size),
    height: px(size / 2),
    "--dx": px(moon.r * 4.8),
  } as CSSProperties;
  return (
    <div className="sdk-halloween-flit" style={style}>
      <BatArt />
    </div>
  );
}

const Stars = memo(function Stars({ stars }: { stars: Layout["stars"] }) {
  return (
    <>
      {stars.map((s, k) => (
        <i
          key={k}
          className="sdk-halloween-star sdk-halloween-night"
          style={{ left: px(s.x), top: px(s.y), "--t": `${4 + ((k * 1.3) % 3)}s`, "--d": `${-k * 1.7}s` } as CSSProperties}
        />
      ))}
    </>
  );
});

const CLOUD = "M12 30a10 10 0 0 1 2-19.6 15 15 0 0 1 27.6-5.2 11 11 0 0 1 17.6 7.2A9 9 0 0 1 60 30z";

/** The hill on each side of a wide screen: ridges, cottage, tree, day clouds and a resident ghost. */
const Hill = memo(function Hill({ scenery, width, height }: { scenery: Scenery; width: number; height: number }) {
  const s = scenery.scale;
  const cottage = { left: px(scenery.cottage.x), top: px(scenery.cottage.y - 150 * s), width: px(120 * s), height: px(150 * s) };
  const tree = { left: px(scenery.tree.x - 160 * s), top: px(scenery.tree.y - 420 * s), width: px(160 * s), height: px(420 * s) };
  return (
    <>
      {scenery.clouds.map((c, k) => (
        <div
          key={k}
          className="sdk-halloween-cloud sdk-halloween-day"
          style={{ left: px(c.x - 50 * s), top: px(c.y), width: px(100 * s), height: px(46 * s), "--d": `${-k * 11}s` } as CSSProperties}
        >
          <svg viewBox="0 0 70 32" aria-hidden>
            <path d={CLOUD} fill="var(--sdk-halloween-cloud)" />
          </svg>
        </div>
      ))}
      <svg className="sdk-halloween-hills" style={{ left: 0, top: 0, width, height }} aria-hidden>
        <path d={scenery.far} fill="var(--sdk-halloween-hill-far)" />
        <path d={scenery.near} fill="var(--sdk-halloween-hill)" />
      </svg>
      <div className="sdk-halloween-cottage" style={cottage}>
        <CottageArt />
      </div>
      {[0, -3.5].map((d) => (
        <i
          key={d}
          className="sdk-halloween-smoke"
          style={{ left: px(scenery.cottage.x + 91 * s), top: px(scenery.cottage.y - 136 * s), "--d": `${d}s` } as CSSProperties}
        />
      ))}
      <div className="sdk-halloween-tree" style={tree}>
        <TreeArt />
      </div>
      <div
        className="sdk-halloween-sleepy"
        style={{
          left: px(scenery.tree.x - 160 * s + 36 * s),
          top: px(scenery.tree.y - 420 * s + 201 * s),
          width: px(16 * s),
          height: px(24 * s),
          transformOrigin: "50% 0",
        }}
      >
        <SleepyBatArt />
      </div>
    </>
  );
});

/** The resident ghost on a wide screen: a tap makes it giggle and spin (just for fun). */
function Resident({ scenery }: { scenery: Scenery }) {
  const [boops, setBoops] = useState(0);
  // At least 36px wide (40px tall): a tappable piece is never under 32×32.
  const w = Math.max(36, 40 * scenery.scale);
  const style = { left: px(scenery.ghost.x - w / 2), top: px(scenery.ghost.y - (w * 1.12) / 2), width: px(w), height: px(w * 1.12) };
  return (
    <div className="sdk-halloween-resident" data-tap="ghost" style={style} onClick={() => setBoops((n) => n + 1)}>
      <span key={boops} data-boop={boops ? "" : undefined}>
        <GhostArt />
      </span>
    </div>
  );
}

/** The patch's plain pumpkins: carved and lit, middle outward, when the board is solved. */
function Patch({ patch, won }: { patch: Pumpkin[]; won: boolean }) {
  // Nearest the game first: the left side's last, the right side's first.
  const rank = [2, 1, 0, 0, 1, 2];
  return (
    <div className="sdk-halloween-patch">
      {patch.map((pumpkin, k) => (
        <PumpkinPiece key={k} pumpkin={pumpkin} slot={k} lit={won} carve={0} hop={false} hopKey={0} delay={500 + rank[k] * 160 + (k < 3 ? 0 : 60)} />
      ))}
    </div>
  );
}

export function HalloweenBackdrop({ boxes, filled, beat, cue }: SceneProps) {
  const layout = useLayout();
  const fresh = useFresh(beat);
  const playing = usePlaying(cue);
  const token = fresh?.token ?? 0;
  const cheer = fresh?.kind === "win" ? token : 0;
  /** The surprise's token while it plays, else 0. */
  const surprise = (name: string) => (playing?.surprise === name ? playing.token : 0);
  // A win, or carving the board into a face, hops the whole row instead: the pumpkins of that
  // beat never carve on their own, during the hop or after it. The beat is the one a hop began
  // on, so a box finished while the row hops still carves once the hop ends.
  const hop = cheer || surprise("board-o-lantern");
  const [hopped, setHopped] = useState({ hop: 0, beat: 0 });
  if (hop && hop !== hopped.hop) setHopped({ hop, beat: token });
  if (!layout) return null;
  const carve = hop || token === hopped.beat ? 0 : token;
  const won = boxes === SOLVED;
  const carved = carvedBy(fresh);
  const flit = fresh && fresh.kind !== "deal" && fresh.kind !== "miss" && fresh.digitDone ? token : 0;
  return (
    <div className="sdk-halloween-scene" data-mode={layout.mode} data-won={won ? "" : undefined} data-cheer={cheer ? "" : undefined}>
      {layout.scenery && <Hill scenery={layout.scenery} width={layout.width} height={layout.height} />}
      <Stars stars={layout.stars} />
      <Moon
        moon={layout.moon}
        k={moonPhase(filled)}
        won={won}
        arrive={surprise("arrive")}
        bong={surprise("ghost-parade")}
        wisp={layout.mode === "wide"}
      />
      {layout.bats.map((flight, k) => (
        <Bat key={k} flight={flight} />
      ))}
      {flit ? <Flit key={flit} moon={layout.moon} /> : null}
      {layout.scenery && <Patch patch={layout.scenery.patch} won={won} />}
      {layout.scenery && <Resident scenery={layout.scenery} />}
      {layout.sill && (
        <Sill
          sill={layout.sill}
          width={layout.width}
          height={layout.height}
          boxes={boxes}
          carved={carved}
          carve={carve}
          hop={hop}
          arrive={surprise("arrive")}
        />
      )}
    </div>
  );
}
