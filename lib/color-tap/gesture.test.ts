import { describe, expect, it } from "vitest";
import { panBy, toWork, zoomAbout, type Camera, type Point } from "./camera";
import { Gestures, SLOP, glide, type GestureEvent } from "./gesture";

// The pointer classifier and the glide. A press that stays within its slop (10 CSS px for a finger
// or pen, 4 for a mouse) taps where it went down, however long it is held; past the slop it pans,
// catching up with the finger, and lifting gives the velocity of the last 60 ms of movement (none
// if it had stopped). Two fingers pinch about their midpoint, keeping the picture under both, and
// never tap; lifting one leaves the other panning with no jump; a third finger is ignored. A
// cancelled pointer never taps and ends a moving gesture still; a pointer that goes down again
// without an up (its up was lost) ends what it was doing the same way and starts a fresh press,
// rather than tapping or panning from where it went down before. The glide follows
// v·τ·(1 − e^(−t/τ)), is capped, stops below its threshold, and isn't started by a slow release.

const types = (events: GestureEvent[]) => events.map((e) => e.type);

/** What the stage does with the events, on a camera. */
function apply(camera: Camera, events: GestureEvent[]): Camera {
  let c = camera;
  for (const e of events) {
    if (e.type === "pan") c = panBy(c, e.dx, e.dy);
    if (e.type === "pinch") c = zoomAbout(panBy(c, e.dx, e.dy), e.factor, e.at);
  }
  return c;
}

const pans = (events: GestureEvent[]) =>
  events.reduce((sum, e) => (e.type === "pan" ? { x: sum.x + e.dx, y: sum.y + e.dy } : sum), { x: 0, y: 0 });

describe("a tap", () => {
  it("is a pointer that goes down and up without moving, at where it went down", () => {
    const g = new Gestures();
    expect(g.down(1, 120, 340, 0, "touch")).toEqual([]);
    expect(g.active).toBe(1);
    expect(g.up(1, 120, 340, 90)).toEqual([{ type: "tap", x: 120, y: 340, kind: "touch" }]);
    expect(g.active).toBe(0);
  });

  it("forgives a finger that wobbles within 10 px, and taps where it first touched", () => {
    const g = new Gestures();
    g.down(1, 100, 100, 0, "touch");
    expect(g.move(1, 106, 103, 30)).toEqual([]);
    expect(g.move(1, 94, 108, 60)).toEqual([]);
    expect(g.move(1, 110, 100, 80)).toEqual([]);
    expect(g.up(1, 108, 105, 120)).toEqual([{ type: "tap", x: 100, y: 100, kind: "touch" }]);
  });

  it("has no time limit", () => {
    const g = new Gestures();
    g.down(1, 50, 60, 0, "pen");
    expect(g.up(1, 52, 61, 8000)).toEqual([{ type: "tap", x: 50, y: 60, kind: "pen" }]);
  });

  it("is held to 4 px with a mouse, and to 10 with a finger or pen", () => {
    expect(SLOP).toEqual({ touch: 10, pen: 10, mouse: 4 });
    const press = (kind: "mouse" | "touch" | "pen", dx: number) => {
      const g = new Gestures();
      g.down(1, 200, 200, 0, kind);
      return types([...g.move(1, 200 + dx, 200, 20), ...g.up(1, 200 + dx, 200, 40)]);
    };
    expect(press("mouse", 4)).toEqual(["tap"]);
    expect(press("mouse", 6)).toEqual(["start", "pan", "end"]);
    expect(press("touch", 6)).toEqual(["tap"]);
    expect(press("touch", 10)).toEqual(["tap"]);
    expect(press("touch", 11)).toEqual(["start", "pan", "end"]);
    expect(press("pen", 11)).toEqual(["start", "pan", "end"]);
  });
});

