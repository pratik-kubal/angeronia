// Lamplighter (/games/lamplighter) copy: the title, the routes' names, Wick's lines, the tutorial's
// prompts, the sheets and the results.

import type { RouteId } from "@/lib/lamplighter/route";

export const TITLE = {
  name: "Lamplighter",
  tagline: "The town's lanterns have gone out. Wick knows the way.",
  play: "Play",
};

/** The way back to the games launcher (DECISIONS.md ADR-021). */
export const ALL_GAMES = { label: "All games", href: "/games" } as const;

export const ROUTE_NAMES: Record<RouteId, { name: string; blurb: string }> = {
  "first-light": { name: "First Light", blurb: "Learn the ribbons. Light the first lantern." },
  "orchard-lane": { name: "Orchard Lane", blurb: "Night blossoms ride a tailwind." },
  "drizzle-hollow": { name: "Drizzle Hollow", blurb: "Rain, and a dewdrop to keep it off." },
  "windmill-rise": { name: "Windmill Rise", blurb: "The wind pushes. Push back." },
  "weavers-gap": { name: "Weaver's Gap", blurb: "Threads, and breaks in the ribbon." },
  "bell-tower": { name: "Bell Tower", blurb: "Round and round, up to the bell." },
};

export const HUD = {
  pause: "Pause",
  glow: "Glow",
  time: "Time",
  stage: "Wick flying along the ribbon",
};

export const PAUSE_COPY = {
  title: "Paused",
  resume: "Keep flying",
  retry: "Back to the last lamp",
  restart: "Start the route again",
  leave: "Leave the route",
};

export const RESULTS_COPY = {
  heading: (route: string) => `${route}: the lantern is lit`,
  time: "Time",
  glow: "Glow",
  sparks: "Sparks",
  flames: {
    finish: "Reached the lantern",
    glow: (goal: number) => `Arrived with ${goal} glow`,
    par: (par: string) => `Under ${par}`,
  },
  earned: "Earned",
  missing: "Not yet",
  again: "Fly again",
  leave: "Done",
};
