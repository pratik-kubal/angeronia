// A route as it is authored: the ribbon's shape as a run of segments, and what is placed along it.
// `compileTrack` (track.ts) turns the segments into a sampled ribbon and `expandPlaces` (items.ts)
// turns the placements into items. Positions along a route are track coordinates: `s` metres along
// the ribbon, `x` metres to the right of its centre line.

export type RouteId = "first-light" | "orchard-lane" | "drizzle-hollow" | "windmill-rise" | "weavers-gap" | "bell-tower";

/**
 * One stretch of ribbon. `yaw` is the heading change over the stretch (degrees, + turns right);
 * `pitch`, `bank` and `half` are the values at its end (degrees, degrees with + leaning right,
 * metres from the centre to an edge), eased from where the previous stretch left them. Under
 * "smooth" (the default) the turn ramps in and out, so stretches join without a kink; "linear"
 * turns at a constant rate (a spiral).
 */
export type Seg = {
  len: number;
  yaw?: number;
  pitch?: number;
  bank?: number;
  half?: number;
  /** A break in the ribbon: hop across it, or the moths carry Wick over. */
  gap?: true;
  ease?: "smooth" | "linear";
};

/** What Wick says along a route: the tutorial's prompts and a few lines of the route's own. */
export type SayId = "steer" | "sparks" | "hop" | "lamp" | "lantern" | "blossom" | "dew" | "rain" | "gust" | "thread" | "bat";

export type Place =
  /** `n` sparks from `s`, `every` metres apart (2 by default), from `x` to `to` (straight, or bowed up by `arc` metres). */
  | { kind: "sparks"; s: number; n: number; x?: number; to?: number; every?: number; arc?: number; big?: true }
  | { kind: "blossom" | "dew"; s: number; x: number }
  /** A raindrop lands at (s, x) every `every` seconds, first at `at` seconds. */
  | { kind: "rain"; s: number; x: number; every: number; at?: number }
  /** A stretch `len` metres long where the wind pushes Wick sideways (m/s², + to the right). */
  | { kind: "gust"; s: number; len: number; push: number }
  /** A spider's thread across the ribbon, from `from` to `to` (the whole width by default). */
  | { kind: "thread"; s: number; from?: number; to?: number }
  /** A bat that swoops across, centred on `x`, `swing` metres each way, once every `every` seconds. */
  | { kind: "bat"; s: number; x: number; swing: number; every: number; at?: number }
  /** A way-lamp: lit on the way past, and where "Retry from the last lamp" starts. */
  | { kind: "lamp"; s: number }
  | { kind: "say"; s: number; line: SayId };

/** Scenery beside the ribbon: drawn, never touched. */
export type Prop = { kind: "tree" | "cottage" | "windmill" | "belfry"; s: number; x: number; scale?: number };

export type RouteDef = {
  id: RouteId;
  /** Bump when the ribbon or its items change: it clears the route's best time and glow, never its flames. */
  version: number;
  /** Par time in seconds, set from the skilled bot's run (routes.test.ts keeps it honest). */
  par: number;
  /** The glow that earns the glow flame. */
  glowGoal: number;
  /** Flames needed, across all routes, to open this one. */
  unlock: number;
  start: { half: number; pitch?: number };
  segs: Seg[];
  places: Place[];
  look: { tint: string; moon: number; props: Prop[] };
  /** Where its lantern sits on the route map's hillside, in % of the map. */
  map: { x: number; y: number };
};
