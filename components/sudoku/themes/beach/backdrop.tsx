"use client";

import { memo, type CSSProperties } from "react";
import type { SceneProps } from "../types";
import { Boat, Bucket, Cloud, Crab, FarGull, Lighthouse, Shell, Starfish, Umbrella } from "./art";
import { Castle } from "./castle";
import { useBeachLayout, type BeachLayout, type Spot } from "./layout";
import { useFreshBeat, useSurprise } from "./use-surprise";

// The cove behind the game: sky, sea and sand, the sun climbing (the moon at night) as the board
// fills, the sandcastle that mirrors the board, and a hermit crab. The busy part is the top band;
// through the glassy controls there is only sand. Static pieces are memoised on the layout; the
// rest reacts to the game's beats (a box packs its piece, a row or column laps the foam, a hint
// winks the sun, a deal sketches the plan in) and plays the surprises that live in the scene.

const at = ({ x, y, s }: Spot, h = s): CSSProperties => ({ left: x - s / 2, top: y - h / 2, width: s, height: h });

/** The sky, top to horizon (under the sun). */
const Sky = memo(function Sky({ horizon }: { horizon: number }) {
  return <div className="sdk-beach-sky" style={{ "--sdk-beach-at": `${horizon}px` } as CSSProperties} />;
});

/** The sun by day and the crescent moon by night: half set at the horizon on an empty board, high at noon on a full one. */
function Sun({ sun, t, wink }: { sun: BeachLayout["sun"]; t: number; wink: number | null }) {
  const lift = (sun.low - sun.high) * t;
  return (
    <div
      className="sdk-beach-sun"
      style={{ left: sun.x - sun.r, top: sun.low - sun.r, width: sun.r * 2, height: sun.r * 2, translate: `0 ${-lift}px`, "--r": `${sun.r}px` } as CSSProperties}
    >
      <i className="sdk-beach-halo" />
      <i className="sdk-beach-rays sdk-beach-day" />
      <i key={wink ?? 0} className="sdk-beach-disc" data-wink={wink !== null ? "" : undefined} />
    </div>
  );
}

/** The sea, the foam at the shore and the sand, with the wide panorama's props. */
const Shore = memo(function Shore({ layout }: { layout: BeachLayout }) {
  const { horizon, shore, sun, props, shells, starfish, fry, mode } = layout;
  const k = props.k;
  return (
    <>
      <div className="sdk-beach-sea" style={{ top: horizon, height: shore - horizon }}>
        <i className="sdk-beach-plankton sdk-beach-night" />
      </div>
      <i className="sdk-beach-horizon" style={{ top: horizon - 1 }} />
      {props.glitter && (
        <div className="sdk-beach-path" style={{ left: sun.x - 20 * k, top: horizon + 6, width: 40 * k, height: (shore - horizon) * 0.7 }} />
      )}
      <div className="sdk-beach-sand" style={{ top: shore }} />
      <i className="sdk-beach-foam-glow sdk-beach-night" style={{ top: shore - 18 }} />
      <i className="sdk-beach-foam" data-line="back" style={{ top: shore - 11 }} />
      <i className="sdk-beach-foam" data-line="front" style={{ top: shore - 4 }} />
      {props.lighthouse && (
        <div className="sdk-beach-prop" style={{ left: props.lighthouse.x - 30 * k, top: props.lighthouse.y - 86 * k, width: 60 * k, height: 96 * k }}>
          <Lighthouse />
        </div>
      )}
      {props.boat && (
        <div className="sdk-beach-prop sdk-beach-boat" style={{ left: props.boat.x - 27 * k, top: props.boat.y - 40 * k, width: 54 * k, height: 50 * k }}>
          <Boat />
        </div>
      )}
      {props.umbrella && (
        <div className="sdk-beach-prop" style={{ left: props.umbrella.x - 130 * k, top: props.umbrella.y - 150 * k, width: 260 * k, height: 200 * k }}>
          <Umbrella />
        </div>
      )}
      {mode === "wide" && (
        <span className="sdk-beach-cone" style={{ ...at(fry), fontSize: fry.s }}>
          🍟
        </span>
      )}
      {props.bucket && (
        <div className="sdk-beach-prop" style={{ left: props.bucket.x - 28 * props.bucket.s, top: props.bucket.y - 25 * props.bucket.s, width: 56 * props.bucket.s, height: 50 * props.bucket.s }}>
          <Bucket />
        </div>
      )}
      {shells.map((s, i) => (
        <div key={`s${i}`} className="sdk-beach-prop" style={at(s)}>
          <Shell />
        </div>
      ))}
      {starfish.map((s, i) => (
        <div key={`f${i}`} className="sdk-beach-prop" style={{ ...at(s), rotate: `${i * 23 - 12}deg` }}>
          <Starfish />
        </div>
      ))}
    </>
  );
});

