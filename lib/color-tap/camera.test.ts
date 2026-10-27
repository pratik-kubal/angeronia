import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  centreOn,
  clamp,
  ease,
  fit,
  flight,
  panBy,
  scaleOf,
  sliderOf,
  toStage,
  toWork,
  zoomAbout,
  zoomRange,
  type Camera,
  type Size,
} from "./camera";
import { PICTURES } from "./pictures";
import { decodePuzzle } from "./puzzle";

// The view's maths. The fit shows the whole picture centred with its margin, on an upright iPhone
// and a wide desktop, and never collapses on a tiny view. The zoom range ends where the thinnest
// area is a fingertip (40 CSS px) wide, within 4× and 32× the fit, and the committed puzzles get
// there on an iPhone. The clamp centres a picture narrower than the view, lets a wider one leave
// at most a quarter of the view empty (growing smoothly from nothing, so it never jumps), and
// holds the scale to the range give or take the pinch's overshoot. Zooming keeps the point under
// the finger, the stage and work transforms undo each other, the slider is logarithmic and
// round-trips, and the flight starts and lands exactly where asked, follows d3's interpolateZoom
// term for term, only zooms when the centre stays, swings out on a long way across, lasts 450 to
// 1200 ms, copes with going nowhere, and stays finite where d3's own sums turn to NaN (a big zoom
// out over a hair of a move, or a very long way across).

const PHONE: Size = { width: 393, height: 660 };
const DESKTOP: Size = { width: 1440, height: 760 };
const PICTURE: Size = { width: 800, height: 533 };
const MARGIN = 12;

const closeTo = (actual: { x: number; y: number }, expected: { x: number; y: number }, digits: number) => {
  expect(actual.x).toBeCloseTo(expected.x, digits);
  expect(actual.y).toBeCloseTo(expected.y, digits);
};

/** The picture's box on the stage, CSS px. */
const box = (camera: Camera, picture: Size) => ({
  left: camera.x,
  top: camera.y,
  right: camera.x + picture.width * camera.scale,
  bottom: camera.y + picture.height * camera.scale,
});

describe("fit", () => {
  it("fills an upright phone's width, less the margin, and centres the picture", () => {
    const camera = fit(PHONE, PICTURE, MARGIN);
    expect(camera.scale).toBeCloseTo((393 - 24) / 800, 12);
    const b = box(camera, PICTURE);
    expect(b.left).toBeCloseTo(MARGIN, 9);
    expect(b.right).toBeCloseTo(PHONE.width - MARGIN, 9);
    // Width-bound: more than the margin above and below, the same each side.
    expect(b.top).toBeGreaterThan(MARGIN);
    expect(b.top).toBeCloseTo(PHONE.height - b.bottom, 9);
  });

  it("fills a wide desktop's height, less the margin, and centres the picture", () => {
    const camera = fit(DESKTOP, PICTURE, MARGIN);
    expect(camera.scale).toBeCloseTo((760 - 24) / 533, 12);
    const b = box(camera, PICTURE);
    expect(b.top).toBeCloseTo(MARGIN, 9);
    expect(b.bottom).toBeCloseTo(DESKTOP.height - MARGIN, 9);
    expect(b.left).toBeGreaterThan(MARGIN);
    expect(b.left).toBeCloseTo(DESKTOP.width - b.right, 9);
  });

  it("keeps a positive scale on a view smaller than its margins, or not laid out at all", () => {
    for (const view of [{ width: 20, height: 10 }, { width: 1, height: 1 }, { width: 0, height: 0 }]) {
      const camera = fit(view, PICTURE, MARGIN);
      expect(camera.scale).toBeGreaterThan(0);
      expect(Number.isFinite(camera.x) && Number.isFinite(camera.y)).toBe(true);
      // Still the whole picture, still centred.
      const b = box(camera, PICTURE);
      expect(b.left).toBeCloseTo(view.width - b.right, 9);
      expect(b.top).toBeCloseTo(view.height - b.bottom, 9);
    }
  });
});

