// The maths of Color Tap's view onto its picture. A camera is a scale and an offset: a work px at
// (wx, wy) is drawn at (x + wx·scale, y + wy·scale) in the stage, in CSS px. Everything the stage
// does to it lives here, pure, so the tests run what the screen runs: fitting the whole picture,
// the zoom range (from that fit down to where the thinnest area is a fingertip wide), keeping the
// picture from wandering off, zooming about a finger, the logarithmic zoom slider, and the
// magnifier's flight, which zooms out, travels and zooms in along van Wijk and Nuij's smooth path.

/** scale = CSS px per work px; (x, y) = where the picture's top-left corner sits in the stage, CSS px. */
export interface Camera {
  scale: number;
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Point {
  x: number;
  y: number;
}

/** The scales a camera may rest at, in CSS px per work px. */
export interface ZoomRange {
  min: number;
  max: number;
}

/** At full zoom the thinnest area is this many CSS px across: a fingertip. */
const FINGER = 40;
/** Full zoom is never less than this many times the fit, so even a coarse picture can be looked into… */
const MIN_DEPTH = 4;
/** …and never more, so a picture with one sliver of an area can't be zoomed into a blur. */
const MAX_DEPTH = 32;
/** Past either edge, at most this share of the view may be left empty. */
const SLACK = 0.25;
/** A view not laid out yet (0 × 0) still gets a camera that can be divided by. */
const TINIEST_SCALE = 1e-6;

/** The whole picture visible and centred, `margin` CSS px clear on every side. */
export function fit(view: Size, picture: Size, margin: number): Camera {
  // A view too small for its margins gives up to half of each side to them, never all of it.
  const width = Math.max(view.width - 2 * margin, view.width / 2);
  const height = Math.max(view.height - 2 * margin, view.height / 2);
  const scale = Math.max(Math.min(width / picture.width, height / picture.height), TINIEST_SCALE);
  return {
    scale,
    x: (view.width - picture.width * scale) / 2,
    y: (view.height - picture.height * scale) / 2,
  };
}

/**
 * From the fit to the scale at which an area whose inscribed radius is `thinnest` work px is a
 * fingertip (40 CSS px) across, but at least 4 and at most 32 times the fit.
 */
export function zoomRange(view: Size, picture: Size, thinnest: number, margin: number): ZoomRange {
  const min = fit(view, picture, margin).scale;
  const wanted = FINGER / (2 * thinnest);
  return { min, max: Math.min(Math.max(wanted, MIN_DEPTH * min), MAX_DEPTH * min) };
}

/**
 * A camera the stage may show. Its scale stays in the range, give or take `give` (0 at rest; 0.15
 * while a pinch overshoots, before it springs back), changed about the view's centre so the work
 * point there stays put. Then on each axis a picture narrower than the view is centred, and a
 * wider one may leave at most a quarter of the view empty past either edge. That allowance grows
 * from nothing as the picture outgrows the view, so zooming through the point where it fits never
 * makes it jump.
 */
export function clamp(camera: Camera, view: Size, picture: Size, range: ZoomRange, give: number): Camera {
  const scale = Math.min(Math.max(camera.scale, range.min * (1 - give)), range.max * (1 + give));
  const centre = { x: view.width / 2, y: view.height / 2 };
  const scaled = zoomAbout(camera, scale / camera.scale, centre);
  return {
    scale,
    x: clampAxis(scaled.x, view.width, picture.width * scale),
    y: clampAxis(scaled.y, view.height, picture.height * scale),
  };
}

/** Where the picture's near edge may sit on one axis, given the view's and the picture's lengths there. */
function clampAxis(at: number, view: number, content: number): number {
  if (content <= view) return (view - content) / 2;
  const slack = Math.min(SLACK * view, content - view);
  return Math.min(Math.max(at, view - slack - content), slack);
}

/** Zooms by `factor`, keeping the work point under `at` (stage CSS px) under it. */
export function zoomAbout(camera: Camera, factor: number, at: Point): Camera {
  return {
    scale: camera.scale * factor,
    x: at.x - (at.x - camera.x) * factor,
    y: at.y - (at.y - camera.y) * factor,
  };
}

export function panBy(camera: Camera, dx: number, dy: number): Camera {
  return { scale: camera.scale, x: camera.x + dx, y: camera.y + dy };
}

/** Stage CSS px to work px. */
export function toWork(camera: Camera, at: Point): Point {
  return { x: (at.x - camera.x) / camera.scale, y: (at.y - camera.y) / camera.scale };
}

/** Work px to stage CSS px. */
export function toStage(camera: Camera, at: Point): Point {
  return { x: camera.x + at.x * camera.scale, y: camera.y + at.y * camera.scale };
}

/** The work point `target` in the middle of the view, at `scale`. */
export function centreOn(view: Size, target: Point, scale: number): Camera {
  return { scale, x: view.width / 2 - target.x * scale, y: view.height / 2 - target.y * scale };
}

/**
 * The zoom slider's position for a scale, 0 at the fit and 1 at full zoom. It is logarithmic, so
 * each stretch of the track doubles the zoom by the same amount, as a pinch does.
 */
export function sliderOf(scale: number, range: ZoomRange): number {
  if (!(range.max > range.min)) return 0;
  return clamp01(Math.log(scale / range.min) / Math.log(range.max / range.min));
}

/** The scale at slider position `t`: the inverse of sliderOf. */
export function scaleOf(t: number, range: ZoomRange): number {
  if (!(range.max > range.min)) return range.min;
  return range.min * Math.pow(range.max / range.min, clamp01(t));
}

function clamp01(t: number): number {
  return Math.min(Math.max(t, 0), 1);
}

/** A camera move over time: `at(0)` is where it starts and `at(1)` exactly where it ends. */
export interface Flight {
  /** In ms. */
  duration: number;
  /** The camera at `t` in [0, 1] of the way along the path; ease `t` first (see `ease`). */
  at(t: number): Camera;
}

/** van Wijk and Nuij's ρ: how much the path prefers zooming out to panning; √2 is their (and d3's) choice. */
const RHO = Math.SQRT2;
const RHO2 = RHO * RHO;
const RHO4 = RHO2 * RHO2;
/** Two centres closer than this (work px, squared) are one: the flight only zooms. */
const SAME_CENTRE = 1e-12;
/** A flight's length in ms, from its path length S: S · 1000, held between these. */
const SHORTEST_FLIGHT = 450;
const LONGEST_FLIGHT = 1200;

/**
 * The magnifier's flight from one camera to another: van Wijk and Nuij's "smooth and efficient
 * zooming and panning", with ρ = √2, exactly as d3-interpolate's interpolateZoom does it. The
 * path is worked out on views [cx, cy, w]: the work point at the view's centre and the view's
 * width in work px. A long way across zooms out first, travels, then zooms back in; a short one
 * barely leaves the picture. Its duration is the path's length S (as d3 measures it) times
 * 1000 ms, held between 450 and 1200 ms. A flight that goes nowhere still lasts the shortest
 * time, so `elapsed / duration` is always defined.
 */
export function flight(from: Camera, to: Camera, view: Size): Flight {
  // A view not laid out yet is taken as 1 px wide, so the widths stay finite and above zero.
  const span = Math.max(view.width, 1);
  const ux0 = (view.width / 2 - from.x) / from.scale;
  const uy0 = (view.height / 2 - from.y) / from.scale;
  const w0 = span / from.scale;
  const ux1 = (view.width / 2 - to.x) / to.scale;
  const uy1 = (view.height / 2 - to.y) / to.scale;
  const w1 = span / to.scale;
  const dx = ux1 - ux0;
  const dy = uy1 - uy0;
  const d2 = dx * dx + dy * dy;

  /** The camera showing the view centred on (cx, cy), w work px wide. */
  const camera = (cx: number, cy: number, w: number): Camera => {
    const scale = span / w;
    return { scale, x: view.width / 2 - cx * scale, y: view.height / 2 - cy * scale };
  };

  let S: number;
  let along: (t: number) => Camera;
  if (d2 < SAME_CENTRE) {
    // The centre stays (or all but stays) put: a pure zoom, its width changing geometrically.
    S = Math.log(w1 / w0) / RHO;
    along = (t) => camera(ux0 + t * dx, uy0 + t * dy, w0 * Math.exp(RHO * t * S));
  } else {
    // d3's maths term for term, with two exact rewrites that keep it finite. d3's
    // ln(√(b² + 1) − b) is −asinh(b): written d3's way it cancels to ln 0 = −∞ once b is large,
    // which a big zoom out over a hair of a move makes it, and the whole flight is NaN. And d3's
    // own cosh, sinh and tanh give way to Math's, which agree to the last bit or so and don't
    // overflow to NaN on a very long way across.
    const d1 = Math.sqrt(d2);
    const b0 = (w1 * w1 - w0 * w0 + RHO4 * d2) / (2 * w0 * RHO2 * d1);
    const b1 = (w1 * w1 - w0 * w0 - RHO4 * d2) / (2 * w1 * RHO2 * d1);
    const r0 = -Math.asinh(b0);
    const r1 = -Math.asinh(b1);
    S = (r1 - r0) / RHO;
    const coshr0 = Math.cosh(r0);
    along = (t) => {
      const s = t * S;
      const u = (w0 / (RHO2 * d1)) * (coshr0 * Math.tanh(RHO * s + r0) - Math.sinh(r0));
      return camera(ux0 + u * dx, uy0 + u * dy, (w0 * coshr0) / Math.cosh(RHO * s + r0));
    };
  }

  // d3's duration is S · 1000 · ρ / √2, which is S · 1000 at ρ = √2. A pure zoom in has S < 0.
  const duration = Math.min(Math.max(Math.abs(S) * 1000, SHORTEST_FLIGHT), LONGEST_FLIGHT);
  const start = { ...from };
  const end = { ...to };
  return {
    duration,
    at: (t) => (t <= 0 ? { ...start } : t >= 1 ? { ...end } : along(t)),
  };
}

/** Cubic in and out, for flights: slow off, quick across, slow to land. */
export function ease(t: number): number {
  const u = clamp01(t);
  return u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
}
