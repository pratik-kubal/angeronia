"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useReducer, useRef, useState, type CSSProperties } from "react";
import { ArrowCounterClockwiseIcon, FlagCheckeredIcon, LightbulbIcon, ListIcon } from "@phosphor-icons/react/dist/ssr";
import { NO_MOVES } from "@/data/solitaire";
import { cardName } from "@/lib/solitaire/cards";
import { canFinish, newGame, parseToken, reduce, score, type Action, type GameState, type Last, type PileId, type Table } from "@/lib/solitaire/game";
import type { Hint } from "@/lib/solitaire/hint";
import { bestTarget } from "@/lib/solitaire/targets";
import { Sheet } from "@/components/sudoku/sheet";
import { Animator, type Motion } from "./animator";
import { computeLayout, type Layout } from "./layout";
import { HelpPanel, MenuPanel, ResultPanel, StatsPanel, formatTime } from "./menus";
import {
  GAME,
  NO_STATS,
  claimGame,
  gameFrom,
  loadGame,
  loadStats,
  ownsGame,
  saveGame,
  saveStats,
  takeDeal,
  takeFx,
  withLoss,
  withPlayed,
  withWin,
  type Stats,
} from "./storage";
import { SolitaireTable } from "./table";
import type { GestureHandlers, GestureState } from "./use-gesture";
import { WIN_FX, type FxKind } from "./win";
import { WinCanvas } from "./win-canvas";

// /solitaire: Klondike, turn three, on one screen with no scrolling, in landscape or upright. The
// game is client-only state (dealt from the bank of winnable deals and saved in the browser), so
// the server renders the felt and the 52 cards, and the mount resumes the saved game or deals one.

const reduceLoaded = (state: GameState | null, action: Action) =>
  action.type === "load" ? action.state : state && reduce(state, action);

const reduced = () => typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

type SheetKind = "menu" | "stats" | "help" | "result";
type Fx = { kind: FxKind; layout: Layout; size: { w: number; h: number }; seed: number; token: number };
type Hints = { seed: number; rev: number; list: Hint[]; index: number; shown: boolean };

const HINT_MS = 3200;
const TOAST_MS = 3200;
/** How long and how far the solver looks for a win before the hint falls back to rules of thumb. */
const HINT_SOLVE_MS = 60;
const HINT_SOLVE_NODES = 30_000;

const pileName = (pile: PileId) => (pile[0] === "t" ? `column ${Number(pile[1]) + 1}` : "its foundation");
/** The table before a game has loaded (nothing to press). */
const EMPTY_TABLE: Table = { stock: [], waste: [], fan: 0, foundations: [[], [], [], []], tableau: Array.from({ length: 7 }, () => ({ down: [], up: [] })) };

/** The live region's words for a change. */
function news(last: Last): string {
  if (last.kind === "undo") return "Move undone";
  if (last.kind === "restart") return "Deal restarted";
  if (last.kind === "finish") return "Every card played to the foundations";
  const e = last.effects[0];
  if (!e) return "";
  if (e.token === "s") return e.recycled ? "Waste turned over" : `Turned ${e.cards.map(cardName).join(", ")}`;
  const move = parseToken(e.token);
  if (!move) return "";
  const more = e.cards.length > 1 ? ` and ${e.cards.length - 1} more` : "";
  const turned = e.flipped === null ? "" : `. Turned over ${cardName(e.flipped)}`;
  return `${cardName(e.cards[0])}${more} to ${pileName(move.to)}${turned}`;
}