describe("a drag", () => {
  it("starts past the slop, catching up with everything since the finger went down", () => {
    const g = new Gestures();
    g.down(1, 100, 100, 0, "touch");
    expect(g.move(1, 105, 102, 10)).toEqual([]);
    expect(g.move(1, 112, 104, 20)).toEqual([{ type: "start" }, { type: "pan", dx: 12, dy: 4 }]);
    expect(g.move(1, 130, 110, 30)).toEqual([{ type: "pan", dx: 18, dy: 6 }]);
  });

  it("pans by exactly how far the finger went, so the picture stays under it", () => {
    const g = new Gestures();
    const events = [...g.down(1, 10, 20, 0, "touch")];
    for (let i = 1; i <= 20; i++) events.push(...g.move(1, 10 + i * 7, 20 - i * 3, i * 16));
    events.push(...g.up(1, 150, -45, 340));
    expect(pans(events)).toEqual({ x: 140, y: -65 });
    expect(types(events).filter((t) => t === "start")).toHaveLength(1);
    expect(types(events).at(-1)).toBe("end");
    expect(types(events)).not.toContain("tap");
  });

  it("ends with the velocity of a steady flick, in CSS px per ms", () => {
    const g = new Gestures();
    g.down(1, 0, 0, 1000, "touch");
    for (let t = 8; t <= 160; t += 8) g.move(1, t * 1.5, -t * 0.5, 1000 + t);
    const [end] = g.up(1, 240, -80, 1160);
    expect(end.type).toBe("end");
    if (end.type !== "end") return;
    expect(end.vx).toBeCloseTo(1.5, 9);
    expect(end.vy).toBeCloseTo(-0.5, 9);
  });

  it("measures only the last 60 ms of movement", () => {
    const g = new Gestures();
    g.down(1, 0, 0, 0, "touch");
    // Slowly for 200 ms (0.1 px/ms), then quickly for 80 ms (2 px/ms), every 16 ms or so.
    let x = 0;
    for (let t = 16; t <= 192; t += 16) g.move(1, (x = t * 0.1), 0, t);
    for (let t = 208; t <= 288; t += 16) g.move(1, (x += 32), 0, t);
    const [end] = g.up(1, x, 0, 290);
    if (end.type !== "end") throw new Error("expected an end");
    expect(end.vx).toBeCloseTo(2, 9);
    expect(end.vy).toBe(0);
  });

  it("measures a flick shorter than the window over all of it", () => {
    const g = new Gestures();
    g.down(1, 0, 0, 0, "touch");
    g.move(1, 0, 30, 15);
    const [, end] = [...g.move(1, 0, 60, 30), ...g.up(1, 0, 60, 32)];
    expect(end).toEqual({ type: "end", vx: 0, vy: 2 });
  });

  it("ends still if the finger stopped for more than 60 ms before it lifted", () => {
    const g = new Gestures();
    g.down(1, 0, 0, 0, "touch");
    for (let t = 10; t <= 100; t += 10) g.move(1, t * 2, 0, t);
    expect(g.up(1, 200, 0, 161)).toEqual([{ type: "end", vx: 0, vy: 0 }]);
    // Within 60 ms it still counts.
    const h = new Gestures();
    h.down(1, 0, 0, 0, "touch");
    for (let t = 10; t <= 100; t += 10) h.move(1, t * 2, 0, t);
    const [end] = h.up(1, 200, 0, 150);
    if (end.type !== "end") throw new Error("expected an end");
    expect(end.vx).toBeCloseTo(2, 9);
  });

  it("takes a release away from the last move as one more move", () => {
    const g = new Gestures();
    g.down(1, 0, 0, 0, "mouse");
    expect(g.up(1, 0, 40, 20)).toEqual([
      { type: "start" },
      { type: "pan", dx: 0, dy: 40 },
      { type: "end", vx: 0, vy: 2 },
    ]);
  });
});

