import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type React from "react";
import { ImageResponse } from "next/og";
import { hero, shareImage, type StatementLine } from "@/data/angeronia";

/**
 * The social card (ADR-026, ADR-031): the hero in one still, 1200 × 630. The
 * wordmark top left, the headline stepped across a 2px line at 38% of the
 * width ("One engineer," hanging, "screen | to server" crossing, the line
 * broken around it), and the city at the foot. Paper and ink; no mark.
 *
 * An image cannot read CSS, so the palette and the geometry are written out
 * here, each named after the token it copies from styles/tokens.css. The face
 * is Hanken Grotesk from `assets/og/` (OFL): the renderer reads TTF, not WOFF2.
 */
export const SOCIAL_CARD = { width: 1200, height: 630 } as const;

const PAPER = "#f1f1ef"; // --palette-paper
const INK = "#1c1c1c"; // --palette-ink
const INK_SOFT = "#5c5d58"; // --palette-ink-soft

const W = SOCIAL_CARD.width;
const H = SOCIAL_CARD.height;
const MARGIN = 56;
const AXIS = Math.round(W * 0.38); // --axis
const SPINE = 2; // --spine-width
const GAP = 18; // --spine-gap at its widest
const SIZE = 112; // the headline's size on the card
const LEADING = 0.9; // --leading-display
const TRACKING = -0.05; // --tracking-display, in em
const AIR = 0.14 * SIZE; // the line's air around crossing type (Spine's TYPE_AIR)
const TOP = 196; // the headline's first line box

const text = (line: StatementLine) => ("hang" in line ? line.hang : "push" in line ? line.push : "centre" in line ? line.centre : "");

export async function renderSocialCard() {
  const [regular, semibold] = await Promise.all([
    readFile(join(process.cwd(), "assets/og/hanken-grotesk-400.ttf")),
    readFile(join(process.cwd(), "assets/og/hanken-grotesk-600.ttf")),
  ]);

  const lineBox = SIZE * LEADING;
  const head = {
    position: "absolute" as const,
    fontSize: SIZE,
    fontWeight: 600,
    lineHeight: LEADING,
    letterSpacing: TRACKING * SIZE,
    color: INK,
    whiteSpace: "nowrap" as const,
  };

  // Each line's place on the axis, from the hero's own lines.
  const pieces: React.ReactNode[] = [];
  const breaks: [number, number][] = [];
  hero.lines.forEach((line, i) => {
    const top = TOP + i * lineBox;
    if ("cross" in line) {
      pieces.push(
        <div key={`${i}l`} style={{ ...head, top, right: W - AXIS + 0.05 * SIZE }}>
          {line.cross[0]}
        </div>,
        <div key={`${i}r`} style={{ ...head, top, left: AXIS + GAP }}>
          {line.cross[1]}
        </div>,
      );
      breaks.push([top - AIR, top + lineBox + AIR]);
    } else {
      pieces.push(
        <div key={i} style={{ ...head, top, left: AXIS + GAP }}>
          {text(line)}
        </div>,
      );
    }
  });

  // The line, in pieces between whatever crosses it.
  const segments: [number, number][] = [];
  let at = 0;
  for (const [a, b] of breaks) {
    if (a > at) segments.push([at, a]);
    at = Math.max(at, b);
  }
  if (at < H) segments.push([at, H]);

  return new ImageResponse(
    (
      <div style={{ display: "flex", position: "relative", width: W, height: H, background: PAPER, fontFamily: "Hanken Grotesk" }}>
        {segments.map(([a, b]) => (
          <div
            key={a}
            style={{ position: "absolute", left: AXIS - SPINE / 2, top: a, width: SPINE, height: b - a, background: INK }}
          />
        ))}
        <div
          style={{
            position: "absolute",
            left: MARGIN,
            top: MARGIN - 8,
            fontSize: 30,
            fontWeight: 600,
            letterSpacing: -0.3,
            color: INK,
          }}
        >
          {shareImage.wordmark}
        </div>
        {pieces}
        <div
          style={{
            position: "absolute",
            left: MARGIN,
            bottom: MARGIN - 8,
            fontSize: 28,
            fontWeight: 400,
            letterSpacing: -0.14,
            color: INK_SOFT,
          }}
        >
          {shareImage.foot}
        </div>
      </div>
    ),
    {
      ...SOCIAL_CARD,
      fonts: [
        { name: "Hanken Grotesk", data: regular, weight: 400, style: "normal" },
        { name: "Hanken Grotesk", data: semibold, weight: 600, style: "normal" },
      ],
    },
  );
}
