"use client";

import { memo } from "react";

// The cove's little drawings, as inline SVG coloured by the stylesheet (each scheme's tokens), so
// one drawing serves day and night. Night-only parts carry .sdk-beach-night, day-only .sdk-beach-day.

/** The hermit crab, half out of its burrow (viewBox 24×24). */
export const Crab = memo(function Crab() {
  return (
    <svg className="sdk-beach-crab-art" viewBox="0 0 24 24" aria-hidden>
      <ellipse className="sdk-beach-hole" cx="12" cy="19.2" rx="10" ry="3.2" />
      <path className="sdk-beach-legs" d="M4.5 13.5 L1.2 16.4 M5.2 15.6 L2.6 18.8 M19.5 13.5 L22.8 16.4 M18.8 15.6 L21.4 18.8" />
      <g className="sdk-beach-claw" data-side="left">
        <path d="M6 12 Q1.6 10.4 2.4 6 Q4.8 5.8 5.8 8.6 Q4.2 8.6 4.4 7.4" />
      </g>
      <g className="sdk-beach-claw" data-side="right">
        <path d="M18 12 Q22.4 10.4 21.6 6 Q19.2 5.8 18.2 8.6 Q19.8 8.6 19.6 7.4" />
      </g>
      <ellipse className="sdk-beach-crab-body" cx="12" cy="14.2" rx="7.6" ry="5" />
      <path className="sdk-beach-crab-stalk" d="M9.6 10.2 L9.1 6.8 M14.4 10.2 L14.9 6.8" />
      <g className="sdk-beach-eyes">
        <circle cx="9" cy="6.2" r="1.7" fill="#fff" />
        <circle cx="15" cy="6.2" r="1.7" fill="#fff" />
        <circle cx="9.3" cy="6.4" r="0.85" fill="#1a2430" />
        <circle cx="15.3" cy="6.4" r="0.85" fill="#1a2430" />
      </g>
      <path className="sdk-beach-crab-mouth" d="M10 16.2 Q12 17.4 14 16.2" />
    </svg>
  );
});

/** A far-off gull: two arcs (viewBox 20×9); its wings beat by scaling. */
export function FarGull() {
  return (
    <svg className="sdk-beach-fargull" viewBox="0 0 20 9" aria-hidden>
      <path d="M1 7 Q5 1 10 6 Q15 1 19 7" />
    </svg>
  );
}

/**
 * The gull that swoops in, side on, flying left (viewBox 52×30): a short square tail (a forked one
 * read as a fish), its wings beating about the shoulder but never folding flat.
 */
export function SwoopGull() {
  return (
    <svg className="sdk-beach-swoopgull" viewBox="0 0 52 30" aria-hidden>
      <path className="sdk-beach-wing sdk-beach-wing-far" d="M25 14 Q28 6 35 2.5 L41 0 Q37 6 33 9.5 Q30.5 12 30 15.5 Z" />
      <path className="sdk-beach-gull-body" d="M37 15.4 L46.6 14.6 Q47.8 17.4 46.6 20.2 L37 19.6 Z" />
      <path className="sdk-beach-gull-body" d="M4.8 17.2 Q6.4 12.4 11.6 12 Q16 11.6 20 13.2 Q30 12.6 40 15 Q42.2 17.4 40 19.6 Q30 22.2 18 21.2 Q8.8 21.2 4.8 17.2 Z" />
      <path className="sdk-beach-gull-beak" d="M5.4 15.9 L0.6 17.3 L5.6 18.3 Z" />
      <circle className="sdk-beach-gull-eye" cx="9.7" cy="14.9" r="1" />
      <path className="sdk-beach-wing" d="M17.5 15.5 Q20 7.5 27 4.5 L46 -2.5 Q40.5 4 35 6.8 Q30 9.6 28.5 16.5 Z" />
      <path className="sdk-beach-wing sdk-beach-wing-tip" d="M46 -2.5 Q43.4 0.6 40.2 3 L37.4 1.6 Z" />
    </svg>
  );
}

/** A storybook cloud (viewBox 50×21). */
export function Cloud() {
  return (
    <svg className="sdk-beach-cloud-art" viewBox="0 0 50 21" aria-hidden>
      <path d="M6 20 Q0 20 1 15 Q2 10 8 11 Q9 4 17 4 Q22 0 28 4 Q36 1 39 9 Q48 8 49 15 Q50 20 44 20 Z" />
    </svg>
  );
}

/** A scallop shell (viewBox 20×20). */
export function Shell() {
  return (
    <svg className="sdk-beach-shell-art" viewBox="0 0 20 20" aria-hidden>
      <path d="M10 18 L2 8 Q10 0 18 8 Z" />
      <path className="sdk-beach-ribs" d="M10 18 L6 5 M10 18 L10 3 M10 18 L14 5 M10 18 L3.6 9 M10 18 L16.4 9" />
    </svg>
  );
}

