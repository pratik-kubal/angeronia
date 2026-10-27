"use client";

// The stage: the canvas the picture is painted on, and everything that moves the view. A finger
// pans, two pinch, a tap paints (the game decides what); a mouse wheel or a trackpad pinch zooms at
// the pointer, a trackpad's two-finger scroll pans. Double-click does nothing of its own (its first
// click would paint; the owner's call): every click is a tap. The camera lives in a
// ref and every move draws one frame, so React never re-renders during a gesture. Flights (the
// magnifier, Fit) follow van Wijk & Nuij's smooth zoom path; a flick glides to a stop; a pinch past
// the zoom limits springs back. iOS gets no page zoom, scroll or rubber band from the stage.

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { centreOn, clamp, ease, fit, flight, panBy, scaleOf, sliderOf, toStage, toWork, zoomAbout, zoomRange, type Camera, type Point, type Size, type ZoomRange } from "@/lib/color-tap/camera";
import { Gestures, glide, type Glide, type PointerKind } from "@/lib/color-tap/gesture";
import type { Puzzle } from "@/lib/color-tap/types";
import { Renderer } from "./renderer";

/** CSS px kept clear around the picture when it fits the stage. */
export const MARGIN = 12;
/** WebKit's canvas memory is tight: two device px per CSS px is plenty for lines and numbers. */
const MAX_DPR = 2;
/** How far a pinch may go past the zoom limits before it resists, as a fraction. */
const GIVE = 0.15;
const SPRING_MS = 200;
const STEP_MS = 220;

/** The zoom slider's position (0–1), shared with the slider without re-rendering the game. */
export class ZoomStore {
  /** How many times the fit the most zoom is, so the slider can say how far in it is. */
  ratio = 1;
  private value = 0;
  private listeners = new Set<() => void>();
  set(value: number) {
    if (Math.abs(value - this.value) < 0.001) return;
    this.value = value;
    this.listeners.forEach((l) => l());
  }
  get = () => this.value;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };
}

export interface StageHandle {
  renderer(): Renderer | null;
  /** Draw a frame soon. */
  invalidate(): void;
  camera(): Camera;
  view(): Size;
  range(): ZoomRange;
  /** Jump there, kept in bounds. */
  setCamera(camera: Camera): void;
  /** The whole picture, animated or not. */
  fit(animate: boolean): void;
  /**
   * The whole picture inside the view less these insets (CSS px), say above a sheet that covers
   * the bottom of the stage. May be smaller than the zoom range allows: nothing can be touched
   * while a sheet is up, and the next fit or gesture puts it back in range.
   */
  fitInto(insets: { top: number; right: number; bottom: number; left: number }): void;
  /** Fly there (kept in bounds); true on arrival, false if a touch interrupted it. */
  fly(target: Camera): Promise<boolean>;
  /** Zoom about the middle of the view, briefly animated. */
  zoomBy(factor: number): void;
  /** Pan by CSS px, briefly animated. */
  panBy(dx: number, dy: number): void;
  setSlider(t: number): void;
  /** Where a work point is on the page, in client CSS px. */
  toClient(at: Point): Point;
  /** How long the last full frame took to draw, ms. */
  frameMs(): number;
}

export interface StageProps {
  puzzle: Puzzle | null;
  /** A tap on the picture: the work point, the zoom (CSS px per work px), and the stage point. */
  onTap: (at: Point, scale: number, stage: Point) => void;
  /** The player moved the view: anything that moves it on its own should stop. */
  onMove: () => void;
  /** Every press on the stage, first (wakes the sound inside the gesture, as iOS requires). */
  onPress: () => void;
  zoom: ZoomStore;
  label: string;
  /** The id of the element that says which keys the picture takes. */
  describedBy: string;
  /** Reduced motion: flights and glides jump. */
  calm: boolean;
}

type Motion =
  | { kind: "flight"; from: number; duration: number; at: (t: number) => Camera; done: (arrived: boolean) => void; eased: boolean }
  | { kind: "glide"; from: number; base: Camera; glide: Glide };

