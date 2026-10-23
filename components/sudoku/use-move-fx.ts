"use client";

import { useEffect, useLayoutEffect, useRef, useState, type Dispatch, type RefObject, type SetStateAction } from "react";
import type { GameState, Move } from "@/lib/sudoku/game";
import { colOf, rowOf } from "@/lib/sudoku/grid";
import { sound } from "./feedback";

// The board's animations, played after the reducer has settled each move. A new game deals in:
// every cell's number reel spins and lands on its clue, corner to corner. A placed digit drops in;
// every row, column or box it finishes gets a mint band sweeping across it while its digits lift
// one after another, outward from the placed cell (all nine of a finished digit pulse too). A
// refused digit shakes and fades. A solved board spins all its reels again, outward from the last
// cell, and bursts into number fireworks before the result. The next move cuts the last one
// short; a move or game taken from another tab shows at rest. Reduced motion keeps only the
// colours (a finished unit's band shows, still, for as long as the sweep would run).

export type LitKind = "place" | "hint" | "sweep" | "set";

export type Fx = {
  /** The last move taken up (the game's own seq when it loaded): behind the game's, a move is on its way. */
  seq: number;
  /** A move is still animating (the result sheet waits for it). */
  running: boolean;
  /** Cells lit by the move, each after `delay` ms; a new token restarts a cell's animation. */
  lit: Record<number, { token: number; kind: LitKind; delay: number }>;
  /** The rows, columns and boxes the move finished, each swept by a band. */
  sweeps: { token: number; kind: "row" | "column" | "box"; index: number }[];
  /** A refused digit, shown in its cell until its animation ends. */
  miss: { cell: number; digit: number; token: number } | null;
  /** Every cell's number reel spinning: dealing a new game, or celebrating a solved one from `origin`. */
  reel: { token: number; kind: "deal" | "win"; origin: number } | null;
  /** The number fireworks over a solved board. */
  burst: number | null;
};

const IDLE: Fx = { seq: 0, running: false, lit: {}, sweeps: [], miss: null, reel: null, burst: null };

/**
 * Timings in ms (sudoku.css plays them): a band's sweep, hold and fade; the digit lift's step per
 * ring of distance and its length; a refused digit; the deal; the finale before the result sheet.
 */
const T = { band: 1000, ringStep: 45, lift: 240, miss: 520, deal: 1350, win: 2100 };

/** A reel's delay in ms: a deal runs corner to corner, a win ripples out from the last cell. */
export function reelDelay(reel: NonNullable<Fx["reel"]>, cell: number): number {
  if (reel.kind === "deal") return (rowOf(cell) + colOf(cell)) * 32 + ((cell * 37) % 5) * 12;
  const ring = Math.max(Math.abs(rowOf(cell) - rowOf(reel.origin)), Math.abs(colOf(cell) - colOf(reel.origin)));
  return ring * 70;
}

/**
 * The board's animation state for the game. `remote` holds the last state taken from another tab
 * (shown at rest: that tab played it). The director follows in a layout effect, so a move's first
 * animation frame paints with the move, never one frame after it.
 */
export function useMoveFx(state: GameState | null, soundOn: boolean, remote: RefObject<GameState | null>): Fx {
  const [fx, setFx] = useState<Fx>(IDLE);
  const soundRef = useRef(soundOn);
  useEffect(() => {
    soundRef.current = soundOn;
  }, [soundOn]);
  const [director] = useState(() => createDirector(setFx, soundRef, remote));
  useLayoutEffect(() => director.follow(state), [director, state]);
  useEffect(() => () => director.stop(null), [director]);
  return fx;
}

function createDirector(setFx: Dispatch<SetStateAction<Fx>>, soundOn: RefObject<boolean>, remote: RefObject<GameState | null>) {
  let timers: number[] = [];
  let game: string | null = null;
  let seen = 0;
  let token = 0;

  const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  const at = (ms: number, fn: () => void) => {
    timers.push(window.setTimeout(fn, ms));
  };
  const play = (fn: () => void) => {
    if (soundOn.current) fn();
  };

  /** Cancels the move under way; at a seq, shows the board at rest there. */
  function stop(seq: number | null) {
    timers.forEach(clearTimeout);
    timers = [];
    if (seq !== null) setFx({ ...IDLE, seq });
  }

  /** A new game: the reels deal the clues in. */
  function deal() {
    if (reduced()) return;
    setFx((f) => ({ ...f, reel: { token: ++token, kind: "deal", origin: 0 } }));
    play(() => sound.deal());
    at(T.deal, () => setFx((f) => ({ ...f, reel: null })));
  }

  /** A solved board: every reel spins out from the last cell, then the fireworks, then the result. */
  function finale(origin: number) {
    const fast = reduced();
    setFx((f) => ({ ...f, running: true, reel: fast ? null : { token: ++token, kind: "win", origin }, burst: fast ? null : ++token }));
    play(() => sound.win());
    at(fast ? 0 : T.win, () => setFx((f) => ({ ...f, running: false, reel: null, burst: null })));
  }

  function fill(move: Extract<Move, { kind: "place" | "hint" }>, grid: readonly number[], won: boolean) {
    const lit: Fx["lit"] = { [move.cell]: { token: ++token, kind: move.kind, delay: 0 } };
    // Rings outward from the placed cell; a cell in two finished units lifts once, on the first ring.
    const light = (cell: number, kind: LitKind) => {
      const delay = Math.max(Math.abs(rowOf(cell) - rowOf(move.cell)), Math.abs(colOf(cell) - colOf(move.cell))) * T.ringStep;
      if (!(cell in lit)) lit[cell] = { token: ++token, kind, delay };
    };
    move.units.forEach((unit) => unit.cells.forEach((cell) => light(cell, "sweep")));
    if (move.digitDone) grid.forEach((d, cell) => d === move.digit && light(cell, "set"));
    const sweeps = move.units.map((u) => ({ token: ++token, kind: u.kind, index: u.index }));
    const longest = Math.max(...Object.values(lit).map((l) => l.delay)) + T.lift;
    const finished = move.units.length + (move.digitDone ? 1 : 0);
    setFx((f) => ({ ...f, running: true, lit, sweeps }));
    play(() => (move.kind === "hint" ? sound.hint() : sound.place(move.digit)));
    if (finished) at(90, () => play(() => sound.complete(finished)));
    at(reduced() ? (sweeps.length ? T.band : 0) : Math.max(longest, sweeps.length ? T.band : 0), () => {
      setFx((f) => ({ ...f, running: false, lit: {}, sweeps: [] }));
      if (won) finale(move.cell);
    });
  }

  function miss(move: Extract<Move, { kind: "miss" }>) {
    setFx((f) => ({ ...f, running: true, miss: { cell: move.cell, digit: move.digit, token: ++token } }));
    play(() => sound.miss());
    at(reduced() ? 300 : T.miss, () => setFx((f) => ({ ...f, running: false, miss: null })));
  }

  /** Plays each new move once; a different game starts at rest (and a brand-new one deals in). */
  function follow(state: GameState | null) {
    if (!state) return;
    const key = `${state.difficulty}:${state.seed}`;
    const move = state.last;
    if (state === remote.current) {
      game = key;
      seen = move?.seq ?? 0;
      stop(seen);
      return;
    }
    if (key !== game) {
      game = key;
      seen = move?.seq ?? 0;
      stop(seen);
      if (state.seq === 0) deal();
      return;
    }
    if (!move || move.seq <= seen) return;
    seen = move.seq;
    stop(seen);
    if (move.kind === "miss") miss(move);
    else fill(move, state.grid, state.status === "won");
  }

  return { follow, stop };
}
