"use client";

import { useEffect, useRef, useState } from "react";
import type { Beat, Cue } from "../types";

/** How long each surprise plays, in ms (the stylesheet's animations fit inside). */
const LENGTH: Record<string, number> = { arrive: 2300, "seven-seas": 2300, towers: 2450, "gull-swoop": 2400 };
/** Under reduced motion a surprise shows still, for this long. */
const STILL = 1500;

/**
 * The surprise playing now, if any: each new cue plays for its length, then clears. The cue
 * present when the scene mounts is not new (a theme switch remounts the scene with the last cue),
 * so it never replays; `reduced` says to show it still.
 */
export function useSurprise(cue: Cue | null): { token: number; surprise: string; reduced: boolean } | null {
  const [live, setLive] = useState<{ token: number; surprise: string; reduced: boolean } | null>(null);
  const seen = useRef(cue?.token ?? 0);
  useEffect(() => {
    if (!cue || cue.token <= seen.current) return;
    seen.current = cue.token;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    setLive({ token: cue.token, surprise: cue.surprise, reduced });
    const id = window.setTimeout(() => setLive(null), reduced ? STILL : (LENGTH[cue.surprise] ?? 2400));
    return () => clearTimeout(id);
  }, [cue]);
  return live;
}

/** The beat if it happened since the scene mounted (a remount never replays the last one). */
export function useFreshBeat(beat: Beat | null): Beat | null {
  const [mounted] = useState(beat?.token ?? 0);
  return beat && beat.token > mounted ? beat : null;
}
