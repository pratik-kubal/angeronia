// localStorage: the game in progress (its seed and moves: iOS drops background tabs, so a reload
// must resume it), the statistics, this browser's way through the deal bank and the next win
// animation. Every access is guarded: private mode and blocked storage just mean nothing is
// remembered.

import { mulberry32 } from "@/lib/random";
import { DEALS } from "@/lib/solitaire/deals";
import { parseSaved, toSaved, type GameState } from "@/lib/solitaire/game";

export const GAME = "solitaire:game";
const STATS = "solitaire:stats";
const ORDER = "solitaire:deals";
const FX = "solitaire:fx";
const OWNER = "solitaire:owner";

function read(key: string): unknown {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? null : JSON.parse(raw);
  } catch {
    return null;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or blocked: the game still plays.
  }
}

export const loadGame = () => parseSaved(read(GAME));
/** A game from a storage event's raw value (another tab saved it). */
export function gameFrom(raw: string | null): GameState | null {
  try {
    return raw === null ? null : parseSaved(JSON.parse(raw));
  } catch {
    return null;
  }
}
export const saveGame = (state: GameState) => write(GAME, toSaved(state));

/**
 * Several tabs: the one the player last used owns the game, and only the owner saves it and runs
 * its clock (two writers would undo each other's moves). Without storage, every tab owns its own.
 */
export const claimGame = (tab: string) => write(OWNER, tab);
export function ownsGame(tab: string): boolean {
  const owner = read(OWNER);
  return owner === null || owner === tab;
}

// ── statistics ─────────────────────────────────────────────────────────────

export type Stats = {
  played: number;
  won: number;
  /** Wins in a row, now and at best. */
  streak: number;
  bestStreak: number;
  /** The fastest win (ms) and the highest score, or null before the first win. */
  bestTime: number | null;
  bestScore: number | null;
};

export const NO_STATS: Stats = { played: 0, won: 0, streak: 0, bestStreak: 0, bestTime: null, bestScore: null };

export function loadStats(): Stats {
  const v = read(STATS) as Partial<Stats> | null;
  if (!v || typeof v !== "object") return NO_STATS;
  const count = (n: unknown) => (typeof n === "number" && Number.isInteger(n) && n >= 0 ? n : 0);
  const best = (n: unknown) => (typeof n === "number" && Number.isFinite(n) && n >= 0 ? n : null);
  const won = count(v.won);
  return {
    played: Math.max(count(v.played), won),
    won,
    streak: count(v.streak),
    bestStreak: Math.max(count(v.bestStreak), count(v.streak)),
    bestTime: best(v.bestTime),
    bestScore: best(v.bestScore),
  };
}
export const saveStats = (stats: Stats) => write(STATS, stats);

/** A deal begun (its first move). */
export const withPlayed = (s: Stats): Stats => ({ ...s, played: s.played + 1 });
/** A begun deal left unwon for another: the streak ends. */
export const withLoss = (s: Stats): Stats => ({ ...s, streak: 0 });
/** A win, in `elapsed` ms for `score` points. */
export function withWin(s: Stats, elapsed: number, score: number): Stats {
  const streak = s.streak + 1;
  return {
    ...s,
    won: s.won + 1,
    streak,
    bestStreak: Math.max(s.bestStreak, streak),
    bestTime: s.bestTime === null ? elapsed : Math.min(s.bestTime, elapsed),
    bestScore: s.bestScore === null ? score : Math.max(s.bestScore, score),
  };
}

// ── the deal bank ──────────────────────────────────────────────────────────

/** Names the bank, so a regenerated one starts a fresh order. */
const BANK = `${DEALS.length}:${DEALS[0]}:${DEALS[DEALS.length - 1]}`;
type Order = { bank: string; salt: number; cursor: number };

/** Bank indexes 0…n−1 in the order a salt deals them. */
export function dealOrder(salt: number, n: number): number[] {
  const rng = mulberry32(salt);
  const order = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

/**
 * The next deal's seed for this browser: the bank in an order of its own, so no deal comes round
 * again until every one has been dealt (then a new order begins). Advances the saved cursor.
 */
export function takeDeal(): number {
  const v = read(ORDER) as Partial<Order> | null;
  let order: Order =
    v && v.bank === BANK && Number.isInteger(v.salt) && Number.isInteger(v.cursor) && v.cursor! >= 0
      ? (v as Order)
      : { bank: BANK, salt: freshSalt(), cursor: 0 };
  if (order.cursor >= DEALS.length) order = { bank: BANK, salt: freshSalt(), cursor: 0 };
  const seed = DEALS[dealOrder(order.salt, DEALS.length)[order.cursor]];
  write(ORDER, { ...order, cursor: order.cursor + 1 });
  return seed;
}

const freshSalt = () => Math.floor(Math.random() * 2 ** 31);

// ── win animations ─────────────────────────────────────────────────────────

/** The win animation to play next (0–3, a WIN_FX index), and on to the one after. */
export function takeFx(count: number): number {
  const v = read(FX);
  const next = typeof v === "number" && Number.isInteger(v) && v >= 0 ? v % count : 0;
  write(FX, (next + 1) % count);
  return next;
}
