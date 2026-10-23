"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import type { Cue } from "../types";
import { useAnchor } from "../use-anchor";
import { layoutOf, type Layout } from "./layout";

/** The scene's layout from the game's measured pieces, or null until they're measured. */
export function useLayout(): Layout | null {
  const shell = useAnchor(".sdk-shell");
  const game = useAnchor(".sdk-game");
  const bar = useAnchor(".sdk-bar");
  const title = useAnchor(".sdk-title");
  const gapA = useAnchor(".sdk-gap-a");
  const board = useAnchor(".sdk-board");
  const gapB = useAnchor(".sdk-gap-b");
  const pad = useAnchor(".sdk-pad");
  return useMemo(
    () => (shell && game && bar && title && gapA && board && gapB && pad ? layoutOf({ shell, game, bar, title, gapA, board, gapB, pad }) : null),
    [shell, game, bar, title, gapA, board, gapB, pad],
  );
}

/**
 * A beat or cue only if it came after the scene mounted: picking the theme mounts it with the
 * game's last beat and cue, which were played (if at all) by another theme.
 */
export function useFresh<T extends { token: number }>(value: T | null): T | null {
  const [floor] = useState(() => value?.token ?? 0);
  return value && value.token > floor ? value : null;
}

/**
 * The latest of a run of tokens, kept after its moment has passed: as a key it remounts a piece
 * (replaying its animation) for each new token, and never again when the moment ends.
 */
export function useLatest(token: number): number {
  const [latest, setLatest] = useState(token);
  if (token && token !== latest) setLatest(token);
  return token || latest;
}

const MOTION = "(prefers-reduced-motion: reduce)";
const subscribe = (change: () => void) => {
  const media = matchMedia(MOTION);
  media.addEventListener("change", change);
  return () => media.removeEventListener("change", change);
};

/** Whether the player asked for less motion (false on the server). */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => matchMedia(MOTION).matches,
    () => false,
  );
}

/** How long a surprise stays: its animation, or a still frame under reduced motion. */
const SURPRISE_MS = 2600;
const STILL_MS = 1800;

/** The fresh cue while its surprise plays, then null (each new token plays it again). */
export function usePlaying(cue: Cue | null): Cue | null {
  const fresh = useFresh(cue);
  const reduced = useReducedMotion();
  const [over, setOver] = useState(0);
  const token = fresh?.token ?? 0;
  useEffect(() => {
    if (!token) return;
    const id = window.setTimeout(() => setOver(token), reduced ? STILL_MS : SURPRISE_MS);
    return () => clearTimeout(id);
  }, [token, reduced]);
  return fresh && fresh.token > over ? fresh : null;
}
