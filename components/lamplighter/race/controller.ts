// The race loop, outside React: the simulation on its fixed 60 Hz tick, the drawing at whatever
// rate the screen manages (each frame between the last two ticks), and the HUD written straight
// into the DOM when a value changes. React hears only about phases: Go, a pause, the finish.
//
// Frame time is clamped (a hidden tab or a slow frame never leaps the race), the loop stops
// entirely while paused or after the finish, and destroy() undoes everything, since Strict Mode
// mounts a race twice in development.

import type { Bot } from "@/lib/lamplighter/bot";
import type { Compiled } from "@/lib/lamplighter/compiled";
import { InputLog, pack } from "@/lib/lamplighter/replay";
import { COUNTDOWN, STEP } from "@/lib/lamplighter/rules";
import { flamesFor } from "@/lib/lamplighter/scoring";
import { createSim, raceTicks, restore, snapshot, step, type Phase, type Sim, type SimEvent } from "@/lib/lamplighter/sim";
import type { InputHub } from "../input";
import { cameraAt, type Pose } from "../render/camera";
import type { Camera } from "../render/project";
import { createGovernor, feed, TIERS } from "../render/quality";
import { createScene } from "../render/scene";

export type RaceResult = { flames: number; ticks: number; glow: number; sparks: number; hits: number; dips: number; log: Uint8Array };

export type RaceHud = {
  /** Its --glow is set to the share of the route's glow Wick holds (0…1). */
  glow: HTMLElement;
  time: HTMLElement;
  count: HTMLElement;
  debug: HTMLElement | null;
};

export type RaceOptions = {
  canvas: HTMLCanvasElement;
  stage: HTMLElement;
  hud: RaceHud;
  route: Compiled;
  input: InputHub;
  reduced: () => boolean;
  /** Extra camera roll (radians): the level horizon in tilt mode. */
  viewRoll: () => number;
  onPhase: (phase: Phase | "paused") => void;
  onEvents: (events: readonly SimEvent[], sim: Sim) => void;
  onFinish: (result: RaceResult) => void;
};

export type RaceView = { roll: number; dpr: number; tier: number; fps: number };

export type RaceController = {
  pause(): void;
  resume(): void;
  restart(): void;
  /** Back to the last way-lamp lit; false if none is lit yet. */
  retryFromLamp(): boolean;
  hasLamp(): boolean;
  state(): Sim;
  view(): RaceView;
  /** Development only: simulation ticks per tick (a time-lapse), and a bot at the controls. */
  speed(k: number): void;
  autopilot(bot: Bot | null): void;
  destroy(): void;
};

/** How long the lantern burns before the results come up (s). */
const LANTERN_HOLD = 1.6;

