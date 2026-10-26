"use client";

import { useSyncExternalStore } from "react";

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

const noop = () => () => {};

/** Whether the page was opened with ?debug: the frame-rate overlay for device checks. */
export function useDebug(): boolean {
  return useSyncExternalStore(
    noop,
    () => new URLSearchParams(location.search).has("debug"),
    () => false,
  );
}
