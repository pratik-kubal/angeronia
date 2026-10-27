// localStorage: every painting begun, one per picture and level, with where the view was (a player
// keeps several going and comes back to each where it was left), which one is open (iOS drops
// background tabs, so a reload must resume it), the settings, the tab that owns the game and
// whether the coach mark has been dismissed. Every access is guarded: private mode and blocked
// storage just mean nothing is remembered. A painting's own contents are checked by game.ts
// (parseSaved) when it is resumed; here a work only has to be shaped like one.

import type { Camera } from "@/lib/color-tap/camera";
import type { Saved } from "@/lib/color-tap/game";
import { isLevelId } from "@/lib/color-tap/levels";
import type { LevelId } from "@/lib/color-tap/types";

/** Every painting in progress or done, by workKey. */
export const WORKS = "color-tap:works";
export const CURRENT = "color-tap:current";
const SETTINGS = "color-tap:settings";
const OWNER = "color-tap:owner";
const COACH = "color-tap:coach";

/** Each switch is on unless the player turned it off. */
export type Settings = { sound: boolean; haptics: boolean; autoAdvance: boolean };

/** One painting: the game's save, the view to put back (null: fit the picture) and when it was saved. */
export interface Work {
  saved: Saved;
  camera: Camera | null;
  /** Date.now() at the save, so the picker can put the latest first. */
  at: number;
}

/** The painting that was open last. */
export interface Current {
  picture: string;
  level: LevelId;
}

function readRaw(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function parse(raw: string | null): unknown {
  try {
    return raw === null ? null : JSON.parse(raw);
  } catch {
    return null;
  }
}

const read = (key: string): unknown => parse(readRaw(key));

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or blocked: the game still plays.
  }
}

/** A plain object (not null, not an array), so its fields can be looked at. */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

const isFiniteNumber = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);

// ── settings ───────────────────────────────────────────────────────────────

export function loadSettings(): Settings {
  const value = read(SETTINGS);
  const stored = isRecord(value) ? value : {};
  return { sound: stored.sound !== false, haptics: stored.haptics !== false, autoAdvance: stored.autoAdvance !== false };
}
export const saveSettings = (settings: Settings) =>
  write(SETTINGS, { sound: settings.sound, haptics: settings.haptics, autoAdvance: settings.autoAdvance });

// ── the paintings ──────────────────────────────────────────────────────────

/** Where a painting is kept in WORKS: "butterfly:easy". A level id has no colon, so it reads back. */
export const workKey = (picture: string, level: LevelId) => `${picture}:${level}`;

/** A camera that can be put back: three finite numbers and a scale above zero. */
function cameraFrom(value: unknown): Camera | null | undefined {
  if (value === null) return null;
  if (!isRecord(value)) return undefined;
  const { scale, x, y } = value;
  if (!isFiniteNumber(scale) || !isFiniteNumber(x) || !isFiniteNumber(y) || scale <= 0) return undefined;
  return { scale, x, y };
}

/** One stored entry as a Work, or null if it isn't shaped like one or is filed under another key. */
function workFrom(key: string, value: unknown): Work | null {
  if (!isRecord(value)) return null;
  const { saved, at } = value;
  if (!isRecord(saved) || typeof saved.picture !== "string" || saved.picture === "" || !isLevelId(saved.level)) return null;
  if (workKey(saved.picture, saved.level) !== key) return null;
  const camera = cameraFrom(value.camera);
  if (camera === undefined || !isFiniteNumber(at)) return null;
  return { saved: saved as unknown as Saved, camera, at };
}

/**
 * The works in a stored value: localStorage's, or a storage event's (another tab saved). Junk reads
 * as no works, and any entry that isn't shaped like a Work is dropped, keeping the rest.
 */
export function worksFrom(raw: string | null): Record<string, Work> {
  const value = parse(raw);
  const works: Record<string, Work> = {};
  if (!isRecord(value)) return works;
  for (const [key, entry] of Object.entries(value)) {
    const work = workFrom(key, entry);
    if (work) works[key] = work;
  }
  return works;
}

export const loadWorks = () => worksFrom(readRaw(WORKS));

export function loadWork(picture: string, level: LevelId): Work | null {
  return loadWorks()[workKey(picture, level)] ?? null;
}

/** Keeps `work` under its picture and level, beside every other painting. */
export function saveWork(work: Work) {
  const works = loadWorks();
  works[workKey(work.saved.picture, work.saved.level)] = { saved: work.saved, camera: work.camera, at: work.at };
  write(WORKS, works);
}

// ── the painting that is open ──────────────────────────────────────────────

export function loadCurrent(): Current | null {
  const value = read(CURRENT);
  if (!isRecord(value)) return null;
  const { picture, level } = value;
  return typeof picture === "string" && picture !== "" && isLevelId(level) ? { picture, level } : null;
}
export const saveCurrent = (current: Current) => write(CURRENT, { picture: current.picture, level: current.level });

// ── tabs ───────────────────────────────────────────────────────────────────

/**
 * Several tabs: the one the player last used owns the game, and only the owner saves it and runs
 * its clock (two writers would undo each other's fills). Without storage, every tab owns its own.
 */
export const claimGame = (tab: string) => write(OWNER, tab);
export function ownsGame(tab: string): boolean {
  const owner = read(OWNER);
  return owner === null || owner === tab;
}

// ── the coach mark ─────────────────────────────────────────────────────────

/** Whether "Tap a highlighted area" has been dismissed: it is shown until the first fill, then never again. */
export const loadCoachSeen = () => read(COACH) === true;
export const saveCoachSeen = () => write(COACH, true);

// ── persistence ────────────────────────────────────────────────────────────

let askedToPersist = false;

/**
 * Asks once per page load for persistent storage, so the browser (iOS above all) is less likely to
 * evict the paintings under storage pressure. The answer doesn't matter and nothing here throws:
 * an old browser, a server render or a refusal just leaves storage as it was.
 */
export function persistStorage() {
  if (askedToPersist) return;
  askedToPersist = true;
  try {
    const storage = typeof navigator === "undefined" ? undefined : navigator.storage;
    if (!storage || typeof storage.persist !== "function") return;
    storage.persist().catch(() => {
      // Refused or unsupported here: the saves stay best-effort.
    });
  } catch {
    // Not allowed in this context (a sandboxed frame, say): the same.
  }
}
