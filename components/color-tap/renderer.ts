// Draws Color Tap's picture onto the stage canvas, from vectors, so it stays sharp at any zoom.
// Each frame, in order: the white paper; the painted areas (each colour's areas one path, stroked a
// device pixel wide in their own colour so neighbours leave no seam); a quiet grey checker over the
// selected colour's open areas, fixed to the screen (a dot and a tint where an area is too small to
// see it); the outlines still to paint (an edge between two painted areas fades to a whisper, and
// to nothing once the picture is done); the numbers, sized to the circle that fits each area on
// screen and hidden when too small to read; then what moves: paint spreading from the finger, a few
// specks of colour, the magnifier's ring and the keyboard's focus ring. Paths are built once per
// area and segment and combined only when what's painted changes. Nothing here touches React.

import { traceHalf, traceRegion } from "@/lib/color-tap/geometry";
import type { Camera, Size } from "@/lib/color-tap/camera";
import type { Puzzle } from "@/lib/color-tap/types";

const PAPER = "#ffffff";
const OUTLINE = "#707070";
const NUMBER = "#595959";
const NUMBER_SELECTED = "#262626";
const CHECK_DARK = "#d9d9d9";
const CHECK_LIGHT = "#f2f2f2";
/** A checker cell, CSS px. */
const CHECK = 6;
const TINT = "rgba(79, 140, 255, 0.32)";
const RING = "#4f8cff";
const FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif';
/** Numbers are drawn from this size up (CSS px), fading in over the next two. */
const MIN_NUMBER = 7;
const MAX_NUMBER = 20;
/** An open area of the selected colour smaller than this across on screen (CSS px) gets a dot. */
const DOT_BELOW = 8;
/** Painted outlines keep this much of their ink until the picture is finished. */
const PAINTED_EDGE = 0.18;

export interface Reveal {
  area: number;
  /** Where the paint starts spreading from, work px. */
  x: number;
  y: number;
  start: number;
  duration: number;
}

interface Speck {
  x: number;
  y: number;
  vx: number;
  vy: number;
  start: number;
  colour: string;
}

/** Ease out: quick to start, gentle to land (cubic-bezier(.2, 0, 0, 1), near enough). */
const easeOut = (t: number) => 1 - (1 - t) ** 3;
const clamp01 = (t: number) => Math.max(0, Math.min(1, t));

export class Renderer {
  readonly puzzle: Puzzle;
  /** The colour whose open areas are highlighted, or -1. */
  selected = -1;
  /** The area the keyboard is on, or -1. */
  focus = -1;
  /** The outlines' and numbers' ink: 1 while painting, 0 once the picture is finished. */
  sheet = 1;
  /** Fewer, cheaper frames: no specks (reduced motion). */
  calm = false;

  private regionPaths: (Path2D | null)[];
  private segmentPaths: (Path2D | null)[];
  /** What the frame shows as painted: painted, and its paint has finished spreading. */
  private shown: Uint8Array;
  private painted: Uint8Array;
  private colourPaths: (Path2D | null)[];
  private openPaths: (Path2D | null)[];
  private colourDirty: Uint8Array;
  private openDirty: Uint8Array;
  private strokeOpen: Path2D | null = null;
  private strokeDone: Path2D | null = null;
  private strokesDirty = true;
  /** For each colour, its areas. */
  private byColour: number[][];
  private reveals: Reveal[] = [];
  private specks: Speck[] = [];
  private rings: { areas: number[]; start: number; duration: number } | null = null;
  private bump: { area: number; start: number } | null = null;
  private highlightFrom = -Infinity;
  private lastNow = 0;
  private pattern: CanvasPattern | null = null;