/** Clouds and far-off gulls by day; stars and a shooting star by night. */
const SkyLife = memo(function SkyLife({ layout }: { layout: BeachLayout }) {
  const { clouds, gulls, stars, shooting, W } = layout;
  return (
    <>
      {clouds.map((c, i) => (
        <div key={i} className="sdk-beach-cloud sdk-beach-day" style={{ ...at(c, c.s * 0.42), "--i": i } as CSSProperties}>
          <Cloud />
        </div>
      ))}
      {gulls.map((g, i) => (
        <div
          key={i}
          className="sdk-beach-glide sdk-beach-day"
          style={{ top: g.y, width: g.s, height: g.s * 0.45, "--sdk-beach-travel": `${W + g.s * 2 + 40}px`, animationDelay: `${g.delay}s` } as CSSProperties}
        >
          <FarGull />
        </div>
      ))}
      {[0, 1, 2].map((group) => (
        <div key={group} className="sdk-beach-stars sdk-beach-night" data-group={group}>
          {stars
            .filter((s) => s.group === group)
            .map((s, i) => (
              <i key={i} style={at(s)} />
            ))}
        </div>
      ))}
      <i className="sdk-beach-shooting sdk-beach-night" style={{ left: shooting.x, top: shooting.y, width: shooting.s }} />
    </>
  );
});

/** The hermit crab: it pops up and cheers a finished box, huffs at the thieving gull, dances at a win. */
function CrabSpot({ spot, cheer, huff, dance }: { spot: Spot; cheer: number | null; huff: number | null; dance: boolean }) {
  return (
    <div className="sdk-beach-crab" style={at(spot)}>
      <div key={cheer ?? 0} className="sdk-beach-crab-pop" data-cheer={cheer !== null ? "" : undefined}>
        <div key={huff ?? 0} className="sdk-beach-crab-act" data-huff={huff !== null ? "" : undefined} data-dance={dance ? "" : undefined}>
          <Crab />
        </div>
      </div>
    </div>
  );
}

const CREATURES = ["🐟", "🐠", "🐡", "🐙", "🦑", "🐬", "🐳"];

/** Seven Seas: rings spread from the shell in the title, then seven sea creatures leap one by one. */
function SevenSeas({ layout }: { layout: BeachLayout }) {
  const { seas, leap, emblem } = layout;
  return (
    <div className="sdk-beach-seas" style={{ "--sdk-beach-leap": `${-leap}px` } as CSSProperties}>
      {[0, 1, 2].map((i) => (
        <i key={i} className="sdk-beach-ripple" style={{ left: emblem.x, top: emblem.y, "--i": i } as CSSProperties} />
      ))}
      {CREATURES.map((c, i) => (
        <span key={c} className="sdk-beach-leap" style={{ left: seas[i].x, top: seas[i].y, fontSize: seas[i].s, "--i": i } as CSSProperties}>
          <i className="sdk-beach-splash" />
          <span className="sdk-beach-creature">{c}</span>
        </span>
      ))}
    </div>
  );
}

export function BeachBackdrop({ boxes, filled, beat, cue }: SceneProps) {
  const layout = useBeachLayout();
  const live = useSurprise(cue);
  const fresh = useFreshBeat(beat);
  if (!layout) return null;

  const units = fresh && (fresh.kind === "place" || fresh.kind === "hint" || fresh.kind === "win") ? fresh.units : [];
  const patMask = units.reduce((mask, u) => (u.kind === "box" ? mask | (1 << u.index) : mask), 0);
  const patToken = patMask && fresh ? fresh.token : 0;
  const won = fresh?.kind === "win";
  const deal = fresh?.kind === "deal" ? fresh.token : null;
  const wash = won ? "tide" : deal !== null ? "surge" : units.some((u) => u.kind !== "box") ? "lap" : null;
  // The sun rises from morning (a quarter full) to noon (full).
  const t = Math.min(1, Math.max(0, (filled - 0.25) / 0.75));
  const playing = (surprise: string) => (live?.surprise === surprise ? live.token : null);
  const seas = playing("seven-seas");

  return (
    <div className="sdk-beach-scene" data-mode={layout.mode} data-swoop={playing("gull-swoop") !== null ? "" : undefined}>
      <Sky horizon={layout.horizon} />
      <Sun sun={layout.sun} t={t} wink={fresh?.kind === "hint" ? fresh.token : null} />
      <Shore layout={layout} />
      {fresh && wash && <i key={fresh.token} className="sdk-beach-wash" data-kind={wash} style={{ top: layout.shore - 14 }} />}
      <SkyLife layout={layout} />
      {seas !== null && <SevenSeas key={seas} layout={layout} />}
      {layout.castle && (
        <Castle box={layout.castle} boxes={boxes} patMask={patMask} patToken={patToken} deal={deal} won={won} towers={playing("towers")} />
      )}
      {layout.crab && <CrabSpot spot={layout.crab} cheer={patToken || null} huff={playing("gull-swoop")} dance={won && boxes === 511} />}
    </div>
  );
}
