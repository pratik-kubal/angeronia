"use client";

import { memo, useId } from "react";
import { moonPath } from "./layout";

/** An id for a gradient or clip path, plain enough for url(#…) whatever React's ids look like. */
export const useSvgId = () => `sdk-halloween-${useId().replace(/[^\w-]/g, "")}`;

// The Halloween scene's drawings, as inline SVG coloured by the theme's tokens (so one drawing
// serves the day and the night). All static: whatever moves is animated by halloween.css.

/** A carved face: triangles and a toothy grin, crescent eyes and a smile, or a wink. */
export type Face = "classic" | "happy" | "wink";

const FACES: Record<Face, string[]> = {
  classic: [
    "M9.6 15.6h3.8l-1.9-3.4z",
    "M18.6 15.6h3.8l-1.9-3.4z",
    "M15 19h2l-1-1.8z",
    "M8.4 20.6c2.4 5 12.8 5 15.2 0l-2 .8-.9 1.3-1.4-1-1.5 1.5-1.8-1.3-1.8 1.3-1.5-1.5-1.4 1-.9-1.3z",
  ],
  happy: ["M9.2 15.6q2.2-3.6 4.4 0q-2.2-1.6-4.4 0z", "M18.4 15.6q2.2-3.6 4.4 0q-2.2-1.6-4.4 0z", "M15 19h2l-1-1.8z", "M8.8 20q7.2 7 14.4 0q-7.2 3.2-14.4 0z"],
  wink: ["M9.6 15.6h3.8l-1.9-3.4z", "M18.4 14.2h4.2v1.4h-4.2z", "M15 19h2l-1-1.8z", "M9.4 20.4q6.6 5.6 13.6-1q-6.4 3.4-13.6 1z"],
};

/** A pumpkin, 32×30: ribs, a stem and a curl of vine; its face shows once it's carved (halloween.css). */
export const PumpkinArt = memo(function PumpkinArt({ face }: { face: Face }) {
  return (
    <svg viewBox="0 0 32 30" aria-hidden>
      <path d="M17 5.6c1.6-2.6 4.6-3.2 6.6-1.6" fill="none" stroke="var(--sdk-halloween-vine)" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M14.6 7.4c.2-2.6.9-4.6 2.6-5.8l1.5 1.3c-1.1.9-1.6 2.5-1.6 4.5z" fill="var(--sdk-halloween-stem)" />
      <ellipse cx="9.6" cy="18.6" rx="8.4" ry="10" fill="var(--sdk-halloween-rib)" />
      <ellipse cx="22.4" cy="18.6" rx="8.4" ry="10" fill="var(--sdk-halloween-rib)" />
      <ellipse cx="16" cy="18.4" rx="8.4" ry="10.8" fill="var(--sdk-halloween-pumpkin)" />
      <g className="sdk-halloween-face" fill="var(--sdk-halloween-face)">
        {FACES[face].map((d) => (
          <path key={d} d={d} />
        ))}
      </g>
    </svg>
  );
});

/** Boo, the shy ghost, 32×36; `wave` raises a hand. */
export const GhostArt = memo(function GhostArt({ wave = false }: { wave?: boolean }) {
  return (
    <svg viewBox="0 0 32 36" aria-hidden>
      {wave && (
        <path
          className="sdk-halloween-arm"
          d="M26.6 18.4c3-1 4.6-3.6 4-6.6"
          fill="none"
          stroke="var(--sdk-halloween-ghost)"
          strokeWidth="3.4"
          strokeLinecap="round"
        />
      )}
      <path
        d="M16 2.5C9 2.5 4.5 7.8 4.5 14.8V31c1.9 2.6 3.8 2.6 5.7 0 1.9 2.6 3.8 2.6 5.8 0 1.9 2.6 3.8 2.6 5.8 0 1.9 2.6 3.8 2.6 5.7 0V14.8C27.5 7.8 23 2.5 16 2.5z"
        fill="var(--sdk-halloween-ghost)"
        stroke="var(--sdk-halloween-ghost-edge)"
        strokeWidth="1"
      />
      <g fill="var(--sdk-halloween-ghost-ink)">
        <ellipse cx="12.2" cy="15" rx="1.7" ry="2.3" />
        <ellipse cx="19.8" cy="15" rx="1.7" ry="2.3" />
      </g>
      <ellipse cx="9.4" cy="19.2" rx="2" ry="1.1" fill="var(--sdk-halloween-blush)" opacity=".6" />
      <ellipse cx="22.6" cy="19.2" rx="2" ry="1.1" fill="var(--sdk-halloween-blush)" opacity=".6" />
      <ellipse cx="16" cy="19.8" rx="1.3" ry="1.6" fill="var(--sdk-halloween-ghost-ink)" />
    </svg>
  );
});