/** A starfish (viewBox 20×20). */
export function Starfish() {
  return (
    <svg className="sdk-beach-starfish-art" viewBox="0 0 20 20" aria-hidden>
      <path d="M10 1 L12.6 7.4 L19.3 7.6 L14 11.7 L15.9 18.3 L10 14.5 L4.1 18.3 L6 11.7 L0.7 7.6 L7.4 7.4 Z" />
    </svg>
  );
}

/** The lighthouse on its rock, lamp lit at night with a beam that sweeps (viewBox 60×96). */
export function Lighthouse() {
  return (
    <svg className="sdk-beach-lighthouse" viewBox="0 0 60 96" aria-hidden>
      <defs>
        <linearGradient id="sdk-beach-beam" x1="30" y1="0" x2="230" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0" className="sdk-beach-beam-in" />
          <stop offset="1" className="sdk-beach-beam-out" />
        </linearGradient>
      </defs>
      <path className="sdk-beach-beam sdk-beach-night" d="M30 17 L230 -16 L230 46 Z" fill="url(#sdk-beach-beam)" />
      <path className="sdk-beach-rock" d="M4 92 Q14 78 30 78 Q46 78 56 92 Z" />
      <path className="sdk-beach-tower" d="M21 80 L24 22 L36 22 L39 80 Z" />
      <path className="sdk-beach-tower-stripe" d="M22.4 52 L37.6 52 L38.2 64 L21.8 64 Z M23.4 32 L36.6 32 L37 42 L23 42 Z" />
      <rect className="sdk-beach-lamp" x="22" y="12" width="16" height="10" rx="2" />
      <path className="sdk-beach-tower-stripe" d="M20 12 L30 4 L40 12 Z" />
    </svg>
  );
}

/** A little sailboat, its masthead lamp lit at night (viewBox 54×50). */
export function Boat() {
  return (
    <svg className="sdk-beach-boat-art" viewBox="0 0 54 50" aria-hidden>
      <path className="sdk-beach-sail" d="M26 3 L26 36 L6 36 Z" />
      <path className="sdk-beach-sail" d="M29 9 L29 36 L46 36 Z" opacity="0.85" />
      <path className="sdk-beach-hull" d="M4 38 L50 38 L44 46 L10 46 Z" />
      <circle className="sdk-beach-masthead sdk-beach-night" cx="26" cy="3" r="6" />
      <circle className="sdk-beach-lamp-dot sdk-beach-night" cx="26" cy="3" r="2" />
    </svg>
  );
}

/** A striped umbrella over a towel (viewBox 260×200). */
export function Umbrella() {
  return (
    <svg className="sdk-beach-umbrella" viewBox="0 0 260 200" aria-hidden>
      <path className="sdk-beach-shade" d="M60 168 Q140 140 236 176 Q150 206 60 168 Z" />
      <path className="sdk-beach-towel" d="M40 170 L190 150 L230 185 L70 205 Z" />
      <path className="sdk-beach-towel-stripe" d="M62 167 L212 147 L218 152 L68 172 Z M90 194 L224 176 L229 181 L94 199 Z" />
      <line className="sdk-beach-pole" x1="130" y1="40" x2="140" y2="180" />
      <path className="sdk-beach-stripe-b" d="M40 60 Q130 -10 220 40 Q205 52 190 50 Q175 62 160 56 Q145 68 130 62 Q115 70 100 64 Q85 72 70 66 Q55 72 40 60 Z" />
      <path className="sdk-beach-stripe-a" d="M130 14 Q100 30 70 66 Q85 72 100 64 Q115 40 130 14 Z M130 14 Q140 40 160 56 Q175 62 190 50 Q170 25 130 14 Z M130 14 Q50 22 40 60 Q55 72 70 66 Z" />
      <circle className="sdk-beach-stripe-a" cx="130" cy="13" r="3" />
    </svg>
  );
}

/** A bucket and spade (viewBox 56×50). */
export function Bucket() {
  return (
    <svg className="sdk-beach-bucket" viewBox="0 0 56 50" aria-hidden>
      <path className="sdk-beach-bucket-body" d="M6 14 L12 46 L34 46 L40 14 Z" />
      <ellipse className="sdk-beach-bucket-rim" cx="23" cy="14" rx="17" ry="4" />
      <path className="sdk-beach-handle" d="M8 16 Q23 -6 38 16" />
      <path className="sdk-beach-spade-handle" d="M44 46 L50 8" />
      <path className="sdk-beach-spade" d="M47 18 L53 18 L52 4 L48 4 Z" />
    </svg>
  );
}

/** A feather drifting down (viewBox 10×16). */
export function Feather() {
  return (
    <svg className="sdk-beach-feather-art" viewBox="0 0 10 16" aria-hidden>
      <path d="M5 1 Q9.5 6 5.4 15 Q0.5 7 5 1 Z" />
      <path className="sdk-beach-quill" d="M5 3 L5.2 15" />
    </svg>
  );
}
