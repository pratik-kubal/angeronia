"use client";

import { useEffect, useRef } from "react";
import { CARDS } from "@/lib/solitaire/cards";
import { faceUrl } from "./card";
import type { Layout } from "./layout";
import { STEP, createSim, type FxKind, type Sprite } from "./win";

type Props = {
  kind: FxKind;
  layout: Layout;
  size: { w: number; h: number };
  seed: number;
  onDone: () => void;
};

/** iOS caps canvas memory: two device pixels per CSS pixel are plenty for cards in motion. */
const MAX_DPR = 2;

function load(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(img);
    img.src = src;
  });
}

/**
 * Plays a win animation over the table on one canvas: the faces are drawn once into an atlas at the
 * cards' size, then the simulation runs at a fixed 60 Hz (the cascade's trails stay put at any
 * frame rate) until it ends or the player taps or presses a key to skip it.
 */
export function WinCanvas({ kind, layout, size, seed, onDone }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const done = useRef(onDone);
  useEffect(() => {
    done.current = onDone;
  }, [onDone]);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return void done.current();
    const dpr = Math.min(MAX_DPR, window.devicePixelRatio || 1);
    canvas.width = Math.round(size.w * dpr);
    canvas.height = Math.round(size.h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const cw = layout.cardW;
    const ch = layout.cardH;
    const cellW = Math.ceil(cw * dpr);
    const cellH = Math.ceil(ch * dpr);
    const atlas = document.createElement("canvas");
    atlas.width = cellW * 13;
    atlas.height = cellH * 4;
    const a = atlas.getContext("2d")!;
    let frame = 0;
    let live = true;

    const draw = (sprites: Sprite[]) => {
      for (const s of sprites) {
        const sx = (s.card % 13) * cellW;
        const sy = Math.floor(s.card / 13) * cellH;
        if (s.rot === 0) {
          ctx.drawImage(atlas, sx, sy, cellW, cellH, s.x - cw / 2, s.y - ch / 2, cw, ch);
          continue;
        }
        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.rotate(s.rot);
        ctx.drawImage(atlas, sx, sy, cellW, cellH, -cw / 2, -ch / 2, cw, ch);
        ctx.restore();
      }
    };

    Promise.all(CARDS.map((card) => load(faceUrl(card)))).then((imgs) => {
      if (!live) return;
      const radius = cw * 0.06 * dpr;
      imgs.forEach((img, card) => {
        const x = (card % 13) * cellW;
        const y = Math.floor(card / 13) * cellH;
        if (img.naturalWidth) a.drawImage(img, x, y, cellW, cellH);
        // A hairline edge, so white cards stay apart where they overlap.
        a.strokeStyle = "rgba(0, 0, 0, 0.35)";
        a.lineWidth = Math.max(1, dpr * 0.75);
        a.beginPath();
        if (typeof a.roundRect === "function") a.roundRect(x + 0.5, y + 0.5, cellW - 1, cellH - 1, radius);
        else a.rect(x + 0.5, y + 0.5, cellW - 1, cellH - 1);
        a.stroke();
      });
      const foundations = (["f0", "f1", "f2", "f3"] as const).map((f) => ({
        x: layout.slots[f].x + cw / 2,
        y: layout.slots[f].y + ch / 2,
      }));
      const sim = createSim(kind, { width: size.w, height: size.h, cardW: cw, cardH: ch, foundations, seed });
      let last = performance.now();
      let acc = 0;
      let latest: Sprite[] = [];
      const tick = (now: number) => {
        if (!live) return;
        // Clamped: a hidden tab's pause or a slow frame never jumps the animation.
        acc += Math.min(0.05, (now - last) / 1000);
        last = now;
        while (acc >= STEP) {
          acc -= STEP;
          const sprites = sim.step();
          if (!sprites) {
            live = false;
            done.current();
            return;
          }
          if (sim.clears) latest = sprites;
          else draw(sprites);
        }
        if (sim.clears) {
          ctx.clearRect(0, 0, size.w, size.h);
          draw(latest);
        }
        frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    });

    return () => {
      live = false;
      cancelAnimationFrame(frame);
      // WebKit frees canvas memory only when the canvas shrinks (or much later, at collection).
      canvas.width = canvas.height = 0;
      atlas.width = atlas.height = 0;
    };
  }, [kind, layout, size, seed]);

  // Skipped on the click, not the press: a result sheet opened under a finger still down would take
  // the click that follows on its backdrop (iOS aims it at whatever is under the tap) and close.
  return <canvas ref={ref} className="sol-fx" data-fx={kind} aria-hidden onClick={() => done.current()} />;
}
