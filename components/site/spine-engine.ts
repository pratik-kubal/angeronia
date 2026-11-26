import motionStyles from "@/styles/motion.module.css";

/**
 * The spine's behaviour, ported from the draft's `js/page.js` and its held
 * scene (`js/seam.js` on `js/stage.js`), in plain TypeScript on one
 * `requestAnimationFrame` loop (ADR-025, ADR-027, ADR-031):
 *
 * 1. **The line.** Drawn down the first screen as the page loads, then kept at
 *    or below the foot of the screen as the reader scrolls; when the reader
 *    scrolls fast it catches up within a few frames.
 * 2. **Its breaks.** Wherever a statement, a picture, the replica or the button
 *    crosses the axis, measured from the page as it is now, with 0.14em of air
 *    for type and 18px for a block, and never a piece shorter than 40px.
 * 3. **The pull** (desktop, motion allowed). Each crossing statement low on the
 *    screen is split open at the axis, evenly on both sides, and closes as it
 *    rises; shut from 45% of the screen up.
 * 4. **The belief, held** (desktop, motion allowed). A sticky stage, 0.8 of a
 *    screen of scroll, whose two halves close evenly onto the axis: a linear
 *    map from scroll position to two translations.
 * 5. **A slow drift** on the two photographs, and **reveals** once per block.
 *
 * Everything it finds, it finds by data attribute: `data-spined` (a band) and
 * its `data-spine-track`, `data-statement` / `data-motion`, `data-line`,
 * `data-part`, `data-cross` (a block that may cross the axis), `data-scene` /
 * `data-scene-stage` / `data-seam`, `data-drift`. Transforms and opacity only;
 * native scroll. Without `html.js` (no script, or a story) it does nothing, and
 * the page is the finished page. It returns its own undo.
 */