/** A bat in flight, 40×20, with two little glowing eyes (that's what keeps a night bat cute). */
export const BatArt = memo(function BatArt() {
  return (
    <svg viewBox="0 0 40 20" aria-hidden>
      <g fill="var(--sdk-halloween-bat)">
        <path d="M20 5.5c-1.9 0-3.1 2-3.1 4.4 0 2.9 1.5 5.1 3.1 5.1s3.1-2.2 3.1-5.1c0-2.4-1.2-4.4-3.1-4.4z" />
        <path d="M17.9 6.6l.2-3.2 1.4 2.4zM22.1 6.6l-.2-3.2-1.4 2.4z" />
        <path d="M17.2 9.2C13.6 4.6 7.8 3.4 1.6 6c3 1 4.2 3 4.3 5.2 2-1.4 4-1 5 1 1.5-1.4 3.9-1 5.9.6z" />
        <path d="M22.8 9.2c3.6-4.6 9.4-5.8 15.6-3.2-3 1-4.2 3-4.3 5.2-2-1.4-4-1-5 1-1.5-1.4-3.9-1-5.9.6z" />
      </g>
      <circle cx="19" cy="9" r=".8" fill="var(--sdk-halloween-bat-eye)" />
      <circle cx="21" cy="9" r=".8" fill="var(--sdk-halloween-bat-eye)" />
    </svg>
  );
});

/** A bat asleep upside down, wrapped in its wings, 16×24 (hanging from its feet at the top). */
export const SleepyBatArt = memo(function SleepyBatArt() {
  return (
    <svg viewBox="0 0 16 24" aria-hidden>
      <path d="M6.4 0v3M9.6 0v3" stroke="var(--sdk-halloween-bat)" strokeWidth="1" strokeLinecap="round" />
      <path d="M8 2.4C3.6 2.4 1.6 7 2.2 12.4c.4 3.6 2.2 6.4 5.8 6.4s5.4-2.8 5.8-6.4C14.4 7 12.4 2.4 8 2.4z" fill="var(--sdk-halloween-bat)" />
      <path d="M5 17.6l-.6 3.6 2.4-2.2zM11 17.6l.6 3.6-2.4-2.2z" fill="var(--sdk-halloween-bat)" />
      <path d="M6 15.6q.8.8 1.6 0M8.6 15.6q.8.8 1.6 0" fill="none" stroke="var(--sdk-halloween-bat-eye)" strokeWidth=".6" strokeLinecap="round" />
      <path d="M8 4.6v9" stroke="var(--sdk-halloween-tree)" strokeWidth=".5" opacity=".5" />
    </svg>
  );
});

/** A candy corn, 20×22: white tip, orange middle, yellow base. */
export function CandyCornArt() {
  const id = useSvgId();
  return (
    <svg viewBox="0 0 20 22" aria-hidden>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0.32" stopColor="var(--sdk-halloween-candy-tip)" />
          <stop offset="0.32" stopColor="var(--sdk-halloween-candy-mid)" />
          <stop offset="0.64" stopColor="var(--sdk-halloween-candy-mid)" />
          <stop offset="0.64" stopColor="var(--sdk-halloween-candy-base)" />
        </linearGradient>
      </defs>
      <path d="M10 1C12 1 18.5 15 18.5 18c0 3.6-17 3.6-17 0C1.5 15 8 1 10 1z" fill={`url(#${id})`} />
    </svg>
  );
}

/**
 * The moon, lit `k` of the way from the right (its dark part faintly there), with craters on the
 * lit part only; a solved board gives it a sleepy smile.
 */