describe("a pinch", () => {
  it("starts as the second finger lands, even before either moves", () => {
    const g = new Gestures();
    expect(g.down(1, 100, 300, 0, "touch")).toEqual([]);
    expect(g.down(2, 300, 300, 40, "touch")).toEqual([{ type: "start" }]);
    expect(g.active).toBe(2);
  });

  it("starts only once when the first finger was already panning", () => {
    const g = new Gestures();
    g.down(1, 100, 300, 0, "touch");
    expect(types(g.move(1, 130, 300, 16))).toEqual(["start", "pan"]);
    expect(g.down(2, 300, 300, 30, "touch")).toEqual([]);
  });

  it("zooms by the change in the gap, about the new midpoint, and pans with the midpoint", () => {
    const g = new Gestures();
    g.down(1, 100, 300, 0, "touch");
    g.down(2, 300, 300, 0, "touch");
    // Finger 2 moves out 100 px: the gap goes 200 → 300, the midpoint 200 → 250.
    expect(g.move(2, 400, 300, 16)).toEqual([{ type: "pinch", factor: 1.5, at: { x: 250, y: 300 }, dx: 50, dy: 0 }]);
    // Finger 1 moves up 40: the gap is 300 → 302.65, the midpoint goes up 20.
    const [e] = g.move(1, 100, 260, 32);
    if (e.type !== "pinch") throw new Error("expected a pinch");
    expect(e.factor).toBeCloseTo(Math.hypot(300, 40) / 300, 12);
    expect(e.at).toEqual({ x: 250, y: 280 });
    expect([e.dx, e.dy]).toEqual([0, -20]);
  });

  it("keeps the picture under both fingers as they spread and slide", () => {
    const g = new Gestures();
    const a0: Point = { x: 100, y: 300 };
    const b0: Point = { x: 300, y: 300 };
    let camera: Camera = { scale: 0.5, x: 0, y: 100 };
    const wa = toWork(camera, a0);
    const wb = toWork(camera, b0);
    g.down(1, a0.x, a0.y, 0, "touch");
    g.down(2, b0.x, b0.y, 0, "touch");
    // Each finger in turn, in small steps, along the line between them, while both drift down.
    for (let i = 1; i <= 10; i++) {
      camera = apply(camera, g.move(1, a0.x - 4 * i, a0.y + 3 * i, i * 16));
      camera = apply(camera, g.move(2, b0.x + 6 * i, b0.y + 3 * i, i * 16 + 8));
    }
    const wa1 = toWork(camera, { x: 60, y: 330 });
    const wb1 = toWork(camera, { x: 360, y: 330 });
    expect(wa1.x).toBeCloseTo(wa.x, 9);
    expect(wa1.y).toBeCloseTo(wa.y, 9);
    expect(wb1.x).toBeCloseTo(wb.x, 9);
    expect(wb1.y).toBeCloseTo(wb.y, 9);
    expect(camera.scale).toBeCloseTo(0.5 * (300 / 200), 12);
  });

  it("never taps, even if neither finger moved", () => {
    const g = new Gestures();
    const events = [
      ...g.down(1, 100, 100, 0, "touch"),
      ...g.down(2, 200, 100, 10, "touch"),
      ...g.up(2, 200, 100, 50),
      ...g.up(1, 100, 100, 60),
    ];
    expect(events).toEqual([{ type: "start" }, { type: "end", vx: 0, vy: 0 }]);
  });

  it("never taps when a second finger touched and left before the first lifted", () => {
    const g = new Gestures();
    g.down(1, 100, 100, 0, "touch");
    g.down(2, 200, 100, 10, "touch");
    g.up(2, 200, 100, 20);
    expect(types(g.up(1, 100, 100, 900))).toEqual(["end"]);
    // The next press is a fresh gesture, and taps again.
    g.down(3, 50, 50, 1000, "touch");
    expect(g.up(3, 50, 50, 1050)).toEqual([{ type: "tap", x: 50, y: 50, kind: "touch" }]);
  });

  it("leaves the other finger panning from where it is when one lifts, with no jump", () => {
    const g = new Gestures();
    g.down(1, 100, 300, 0, "touch");
    g.down(2, 300, 300, 0, "touch");
    g.move(1, 80, 310, 16);
    g.move(2, 330, 290, 24);
    expect(g.up(1, 80, 310, 40)).toEqual([]);
    expect(g.active).toBe(1);
    // Finger 2 is at (330, 290): its next move pans by just that move.
    expect(g.move(2, 335, 293, 56)).toEqual([{ type: "pan", dx: 5, dy: 3 }]);
    expect(g.move(2, 345, 293, 72)).toEqual([{ type: "pan", dx: 10, dy: 0 }]);
  });

  it("ends still, whatever the last finger did after it", () => {
    const g = new Gestures();
    g.down(1, 100, 300, 0, "touch");
    g.down(2, 300, 300, 0, "touch");
    g.move(2, 350, 300, 16);
    g.up(1, 100, 300, 30);
    for (let t = 40; t <= 120; t += 8) g.move(2, 350 + (t - 30) * 2, 300, t);
    expect(g.up(2, 530, 300, 122)).toEqual([{ type: "end", vx: 0, vy: 0 }]);
  });

  it("ignores a third finger, down, moving and up", () => {
    const g = new Gestures();
    g.down(1, 100, 300, 0, "touch");
    g.down(2, 300, 300, 0, "touch");
    expect(g.down(3, 200, 500, 10, "touch")).toEqual([]);
    expect(g.active).toBe(2);
    expect(g.move(3, 260, 560, 20)).toEqual([]);
    expect(g.up(3, 260, 560, 30)).toEqual([]);
    // The pinch carries on between the first two.
    expect(types(g.move(2, 320, 300, 40))).toEqual(["pinch"]);
  });

  it("measures no zoom from two fingers on one spot", () => {
    const g = new Gestures();
    g.down(1, 100, 100, 0, "touch");
    g.down(2, 100, 100, 0, "touch");
    const [e] = g.move(2, 140, 100, 16);
    expect(e).toEqual({ type: "pinch", factor: 1, at: { x: 120, y: 100 }, dx: 20, dy: 0 });
  });
});

