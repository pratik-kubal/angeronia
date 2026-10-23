"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { mulberry32 } from "@/lib/random";
import type { SceneProps } from "../types";
import { BeeShape, PetalShape, StarShape, SwallowShape } from "./art";
import { pointAlong, type Garden } from "./garden";
import { useFresh, useGarden } from "./use-garden";

// Blossom's surprises, over the game (never taking a tap), each gone within 2.5 s: the swallows'
// return when the season comes in, a petal shower, a rainbow over the board and a bee visiting
// every flower. Under reduced motion each is one still frame, for a moment.

const CUE_MS = 2600;
const STILL_MS = 1600;
/** The swallow's swoop, and where along it (0–1) it lets a petal go. */
const SWOOP_MS = 2000;
const RELEASES = [0.2, 0.3, 0.4, 0.5, 0.6, 0.7];
/** sdkBlossomSwoop's timing (blossom.css): cubic-bezier(0.42, 0.05, 0.45, 1). */
const SWOOP_EASE = [0.42, 0.05, 0.45, 1] as const;

const bezier = (a: number, b: number, s: number) => 3 * a * (1 - s) ** 2 * s + 3 * b * (1 - s) * s * s + s ** 3;

/** The time (0–1) at which the eased swoop has covered `f` of its path, so a petal leaves from the bird. */
function swoopTime(f: number): number {
  const [x1, y1, x2, y2] = SWOOP_EASE;
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 30; i++) {
    const s = (lo + hi) / 2;
    if (bezier(y1, y2, s) < f) lo = s;
    else hi = s;
  }
  return bezier(x1, x2, (lo + hi) / 2);
}

function useReduced(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  return reduced;
}

const px = (n: number) => `${Math.round(n * 10) / 10}px`;
const path = (d: string) => `path("${d}")`;

function Arrive({ garden, still }: { garden: Garden; still: boolean }) {
  const { swallow, branch } = garden;
  const perch = branch.perch;
  return (
    <>
      <span
        className="sdk-blossom-swallow"
        style={
          still
            ? ({
                "--size": px(swallow.size),
                translate: `${px(perch.x - swallow.size / 2)} ${px(perch.y - swallow.size * 0.55)}`,
              } as CSSProperties)
            : ({
                "--size": px(swallow.size),
                offsetPath: path(swallow.d),
              } as CSSProperties)
        }
      >
        <SwallowShape />
      </span>
      {!still &&
        RELEASES.map((f, k) => {
          const at = pointAlong(swallow.segs, f);
          return (
            <span
              key={k}
              className="sdk-blossom-release"
              style={
                {
                  "--x": px(at.x),
                  "--y": px(at.y + 6),
                  "--d": `${Math.round(swoopTime(f) * SWOOP_MS)}ms`,
                  "--sway": `${k % 2 ? 18 : -16}px`,
                } as CSSProperties
              }
            >
              <PetalShape deep={k % 2 === 1} />
            </span>
          );
        })}
    </>
  );
}

/** Eighteen petals across the whole screen, seeded by the cue so a re-render keeps them in place. */
function Shower({ garden, token, still }: { garden: Garden; token: number; still: boolean }) {
  const rng = mulberry32(token * 7919);
  return (
    <>
      {Array.from({ length: 18 }, (_, k) => {
        const x = garden.width * (0.04 + rng() * 0.92);
        const size = 10 + rng() * 5;
        const style = {
          "--x": px(x),
          "--size": px(size),
          "--rest": px(garden.height * (0.06 + rng() * 0.88)),
          "--from": px(-20 - rng() * garden.height * 0.12),
          "--d": `${Math.round(rng() * 400)}ms`,
          "--dur": `${Math.round(1500 + rng() * 600)}ms`,
          "--sway": px((rng() < 0.5 ? -1 : 1) * (10 + rng() * 30)),
          "--spin": `${Math.round((rng() < 0.5 ? -1 : 1) * (360 + rng() * 360))}deg`,
        } as CSSProperties;
        return (
          <span key={k} className="sdk-blossom-shower" data-still={still ? "" : undefined} style={style}>
            <PetalShape deep={k % 3 === 0} />
          </span>
        );
      })}
    </>
  );
}

/** The tops of the pad's keys 1–7 (their faces), in px from the shell's top-left, wherever the pad has put them. */
function keyTops(): { digit: number; x: number; y: number }[] {
  const shell = document.querySelector(".sdk-shell");
  if (!shell) return [];
  const s = shell.getBoundingClientRect();
  return [1, 2, 3, 4, 5, 6, 7].flatMap((digit) => {
    const face = document.querySelector(`.sdk-key[data-digit="${digit}"] .sdk-key-face`);
    if (!face) return [];
    const r = face.getBoundingClientRect();
    return [{ digit, x: r.left - s.left + r.width / 2, y: r.top - s.top + 4 }];
  });
}