export const MoonArt = memo(function MoonArt({ k, smile }: { k: number; smile: boolean }) {
  const id = useSvgId();
  const lit = moonPath(k);
  return (
    <svg viewBox="-1 -1 2 2" aria-hidden>
      <defs>
        <clipPath id={id}>
          <path d={lit} />
        </clipPath>
        <radialGradient id={`${id}g`} cx="-0.24" cy="-0.28" r="1.3" gradientUnits="userSpaceOnUse">
          <stop offset="0.5" stopColor="var(--sdk-halloween-moon)" />
          <stop offset="1" stopColor="var(--sdk-halloween-moon-shade)" />
        </radialGradient>
      </defs>
      <circle r="1" fill="var(--sdk-halloween-moon-dark)" />
      <path d={lit} fill={`url(#${id}g)`} />
      <g clipPath={`url(#${id})`} fill="var(--sdk-halloween-moon-shade)" opacity=".6">
        <circle cx="-0.34" cy="-0.3" r=".2" />
        <circle cx="0.36" cy="0.2" r=".15" />
        <circle cx="-0.02" cy="-0.66" r=".09" />
        <circle cx="0.5" cy="-0.42" r=".08" />
        <circle cx="-0.5" cy="0.36" r=".1" />
      </g>
      {smile && (
        <g className="sdk-halloween-moon-face">
          <path d="M-0.42 -0.12q.15-.15 .3 0M0.12 -0.12q.15-.15 .3 0M-0.3 0.22q.3 .26 .6 0" fill="none" stroke="var(--sdk-halloween-moon-face)" strokeWidth=".08" strokeLinecap="round" />
          <ellipse cx="-0.5" cy="0.12" rx=".11" ry=".06" fill="var(--sdk-halloween-blush)" opacity=".55" />
          <ellipse cx="0.5" cy="0.12" rx=".11" ry=".06" fill="var(--sdk-halloween-blush)" opacity=".55" />
        </g>
      )}
    </svg>
  );
});

/**
 * The crooked cottage, 120×150: a clock in the attic stuck at 10:31 (Halloween's date, as a
 * time), two windows (a cat sits in one), an arched door that lights when the board is solved,
 * and a chimney.
 */
export const CottageArt = memo(function CottageArt() {
  // Clock hands at 10:31: the hour hand just past ten, the minute hand just past the half.
  const hour = ((10 + 31 / 60) * 30 * Math.PI) / 180;
  const minute = (31 * 6 * Math.PI) / 180;
  return (
    <svg viewBox="0 0 120 150" aria-hidden>
      <rect x="84" y="16" width="14" height="38" fill="var(--sdk-halloween-house)" />
      <path d="M14 150V62L4 66L58 8L114 60H104V150Z" fill="var(--sdk-halloween-house)" />
      <circle cx="58" cy="44" r="9" fill="var(--sdk-halloween-window)" />
      <path
        d={`M58 44L${(58 + 5 * Math.sin(hour)).toFixed(2)} ${(44 - 5 * Math.cos(hour)).toFixed(2)}M58 44L${(58 + 7.4 * Math.sin(minute)).toFixed(2)} ${(44 - 7.4 * Math.cos(minute)).toFixed(2)}`}
        stroke="var(--sdk-halloween-house-ink)"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <g fill="var(--sdk-halloween-window)">
        <rect x="28" y="80" width="20" height="24" rx="2.5" />
        <rect x="70" y="80" width="20" height="24" rx="2.5" />
      </g>
      <path d="M38 80v24M28 92h20M80 80v24M70 92h20" stroke="var(--sdk-halloween-house)" strokeWidth="1.6" />
      {/* A cat on the left sill: body, head, ears and a curl of tail. */}
      <path d="M31 104c0-4 1.6-6.6 4-7.4-.8-1.2-.9-3 .2-4l.4-1.8 1.2 1.3h1.6l1.2-1.3.4 1.8c1.1 1 1 2.8.2 4 2.4.8 4 3.4 4 7.4zM43 104c3 0 4.2-1.8 3.4-4" fill="var(--sdk-halloween-house-ink)" stroke="var(--sdk-halloween-house-ink)" strokeWidth=".8" strokeLinecap="round" />
      <path className="sdk-halloween-door" d="M50 150V128a9 9 0 0 1 18 0V150Z" fill="var(--sdk-halloween-house-ink)" />
    </svg>
  );
});

/** The curly bare tree, 160×420 (its foot at the bottom right): three branches, each curling at its tip. */
export const TreeArt = memo(function TreeArt() {
  return (
    <svg viewBox="0 0 160 420" aria-hidden>
      <g fill="none" stroke="var(--sdk-halloween-tree)" strokeLinecap="round">
        <path d="M86 236C66 214 44 206 28 190c-10-10-4-26 8-22" strokeWidth="7" />
        <path d="M85 206C80 160 88 128 76 96c-6-16-22-10-15 2" strokeWidth="5.5" />
        <path d="M88 216c12-38 38-46 46-74c4-12 14-16 18-8" strokeWidth="5" />
        <path d="M106 304c12-8 24-8 32-20" strokeWidth="4" />
      </g>
      <path d="M96 420c-2-86-8-160-16-218l12-2c10 58 22 130 32 220z" fill="var(--sdk-halloween-tree)" />
    </svg>
  );
});