describe("a cancelled pointer", () => {
  it("never taps", () => {
    const g = new Gestures();
    g.down(1, 100, 100, 0, "touch");
    expect(g.cancel(1)).toEqual([]);
    expect(g.active).toBe(0);
    expect(g.up(1, 100, 100, 50)).toEqual([]);
  });

  it("ends a moving gesture without a glide", () => {
    const g = new Gestures();
    g.down(1, 0, 0, 0, "touch");
    for (let t = 8; t <= 80; t += 8) g.move(1, t * 3, 0, t);
    expect(g.cancel(1)).toEqual([{ type: "end", vx: 0, vy: 0 }]);
    expect(g.move(1, 300, 0, 90)).toEqual([]);
  });

  it("ends a pinch once, for both fingers", () => {
    const g = new Gestures();
    g.down(1, 100, 300, 0, "touch");
    g.down(2, 300, 300, 0, "touch");
    expect(g.cancel(2)).toEqual([{ type: "end", vx: 0, vy: 0 }]);
    expect(g.cancel(1)).toEqual([]);
    expect(g.move(1, 50, 300, 20)).toEqual([]);
    expect(g.active).toBe(0);
  });

  it("is unknown when it never went down", () => {
    expect(new Gestures().cancel(7)).toEqual([]);
  });
});