describe("zoomRange", () => {
  it("runs from the fit to where the thinnest area is 40 CSS px across", () => {
    const range = zoomRange(PHONE, PICTURE, 2.25, MARGIN);
    expect(range.min).toBe(fit(PHONE, PICTURE, MARGIN).scale);
    expect(range.max).toBeCloseTo(40 / (2 * 2.25), 12);
    expect(2 * 2.25 * range.max).toBeCloseTo(40, 12);
  });

  it("zooms at least 4 times the fit, however coarse the picture", () => {
    const range = zoomRange(DESKTOP, PICTURE, 50, MARGIN);
    expect(range.max).toBeCloseTo(4 * range.min, 12);
  });

  it("zooms at most 32 times the fit, however thin an area", () => {
    const range = zoomRange(PHONE, PICTURE, 0.05, MARGIN);
    expect(range.max).toBeCloseTo(32 * range.min, 12);
  });

  it("brings every committed puzzle's thinnest area to a fingertip on an iPhone, unless 32× stops it", () => {
    expect(PICTURES.length).toBeGreaterThan(0);
    for (const picture of PICTURES) {
      for (const level of picture.levels) {
        const file = path.join("public", level.src);
        const puzzle = decodePuzzle(JSON.parse(fs.readFileSync(file, "utf8")));
        const thinnest = Math.min(...puzzle.regions.map((region) => region.labels[0].r));
        const range = zoomRange(PHONE, puzzle, thinnest, MARGIN);
        const across = 2 * thinnest * range.max;
        if (range.max < 32 * range.min - 1e-9) expect(across).toBeGreaterThanOrEqual(40 - 1e-9);
        expect(range.max).toBeGreaterThanOrEqual(4 * range.min);
        expect(range.max).toBeLessThanOrEqual(32 * range.min + 1e-12);
      }
    }
  });
});