  constructor(puzzle: Puzzle) {
    this.puzzle = puzzle;
    const n = puzzle.regions.length;
    const k = puzzle.palette.length;
    this.regionPaths = new Array(n).fill(null);
    this.segmentPaths = new Array(puzzle.segments.length).fill(null);
    this.shown = new Uint8Array(n);
    this.painted = new Uint8Array(n);
    this.colourPaths = new Array(k).fill(null);
    this.openPaths = new Array(k).fill(null);
    this.colourDirty = new Uint8Array(k).fill(1);
    this.openDirty = new Uint8Array(k).fill(1);
    this.byColour = Array.from({ length: k }, () => []);
    puzzle.regions.forEach((r, i) => this.byColour[r.colour].push(i));
  }

  regionPath(area: number): Path2D {
    let path = this.regionPaths[area];
    if (!path) {
      path = new Path2D();
      traceRegion(path, this.puzzle, this.puzzle.regions[area]);
      this.regionPaths[area] = path;
    }
    return path;
  }

  private segmentPath(s: number): Path2D {
    let path = this.segmentPaths[s];
    if (!path) {
      path = new Path2D();
      traceHalf(path, this.puzzle.segments[s], false, true);
      this.segmentPaths[s] = path;
    }
    return path;
  }

  /** What's painted now. Areas painted since the last call show at once unless a reveal is spreading them. */
  setPainted(painted: Uint8Array) {
    const spreading = new Set(this.reveals.map((r) => r.area));
    // Never past this puzzle's areas, whatever is handed in.
    for (let i = 0; i < Math.min(painted.length, this.painted.length); i++) {
      if (painted[i] === this.painted[i]) continue;
      this.painted[i] = painted[i];
      if (!painted[i] || !spreading.has(i)) this.show(i, painted[i]);
    }
  }

  private show(area: number, on: number) {
    if (this.shown[area] === on) return;
    this.shown[area] = on;
    const colour = this.puzzle.regions[area].colour;
    this.colourDirty[colour] = 1;
    this.openDirty[colour] = 1;
    this.strokesDirty = true;
  }

  /** Paint spreading through `area` from (x, y), work px. */
  reveal(area: number, x: number, y: number, now: number, duration: number) {
    this.reveals = this.reveals.filter((r) => r.area !== area);
    this.reveals.push({ area, x, y, start: now, duration });
  }