describe("a pointer that goes down again without coming up", () => {
  it("is a fresh press, so a mouse whose up was lost taps where it went down this time", () => {
    const g = new Gestures();
    g.down(1, 100, 100, 0, "mouse");
    // Its up never came: the next press is the same pointer, somewhere else.
    expect(g.down(1, 300, 260, 500, "mouse")).toEqual([]);
    expect(g.active).toBe(1);
    expect(g.up(1, 300, 260, 560)).toEqual([{ type: "tap", x: 300, y: 260, kind: "mouse" }]);
  });

  it("ends the drag it lost the end of, still, and doesn't jump from where that drag went down", () => {
    const g = new Gestures();
    g.down(1, 0, 0, 0, "mouse");
    for (let t = 8; t <= 80; t += 8) g.move(1, t * 3, 0, t);
    expect(g.down(1, 50, 50, 90, "mouse")).toEqual([{ type: "end", vx: 0, vy: 0 }]);
    // Measured from the new press: within the slop, nothing moves, and lifting taps.
    expect(g.move(1, 52, 50, 100)).toEqual([]);
    expect(g.up(1, 52, 50, 110)).toEqual([{ type: "tap", x: 50, y: 50, kind: "mouse" }]);
  });

  it("ends the pinch it lost a finger of, once, and starts again with one finger", () => {
    const g = new Gestures();
    g.down(1, 100, 300, 0, "touch");
    g.down(2, 300, 300, 0, "touch");
    expect(g.down(1, 120, 320, 400, "touch")).toEqual([{ type: "end", vx: 0, vy: 0 }]);
    expect(g.active).toBe(1);
    // The other finger of the old pinch is forgotten, as after a cancel.
    expect(g.move(2, 340, 300, 410)).toEqual([]);
    expect(g.up(1, 120, 320, 450)).toEqual([{ type: "tap", x: 120, y: 320, kind: "touch" }]);
  });
});

describe("glide", () => {
  const TAU = 325;

  it("isn't started by a release slower than 0.3 px/ms", () => {
    expect(glide(0, 0)).toBeNull();
    expect(glide(0.2, -0.2)).toBeNull();
    expect(glide(0.29, 0)).toBeNull();
    expect(glide(0.3, 0)).not.toBeNull();
  });

  it("travels v·τ·(1 − e^(−t/τ)) in the direction of the flick", () => {
    const g = glide(0.6, -0.8)!;
    const still = g.at(0);
    expect([Math.abs(still.dx), Math.abs(still.dy), still.done]).toEqual([0, 0, false]);
    for (const t of [16, 100, 325, 600]) {
      const { dx, dy } = g.at(t);
      const travelled = TAU * (1 - Math.exp(-t / TAU));
      expect(dx).toBeCloseTo(0.6 * travelled, 9);
      expect(dy).toBeCloseTo(-0.8 * travelled, 9);
    }
  });

  it("starts at the release speed and slows down", () => {
    const g = glide(1, 0)!;
    expect(g.at(1).dx).toBeCloseTo(1, 2);
    let step = Infinity;
    for (let t = 16; t < 1000; t += 16) {
      const moved = g.at(t).dx - g.at(t - 16).dx;
      expect(moved).toBeLessThan(step);
      step = moved;
    }
  });

  it("caps a hard flick at 1.4 px/ms, keeping its direction", () => {
    const g = glide(-6, 8)!;
    const { dx, dy } = g.at(1e6);
    const total = Math.hypot(dx, dy);
    // It stops at 0.02 px/ms, 0.02·τ short of where a 1.4 px/ms glide would go in the end.
    expect(total).toBeCloseTo(1.4 * TAU - 0.02 * TAU, 9);
    expect(dx / dy).toBeCloseTo(-6 / 8, 12);
  });

  it("is done once it is slower than 0.02 px/ms, and stays put after", () => {
    const g = glide(1.2, 0)!;
    const end = TAU * Math.log(1.2 / 0.02);
    expect(g.at(end - 1).done).toBe(false);
    expect(g.at(end).done).toBe(true);
    const rest = g.at(end).dx;
    expect(rest).toBeCloseTo(1.2 * TAU - 0.02 * TAU, 9);
    expect(g.at(end + 5000)).toEqual({ dx: rest, dy: 0, done: true });
  });
});
