// The keyboard: ←/→ or A/D steer (easing to full over 120 ms, so a tap nudges and a hold turns),
// Space, ↑ or W hop, Esc or P pause. Keys are left alone while a sheet is open, and Space never
// scrolls or presses a button behind the race.

import type { InputHub, SteerSource } from "./index";

/** Seconds from no steer to full steer. */
const RAMP = 0.12;

const LEFT = new Set(["ArrowLeft", "a", "A"]);
const RIGHT = new Set(["ArrowRight", "d", "D"]);
const HOP = new Set([" ", "ArrowUp", "w", "W"]);
const PAUSE = new Set(["Escape", "p", "P"]);

export function attachKeyboard(hub: InputHub, opts: { active: () => boolean; onPause: () => void }): () => void {
  let left = false;
  let right = false;
  let value = 0;
  const source: SteerSource = {
    steer(dt) {
      const goal = (right ? 1 : 0) - (left ? 1 : 0);
      const step = dt / RAMP;
      value = goal > value ? Math.min(goal, value + step) : Math.max(goal, value - step);
      return value;
    },
  };
  const remove = hub.add(source);

  const sheetOpen = () => document.querySelector("dialog[open]") !== null;
  const down = (e: KeyboardEvent) => {
    if (sheetOpen() || e.metaKey || e.ctrlKey || e.altKey) return;
    const racing = opts.active();
    if (LEFT.has(e.key)) left = true;
    else if (RIGHT.has(e.key)) right = true;
    else if (HOP.has(e.key)) {
      if (!racing) return;
      e.preventDefault();
      if (!e.repeat) hub.hop();
      return;
    } else if (PAUSE.has(e.key)) {
      if (!racing || e.repeat) return;
      e.preventDefault();
      opts.onPause();
      return;
    } else return;
    if (racing) e.preventDefault();
  };
  const up = (e: KeyboardEvent) => {
    if (LEFT.has(e.key)) left = false;
    else if (RIGHT.has(e.key)) right = false;
  };
  const release = () => {
    left = right = false;
  };
  window.addEventListener("keydown", down);
  window.addEventListener("keyup", up);
  window.addEventListener("blur", release);
  return () => {
    remove();
    window.removeEventListener("keydown", down);
    window.removeEventListener("keyup", up);
    window.removeEventListener("blur", release);
  };
}