  /** A few specks of the area's colour thrown from (x, y), stage CSS px. */
  splash(area: number, x: number, y: number, now: number) {
    if (this.calm) return;
    const colour = this.puzzle.palette[this.puzzle.regions[area].colour];
    for (let i = 0; i < 7; i++) {
      const angle = (i / 7) * Math.PI * 2 + ((area * 7 + i * 13) % 10) / 10;
      const speed = 0.06 + ((area + i * 17) % 10) / 160;
      this.specks.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 0.03, start: now, colour });
    }
  }

  /** The magnifier's ring around `areas`, pulsing twice. */
  ring(areas: number[], now: number, duration: number) {
    this.rings = { areas, start: now, duration };
  }

  /** A wrong tap: the area's number swells and settles. */
  nudge(area: number, now: number) {
    this.bump = { area, start: now };
  }

  /** The selected colour changed: its checker brightens once. */
  select(colour: number, now: number) {
    if (colour !== this.selected) this.highlightFrom = now;
    this.selected = colour;
  }

  stopAnimations() {
    for (const r of this.reveals) this.show(r.area, this.painted[r.area]);
    this.reveals = [];
    this.specks = [];
    this.rings = null;
    this.bump = null;
  }

  /** Releases every cached path (a new picture, or leaving the page). */
  dispose() {
    this.regionPaths.fill(null);
    this.segmentPaths.fill(null);
    this.colourPaths.fill(null);
    this.openPaths.fill(null);
    this.strokeOpen = null;
    this.strokeDone = null;
  }

  private colourPath(colour: number): Path2D | null {
    if (this.colourDirty[colour]) {
      const path = new Path2D();
      let any = false;
      for (const area of this.byColour[colour]) {
        if (!this.shown[area]) continue;
        path.addPath(this.regionPath(area));
        any = true;
      }
      this.colourPaths[colour] = any ? path : null;
      this.colourDirty[colour] = 0;
    }
    return this.colourPaths[colour];
  }

  private openPath(colour: number): Path2D | null {
    if (this.openDirty[colour]) {
      const path = new Path2D();
      let any = false;
      for (const area of this.byColour[colour]) {
        if (this.painted[area]) continue;
        path.addPath(this.regionPath(area));
        any = true;
      }
      this.openPaths[colour] = any ? path : null;
      this.openDirty[colour] = 0;
    }
    return this.openPaths[colour];
  }

  private strokes() {
    if (this.strokesDirty) {
      const open = new Path2D();
      const done = new Path2D();
      this.puzzle.segments.forEach((seg, s) => {
        const a = seg.left >= 0 ? this.shown[seg.left] : 1;
        const b = seg.right >= 0 ? this.shown[seg.right] : 1;
        (a && b ? done : open).addPath(this.segmentPath(s));
      });
      this.strokeOpen = open;
      this.strokeDone = done;
      this.strokesDirty = false;
    }
    return { open: this.strokeOpen!, done: this.strokeDone! };
  }

  private checker(ctx: CanvasRenderingContext2D): CanvasPattern | null {
    if (!this.pattern) {
      const tile = document.createElement("canvas");
      tile.width = CHECK * 2;
      tile.height = CHECK * 2;
      const t = tile.getContext("2d");
      if (!t) return null;
      t.fillStyle = CHECK_LIGHT;
      t.fillRect(0, 0, CHECK * 2, CHECK * 2);
      t.fillStyle = CHECK_DARK;
      t.fillRect(0, 0, CHECK, CHECK);
      t.fillRect(CHECK, CHECK, CHECK, CHECK);
      this.pattern = ctx.createPattern(tile, "repeat");
    }
    return this.pattern;
  }

  /** Whether anything is still moving, so the caller knows to ask for another frame. */
  get busy(): boolean {
    const brightening = !this.calm && this.selected >= 0 && this.sheet > 0 && this.lastNow - this.highlightFrom < 600;
    return brightening || this.reveals.length > 0 || this.specks.length > 0 || this.rings !== null || this.bump !== null;
  }

  /** Draws one frame. `dpr` device px per CSS px; the camera maps work px to stage CSS px. */
  draw(ctx: CanvasRenderingContext2D, view: Size, dpr: number, camera: Camera, now: number) {
    const { puzzle } = this;
    const { scale } = camera;
    const k = dpr * scale;
    this.lastNow = now;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, view.width, view.height);

    // The paper, lifted off the studio's ground.
    ctx.save();
    ctx.shadowColor = "rgba(0, 0, 0, 0.45)";
    ctx.shadowBlur = 28;
    ctx.shadowOffsetY = 8;
    ctx.fillStyle = PAPER;
    ctx.fillRect(camera.x, camera.y, puzzle.width * scale, puzzle.height * scale);
    ctx.restore();

    ctx.save();
    ctx.setTransform(k, 0, 0, k, dpr * camera.x, dpr * camera.y);
    ctx.beginPath();
    ctx.rect(0, 0, puzzle.width, puzzle.height);
    ctx.clip();
    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    // Painted areas.
    for (let c = 0; c < puzzle.palette.length; c++) {
      const path = this.colourPath(c);
      if (!path) continue;
      ctx.fillStyle = puzzle.palette[c];
      ctx.strokeStyle = puzzle.palette[c];
      ctx.lineWidth = 1 / k;
      ctx.fill(path);
      ctx.stroke(path);
    }

    // The selected colour's open areas: a checker fixed to the screen, brightening once when picked.
    if (this.selected >= 0 && this.sheet > 0) {
      const open = this.openPath(this.selected);
      const pattern = this.checker(ctx);
      if (open && pattern) {
        ctx.save();
        ctx.clip(open);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        const lit = clamp01((now - this.highlightFrom) / 600);
        ctx.globalAlpha = this.sheet;
        ctx.fillStyle = pattern;
        ctx.fillRect(0, 0, view.width, view.height);
        if (lit < 1 && !this.calm) {
          ctx.globalAlpha = this.sheet * 0.35 * Math.sin(lit * Math.PI);
          ctx.fillStyle = TINT;
          ctx.fillRect(0, 0, view.width, view.height);
        }
        ctx.restore();
      }
    }

    // Paint still spreading.
    for (const r of this.reveals) {
      const t = clamp01((now - r.start) / r.duration);
      const region = puzzle.regions[r.area];
      const [x0, y0, x1, y1] = region.box;
      const reach = Math.max(Math.hypot(r.x - x0, r.y - y0), Math.hypot(r.x - x1, r.y - y0), Math.hypot(r.x - x0, r.y - y1), Math.hypot(r.x - x1, r.y - y1));
      ctx.save();
      ctx.clip(this.regionPath(r.area));
      ctx.fillStyle = puzzle.palette[region.colour];
      ctx.beginPath();
      ctx.arc(r.x, r.y, Math.max(0.01, reach * easeOut(t)), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Outlines.
    if (this.sheet > 0) {
      const { open, done } = this.strokes();
      const width = Math.min(2.5, Math.max(1, scale * 0.18));
      ctx.lineWidth = width / scale;
      ctx.strokeStyle = OUTLINE;
      ctx.globalAlpha = this.sheet;
      ctx.stroke(open);
      ctx.globalAlpha = this.sheet * PAINTED_EDGE;
      ctx.stroke(done);
      ctx.globalAlpha = 1;
    }
    ctx.restore();

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (this.sheet > 0) this.drawDots(ctx, view, camera);
    if (this.sheet > 0) this.drawNumbers(ctx, view, camera, now);
    this.drawOverlay(ctx, dpr, camera, now);
    this.settle(now);
  }

  /** Open areas of the selected colour too small to see at this zoom: a tint and a dot each. */
  private drawDots(ctx: CanvasRenderingContext2D, view: Size, camera: Camera) {
    if (this.selected < 0) return;
    const { puzzle } = this;
    const { scale } = camera;
    for (const area of this.byColour[this.selected]) {
      if (this.painted[area]) continue;
      const label = puzzle.regions[area].labels[0];
      if (label.r * 2 * scale >= DOT_BELOW) continue;
      const x = camera.x + label.x * scale;
      const y = camera.y + label.y * scale;
      if (x < -8 || y < -8 || x > view.width + 8 || y > view.height + 8) continue;
      ctx.save();
      ctx.translate(camera.x, camera.y);
      ctx.scale(scale, scale);
      ctx.globalAlpha = this.sheet;
      ctx.fillStyle = TINT;
      ctx.fill(this.regionPath(area));
      ctx.restore();
      ctx.globalAlpha = this.sheet;
      ctx.beginPath();
      ctx.arc(x, y, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = "#3d3d3d";
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = PAPER;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }

  private drawNumbers(ctx: CanvasRenderingContext2D, view: Size, camera: Camera, now: number) {
    const { puzzle } = this;
    const { scale } = camera;
    const fading = new Map<number, number>();
    for (const r of this.reveals) fading.set(r.area, 1 - clamp01((now - r.start) / Math.min(150, r.duration)));
    const bumpScale = (area: number) => {
      if (!this.bump || this.bump.area !== area) return 1;
      const t = clamp01((now - this.bump.start) / 200);
      return 1 + 0.25 * Math.sin(t * Math.PI);
    };
    // Grouped by font, so the font changes as few times as possible.
    const groups = new Map<string, { x: number; y: number; text: string; alpha: number }[]>();
    puzzle.regions.forEach((region, area) => {
      if (this.shown[area]) return;
      const fade = fading.get(area) ?? (this.painted[area] ? 0 : 1);
      if (fade <= 0) return;
      const text = String(region.colour + 1);
      const selected = region.colour === this.selected;
      for (const label of region.labels) {
        const r = label.r * scale;
        let size = Math.min((0.85 * 2 * r) / Math.sqrt((0.6 * text.length) ** 2 + 0.72 ** 2), MAX_NUMBER);
        if (size < MIN_NUMBER) continue;
        const x = camera.x + label.x * scale;
        const y = camera.y + label.y * scale;
        if (x < -size || y < -size || x > view.width + size || y > view.height + size) continue;
        const alpha = this.sheet * fade * clamp01((size - MIN_NUMBER) / 2);
        size *= bumpScale(area);
        const key = `${selected ? 650 : 400} ${Math.round(size * 2) / 2}`;
        let group = groups.get(key);
        if (!group) groups.set(key, (group = []));
        group.push({ x, y: y + size * 0.36, text, alpha });
      }
    });
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.lineJoin = "round";
    for (const [key, items] of groups) {
      const [weight, size] = key.split(" ");
      ctx.font = `${weight} ${size}px ${FONT}`;
      ctx.fillStyle = weight === "650" ? NUMBER_SELECTED : NUMBER;
      ctx.strokeStyle = "rgba(255, 255, 255, 0.92)";
      ctx.lineWidth = 3;
      for (const item of items) {
        ctx.globalAlpha = item.alpha;
        ctx.strokeText(item.text, item.x, item.y);
        ctx.fillText(item.text, item.x, item.y);
      }
    }
    ctx.globalAlpha = 1;
  }

  private drawOverlay(ctx: CanvasRenderingContext2D, dpr: number, camera: Camera, now: number) {
    const { scale } = camera;
    const toWork = () => ctx.setTransform(dpr * scale, 0, 0, dpr * scale, dpr * camera.x, dpr * camera.y);

    if (this.rings) {
      const t = clamp01((now - this.rings.start) / this.rings.duration);
      const pulse = 0.5 + 0.5 * Math.cos(t * Math.PI * 4);
      ctx.save();
      toWork();
      ctx.lineJoin = "round";
      for (const area of this.rings.areas) {
        const path = this.regionPath(area);
        ctx.globalAlpha = (1 - t * 0.6) * (0.35 + 0.4 * pulse);
        ctx.strokeStyle = RING;
        ctx.lineWidth = (6 + 6 * pulse) / scale;
        ctx.stroke(path);
        ctx.globalAlpha = 1 - t * 0.5;
        ctx.lineWidth = 2.5 / scale;
        ctx.stroke(path);
      }
      ctx.restore();
    }

    if (this.focus >= 0) {
      ctx.save();
      toWork();
      const path = this.regionPath(this.focus);
      ctx.lineJoin = "round";
      ctx.strokeStyle = PAPER;
      ctx.lineWidth = 5 / scale;
      ctx.stroke(path);
      ctx.strokeStyle = "#111827";
      ctx.lineWidth = 2.5 / scale;
      ctx.stroke(path);
      ctx.restore();
    }

    if (this.specks.length > 0) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      for (const s of this.specks) {
        const age = now - s.start;
        const t = clamp01(age / 520);
        ctx.globalAlpha = 1 - t;
        ctx.fillStyle = s.colour;
        ctx.beginPath();
        ctx.arc(s.x + s.vx * age, s.y + s.vy * age + 0.00012 * age * age, 3.2 * (1 - t * 0.5), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
  }

  /** Retires whatever has finished moving. */
  private settle(now: number) {
    if (this.reveals.length > 0) {
      const done = this.reveals.filter((r) => now - r.start >= r.duration);
      if (done.length > 0) {
        this.reveals = this.reveals.filter((r) => now - r.start < r.duration);
        for (const r of done) this.show(r.area, this.painted[r.area]);
      }
    }
    if (this.specks.length > 0) this.specks = this.specks.filter((s) => now - s.start < 520);
    if (this.rings && now - this.rings.start >= this.rings.duration) this.rings = null;
    if (this.bump && now - this.bump.start >= 200) this.bump = null;
  }
}
