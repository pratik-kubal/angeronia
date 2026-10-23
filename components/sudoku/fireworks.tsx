"use client";

import { memo, type CSSProperties } from "react";
import { mulberry32 } from "@/lib/random";

const SPARKS = 36;

/**
 * Number fireworks over a solved board: digits burst from the board's middle, spin and drift away,
 * each in its own digit's colour; every other spark is one of the theme's glyphs when it has some,
 * glowing in its four spark colours in turn. Seeded by the burst's token, so a re-render keeps every
 * spark in place.
 */
export const Fireworks = memo(function Fireworks({ token, glyphs }: { token: number; glyphs: readonly string[] }) {
  const rng = mulberry32(token * 9973);
  return (
    <div className="sdk-fireworks" aria-hidden>
      {Array.from({ length: SPARKS }, (_, k) => {
        const angle = rng() * Math.PI * 2;
        const distance = 90 + rng() * 170;
        const glyph = glyphs.length > 0 && k % 2 === 1;
        const digit = (k % 9) + 1;
        const style = {
          "--x": `${30 + rng() * 40}%`,
          "--y": `${30 + rng() * 40}%`,
          "--dx": `${Math.round(Math.cos(angle) * distance)}px`,
          "--dy": `${Math.round(Math.sin(angle) * distance - 60)}px`,
          "--rot": `${Math.round((rng() - 0.5) * 540)}deg`,
          "--size": `${Math.round(16 + rng() * 22)}px`,
          "--delay": `${Math.round(500 + rng() * 450)}ms`,
          // Glyphs are the odd sparks: count them, not k, so all four colours come round.
          "--c": glyph ? `var(--spark-${(Math.floor(k / 2) % 4) + 1})` : `var(--d${digit})`,
        } as CSSProperties;
        return (
          <span key={k} style={style} data-glyph={glyph ? "" : undefined}>
            {glyph ? glyphs[Math.floor(k / 2) % glyphs.length] : digit}
          </span>
        );
      })}
    </div>
  );
});
