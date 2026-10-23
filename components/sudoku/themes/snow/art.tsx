"use client";

import { memo, useId, type CSSProperties } from "react";

// Snow Day's picture-book pieces, drawn in inline SVG and coloured by the theme's --sdk-snow-*
// tokens, so one drawing serves the day and the night. Each is memoised: the scene re-renders on
// every beat, and these only change with their own props.

/** A CSS custom property's value, for inline styles. */
export type Vars = CSSProperties & Record<`--${string}`, string | number>;

const CREAM = "#fff3e3";

/** A knitted mitten, cuff up (its cuff is pegged to the line); `yarn` is its wool. */
export const Mitten = memo(function Mitten({ yarn }: { yarn: string }) {
  return (
    <svg viewBox="0 0 14 18" width="100%" height="100%" aria-hidden>
      <path
        d="M2 4.6 H10 V7.3 C11.3 6.9 12.9 7.6 13 9 C13.1 10.4 11.9 11.7 10.3 12.5 L10 12.6 V13.2 C10 15.6 8.3 17.5 6 17.5 C3.7 17.5 2 15.6 2 13.2 Z"
        fill={yarn}
      />
      <path d="M2.8 10.6 l1.2 -1.2 l1.2 1.2 l1.2 -1.2 l1.2 1.2 l1.2 -1.2" stroke={CREAM} strokeWidth="0.8" fill="none" opacity="0.85" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="1.2" y="0.6" width="9.6" height="4.6" rx="1.4" fill={CREAM} />
      <path d="M3.2 1.3 V4.5 M5.2 1.3 V4.5 M7.2 1.3 V4.5 M9.2 1.3 V4.5" stroke={yarn} strokeWidth="0.55" opacity="0.45" />
    </svg>
  );
});

/** A six-armed snowflake, in currentColor. */
export const Crystal = memo(function Crystal() {
  return (
    <svg viewBox="-6 -6 12 12" width="100%" height="100%" aria-hidden>
      <g stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" fill="none">
        {[0, 60, 120, 180, 240, 300].map((a) => (
          <path key={a} d="M0 0 V-5.2 M0 -3.2 L-1.4 -4.4 M0 -3.2 L1.4 -4.4" transform={`rotate(${a})`} />
        ))}
      </g>
    </svg>
  );
});

/** A snowy spruce; `tone` picks its green. */
export const Pine = memo(function Pine({ tone }: { tone: 1 | 2 }) {
  return (
    <svg viewBox="0 0 64 100" width="100%" height="100%" aria-hidden>
      <rect x="29" y="84" width="6" height="16" fill="var(--sdk-snow-wood-2)" />
      <path d="M32 0 L50 30 H42 L58 56 H46 L64 86 H0 L18 56 H6 L22 30 H14 Z" fill={tone === 1 ? "var(--sdk-snow-pine)" : "var(--sdk-snow-pine-2)"} />
      <path
        d="M32 0 L42 17 C38 20 35 16 32 20 C29 16 26 20 22 17 Z M22 30 H42 L48 40 C42 44 38 38 32 42 C26 38 21 44 16 40 Z M18 56 H46 L53 67 C46 71 40 64 32 69 C24 64 18 71 11 67 Z"
        fill="var(--sdk-snow-ground)"
      />
    </svg>
  );
});

/** A small mug of cocoa (24×24), its band the mitten red. */
export const SmallMug = memo(function SmallMug() {
  return (
    <svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden>
      <path d="M16 11.5 h2.2 a3 3 0 0 1 0 6 H16" stroke="var(--sdk-snow-mug)" strokeWidth="1.8" fill="none" />
      <rect x="5" y="9" width="11.5" height="13" rx="2.6" fill="var(--sdk-snow-mug)" />
      <rect x="5" y="12.4" width="11.5" height="2.8" fill="var(--sdk-snow-knit)" />
      <ellipse cx="10.75" cy="9.4" rx="5.2" ry="1.3" fill="var(--sdk-snow-cocoa)" />
    </svg>
  );
});

/** The window's nine panes, laid out like the board's boxes. */
const PANES = Array.from({ length: 9 }, (_, b) => ({ b, x: 42 + (b % 3) * 16, y: 88 + Math.floor(b / 3) * 13.67 }));

/**
 * The cabin on the left page. Its window has nine frosted panes, laid out like the board's boxes:
 * a pane clears when its box is finished, showing the warm room inside.
 */
