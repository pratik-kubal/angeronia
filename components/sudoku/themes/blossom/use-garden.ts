"use client";

import { useEffect, useMemo, useState } from "react";
import type { Beat } from "../types";
import { useAnchor } from "../use-anchor";
import { gardenLayout, type Garden } from "./garden";

/** The garden laid out over the game's measured pieces; null until they are measured. */
export function useGarden(): Garden | null {
  const shell = useAnchor(".sdk-shell");
  const bar = useAnchor(".sdk-bar");
  const title = useAnchor(".sdk-title");
  const gapA = useAnchor(".sdk-gap-a");
  const board = useAnchor(".sdk-board");
  const gapB = useAnchor(".sdk-gap-b");
  const rule = useAnchor(".sdk-rule");
  const pad = useAnchor(".sdk-pad");
  const dock = useAnchor(".sdk-dock");
  return useMemo(
    () =>
      shell && bar && title && gapA && board && gapB && rule && pad && dock
        ? gardenLayout({ shell, bar, title, gapA, board, gapB, rule, pad, dock })
        : null,
    [shell, bar, title, gapA, board, gapB, rule, pad, dock],
  );
}

/**
 * The latest beat or cue while it is still playing: from its arrival until `ms` later (`still` ms
 * under reduced motion), then null. One from before the mount (a theme picked mid-game, a page
 * come back) never plays: the scene shows it at rest.
 */
export function useFresh<T extends { token: number }>(item: T | null, ms: number, still = ms): T | null {
  const [born] = useState(() => item?.token ?? 0);
  const [live, setLive] = useState<T | null>(null);
  useEffect(() => {
    const lasts = matchMedia("(prefers-reduced-motion: reduce)").matches ? still : ms;
    if (!item || item.token <= born || !lasts) return;
    setLive(item);
    const id = window.setTimeout(() => setLive(null), lasts);
    return () => clearTimeout(id);
  }, [item, born, ms, still]);
  return live;
}

/** The token of the last deal this tab made (0 before one): the buds sprout again for each. */
export function useDealt(beat: Beat | null): number {
  const fresh = useFresh(beat?.kind === "deal" ? beat : null, 1);
  const [dealt, setDealt] = useState(0);
  if (fresh && fresh.token !== dealt) setDealt(fresh.token);
  return dealt;
}

/**
 * False until the garden has been drawn once (`ready`), true after: what mounts later (a flower
 * opening, a bud dealt) may animate in, while what the garden showed first stays at rest. Keyed to
 * the garden, not the mount: it is measured in a layout effect, after the mount's own effects.
 */
export function useLive(ready: boolean): boolean {
  const [live, setLive] = useState(false);
  useEffect(() => {
    if (ready) setLive(true);
  }, [ready]);
  return live;
}