describe("clamp", () => {
  const range = zoomRange(PHONE, PICTURE, 2.25, MARGIN);

  it("centres a picture narrower than the view, wherever it was dragged", () => {
    const camera = clamp({ scale: range.min, x: 150, y: -300 }, PHONE, PICTURE, range, 0);
    expect(camera).toEqual(fit(PHONE, PICTURE, MARGIN));
  });

  it("centres each axis on its own: wider than the view across, shorter down", () => {
    // At 0.6 the picture is 480 × 319.8 on a 393 × 660 view.
    const camera = clamp({ scale: 0.6, x: 0, y: 0 }, PHONE, PICTURE, range, 0);
    expect(camera.x).toBe(0);
    expect(camera.y).toBeCloseTo((660 - 533 * 0.6) / 2, 9);
  });

  it("leaves at most a quarter of the view empty past either edge of a wide picture", () => {
    const scale = 4;
    const content = { width: PICTURE.width * scale, height: PICTURE.height * scale };
    // Dragged far right and down: the left and top edges stop a quarter of the view in.
    const pulled = clamp({ scale, x: 5000, y: 5000 }, PHONE, PICTURE, range, 0);
    expect(pulled.x).toBeCloseTo(PHONE.width / 4, 9);
    expect(pulled.y).toBeCloseTo(PHONE.height / 4, 9);
    // Dragged far left and up: the right and bottom edges stop a quarter of the view short.
    const pushed = clamp({ scale, x: -9000, y: -9000 }, PHONE, PICTURE, range, 0);
    expect(pushed.x + content.width).toBeCloseTo(PHONE.width * 0.75, 9);
    expect(pushed.y + content.height).toBeCloseTo(PHONE.height * 0.75, 9);
    // Anywhere in between is left alone.
    expect(clamp({ scale, x: -500, y: -400 }, PHONE, PICTURE, range, 0)).toEqual({ scale, x: -500, y: -400 });
  });

  it("lets a picture only a little wider than the view only a little past its edges, so it never jumps", () => {
    // 2 CSS px wider than the view: at most 2 px empty, not a quarter of the view.
    const scale = (PHONE.width + 2) / PICTURE.width;
    expect(clamp({ scale, x: 100, y: 0 }, PHONE, PICTURE, range, 0).x).toBeCloseTo(2, 9);
    expect(clamp({ scale, x: -100, y: 0 }, PHONE, PICTURE, range, 0).x).toBeCloseTo(-4, 9);
    // Zooming out through the fit, dragged hard to one side, the edge moves by a hair each step.
    let previous: number | null = null;
    for (let width = PHONE.width + 40; width >= PHONE.width - 40; width -= 0.5) {
      const x = clamp({ scale: width / PICTURE.width, x: 1000, y: 0 }, PHONE, PICTURE, range, 0).x;
      if (previous !== null) expect(Math.abs(x - previous)).toBeLessThan(1);
      previous = x;
    }
  });

  it("holds the scale to the range at rest, about the view's centre", () => {
    const centre = { x: PHONE.width / 2, y: PHONE.height / 2 };
    const deep: Camera = { scale: range.max * 3, x: -2000, y: -1500 };
    const held = clamp(deep, PHONE, PICTURE, range, 0);
    expect(held.scale).toBe(range.max);
    closeTo(toWork(held, centre), toWork(deep, centre), 9);
    expect(clamp({ scale: range.min / 2, x: 0, y: 0 }, PHONE, PICTURE, range, 0).scale).toBe(range.min);
  });

  it("gives a pinch 15% either way, and no more", () => {
    const give = 0.15;
    const under = clamp({ scale: range.min * 0.9, x: 0, y: 0 }, PHONE, PICTURE, range, give);
    expect(under.scale).toBeCloseTo(range.min * 0.9, 12);
    expect(clamp({ scale: range.min * 0.5, x: 0, y: 0 }, PHONE, PICTURE, range, give).scale).toBeCloseTo(range.min * 0.85, 12);
    expect(clamp({ scale: range.max * 1.1, x: -3000, y: -2000 }, PHONE, PICTURE, range, give).scale).toBeCloseTo(range.max * 1.1, 12);
    expect(clamp({ scale: range.max * 2, x: -3000, y: -2000 }, PHONE, PICTURE, range, give).scale).toBeCloseTo(range.max * 1.15, 12);
  });
});

describe("zoomAbout, panBy, toWork and toStage", () => {
  const camera: Camera = { scale: 1.7, x: -240, y: 35 };

  it("keeps the work point under the finger under it", () => {
    for (const at of [{ x: 0, y: 0 }, { x: 196, y: 330 }, { x: 380, y: 12 }]) {
      for (const factor of [0.5, 1.13, 3]) {
        const zoomed = zoomAbout(camera, factor, at);
        expect(zoomed.scale).toBeCloseTo(camera.scale * factor, 12);
        closeTo(toWork(zoomed, at), toWork(camera, at), 9);
      }
    }
  });

  it("pans by exactly what it is given", () => {
    expect(panBy(camera, 12, -7)).toEqual({ scale: 1.7, x: -228, y: 28 });
    closeTo(toStage(panBy(camera, 12, -7), { x: 100, y: 100 }), { x: -228 + 170, y: 28 + 170 }, 9);
  });

  it("maps stage to work and back again", () => {
    const work = { x: 412.5, y: 97.25 };
    closeTo(toWork(camera, toStage(camera, work)), work, 9);
    const stage = { x: 33, y: 610 };
    closeTo(toStage(camera, toWork(camera, stage)), stage, 9);
    // The picture's top-left corner sits at the camera's offset.
    expect(toStage(camera, { x: 0, y: 0 })).toEqual({ x: camera.x, y: camera.y });
  });

  it("centres a work point in the view", () => {
    const target = { x: 640, y: 120 };
    const centred = centreOn(PHONE, target, 5);
    expect(centred.scale).toBe(5);
    closeTo(toStage(centred, target), { x: PHONE.width / 2, y: PHONE.height / 2 }, 9);
  });
});