export function SolitaireGame() {
  const [state, dispatch] = useReducer(reduceLoaded, null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const [stats, setStats] = useState<Stats>(NO_STATS);
  const [sheet, setSheet] = useState<SheetKind | null>(null);
  const [fx, setFx] = useState<Fx | null>(null);
  /** The animation the latest win played (for its result heading and Watch again). */
  const [lastFx, setLastFx] = useState<Fx | null>(null);
  const [hints, setHints] = useState<Hints | null>(null);
  const [toast, setToast] = useState<{ token: number; text: string } | null>(null);
  const [live, setLive] = useState("");
  const stageRef = useRef<HTMLDivElement>(null);
  const animator = useMemo(() => new Animator(reduced), []);

  /** How the latest game arrived (dealt, or resumed or taken from another tab): its first motion. */
  const entry = useRef<{ token: number; seed: number; rev: number; motion: Motion }>({ token: 0, seed: -1, rev: -1, motion: { kind: "snap" } });
  const [entryToken, setEntryToken] = useState(0);
  /** The rev of the game as it arrived: only changes after it are this tab's own play. */
  const loadedRev = useRef(0);
  /** The game whose win is being shown (a new deal clears it). */
  const winFor = useRef<string | null>(null);
  const adopt = useCallback((next: GameState, kind: "deal" | "snap") => {
    loadedRev.current = next.rev;
    entry.current = { token: entry.current.token + 1, seed: next.seed, rev: next.rev, motion: { kind } };
    setEntryToken(entry.current.token);
    dispatch({ type: "load", state: next });
  }, []);

  // The latest game, layout and handlers for the native listeners, set before paint (as the
  // show's refs below), so an input right after a change never acts on the one before it.
  const stateRef = useRef(state);
  useLayoutEffect(() => {
    stateRef.current = state;
  }, [state]);

  // The table's size, from the stage (inside the safe areas): the layout follows it.
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      setSize((prev) => (prev && prev.w === Math.round(r.width) && prev.h === Math.round(r.height) ? prev : { w: Math.round(r.width), h: Math.round(r.height) }));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const table = state?.table ?? null;
  const layout = useMemo(() => (table && size ? computeLayout(size, table, window.devicePixelRatio || 1) : null), [table, size]);
  const layoutRef = useRef(layout);
  useLayoutEffect(() => {
    layoutRef.current = layout;
  }, [layout]);

  // The motion the table plays for the latest change.
  const seed = state?.seed;
  const rev = state?.rev;
  const motion = useMemo(() => {
    const s = state;
    if (!s) return null;
    const e = entry.current;
    if (s.seed === e.seed && s.rev === e.rev) return { key: `entry:${e.token}`, motion: e.motion };
    const last = s.last;
    const key = `rev:${e.token}:${s.rev}`;
    if (last && last.rev === s.rev) return { key, motion: last.kind === "restart" ? ({ kind: "deal" } as Motion) : { kind: last.kind, effects: last.effects } };
    return { key, motion: { kind: "snap" } as Motion };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed by the game, its rev and how it arrived
  }, [seed, rev, entryToken]);

  // ── loading, saving and other tabs ───────────────────────────────────────
  const tabId = useRef("");
  const owns = useCallback(() => ownsGame(tabId.current), []);
  const started = useRef(false);
  useEffect(() => {
    // Strict Mode mounts twice in development: deal once, or the bank's cursor would skip a deal.
    if (started.current) return;
    started.current = true;
    tabId.current = Math.random().toString(36).slice(2);
    if (document.visibilityState === "visible") claimGame(tabId.current);
    setStats(loadStats());
    const saved = loadGame();
    if (saved) {
      adopt(saved, "snap");
      if (saved.status === "won") setSheet("result");
    } else adopt(newGame(takeDeal()), "deal");
  }, [adopt]);

  useEffect(() => {
    if (state && owns()) saveGame(state);
  }, [state, owns]);

  // Several tabs: the one the player last used owns the game, alone saving it and running its
  // clock; the others follow its saves. Using a tab (a touch, a key, bringing it into view, or
  // coming back to it from the back-forward cache) takes the game over, from the latest save.
  const clock = useRef<{ last: number; visible: boolean } | null>(null);
  useEffect(() => {
    const take = (other: GameState | null) => {
      const mine = stateRef.current;
      if (!other) return;
      if (mine && other.seed === mine.seed && other.rev === mine.rev) {
        // The same position (the owner saves every tick of its clock): only the time and the stats
        // marks move on, so nothing is replayed onto the table.
        const marked = other.counted !== mine.counted || other.recorded !== mine.recorded;
        if (!marked && other.elapsed === mine.elapsed) return;
        dispatch({ type: "load", state: { ...mine, elapsed: other.elapsed, counted: other.counted, recorded: other.recorded } });
        if (marked) setStats(loadStats());
      } else {
        if (!mine || other.seed !== mine.seed) {
          // Another deal: this one's win show, result and hints go with it.
          winFor.current = null;
          setFx(null);
          setLastFx(null);
          setHints(null);
          setSheet((s) => (s === "result" ? null : s));
        }
        adopt(other, "snap");
        setStats(loadStats());
        if (other.status === "won") setSheet("result");
      }
      if (clock.current) clock.current.last = performance.now();
    };
    const claim = () => {
      if (owns()) return;
      take(loadGame());
      claimGame(tabId.current);
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === GAME && !owns()) take(gameFrom(e.newValue));
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") claim();
    };
    const onShow = (e: PageTransitionEvent) => {
      if (e.persisted) take(loadGame());
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("pageshow", onShow);
    document.addEventListener("visibilitychange", onVisible);
    document.addEventListener("pointerdown", claim, true);
    document.addEventListener("keydown", claim, true);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("pageshow", onShow);
      document.removeEventListener("visibilitychange", onVisible);
      document.removeEventListener("pointerdown", claim, true);
      document.removeEventListener("keydown", claim, true);
    };
  }, [adopt, owns]);

  // ── the clock ────────────────────────────────────────────────────────────
  // It runs while a game is under way, no sheet or win show is up, the page is in view and this
  // tab owns the game (the reducer starts it at the first move). A move counts the part-second
  // since the last tick first, so the winning move's time is in the result.
  const playing = state?.status === "playing";
  const paused = sheet !== null || fx !== null;
  const flushClock = useCallback(() => {
    const c = clock.current;
    if (!c) return;
    const now = performance.now();
    if (c.visible && owns()) dispatch({ type: "tick", ms: Math.min(now - c.last, 2000) });
    c.last = now;
  }, [owns]);
  useEffect(() => {
    if (!playing || paused) return;
    clock.current = { last: performance.now(), visible: document.visibilityState === "visible" };
    const onVisibility = () => {
      flushClock();
      if (clock.current) clock.current.visible = document.visibilityState === "visible";
    };
    const id = setInterval(flushClock, 1000);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", flushClock);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", flushClock);
      flushClock();
      clock.current = null;
    };
  }, [playing, paused, flushClock]);

  // ── statistics and the win ───────────────────────────────────────────────
  // A deal counts as played at its first move, and its win is recorded once, both by the tab
  // whose move it was.
  useEffect(() => {
    if (!state || state.counted || state.log.length === 0 || state.rev <= loadedRev.current) return;
    const next = withPlayed(loadStats());
    saveStats(next);
    setStats(next);
    dispatch({ type: "mark", counted: true });
  }, [state]);

  const fxToken = useRef(0);
  const showWin = useCallback(
    (kind: FxKind | null) => {
      const l = layoutRef.current;
      const s = stateRef.current;
      if (!kind || !l || !size || !s) return setSheet("result");
      const next = { kind, layout: l, size, seed: s.seed + s.rev, token: ++fxToken.current };
      setFx(next);
      setLastFx(next);
    },
    [size],
  );
  useEffect(() => {
    if (!state || state.status !== "won" || state.recorded || state.rev <= loadedRev.current) return;
    const key = `${state.seed}:${state.rev}`;
    if (winFor.current === key) return;
    winFor.current = key;
    const next = withWin(loadStats(), state.elapsed, score(state));
    saveStats(next);
    setStats(next);
    dispatch({ type: "mark", recorded: true });
    setHints(null);
    // The show waits for the last card to land.
    animator.whenIdle().then(() => {
      if (winFor.current === key) showWin(reduced() ? null : WIN_FX[takeFx(WIN_FX.length)]);
    });
  }, [state, animator, showWin]);
  const endFx = useCallback(() => {
    setFx(null);
    setSheet("result");
  }, []);

  // ── actions ──────────────────────────────────────────────────────────────
  const act = useCallback(
    (action: Action) => {
      flushClock();
      dispatch(action);
    },
    [flushClock],
  );

  const deal = useCallback(() => {
    const s = stateRef.current;
    if (s && s.counted && s.status !== "won") {
      const next = withLoss(loadStats());
      saveStats(next);
      setStats(next);
    }
    winFor.current = null;
    setSheet(null);
    setFx(null);
    setLastFx(null);
    setHints(null);
    adopt(newGame(takeDeal()), "deal");
  }, [adopt]);

  const announce = useCallback((text: string) => setToast({ token: Date.now(), text }), []);
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), TOAST_MS);
    return () => clearTimeout(id);
  }, [toast]);

  const hintModule = useRef<typeof import("@/lib/solitaire/hint") | null>(null);
  const hintsRef = useRef(hints);
  useEffect(() => {
    hintsRef.current = hints;
  }, [hints]);
  /** Shows the next hint: the list is worked out once per position, and each press moves along it. */
  const showHint = useCallback(async () => {
    const s = stateRef.current;
    if (!s || s.status !== "playing") return;
    const mod = hintModule.current ?? (hintModule.current = await import("@/lib/solitaire/hint"));
    const now = stateRef.current;
    if (!now || now.rev !== s.rev || now.seed !== s.seed) return;
    const prev = hintsRef.current;
    const fresh = !prev || prev.rev !== s.rev || prev.seed !== s.seed;
    const list = fresh ? mod.hintList(s.table, { maxNodes: HINT_SOLVE_NODES, deadline: performance.now() + HINT_SOLVE_MS }) : prev.list;
    if (!list.length) {
      setHints(null);
      announce(NO_MOVES);
      return;
    }
    setHints({ seed: s.seed, rev: s.rev, list, index: fresh ? 0 : (prev.index + 1) % list.length, shown: true });
  }, [announce]);
  useEffect(() => {
    if (!hints?.shown) return;
    const id = setTimeout(() => setHints((h) => h && { ...h, shown: false }), HINT_MS);
    return () => clearTimeout(id);
  }, [hints]);
  const hint = hints?.shown && state && hints.rev === state.rev && hints.seed === state.seed ? hints.list[hints.index] : null;

  // The table's pointer handling reads the latest game and calls back here.
  const enabled = state?.status === "playing" && sheet === null && fx === null;
  const gesture = useRef<GestureState>({ table: EMPTY_TABLE, layout: null, enabled: false });
  useLayoutEffect(() => {
    if (state) gesture.current = { table: state.table, layout, enabled };
  }, [state, layout, enabled]);
  const handlers = useRef<GestureHandlers>({ onStock() {}, onTap() {}, onDrop() {} });
  useLayoutEffect(() => {
    handlers.current = {
      onStock: () => act({ type: "stock" }),
      onTap: (from, count, cards) => {
        const s = stateRef.current;
        const to = s && bestTarget(s.table, from, count);
        if (to) act({ type: "move", from, to, count });
        else animator.shake(cards);
      },
      onDrop: (from, to, count) => act({ type: "move", from, to, count }),
    };
  }, [act, animator]);

  // The live region: each change's news.
  useEffect(() => {
    const last = state?.last;
    if (!last || last.rev !== state.rev || state.rev <= loadedRev.current) return;
    setLive(state.status === "won" ? "Solved!" : news(last));
  }, [state]);

  // Keys: D or Space turns the stock, U or ⌘/Ctrl+Z undoes, H hints, F finishes; any key skips the win show.
  // The listener reads the show and the sheet through refs set before paint, so a key pressed the
  // moment the show appears already skips it.
  const shown = useRef({ fx, sheet });
  useLayoutEffect(() => {
    shown.current = { fx, sheet };
  }, [fx, sheet]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const { fx, sheet } = shown.current;
      if (fx) {
        // Held back, or the same Escape would cancel the result sheet the skip opens.
        if (e.key === "Shift" || e.key === "Meta" || e.key === "Control" || e.key === "Alt") return;
        e.preventDefault();
        endFx();
        return;
      }
      if (sheet || e.altKey || document.querySelector("dialog[open]")) return;
      const key = e.key.toLowerCase();
      const meta = e.metaKey || e.ctrlKey;
      if (meta && key === "z") {
        e.preventDefault();
        act({ type: "undo" });
        return;
      }
      if (meta) return;
      // Space on a focused control (Undo, Hint, the stock, a card) presses that control; it turns
      // the stock only from elsewhere.
      if (key === " " && e.target instanceof Element && e.target.closest("button, a[href], input, select, textarea, [role=button]")) return;
      if (key === "d" || key === " ") {
        e.preventDefault();
        act({ type: "stock" });
      } else if (key === "u") act({ type: "undo" });
      else if (key === "h") void showHint();
      else if (key === "f") act({ type: "finish" });
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [act, showHint, endFx]);

  // ── render ───────────────────────────────────────────────────────────────
  const won = state?.status === "won";
  const finishable = state !== null && !won && canFinish(state.table);
  const canUndo = state !== null && !won && state.log.length > 0;
  const status = state && (
    <div className="sol-status" aria-label="Score, moves and time">
      <span className="sol-deal">Deal #{state.seed}</span>
      <span>
        <b>{score(state).toLocaleString("en-US")}</b> pts
      </span>
      <span>
        <b>{state.log.length}</b> moves
      </span>
      <span className="sol-time">
        <b>{formatTime(state.elapsed)}</b>
      </span>
    </div>
  );
  const buttons = {
    menu: (
      <button key="menu" type="button" className="sol-tool" aria-label="Menu" onClick={() => setSheet("menu")}>
        <ListIcon size={22} weight="bold" aria-hidden />
      </button>
    ),
    undo: (
      <button key="undo" type="button" className="sol-tool" aria-label="Undo" disabled={!canUndo} onClick={() => act({ type: "undo" })}>
        <ArrowCounterClockwiseIcon size={21} weight="bold" aria-hidden />
      </button>
    ),
    hint: (
      <button key="hint" type="button" className="sol-tool" aria-label="Hint" disabled={won} onClick={() => void showHint()}>
        <LightbulbIcon size={21} weight="bold" aria-hidden />
      </button>
    ),
    finish: finishable && (
      <button key="finish" type="button" className="sol-tool sol-finish" onClick={() => act({ type: "finish" })}>
        <FlagCheckeredIcon size={18} weight="bold" aria-hidden />
        <span>Finish</span>
      </button>
    ),
  };
  const place = (r: { x: number; y: number; w: number; h: number }): CSSProperties => ({ left: r.x, top: r.y, width: r.w, height: r.h });

  return (
    <main className="sol-game">
      <h1 className="sol-sr">Solitaire</h1>
      <div className="sol-stage" ref={stageRef}>
        {state && motion && (
          <SolitaireTable
            layout={layout}
            table={state.table}
            motion={motion}
            hint={hint}
            fx={fx !== null}
            animator={animator}
            gesture={gesture}
            handlers={handlers}
          />
        )}
        {/* The controls step aside while a win animation plays over the table, as Windows' did. */}
        {layout && state && !fx && layout.arrangement === "classic" && (
          <div className="sol-controls sol-bar" style={place(layout.controls[0])}>
            {buttons.menu}
            {status}
            {buttons.finish}
            {buttons.undo}
            {buttons.hint}
          </div>
        )}
        {layout && state && !fx && layout.arrangement === "rails" && (
          <>
            <div className="sol-controls sol-rail" data-side="left" style={place(layout.controls[0])}>
              {buttons.undo}
              {buttons.hint}
              {buttons.finish}
            </div>
            <div className="sol-controls sol-rail" data-side="right" style={place(layout.controls[1])}>
              {status}
              {buttons.menu}
            </div>
          </>
        )}
        {fx && <WinCanvas key={fx.token} kind={fx.kind} layout={fx.layout} size={fx.size} seed={fx.seed} onDone={endFx} />}
        {fx && <p className="sol-skip">Tap to skip</p>}
        {toast && (
          <p key={toast.token} className="sol-toast" role="status">
            {toast.text}
          </p>
        )}
      </div>
      <p className="sol-sr" aria-live="polite">
        {live}
      </p>

      <Sheet prefix="sol" open={sheet === "menu"} label="Menu" dismissible onClose={() => setSheet(null)}>
        {state && (
          <MenuPanel
            deal={state.seed}
            canRestart={state.log.length > 0 && !won}
            onNew={deal}
            onRestart={() => {
              setSheet(null);
              act({ type: "restart" });
            }}
            onStats={() => setSheet("stats")}
            onHelp={() => setSheet("help")}
          />
        )}
      </Sheet>
      <Sheet prefix="sol" open={sheet === "stats"} label="Statistics" dismissible onClose={() => setSheet(null)}>
        <StatsPanel stats={stats} />
      </Sheet>
      <Sheet prefix="sol" open={sheet === "help"} label="How to play" dismissible onClose={() => setSheet(null)}>
        <HelpPanel />
      </Sheet>
      <Sheet prefix="sol" open={sheet === "result"} label="Result" dismissible onClose={() => setSheet(null)}>
        {state && won && (
          <ResultPanel
            fx={lastFx?.kind ?? null}
            deal={state.seed}
            elapsed={state.elapsed}
            score={score(state)}
            moves={state.log.length}
            stats={stats}
            onNew={deal}
            onReplay={
              lastFx && !reduced()
                ? () => {
                    setSheet(null);
                    showWin(lastFx.kind);
                  }
                : undefined
            }
          />
        )}
      </Sheet>
    </main>
  );
}