export const Cabin = memo(function Cabin({ boxes }: { boxes: number }) {
  return (
    <svg viewBox="0 0 200 150" width="100%" height="100%" aria-hidden>
      <rect x="128" y="22" width="18" height="40" fill="var(--sdk-snow-wood-2)" />
      <path d="M125 23 Q137 13 149 23 Z" fill="var(--sdk-snow-ground)" />
      <rect x="30" y="72" width="140" height="74" fill="var(--sdk-snow-wood)" />
      <path d="M30 86 H170 M30 100 H170 M30 114 H170 M30 128 H170" stroke="var(--sdk-snow-wood-2)" strokeWidth="1.5" opacity="0.5" />
      <path d="M12 78 L100 24 L188 78 Z" fill="var(--sdk-snow-wood-2)" />
      <path
        d="M8 80 L100 18 L192 80 C186 88 180 80 174 86 C168 92 162 82 154 86 C146 90 140 82 132 84 L100 64 L68 84 C60 82 54 90 46 86 C38 82 32 92 26 86 C20 80 14 88 8 80 Z"
        fill="var(--sdk-snow-ground)"
      />
      <rect x="42" y="88" width="48" height="41" fill="var(--sdk-snow-room)" />
      <path d="M48 129 v-9 h7 v9 M70 129 c0 -6 3 -9 6 -9 s6 3 6 9" fill="var(--sdk-snow-room-2)" />
      {PANES.map(({ b, x, y }) => (
        <g key={b} className="sdk-snow-pane" data-clear={boxes & (1 << b) ? "" : undefined}>
          <rect x={x} y={y} width="16" height="13.67" fill="var(--sdk-snow-frost)" />
          <path d={`M${x + 3} ${y + 11} q3 -3 2.4 -8 M${x + 3} ${y + 11} q4.6 -1 8.6 -4.6 M${x + 5} ${y + 8} l-1.6 -1.6`} stroke="#ffffff" strokeWidth="0.8" fill="none" opacity="0.85" />
        </g>
      ))}
      <rect x="40" y="86" width="52" height="45" fill="none" stroke="var(--sdk-snow-wood-2)" strokeWidth="4" />
      <path d="M58 88 V129 M74 88 V129 M42 101.67 H90 M42 115.33 H90" stroke="var(--sdk-snow-wood-2)" strokeWidth="2" />
      <rect x="36" y="129" width="60" height="5" rx="2" fill="var(--sdk-snow-ground)" />
      <g transform="translate(76 116) scale(0.62)">
        <path d="M16 11.5 h2.2 a3 3 0 0 1 0 6 H16" stroke="var(--sdk-snow-mug)" strokeWidth="1.8" fill="none" />
        <rect x="5" y="9" width="11.5" height="13" rx="2.6" fill="var(--sdk-snow-mug)" />
        <rect x="5" y="12.4" width="11.5" height="2.8" fill="var(--sdk-snow-knit)" />
      </g>
      <rect x="110" y="94" width="34" height="52" rx="3" fill="var(--sdk-snow-door)" />
      <circle cx="137" cy="122" r="2.2" fill="#f0c36a" />
      <circle cx="127" cy="106" r="5" fill="var(--sdk-snow-room)" />
      <path d="M20 146 C60 136 140 136 186 146 Z" fill="var(--sdk-snow-ground)" />
    </svg>
  );
});

/** A red sled, waiting. */
export const Sled = memo(function Sled() {
  return (
    <svg viewBox="-4 0 74 30" width="100%" height="100%" aria-hidden>
      <path d="M4 14 H54 Q66 14 64 4" stroke="var(--sdk-snow-knit)" strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M6 22 H58 Q68 22 66 14" stroke="var(--sdk-snow-wood)" strokeWidth="2.5" fill="none" />
      <path d="M14 16 V22 M44 16 V22" stroke="var(--sdk-snow-wood)" strokeWidth="2.5" />
      <path d="M2 14 Q-3 24 1 29" stroke="var(--sdk-snow-cuff)" strokeWidth="1.2" fill="none" />
    </svg>
  );
});

/** The black-capped chickadee that lands on the line when the board is solved (asleep at night). */
export const Chickadee = memo(function Chickadee() {
  return (
    <svg viewBox="-4 0 24 16" width="100%" height="100%" aria-hidden>
      <path d="M2 8 L-3 6 L1 10 Z" fill="var(--sdk-snow-bird-wing)" />
      <ellipse cx="9" cy="8" rx="7.2" ry="5.6" fill="var(--sdk-snow-bird-belly)" />
      <path d="M3 6 Q8 2 14 6 Q11 11 4 10 Z" fill="var(--sdk-snow-bird-wing)" className="sdk-snow-bird-wing" />
      <g className="sdk-snow-bird-head">
        <circle cx="13" cy="4.6" r="4" fill="#f7f5f0" />
        <path d="M9.4 3.6 Q13 -0.6 16.9 3.8 Q13 2.6 9.4 3.6 Z" fill="#26262c" />
        <path d="M14.5 6.6 Q16 8.4 17.2 6.4 Z" fill="#26262c" />
        <circle className="sdk-snow-day" cx="14.4" cy="4.3" r="0.75" fill="#26262c" />
        <path className="sdk-snow-night" d="M13.6 4.4 q0.9 0.8 1.8 0" stroke="#26262c" strokeWidth="0.6" fill="none" />
        <path d="M16.8 4.6 L19 5 L16.8 5.6 Z" fill="#3a3a40" />
      </g>
      <path d="M8 13.4 V14.8 M11 13.4 V14.8" stroke="#6b5a48" strokeWidth="0.7" />
    </svg>
  );
});