describe("the zoom slider", () => {
  const range = { min: 0.5, max: 8 };

  it("runs from 0 at the fit to 1 at full zoom, logarithmically", () => {
    expect(sliderOf(range.min, range)).toBe(0);
    expect(sliderOf(range.max, range)).toBeCloseTo(1, 12);
    // The geometric mean is halfway; each doubling is a quarter of the track here (16× in all).
    expect(sliderOf(2, range)).toBeCloseTo(0.5, 12);
    expect(sliderOf(1, range)).toBeCloseTo(0.25, 12);
  });

  it("stays on the track past either end", () => {
    expect(sliderOf(0.1, range)).toBe(0);
    expect(sliderOf(range.max * 1.15, range)).toBe(1);
    expect(scaleOf(-1, range)).toBe(range.min);
    expect(scaleOf(2, range)).toBeCloseTo(range.max, 12);
  });

  it("round-trips between position and scale", () => {
    for (let t = 0; t <= 1; t += 0.05) expect(sliderOf(scaleOf(t, range), range)).toBeCloseTo(t, 12);
    for (const scale of [0.5, 0.77, 1.9, 4, 7.99]) expect(scaleOf(sliderOf(scale, range), range)).toBeCloseTo(scale, 12);
  });

  it("gives a range with no room in it a position of 0, not NaN", () => {
    expect(sliderOf(1, { min: 1, max: 1 })).toBe(0);
    expect(scaleOf(0.7, { min: 1, max: 1 })).toBe(1);
  });
});

/**
 * d3-interpolate's interpolateZoom at ρ = √2 (ISC licence), transcribed as its reference: views
 * are [cx, cy, w], and it gives the view at t and its duration in ms.
 */
function d3Zoom(p0: [number, number, number], p1: [number, number, number]) {
  const rho = Math.SQRT2;
  const rho2 = 2;
  const rho4 = 4;
  const cosh = (x: number) => ((x = Math.exp(x)) + 1 / x) / 2;
  const sinh = (x: number) => ((x = Math.exp(x)) - 1 / x) / 2;
  const tanh = (x: number) => ((x = Math.exp(2 * x)) - 1) / (x + 1);
  const [ux0, uy0, w0] = p0;
  const [ux1, uy1, w1] = p1;
  const dx = ux1 - ux0;
  const dy = uy1 - uy0;
  const d2 = dx * dx + dy * dy;
  let S: number;
  let i: (t: number) => [number, number, number];
  if (d2 < 1e-12) {
    S = Math.log(w1 / w0) / rho;
    i = (t) => [ux0 + t * dx, uy0 + t * dy, w0 * Math.exp(rho * t * S)];
  } else {
    const d1 = Math.sqrt(d2);
    const b0 = (w1 * w1 - w0 * w0 + rho4 * d2) / (2 * w0 * rho2 * d1);
    const b1 = (w1 * w1 - w0 * w0 - rho4 * d2) / (2 * w1 * rho2 * d1);
    const r0 = Math.log(Math.sqrt(b0 * b0 + 1) - b0);
    const r1 = Math.log(Math.sqrt(b1 * b1 + 1) - b1);
    S = (r1 - r0) / rho;
    i = (t) => {
      const s = t * S;
      const coshr0 = cosh(r0);
      const u = (w0 / (rho2 * d1)) * (coshr0 * tanh(rho * s + r0) - sinh(r0));
      return [ux0 + u * dx, uy0 + u * dy, (w0 * coshr0) / cosh(rho * s + r0)];
    };
  }
  return { i, duration: (S * 1000 * rho) / Math.SQRT2 };
}