function Rainbow({ garden }: { garden: Garden }) {
  const { cx, cy, r, band } = garden.bow;
  // Read once, as the rainbow starts (the overlay only ever renders in the browser).
  const [keys] = useState(keyTops);
  const arc = (radius: number) => `M${cx - radius} ${cy}A${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`;
  return (
    <>
      <svg className="sdk-blossom-bow" viewBox={`0 0 ${garden.width} ${garden.height}`} preserveAspectRatio="none" aria-hidden>
        {/* The feet fade into the air rather than stopping short. */}
        <defs>
          <linearGradient id="sdk-blossom-bow-fade" gradientUnits="userSpaceOnUse" x1={0} y1={cy - r * 0.42} x2={0} y2={cy}>
            <stop offset="0%" stopColor="#fff" />
            <stop offset="100%" stopColor="#fff" stopOpacity={0} />
          </linearGradient>
          <mask id="sdk-blossom-bow-mask" maskUnits="userSpaceOnUse" x={0} y={0} width={garden.width} height={garden.height}>
            <rect width={garden.width} height={garden.height} fill="url(#sdk-blossom-bow-fade)" />
          </mask>
        </defs>
        <g mask="url(#sdk-blossom-bow-mask)">
          <path d={arc(r - band * 3.5)} pathLength={1} className="sdk-blossom-moonbow" style={{ strokeWidth: band * 9 }} />
          {Array.from({ length: 7 }, (_, k) => (
            <path
              key={k}
              d={arc(r - (k + 0.5) * band)}
              pathLength={1}
              className="sdk-blossom-band"
              style={
                {
                  "--k": k,
                  stroke: `var(--sdk-blossom-bow-${k + 1})`,
                  strokeWidth: band + 0.6,
                } as CSSProperties
              }
            />
          ))}
        </g>
      </svg>
      {/* A mote from each of the keys 1–7, in the countdown's order: the 7 first. */}
      {keys.map((key) => (
        <span
          key={key.digit}
          className="sdk-blossom-mote"
          style={
            {
              "--x": px(key.x),
              "--y": px(key.y),
              "--k": 7 - key.digit,
              background: `var(--sdk-blossom-bow-${key.digit})`,
            } as CSSProperties
          }
        />
      ))}
      <span
        className="sdk-blossom-ride"
        style={
          {
            "--x": px(cx),
            "--y": px(cy),
            "--r": px(r - band / 2),
          } as CSSProperties
        }
      >
        <i>
          <StarShape />
        </i>
      </span>
    </>
  );
}

function Bee({ garden, still }: { garden: Garden; still: boolean }) {
  const { bee } = garden;
  // Still, it hovers where its flight passes over the middle flower (upright, clear of the board).
  const rest = pointAlong(bee.segs, bee.visits[4]);
  return (
    <>
      <svg className="sdk-blossom-trail" viewBox={`0 0 ${garden.width} ${garden.height}`} preserveAspectRatio="none" aria-hidden>
        <path d={bee.d} />
      </svg>
      <span
        className="sdk-blossom-bee"
        style={
          still
            ? ({
                "--size": px(bee.size),
                translate: `${px(rest.x - bee.size / 2)} ${px(rest.y - (bee.size * 20) / 48)}`,
              } as CSSProperties)
            : ({
                "--size": px(bee.size),
                offsetPath: path(bee.d),
              } as CSSProperties)
        }
      >
        <BeeShape />
      </span>
    </>
  );
}

export function BlossomOverlay({ cue }: SceneProps) {
  const garden = useGarden();
  const shown = useFresh(cue, CUE_MS, STILL_MS);
  const still = useReduced();
  if (!garden || !shown) return null;
  return (
    <div key={shown.token} className="sdk-blossom-fx" data-surprise={shown.surprise} style={{ "--fall": px(garden.height + 40) } as CSSProperties}>
      {shown.surprise === "arrive" && <Arrive garden={garden} still={still} />}
      {shown.surprise === "petal-shower" && <Shower garden={garden} token={shown.token} still={still} />}
      {shown.surprise === "rainbow" && <Rainbow garden={garden} />}
      {shown.surprise === "bumblebee" && <Bee garden={garden} still={still} />}
    </div>
  );
}