export const Stage = forwardRef<StageHandle, StageProps>(function Stage({ puzzle, onTap, onMove, onPress, zoom, label, describedBy, calm }, ref) {
  const box = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const perfRef = useRef<HTMLSpanElement>(null);
  const props = useRef({ onTap, onMove, onPress, calm, zoom });
  props.current = { onTap, onMove, onPress, calm, zoom };

  const s = useRef({
    camera: { scale: 1, x: 0, y: 0 } as Camera,
    view: { width: 0, height: 0 } as Size,
    dpr: 1,
    range: { min: 1, max: 8 } as ZoomRange,
    picture: { width: 1, height: 1 } as Size,
    renderer: null as Renderer | null,
    motion: null as Motion | null,
    frame: 0,
    frameMs: 0,
    samples: [] as number[],
    /** Whether the view is at fit, so a resize keeps fitting. */
    fitted: true,
  });

  const draw = () => {
    const st = s.current;
    st.frame = 0;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const now = performance.now();
    let moving = false;
    if (st.motion) {
      const m = st.motion;
      if (m.kind === "flight") {
        const t = Math.min(1, (now - m.from) / m.duration);
        st.camera = m.at(m.eased ? ease(t) : t);
        if (t >= 1) {
          st.motion = null;
          m.done(true);
        } else moving = true;
      } else {
        const g = m.glide.at(now - m.from);
        st.camera = clamp(panBy(m.base, g.dx, g.dy), st.view, st.picture, st.range, 0);
        if (g.done) st.motion = null;
        else moving = true;
      }
    }
    props.current.zoom.ratio = st.range.max / st.range.min;
    props.current.zoom.set(sliderOf(st.camera.scale, st.range));
    if (ctx && st.renderer && st.view.width > 0) {
      const t0 = performance.now();
      st.renderer.draw(ctx, st.view, st.dpr, st.camera, now);
      st.frameMs = performance.now() - t0;
      if (perfRef.current) {
        st.samples.push(st.frameMs);
        if (st.samples.length >= 30) {
          const sorted = [...st.samples].sort((a, b) => a - b);
          perfRef.current.textContent = `p50 ${sorted[15].toFixed(1)} ms · p95 ${sorted[28].toFixed(1)} ms`;
          st.samples = [];
        }
      }
      if (st.renderer.busy) moving = true;
    }
    if (moving) invalidate();
  };
  const invalidate = () => {
    if (!s.current.frame) s.current.frame = requestAnimationFrame(draw);
  };

  const strict = (camera: Camera) => clamp(camera, s.current.view, s.current.picture, s.current.range, 0);
  const setCamera = (camera: Camera) => {
    s.current.camera = strict(camera);
    s.current.fitted = false;
    invalidate();
  };
  const stopMotion = () => {
    const m = s.current.motion;
    s.current.motion = null;
    if (m?.kind === "flight") m.done(false);
  };
  /** A short straight move (buttons, keys, springs), scale in log space. */
  const glideTo = (target: Camera, ms: number, onDone: (arrived: boolean) => void) => {
    stopMotion();
    const from = s.current.camera;
    if (props.current.calm) {
      s.current.camera = target;
      invalidate();
      onDone(true);
      return;
    }
    const k = Math.log(target.scale / from.scale);
    s.current.motion = {
      kind: "flight",
      from: performance.now(),
      duration: ms,
      eased: true,
      at: (t) => ({ scale: from.scale * Math.exp(k * t), x: from.x + (target.x - from.x) * t, y: from.y + (target.y - from.y) * t }),
      done: onDone,
    };
    invalidate();
  };
  const fly = (target: Camera) =>
    new Promise<boolean>((resolve) => {
      const goal = strict(target);
      s.current.fitted = false;
      if (props.current.calm) {
        stopMotion();
        s.current.camera = goal;
        invalidate();
        resolve(true);
        return;
      }
      stopMotion();
      const path = flight(s.current.camera, goal, s.current.view);
      s.current.motion = { kind: "flight", from: performance.now(), duration: path.duration, eased: true, at: path.at, done: resolve };
      invalidate();
    });
  const fitCamera = () => fit(s.current.view, s.current.picture, MARGIN);

  useImperativeHandle(ref, () => ({
    renderer: () => s.current.renderer,
    invalidate,
    camera: () => s.current.camera,
    view: () => s.current.view,
    range: () => s.current.range,
    setCamera,
    fit(animate) {
      const target = fitCamera();
      if (animate) glideTo(target, 320, () => {});
      else {
        stopMotion();
        s.current.camera = target;
        invalidate();
      }
      s.current.fitted = true;
    },
    fitInto(insets) {
      const { view, picture } = s.current;
      const inner = { width: Math.max(1, view.width - insets.left - insets.right), height: Math.max(1, view.height - insets.top - insets.bottom) };
      const camera = fit(inner, picture, MARGIN);
      stopMotion();
      s.current.camera = { scale: camera.scale, x: camera.x + insets.left, y: camera.y + insets.top };
      s.current.fitted = false;
      invalidate();
    },
    fly,
    zoomBy(factor) {
      const { view } = s.current;
      s.current.fitted = false;
      glideTo(strict(zoomAbout(s.current.camera, factor, { x: view.width / 2, y: view.height / 2 })), STEP_MS, () => {});
    },
    panBy(dx, dy) {
      s.current.fitted = false;
      glideTo(strict(panBy(s.current.camera, dx, dy)), STEP_MS, () => {});
    },
    setSlider(t) {
      stopMotion();
      const { view, range, camera } = s.current;
      setCamera(zoomAbout(camera, scaleOf(t, range) / camera.scale, { x: view.width / 2, y: view.height / 2 }));
    },
    toClient(at) {
      const rect = canvasRef.current?.getBoundingClientRect();
      const p = toStage(s.current.camera, at);
      return { x: p.x + (rect?.left ?? 0), y: p.y + (rect?.top ?? 0) };
    },
    frameMs: () => s.current.frameMs,
  }));

  // A new picture: a new renderer, its zoom range, and the whole picture in view (a resumed painting
  // then sets its own camera).
  useEffect(() => {
    const st = s.current;
    st.renderer?.dispose();
    stopMotion();
    if (!puzzle) {
      st.renderer = null;
      invalidate();
      return;
    }
    const renderer = new Renderer(puzzle);
    renderer.calm = props.current.calm;
    st.renderer = renderer;
    st.picture = { width: puzzle.width, height: puzzle.height };
    const thinnest = Math.min(...puzzle.regions.map((r) => r.labels[0].r));
    st.range = zoomRange(st.view, st.picture, thinnest, MARGIN);
    st.camera = fitCamera();
    st.fitted = true;
    invalidate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [puzzle]);

  useEffect(() => {
    if (s.current.renderer) s.current.renderer.calm = calm;
  }, [calm]);

  // Size: the canvas follows its box; the picture's centre stays put (or it keeps fitting).
  useEffect(() => {
    const el = box.current;
    const canvas = canvasRef.current;
    if (!el || !canvas) return;
    const resize = () => {
      const st = s.current;
      const rect = el.getBoundingClientRect();
      const view = { width: Math.max(1, rect.width), height: Math.max(1, rect.height) };
      const dpr = Math.min(MAX_DPR, window.devicePixelRatio || 1);
      const old = st.view;
      const centre = old.width > 0 ? toWork(st.camera, { x: old.width / 2, y: old.height / 2 }) : null;
      st.view = view;
      st.dpr = dpr;
      canvas.width = Math.round(view.width * dpr);
      canvas.height = Math.round(view.height * dpr);
      if (st.renderer) {
        const thinnest = Math.min(...st.renderer.puzzle.regions.map((r) => r.labels[0].r));
        st.range = zoomRange(view, st.picture, thinnest, MARGIN);
        st.camera = st.fitted || !centre ? fitCamera() : strict(centreOn(view, centre, st.camera.scale));
      }
      // Draw now (a resized canvas is blank), taking the place of any frame already asked for.
      cancelAnimationFrame(st.frame);
      draw();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(el);
    resize();
    return () => {
      observer.disconnect();
      cancelAnimationFrame(s.current.frame);
      s.current.frame = 0;
      s.current.renderer?.dispose();
      // WebKit keeps a canvas's memory until it is sized to nothing.
      canvas.width = 0;
      canvas.height = 0;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Input: native listeners, so touches can be held off the page (non-passive) and nothing re-renders.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gestures = new Gestures();
    let rect = canvas.getBoundingClientRect();
    let pinchAt: Point | null = null;
    /** A press that stopped a glide only stops it, as on iOS: it never paints. */
    let swallowTap = false;
    const local = (e: { clientX: number; clientY: number }) => ({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    const kindOf = (e: PointerEvent): PointerKind => (e.pointerType === "mouse" ? "mouse" : e.pointerType === "pen" ? "pen" : "touch");

    const apply = (events: ReturnType<Gestures["move"]>) => {
      const st = s.current;
      for (const ev of events) {
        if (ev.type === "start") {
          stopMotion();
          st.fitted = false;
          props.current.onMove();
        } else if (ev.type === "pan") {
          st.camera = clamp(panBy(st.camera, ev.dx, ev.dy), st.view, st.picture, st.range, GIVE);
        } else if (ev.type === "pinch") {
          pinchAt = ev.at;
          // Hold the zoom inside its limits (and their give) here, about the fingers: left to clamp,
          // the scale would come back about the middle of the view and slide the picture away.
          const { min, max } = st.range;
          const scale = Math.max(min * (1 - GIVE), Math.min(max * (1 + GIVE), st.camera.scale * ev.factor));
          st.camera = clamp(zoomAbout(panBy(st.camera, ev.dx, ev.dy), scale / st.camera.scale, ev.at), st.view, st.picture, st.range, GIVE);
        } else if (ev.type === "tap") {
          if (!swallowTap) props.current.onTap(toWork(st.camera, { x: ev.x, y: ev.y }), st.camera.scale, { x: ev.x, y: ev.y });
        } else if (ev.type === "end") {
          const { min, max } = st.range;
          const scale = st.camera.scale;
          if (scale < min || scale > max) {
            // Past the limits: spring back about where the fingers were.
            const at = pinchAt ?? { x: st.view.width / 2, y: st.view.height / 2 };
            const target = strict(zoomAbout(st.camera, Math.max(min, Math.min(max, scale)) / scale, at));
            glideTo(target, SPRING_MS, () => {});
          } else {
            st.camera = strict(st.camera);
            const g = props.current.calm ? null : glide(ev.vx, ev.vy);
            if (g) st.motion = { kind: "glide", from: performance.now(), base: st.camera, glide: g };
          }
          pinchAt = null;
        }
      }
      invalidate();
    };

    const onDown = (e: PointerEvent) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      props.current.onPress();
      if (gestures.active === 0) {
        rect = canvas.getBoundingClientRect();
        swallowTap = s.current.motion?.kind === "glide";
        if (swallowTap) s.current.motion = null;
      }
      try {
        canvas.setPointerCapture(e.pointerId);
      } catch {
        // A pointer that is already gone can't be captured; its up event still arrives.
      }
      const p = local(e);
      apply(gestures.down(e.pointerId, p.x, p.y, e.timeStamp, kindOf(e)));
    };
    const onMovePointer = (e: PointerEvent) => {
      if (gestures.active === 0) return;
      const p = local(e);
      apply(gestures.move(e.pointerId, p.x, p.y, e.timeStamp));
    };
    const onUp = (e: PointerEvent) => {
      const p = local(e);
      apply(gestures.up(e.pointerId, p.x, p.y, e.timeStamp));
    };
    const onCancel = (e: PointerEvent) => apply(gestures.cancel(e.pointerId));
    // A flight in progress gives way to the first touch.
    const onCaptureDown = () => {
      if (s.current.motion?.kind === "flight") stopMotion();
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const st = s.current;
      rect = canvas.getBoundingClientRect();
      const at = local(e);
      const lines = e.deltaMode === 1 ? 40 : e.deltaMode === 2 ? 800 : 1;
      const dx = e.deltaX * lines;
      const dy = e.deltaY * lines;
      // A trackpad pinch arrives as a ctrl-wheel; a mouse wheel in whole notches; a trackpad scroll pans.
      const mouseWheel = e.deltaMode !== 0 || (dx === 0 && Math.abs(dy) >= 40 && Number.isInteger(dy));
      stopMotion();
      st.fitted = false;
      props.current.onMove();
      if (e.ctrlKey || mouseWheel) {
        const factor = Math.max(0.5, Math.min(2, Math.exp(-dy * (e.ctrlKey ? 0.01 : 0.0025))));
        st.camera = strict(zoomAbout(st.camera, factor, at));
      } else {
        st.camera = strict(panBy(st.camera, -dx, -dy));
      }
      invalidate();
    };
    // Safari: pinches send gesture events, which would zoom the page. On a Mac's trackpad they are
    // the only pinch there is, so they zoom the picture; on a touch screen the pointers already do.
    let gestureScale = 1;
    const onGestureStart = (e: Event) => {
      e.preventDefault();
      gestureScale = 1;
    };
    const onGestureChange = (e: Event) => {
      e.preventDefault();
      if (navigator.maxTouchPoints > 0) return;
      const g = e as Event & { scale: number; clientX: number; clientY: number };
      const st = s.current;
      rect = canvas.getBoundingClientRect();
      st.camera = strict(zoomAbout(st.camera, g.scale / gestureScale, local(g)));
      gestureScale = g.scale;
      st.fitted = false;
      props.current.onMove();
      invalidate();
    };
    const onTouchMove = (e: TouchEvent) => {
      if (gestures.active > 0) e.preventDefault();
    };
    const onContextMenu = (e: Event) => e.preventDefault();

    canvas.addEventListener("pointerdown", onCaptureDown, { capture: true });
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMovePointer);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onCancel);
    canvas.addEventListener("lostpointercapture", onCancel);
    canvas.addEventListener("wheel", onWheel, { passive: false });
    canvas.addEventListener("touchmove", onTouchMove, { passive: false });
    canvas.addEventListener("gesturestart", onGestureStart);
    canvas.addEventListener("gesturechange", onGestureChange);
    canvas.addEventListener("gestureend", onGestureStart);
    canvas.addEventListener("contextmenu", onContextMenu);
    return () => {
      canvas.removeEventListener("pointerdown", onCaptureDown, { capture: true });
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMovePointer);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onCancel);
      canvas.removeEventListener("lostpointercapture", onCancel);
      canvas.removeEventListener("wheel", onWheel);
      canvas.removeEventListener("touchmove", onTouchMove);
      canvas.removeEventListener("gesturestart", onGestureStart);
      canvas.removeEventListener("gesturechange", onGestureChange);
      canvas.removeEventListener("gestureend", onGestureStart);
      canvas.removeEventListener("contextmenu", onContextMenu);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ?perf shows how long frames take to draw (development only).
  const [showPerf, setShowPerf] = useState(false);
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" && new URLSearchParams(window.location.search).has("perf")) setShowPerf(true);
  }, []);
  return (
    <div ref={box} className="ctp-stage">
      {/* An application: it takes its own keys (see describedBy), so screen readers pass them through. */}
      <canvas ref={canvasRef} className="ctp-canvas" role="application" aria-roledescription="painting" aria-label={label} aria-describedby={describedBy} tabIndex={0} />
      {showPerf && <span ref={perfRef} className="ctp-perf" aria-hidden />}
    </div>
  );
});