/** A camera as d3's view: the work point at the view's centre, and the view's width in work px. */
const asView = (camera: Camera, view: Size): [number, number, number] => [
  (view.width / 2 - camera.x) / camera.scale,
  (view.height / 2 - camera.y) / camera.scale,
  view.width / camera.scale,
];

describe("flight", () => {
  const range = zoomRange(PHONE, PICTURE, 2.25, MARGIN);
  const home = fit(PHONE, PICTURE, MARGIN);
  const corner = centreOn(PHONE, { x: 760, y: 500 }, range.max);
  const viewCentre = { x: PHONE.width / 2, y: PHONE.height / 2 };

  it("starts and lands exactly where it was asked to", () => {
    for (const [from, to] of [[home, corner], [corner, home], [home, zoomAbout(home, 4, viewCentre)]]) {
      const f = flight(from, to, PHONE);
      expect(f.at(0)).toEqual(from);
      expect(f.at(1)).toEqual(to);
      expect(f.at(0)).not.toBe(from);
      // Just inside either end it is already close.
      expect(f.at(1e-6).scale).toBeCloseTo(from.scale, 4);
      expect(f.at(1 - 1e-6).scale).toBeCloseTo(to.scale, 4);
    }
  });

  it("follows d3's interpolateZoom term for term, duration included", () => {
    const cases: [Camera, Camera][] = [
      [home, corner],
      [corner, home],
      [centreOn(PHONE, { x: 40, y: 30 }, 3), centreOn(PHONE, { x: 700, y: 480 }, 6)],
      [centreOn(PHONE, { x: 400, y: 260 }, 2), centreOn(PHONE, { x: 410, y: 262 }, 2)],
    ];
    for (const [from, to] of cases) {
      const f = flight(from, to, PHONE);
      const reference = d3Zoom(asView(from, PHONE), asView(to, PHONE));
      for (let t = 0.05; t < 1; t += 0.05) {
        const [cx, cy, w] = asView(f.at(t), PHONE);
        const [ex, ey, ew] = reference.i(t);
        expect(cx).toBeCloseTo(ex, 6);
        expect(cy).toBeCloseTo(ey, 6);
        expect(w).toBeCloseTo(ew, 6);
      }
      expect(f.duration).toBeCloseTo(Math.min(Math.max(reference.duration, 450), 1200), 6);
    }
  });

  it("only zooms when the centre stays, its width shrinking all the way", () => {
    const to = zoomAbout(home, 6, viewCentre);
    const f = flight(home, to, PHONE);
    let width = Infinity;
    for (let t = 0; t <= 1; t += 0.01) {
      const camera = f.at(t);
      const [cx, cy, w] = asView(camera, PHONE);
      expect(w).toBeLessThan(width);
      width = w;
      closeTo({ x: cx, y: cy }, toWork(home, viewCentre), 6);
    }
    // And the way back grows all the way.
    const back = flight(to, home, PHONE);
    for (let t = 0.01; t <= 1; t += 0.01) expect(back.at(t).scale).toBeLessThan(back.at(t - 0.01).scale);
  });

  it("zooms out on a long way across, and back in to land", () => {
    const from = centreOn(PHONE, { x: 60, y: 60 }, range.max);
    const to = centreOn(PHONE, { x: 740, y: 470 }, range.max);
    const f = flight(from, to, PHONE);
    const middle = f.at(0.5).scale;
    expect(middle).toBeLessThan(range.max / 4);
    expect(f.at(0.25).scale).toBeGreaterThan(middle);
    expect(f.at(0.75).scale).toBeGreaterThan(middle);
  });

  it("lasts S × 1000 ms, held between 450 and 1200 ms", () => {
    // A pure 4× zoom: S = ln 4 / √2, about 980 ms.
    expect(flight(home, zoomAbout(home, 4, viewCentre), PHONE).duration).toBeCloseTo((1000 * Math.log(4)) / Math.SQRT2, 6);
    // Zooming out takes as long as zooming in.
    expect(flight(zoomAbout(home, 4, viewCentre), home, PHONE).duration).toBeCloseTo((1000 * Math.log(4)) / Math.SQRT2, 6);
    // A nudge is the shortest flight; a journey to the far corner at full zoom the longest.
    expect(flight(home, panBy(home, 3, 2), PHONE).duration).toBe(450);
    expect(flight(home, corner, PHONE).duration).toBe(1200);
    for (const to of [corner, centreOn(PHONE, { x: 200, y: 200 }, 2), zoomAbout(home, 1.5, { x: 10, y: 10 })]) {
      const duration = flight(home, to, PHONE).duration;
      expect(duration).toBeGreaterThanOrEqual(450);
      expect(duration).toBeLessThanOrEqual(1200);
    }
  });

  it("goes nowhere, finitely, when it has nowhere to go", () => {
    const f = flight(corner, { ...corner }, PHONE);
    expect(f.duration).toBe(450);
    for (const t of [0, 0.2, 0.5, 0.9, 1]) {
      const camera = f.at(t);
      expect(camera.scale).toBeCloseTo(corner.scale, 12);
      expect(camera.x).toBeCloseTo(corner.x, 9);
      expect(camera.y).toBeCloseTo(corner.y, 9);
    }
    // Even on a view that hasn't been laid out.
    const empty = flight(home, home, { width: 0, height: 0 });
    expect(Number.isFinite(empty.at(0.5).scale)).toBe(true);
  });

  it("stays finite on a big zoom out over a hair of a move, where d3's own sums give NaN", () => {
    // From deep in to the fit, the centre moved by millionths of a work px: too far for the
    // pure-zoom case, and d3's ln(√(b² + 1) − b) is ln 0 here.
    const centre = { x: 400, y: 260 };
    const deep = centreOn(PHONE, centre, 13);
    const out = (hair: number) => centreOn(PHONE, { x: centre.x + hair, y: centre.y }, home.scale);
    expect(Number.isNaN(d3Zoom(asView(deep, PHONE), asView(out(2e-6), PHONE)).i(0.5)[2])).toBe(true);
    // Here it is all but the pure zoom out it looks like.
    const pure = flight(deep, out(0), PHONE);
    for (const hair of [2e-6, 1e-5, 5e-5]) {
      const f = flight(deep, out(hair), PHONE);
      expect(f.duration).toBe(pure.duration);
      for (let t = 0.05; t < 1; t += 0.05) {
        const camera = f.at(t);
        expect(camera.scale / pure.at(t).scale).toBeCloseTo(1, 6);
        closeTo(camera, pure.at(t), 2);
      }
    }
  });

  it("stays finite on a very long way across", () => {
    const f = flight(centreOn(PHONE, { x: 0, y: 0 }, 20), centreOn(PHONE, { x: 1e9, y: 0 }, 20), PHONE);
    expect(f.duration).toBe(1200);
    for (let t = 0.05; t < 1; t += 0.05) {
      const camera = f.at(t);
      expect([camera.scale, camera.x, camera.y].every(Number.isFinite)).toBe(true);
      expect(camera.scale).toBeGreaterThan(0);
    }
  });
});

describe("ease", () => {
  it("is cubic in and out: still at the ends, halfway at half time, symmetric", () => {
    expect(ease(0)).toBe(0);
    expect(ease(1)).toBe(1);
    expect(ease(0.5)).toBe(0.5);
    expect(ease(0.25)).toBeCloseTo(4 * 0.25 ** 3, 12);
    for (let t = 0; t <= 1; t += 0.1) expect(ease(t) + ease(1 - t)).toBeCloseTo(1, 12);
  });

  it("only goes forwards, and stays in [0, 1] outside it", () => {
    for (let t = 0.01; t <= 1; t += 0.01) expect(ease(t)).toBeGreaterThan(ease(t - 0.01));
    expect(ease(-0.5)).toBe(0);
    expect(ease(1.5)).toBe(1);
  });
});