type SnowmanProps = {
  /** Finished boxes: each adds a part, base to bobble hat. */
  stage: number;
  /** The stage the scene came up at: parts above it pop on as they arrive. */
  from: number;
  /** Before any box: a snowball rolling, growing as the board fills (0–1). */
  roll: number;
  /** The board is solved: he waves (`wave`: just now) with his right arm up. */
  done: boolean;
  wave: boolean;
};

/**
 * The snowman, built a part per finished box: base, body, head, a coal face, a carrot nose,
 * twig arms, a scarf, buttons and a bobble hat. Before the first box, a snowball rolls.
 */
export const Snowman = memo(function Snowman({ stage, from, roll, done, wave }: SnowmanProps) {
  const id = useId();
  const ball = `${id}-ball`;
  const part = (n: number) => ({ "data-pop": n > from ? "" : undefined });
  return (
    <svg viewBox="0 0 100 150" width="100%" height="100%" aria-hidden className="sdk-snow-snowman">
      <defs>
        <radialGradient id={ball} cx="38%" cy="32%" r="75%">
          <stop offset="0" stopColor="var(--sdk-snow-ball)" />
          <stop offset="0.62" stopColor="var(--sdk-snow-ball)" />
          <stop offset="1" stopColor="var(--sdk-snow-ball-shade)" />
        </radialGradient>
      </defs>
      <ellipse cx="50" cy="147" rx="34" ry="4" fill="var(--sdk-snow-ball-shade)" opacity="0.6" />
      {stage === 0 && (
        <>
          <path d="M6 146 Q22 141 34 146" stroke="var(--sdk-snow-ball-shade)" strokeWidth="5" fill="none" strokeLinecap="round" />
          <circle className="sdk-snow-roll" cx="42" cy="134" r="12" fill={`url(#${ball})`} style={{ "--roll": 0.45 + 0.55 * roll } as Vars} />
        </>
      )}
      {stage >= 1 && <circle {...part(1)} cx="50" cy="118" r="28" fill={`url(#${ball})`} />}
      {stage >= 2 && <circle {...part(2)} cx="50" cy="77" r="21" fill={`url(#${ball})`} />}
      {stage >= 6 && (
        <g {...part(6)} stroke="var(--sdk-snow-twig)" strokeWidth="2.6" strokeLinecap="round" fill="none">
          <path d="M33 74 L12 60 M18 64 L14 54" />
          {!done && <path d="M67 74 L88 60 M82 64 L86 54" />}
        </g>
      )}
      {done && (
        <g className="sdk-snow-arm" data-wave={wave ? "" : undefined} stroke="var(--sdk-snow-twig)" strokeWidth="2.6" strokeLinecap="round" fill="none">
          <path d="M67 74 L88 50 M80 58 L86 44" />
        </g>
      )}
      {stage >= 3 && <circle {...part(3)} cx="50" cy="44" r="15" fill={`url(#${ball})`} />}
      {stage >= 8 && (
        <g {...part(8)} fill="var(--sdk-snow-coal)">
          <circle cx="50" cy="71" r="2.2" />
          <circle cx="50" cy="80" r="2.2" />
          <circle cx="50" cy="89" r="2.2" />
        </g>
      )}
      {stage >= 7 && (
        <g {...part(7)}>
          <path d="M35 55 Q50 63 65 55 L66 61 Q50 69 34 61 Z" fill="var(--sdk-snow-knit)" />
          <path d="M58 60 L62 80 L55 79 L52 62 Z" fill="var(--sdk-snow-knit-shade)" />
          <path d="M38 58 V62 M44 59.5 V64 M50 60 V65 M56 59.5 V64 M62 58 V62" stroke={CREAM} strokeWidth="1" opacity="0.7" />
        </g>
      )}
      {stage >= 4 && (
        <g {...part(4)}>
          <circle cx="44.5" cy="41" r="1.9" fill="var(--sdk-snow-coal)" />
          <circle cx="55.5" cy="41" r="1.9" fill="var(--sdk-snow-coal)" />
          <path d="M44 49 Q50 53 56 49" stroke="var(--sdk-snow-coal)" strokeWidth="1.6" strokeDasharray="0.1 3" strokeLinecap="round" fill="none" />
        </g>
      )}
      {stage >= 5 && <path {...part(5)} d="M50 44 L64 46.5 L50 48.5 Z" fill="var(--sdk-snow-carrot)" />}
      {stage >= 9 && (
        <g className="sdk-snow-hat" data-drop={from < 9 ? "" : undefined}>
          <path d="M36 35 Q36 19 50 19 Q64 19 64 35 Z" fill="var(--sdk-snow-knit-2)" />
          <rect x="34" y="32" width="32" height="5" rx="2" fill={CREAM} />
          <circle cx="50" cy="17" r="5" fill={CREAM} />
        </g>
      )}
    </svg>
  );
});