const clock = (ticks: number) => {
  const tenths = Math.floor((ticks * STEP * 10) % 10);
  const total = Math.floor(ticks * STEP);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}.${tenths}`;
};

export function createRace(opts: RaceOptions): RaceController {
  const { canvas, stage, hud, route, input } = opts;
  const scene = createScene(canvas, route, route.items.length);
  const governor = createGovernor();
  let sim = createSim(route);
  let log = new InputLog();
  let lamp: Sim | null = null;
  let prev: Pose = { s: 0, x: 0, h: 0 };
  let cam: Camera | null = null;
  let tier = TIERS[governor.tier];
  let w = 0;
  let h = 0;
  let dpr = 1;
  let frame = 0;
  let last = 0;
  let acc = 0;
  let t = 0;
  let lit = -1;
  let paused = false;
  let done = false;
  let alive = true;
  let speedK = 1;
  let fps = 60;
  let hudTick = -1;
  let shownGlow = -1;
  let debugAt = 0;

  const finished = () => sim.phase === "finished";
  const pose = (alpha: number): Pose => ({
    s: prev.s + (sim.s - prev.s) * alpha,
    x: prev.x + (sim.x - prev.x) * alpha,
    h: prev.h + (sim.h - prev.h) * alpha,
  });

  function setPhase(phase: Phase | "paused") {
    stage.dataset.phase = phase;
    opts.onPhase(phase);
  }

  function measure() {
    const rect = stage.getBoundingClientRect();
    w = Math.max(1, Math.round(rect.width));
    h = Math.max(1, Math.round(rect.height));
    dpr = Math.min(tier.dpr, window.devicePixelRatio || 1);
    const view = cameraAt(route.track, pose(1), { w, h, viewRoll: 0, reduced: opts.reduced(), dt: 0 }, null);
    scene.resize(w, h, dpr, view);
    cam = null;
  }

  function updateHud(force = false) {
    const tick = Math.floor(sim.tick / 6);
    if (!force && tick === hudTick) return;
    hudTick = tick;
    const share = Math.round((sim.glow / route.maxGlow) * 100) / 100;
    if (share !== shownGlow) {
      shownGlow = share;
      hud.glow.style.setProperty("--glow", String(share));
      stage.dataset.glow = String(sim.glow);
    }
    hud.time.textContent = clock(raceTicks(sim));
    const left = COUNTDOWN - sim.tick;
    const count = sim.phase === "countdown" ? String(Math.ceil(left / 60)) : raceTicks(sim) < 40 ? "Go" : "";
    if (hud.count.textContent !== count) hud.count.textContent = count;
  }

  function draw(dt: number, alpha: number) {
    if (!w) return;
    const p = pose(alpha);
    cam = cameraAt(route.track, p, { w, h, viewRoll: opts.viewRoll(), reduced: opts.reduced(), dt }, cam);
    scene.render({ cam, sim, pose: p, tick: sim.tick + alpha, t, dt, tier, reduced: opts.reduced(), lit: lit < 0 ? -1 : t - lit });
  }

  function handle(events: readonly SimEvent[]) {
    for (const e of events) {
      scene.burst(e.kind, e.item, sim);
      if (e.kind === "lamp") lamp = snapshot(sim);
      else if (e.kind === "go") setPhase("running");
      else if (e.kind === "finish") {
        lit = t;
        setPhase("finished");
      }
    }
    opts.onEvents(events, sim);
  }

  function finish() {
    done = true;
    opts.onFinish({
      flames: flamesFor(route.def, sim),
      ticks: raceTicks(sim),
      glow: sim.glow,
      sparks: sim.sparks,
      hits: sim.hits,
      dips: sim.dips,
      log: log.bytes(),
    });
  }

  function loop(now: number) {
    if (!alive || paused) return;
    const ms = last ? now - last : STEP * 1000;
    last = now;
    // Clamped: a hidden tab's pause or a slow frame never leaps the race.
    const dt = Math.min(0.05, ms / 1000);
    t += dt;
    fps += (1000 / Math.max(1, ms) - fps) * 0.05;
    const next = TIERS[feed(governor, ms)];
    if (next !== tier) {
      tier = next;
      measure();
    }
    if (!finished()) {
      acc += dt;
      while (acc >= STEP) {
        acc -= STEP;
        for (let k = 0; k < speedK && !finished(); k++) {
          prev = { s: sim.s, x: sim.x, h: sim.h };
          const tickInput = input.sample(sim, route, STEP);
          log.push(pack(tickInput));
          step(sim, tickInput, route);
          if (sim.events.length) handle(sim.events);
        }
      }
    }
    updateHud();
    draw(dt, finished() ? 1 : acc / STEP);
    if (hud.debug && now - debugAt > 500) {
      debugAt = now;
      hud.debug.textContent = `${Math.round(fps)} fps · tier ${governor.tier} · ${dpr}×`;
    }
    // (Read afresh: the ticks above may have finished the race.)
    if (finished() && !done && (opts.reduced() || t - lit >= LANTERN_HOLD)) {
      finish();
      return;
    }
    frame = requestAnimationFrame(loop);
  }

  function start() {
    cancelAnimationFrame(frame);
    last = 0;
    frame = requestAnimationFrame(loop);
  }

  function reset(to: Sim) {
    sim = to;
    prev = { s: sim.s, x: sim.x, h: sim.h };
    acc = 0;
    cam = null;
    input.reset();
    updateHud(true);
  }

  const ro = new ResizeObserver(() => {
    measure();
    if (paused || done) draw(0, 1);
  });
  ro.observe(stage);
  measure();
  setPhase("countdown");
  updateHud(true);
  start();

  return {
    pause() {
      if (paused || done || sim.phase === "finished") return;
      paused = true;
      cancelAnimationFrame(frame);
      input.reset();
      setPhase("paused");
    },
    resume() {
      if (!paused) return;
      paused = false;
      setPhase(sim.phase);
      start();
    },
    restart() {
      log = new InputLog();
      lamp = null;
      lit = -1;
      done = false;
      reset(createSim(route));
      setPhase("countdown");
      paused = false;
      start();
    },
    retryFromLamp() {
      if (!lamp) return false;
      const to = createSim(route);
      restore(to, lamp);
      log.truncate(lamp.tick);
      reset(to);
      paused = false;
      setPhase(sim.phase);
      start();
      return true;
    },
    hasLamp: () => lamp !== null,
    state: () => sim,
    view: () => ({ roll: cam?.roll ?? 0, dpr, tier: governor.tier, fps: Math.round(fps) }),
    speed(k) {
      speedK = Math.max(1, Math.min(16, Math.round(k)));
    },
    autopilot(bot) {
      input.autopilot(bot);
    },
    destroy() {
      if (!alive) return;
      alive = false;
      cancelAnimationFrame(frame);
      ro.disconnect();
      input.autopilot(null);
      scene.destroy();
    },
  };
}