export function startSpine(): () => void {
  const html = document.documentElement;
  if (!html.classList.contains("js")) return () => {};

  const bands = [...document.querySelectorAll<HTMLElement>("[data-spined]")];
  if (bands.length === 0) return () => {};

  const reduce = matchMedia("(prefers-reduced-motion: reduce)");
  const narrow = matchMedia("(max-width: 899px)");
  const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
  /** A length or duration read from CSS, in its own unit; `fallback` only when there is none (0 is a value). */
  const read = (value: string, fallback: number) => {
    const n = parseFloat(value);
    return Number.isNaN(n) ? fallback : n;
  };

  /** No piece of the line shorter than this between two breaks. */
  const MIN_PIECE = 40;
  /** Air above and below a block that crosses the axis. */
  const BLOCK_AIR = 18;
  /** Air above and below type that crosses it, in its own em. */
  const TYPE_AIR = 0.14;
  /** The line is drawn down the first screen in this time (--dur-arrive). */
  const DRAW_MS = read(getComputedStyle(html).getPropertyValue("--dur-arrive"), 1150);
  /**
   * Whether the page is still holding the no-script line back for the script
   * (band.module.css's wait on the band's ::before). If the script came after
   * --dur-script-wait, the whole line is already on screen: keep it whole
   * rather than hide it and draw it down again.
   */
  const heldBack =
    typeof bands[0].getAnimations !== "function" ||
    bands[0].getAnimations({ subtree: true }).some((a) => {
      const effect = a.effect as KeyframeEffect | null;
      return effect?.target === bands[0] && effect.pseudoElement === "::before";
    });
  const t0 = performance.now();

  let stopped = false;
  const undo: (() => void)[] = [];
  const listen = (target: EventTarget, type: string, fn: (event: Event) => void, options?: AddEventListenerOptions) => {
    target.addEventListener(type, fn, options);
    undo.push(() => target.removeEventListener(type, fn, options));
  };

  // ── Reveals: whatever is already on screen counts as revealed, before
  //    anything is allowed to hide (ADR-031). ──────────────────────────────
  const reveals = [...document.querySelectorAll<HTMLElement>(`.${CSS.escape(motionStyles.reveal)}`)];
  const onScreen = (el: Element) => {
    const r = el.getBoundingClientRect();
    return r.top < innerHeight && r.bottom > 0;
  };
  for (const el of reveals) if (onScreen(el)) el.setAttribute("data-in", "");

  html.classList.add("spine-live");

  // ── The line, in pieces: one pool per band, so each piece takes its band's ink.
  type Pool = { band: HTMLElement; track: HTMLElement; els: HTMLElement[] };
  const pools: Pool[] = bands.map((band) => ({
    band,
    track: band.querySelector<HTMLElement>(":scope > [data-spine-track]") ?? band,
    els: [],
  }));
  const drawn = new Map<HTMLElement, string>();
  const piece = (pool: Pool, i: number) => {
    while (pool.els.length <= i) {
      const el = document.createElement("i");
      pool.track.appendChild(el);
      pool.els.push(el);
    }
    return pool.els[i];
  };

  // ── What crosses the line, what pulls apart, what the scene moves ──────
  type Mask = { el: HTMLElement; pad: number };
  type Pull = { st: HTMLElement; parts: { L: HTMLElement; R: HTMLElement }[]; follow: HTMLElement[]; xl: number; xr: number };
  type SeamItem = { el: HTMLElement; dx: number; x: number };
  let masks: Mask[] = [];
  let pulls: Pull[] = [];
  let seam: SeamItem[] = [];
  const scene = document.querySelector<HTMLElement>('[data-scene="seam"]');
  let sceneLive = false;
  const drifts = [...document.querySelectorAll<HTMLElement>("[data-drift]")];

  const pulled = () => pulls.flatMap((p) => [...p.parts.flatMap((q) => [q.L, q.R]), ...p.follow]);

  const collect = () => {
    // Undo what this script moved, so every measurement reads the page at rest.
    for (const el of pulled()) el.style.transform = "";
    for (const s of seam) {
      s.el.style.transform = "";
      s.el.style.willChange = "";
    }

    masks = [
      ...document.querySelectorAll<HTMLElement>(
        "[data-statement] [data-part], [data-statement] [data-line]:not([data-line='x']), [data-cross]",
      ),
    ].map((el) => ({
      el,
      pad: el.hasAttribute("data-cross") ? BLOCK_AIR : TYPE_AIR * parseFloat(getComputedStyle(el).fontSize),
    }));

    const moving = !reduce.matches && !narrow.matches;

    // One pull per statement: its crossing lines open and close together, so
    // their edges stay registered; a hanging or pushed line travels with the
    // right halves, so the steps stay registered too.
    pulls = [];
    if (moving) {
      for (const st of document.querySelectorAll<HTMLElement>('[data-statement][data-motion="pull"]')) {
        const parts = [...st.querySelectorAll<HTMLElement>(':scope > [data-line="x"]')]
          .filter((line) => getComputedStyle(line).display === "grid")
          .map((line) => ({
            L: line.querySelector<HTMLElement>(':scope > [data-part="l"]'),
            R: line.querySelector<HTMLElement>(':scope > [data-part="r"]'),
          }))
          .filter((p): p is { L: HTMLElement; R: HTMLElement } => p.L !== null && p.R !== null);
        const follow = [...st.querySelectorAll<HTMLElement>(':scope > [data-line="h"], :scope > [data-line="p"]')];
        if (parts.length) pulls.push({ st, parts, follow, xl: 0, xr: 0 });
      }
    }

    // The held scene: live only where it can be held; otherwise the section
    // is an ordinary band showing the finished, closed statement. Its held
    // geometry is CSS from the first paint, on the same conditions
    // (belief.module.css), so marking it live moves nothing (ADR-032).
    sceneLive = scene !== null && moving;
    seam = [];
    if (scene) {
      scene.toggleAttribute("data-live", sceneLive);
      if (sceneLive) {
        const stage = scene.querySelector<HTMLElement>("[data-scene-stage]") ?? scene;
        const sr = stage.getBoundingClientRect();
        const pad = read(getComputedStyle(stage).paddingLeft, 0);
        for (const el of scene.querySelectorAll<HTMLElement>("[data-seam]")) {
          const r = el.getBoundingClientRect();
          // Open: "your" side out to the left margin, the studio's to the right one.
          const dx = el.dataset.seam === "l" ? -Math.max(0, r.left - (sr.left + pad)) : Math.max(0, sr.right - pad - r.right);
          // The sides move every frame while the scene is held: a layer each
          // (set here, by the script that moves them, not by Belief's CSS: ADR-035).
          el.style.willChange = "transform";
          seam.push({ el, dx, x: Number.NaN });
        }
      }
    }
  };

  // ── The frame ───────────────────────────────────────────────────────────
  // The line's tip, in page coordinates: at the top, to be drawn down, unless
  // the whole line is already showing (see heldBack).
  let tipDoc = heldBack ? 0 : Number.POSITIVE_INFINITY;
  let queued = false;
  let raf = 0;
  /** Until then, keep drawing: something that moves a break is in motion. */
  let followUntil = 0;

  const frame = () => {
    queued = false;
    if (stopped) return;
    const H = innerHeight;
    const W = innerWidth;
    const sy = scrollY;
    let again = performance.now() < followUntil;

    // 1. The tip: drawn down the first screen on load, then kept ahead of the reader.
    let tip = Number.POSITIVE_INFINITY;
    if (!reduce.matches) {
      const target = sy + H + 2;
      const k = heldBack ? clamp((performance.now() - t0) / DRAW_MS, 0, 1) : 1;
      if (k < 1) {
        tipDoc = Math.max(tipDoc, (1 - Math.pow(1 - k, 3)) * target);
        again = true;
      } else if (target - tipDoc > 0.5) {
        const d = target - tipDoc;
        tipDoc += Math.max(d * 0.24, Math.min(d, 8));
        again = true;
      }
      tip = tipDoc;
    }

    // 2. The pull: a crossing statement low on the screen is open at the axis,
    //    closed from 45% of the screen up; quick near the close, so a still shows
    //    it open or shut.
    const M = read(getComputedStyle(bands[0]).paddingLeft, 16);
    const moves = pulls.map((p) => {
      const r = p.st.getBoundingClientRect();
      if (r.bottom < -40 || r.top > H + 160) return [0, 0];
      const yc = (r.top + r.bottom) / 2 / H;
      const open = Math.pow(clamp((yc - 0.45) / 0.5, 0, 1), 0.8);
      if (!open) return [0, 0];
      let roomL = 0.2 * W;
      let roomR = 0.2 * W;
      for (const { L, R } of p.parts) {
        const l = L.getBoundingClientRect();
        const rr = R.getBoundingClientRect();
        roomL = Math.min(roomL, l.left - p.xl - M - 2);
        roomR = Math.min(roomR, W - M - 2 - (rr.right - p.xr));
      }
      for (const el of p.follow) roomR = Math.min(roomR, W - M - 2 - (el.getBoundingClientRect().right - p.xr));
      // Both halves travel the same distance, the smaller room, so a statement
      // with a long left half still opens evenly about the axis (ADR-033).
      const room = Math.max(0, Math.min(roomL, roomR)) * open;
      return [-room, room];
    });
    pulls.forEach((p, i) => {
      const [xl, xr] = moves[i].map((v) => Math.round(v * 10) / 10);
      if (xl !== p.xl) {
        p.xl = xl;
        for (const { L } of p.parts) L.style.transform = xl ? `translate3d(${xl}px,0,0)` : "";
      }
      if (xr !== p.xr) {
        p.xr = xr;
        for (const el of [...p.parts.map((q) => q.R), ...p.follow]) el.style.transform = xr ? `translate3d(${xr}px,0,0)` : "";
      }
    });

    // 3. The held scene: progress through the hold, linear (ADR-027).
    if (sceneLive && scene) {
      const r = scene.getBoundingClientRect();
      const span = r.height - H;
      const progress = span > 0 ? clamp(-r.top / span, 0, 1) : 1;
      for (const s of seam) {
        const x = Math.round(s.dx * (1 - progress) * 10) / 10;
        if (x !== s.x) {
          s.x = x;
          s.el.style.transform = x ? `translate3d(${x}px,0,0)` : "";
        }
      }
    }

    // 4. The breaks: wherever anything crosses the axis, measured as it is now.
    const axisVw = read(getComputedStyle(html).getPropertyValue("--axis"), 38);
    const axisX = (axisVw / 100) * W;
    const win0 = sy - 140;
    const win1 = sy + H + 140;
    const gaps: [number, number][] = [];
    for (const m of masks) {
      const r = m.el.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) continue;
      if (r.bottom + sy < win0 || r.top + sy > win1) continue;
      if (r.left > axisX + 1.5 || r.right < axisX - 1.5) continue;
      gaps.push([r.top + sy - m.pad, r.bottom + sy + m.pad]);
    }
    gaps.sort((a, b) => a[0] - b[0]);
    const merged: [number, number][] = [];
    for (const g of gaps) {
      const last = merged[merged.length - 1];
      if (last && g[0] <= last[1]) last[1] = Math.max(last[1], g[1]);
      else merged.push([g[0], g[1]]);
    }

    const rects = bands.map((b) => b.getBoundingClientRect());
    const docStart = rects[0].top + sy;
    const docEnd = rects[rects.length - 1].bottom + sy;
    const lo = Math.max(win0, docStart);
    const hi = Math.min(win1, tip, docEnd);
    const segs: [number, number][] = [];
    let at = lo;
    for (const [a, b] of merged) {
      if (b <= at) continue;
      if (a >= hi) break;
      if (a > at) segs.push([at, Math.min(a, hi)]);
      at = Math.max(at, b);
    }
    if (at < hi) segs.push([at, hi]);
    const keep = segs.filter(([a, b]) => b - a >= MIN_PIECE || a <= lo + 0.5 || b >= hi - 0.5);

    // 5. Draw the pieces into their bands (each overlaps the next band by 1px).
    pools.forEach((pool, i) => {
      const top = rects[i].top + sy;
      const bot = rects[i].bottom + sy;
      let n = 0;
      for (const [a, b] of keep) {
        const s = Math.max(a, top);
        const e = Math.min(b, bot) + (b > bot ? 1 : 0);
        if (e - s < 0.5) continue;
        const el = piece(pool, n++);
        const v = `translate3d(0,${(s - top).toFixed(1)}px,0) scaleY(${((e - s) / 100).toFixed(4)})`;
        if (drawn.get(el) !== v) {
          drawn.set(el, v);
          el.style.transform = v;
        }
      }
      for (let k = n; k < pool.els.length; k++) {
        const el = pool.els[k];
        if (drawn.get(el) !== "off") {
          drawn.set(el, "off");
          el.style.transform = "scaleY(0)";
        }
      }
    });

    // 6. A slow drift on the photographs (scroll-linked, never on its own).
    if (!reduce.matches) {
      for (const img of drifts) {
        const frameEl = img.parentElement;
        if (!frameEl) continue;
        const r = frameEl.getBoundingClientRect();
        if (r.bottom < -H || r.top > 2 * H) continue;
        const p = (r.top + r.height / 2) / H;
        const ty = clamp((0.5 - p) * 7, -4, 4);
        img.style.transform = `translate3d(0, ${ty.toFixed(2)}%, 0) scale(1.08)`;
      }
    }

    if (again) request();
  };

  const request = () => {
    if (queued || stopped) return;
    queued = true;
    raf = requestAnimationFrame(frame);
  };

  /** Re-measure, then draw at once, so no frame shows the page half-measured. */
  const refresh = () => {
    if (stopped) return;
    collect();
    frame();
  };

  const restart = () => {
    if (reduce.matches) for (const img of drifts) img.style.transform = "";
    refresh();
  };

  refresh();

  listen(window, "scroll", request, { passive: true });
  listen(window, "resize", refresh);
  listen(window, "load", refresh);
  listen(narrow, "change", restart);
  listen(reduce, "change", restart);
  document.fonts?.ready.then(refresh).catch(() => {});

  // A layout change the window does not announce (fonts, a picture) moves what
  // the line breaks for.
  const ro = new ResizeObserver(() => refresh());
  ro.observe(document.body);
  undo.push(() => ro.disconnect());

  // Reveals and the hero's arrival move things the line breaks for: follow
  // them for a moment after each one starts, inside the one loop. Only what can
  // move a break counts: a transform on an element (a reveal rising, a press),
  // or an animation on one (the hero's arrival). A hover's colour, or anything
  // on a pseudo-element (the line's own wait, a tab's underline), does not.
  const MOVES = new Set(["transform", "translate", "scale"]);
  const followFor = (ms: number) => {
    followUntil = Math.max(followUntil, performance.now() + ms);
    request();
  };
  listen(
    window,
    "transitionrun",
    (e) => {
      const t = e as TransitionEvent;
      if (!t.pseudoElement && MOVES.has(t.propertyName)) followFor(1000);
    },
    { capture: true },
  );
  listen(
    window,
    "animationstart",
    (e) => {
      if (!(e as AnimationEvent).pseudoElement) followFor(1400);
    },
    { capture: true },
  );

  // ── Reveal once, as each block comes into view ─────────────────────────
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        e.target.setAttribute("data-in", "");
        io.unobserve(e.target);
      }
    },
    { rootMargin: "0px 0px -3% 0px", threshold: 0.01 },
  );
  for (const el of reveals) if (!el.hasAttribute("data-in")) io.observe(el);
  undo.push(() => io.disconnect());
  // A block that takes focus before it has come into view is revealed at once
  // (motion.module.css shows it without a transition while it holds focus), so
  // a focus ring is never drawn on something invisible (ADR-032).
  const revealSelector = `.${CSS.escape(motionStyles.reveal)}`;
  listen(document, "focusin", (e) => {
    let el = e.target instanceof Element ? e.target.closest<HTMLElement>(revealSelector) : null;
    while (el) {
      if (!el.hasAttribute("data-in")) {
        el.setAttribute("data-in", "");
        io.unobserve(el);
      }
      el = el.parentElement?.closest<HTMLElement>(revealSelector) ?? null;
    }
  });
  // Anything on screen once the page has settled is shown, whatever the observer said.
  const late = window.setTimeout(() => {
    for (const el of reveals) if (onScreen(el)) el.setAttribute("data-in", "");
  }, 1500);
  undo.push(() => window.clearTimeout(late));

  return () => {
    stopped = true;
    cancelAnimationFrame(raf);
    for (const fn of undo) fn();
    for (const el of pulled()) el.style.transform = "";
    for (const s of seam) {
      s.el.style.transform = "";
      s.el.style.willChange = "";
    }
    for (const img of drifts) img.style.transform = "";
    scene?.removeAttribute("data-live");
    for (const pool of pools) for (const el of pool.els) el.remove();
    for (const el of reveals) el.removeAttribute("data-in");
    html.classList.remove("spine-live");
  };
}
