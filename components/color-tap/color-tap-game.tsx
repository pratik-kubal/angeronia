"use client";

// /games/paint-by-numbers: Color Tap. One screen with no scrolling: a bar (home, the painting's name
// and how far it has got, the gallery, settings), the stage with the picture, the tools (zoom,
// auto-paint, the magnifier) and the paint box. The game is client-only state: the puzzles are
// static files made at build time (DECISIONS.md ADR-022) and progress is saved in the browser, so
// the server renders the empty studio and the mount resumes the last painting, or opens the New
// painting sheet with the chosen picture's blank sheet behind it.
//
// A tap paints the area under the finger if it is the selected colour's (or one within 12 CSS px
// is: a forgiving finger); another colour's area just says so, with no penalty. When a colour is
// done the next one is picked. The magnifier flies to an area of the colour the player can't see,
// a few times per painting. Auto-paint finishes the picture area by area. The last area fades the
// lines away, replays the painting, and shows the before and after next to the photo.

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, type RefObject } from "react";
import { CornersOutIcon, GearSixIcon, HouseSimpleIcon, ImagesIcon, MagicWandIcon, MagnifyingGlassIcon, MinusIcon, PlusIcon, StopIcon } from "@phosphor-icons/react/dist/ssr";
import { ALL_GAMES, COACH, EMPTY, KEYS, TITLE } from "@/data/color-tap";
import { centreOn, flight, toStage, toWork, type Camera, type Point } from "@/lib/color-tap/camera";
import { autoPlan, colourProgress, isColourDone, magnifierTarget, makeBoard, newGame, nextColour, openAreas, parseSaved, reduce, toSaved, type Action, type Board, type GameState } from "@/lib/color-tap/game";
import { HitIndex } from "@/lib/color-tap/hit";
import { levelById } from "@/lib/color-tap/levels";
import { PICTURES } from "@/lib/color-tap/pictures";
import { decodePuzzle } from "@/lib/color-tap/puzzle";
import type { LevelId, PictureInfo, PictureLevel, Puzzle } from "@/lib/color-tap/types";
import { Sheet } from "@/components/sudoku/sheet";
import { feel, sound, unlockAudio } from "./feedback";
import { FinishedPanel, NewPaintingPanel, SettingsPanel, type WorkStage } from "./menus";
import { Palette } from "./palette";
import { Stage, ZoomStore, type StageHandle } from "./stage";
import {
  WORKS,
  claimGame,
  loadCoachSeen,
  loadCurrent,
  loadSettings,
  loadWork,
  loadWorks,
  ownsGame,
  persistStorage,
  saveCoachSeen,
  saveCurrent,
  saveSettings,
  saveWork,
  workKey,
  worksFrom,
  type Settings,
  type Work,
} from "./storage";

type SheetKind = "new" | "settings" | "finished";

interface Loaded {
  picture: PictureInfo;
  entry: PictureLevel;
  puzzle: Puzzle;
  board: Board;
  hit: HitIndex;
}

/** A finger is forgiven this far (CSS px): the nearest open area of the colour gets the paint. */
const REACH = 12;
/** Paint spreads through an area this long, ms (an auto-painted one faster). */
const SPREAD_MS = 260;
const AUTO_SPREAD_MS = 150;
/** An area this wide on screen (CSS px) throws a few specks of paint. */
const SPLASH_FROM = 40;
/** The magnifier leaves an area this wide on screen, CSS px; areas smaller than HIDDEN count as hidden. */
const LOOK_AT = 72;
const HIDDEN = 24;
/** The next colour is picked this long after one is finished, ms. */
const ADVANCE_MS = 600;
const SAVE_MS = 300;
/** The finished painting's replay is squeezed into this long, ms. */
const REPLAY_MS = 8000;

const puzzles = new Map<string, Promise<Puzzle>>();
/** A puzzle file, fetched once (its name is its hash, so the browser may keep it for good). */
function loadPuzzle(src: string): Promise<Puzzle> {
  let p = puzzles.get(src);
  if (!p) {
    p = fetch(src)
      .then((res) => {
        if (!res.ok) throw new Error(`${src}: ${res.status}`);
        return res.json();
      })
      .then(decodePuzzle);
    p.catch(() => puzzles.delete(src));
    puzzles.set(src, p);
  }
  return p;
}

const tools = new WeakMap<Puzzle, { board: Board; hit: HitIndex }>();
function toolsFor(puzzle: Puzzle) {
  let t = tools.get(puzzle);
  if (!t) tools.set(puzzle, (t = { board: makeBoard(puzzle), hit: new HitIndex(puzzle) }));
  return t;
}

/** The URL of one of a level's puzzles, current or retired: the same name with that id. */
const versionSrc = (entry: PictureLevel, id: string) => entry.src.replace(`.${entry.id}.json`, `.${id}.json`);

/** The puzzle a saved painting was begun on, if it is one of this level's (current or retired). */
function puzzleOf(work: Work | null | undefined, entry: PictureLevel | undefined): string | null {
  if (!work || !entry) return null;
  if (work.saved.puzzle === entry.id) return entry.src;
  return entry.retired.some((r) => r.id === work.saved.puzzle) ? versionSrc(entry, work.saved.puzzle) : null;
}

/** How many areas a saved painting has painted (its order is two bytes an area), if it can be carried on. */
function paintedIn(work: Work | undefined, entry: PictureLevel | undefined): number {
  if (!work || !puzzleOf(work, entry)) return 0;
  try {
    return atob(work.saved.order).length / 2;
  } catch {
    return 0;
  }
}

/** The canvas, to put focus on the picture once a sheet or the finale lets go of it. */
const focusPicture = () =>
  requestAnimationFrame(() => requestAnimationFrame(() => document.querySelector<HTMLCanvasElement>("canvas.ctp-canvas")?.focus({ preventScroll: true })));

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export function ColorTapGame() {
  const stage = useRef<StageHandle>(null);
  const zoom = useMemo(() => new ZoomStore(), []);
  const [settings, setSettingsState] = useState<Settings>({ sound: true, haptics: true, autoAdvance: true });
  const settingsRef = useRef(settings);
  const [works, setWorks] = useState<Record<string, Work>>({});
  const [active, setActiveState] = useState<Loaded | null>(null);
  const activeRef = useRef<Loaded | null>(null);
  const [game, setGameState] = useState<GameState | null>(null);
  const gameRef = useRef<GameState | null>(null);
  const [sheet, setSheetState] = useState<SheetKind | null>(null);
  const sheetRef = useRef<SheetKind | null>(null);
  const [choice, setChoice] = useState<{ picture: string; level: LevelId }>({ picture: PICTURES[0]?.id ?? "", level: "easy" });
  const [preview, setPreview] = useState<{ key: string; puzzle: Puzzle; painted: Uint8Array } | null>(null);
  const [loading, setLoading] = useState(false);
  const [autoOn, setAutoOn] = useState(false);
  const [busy, setBusyState] = useState<"finale" | "replay" | null>(null);
  const busyRef = useRef<"finale" | "replay" | null>(null);
  const [coach, setCoach] = useState(false);
  const [message, setMessage] = useState("");
  const [wiggle, setWiggle] = useState<{ colour: number; token: number } | null>(null);
  const [shake, setShake] = useState(0);
  const [focus, setFocus] = useState(-1);
  const [calm, setCalm] = useState(false);
  const [coarse, setCoarse] = useState(false);
  const tabId = useRef("");
  const started = useRef(false);
  /** The camera to put the stage at once the puzzle it belongs to is on it. */
  const pendingCamera = useRef<Camera | "fit" | null>(null);
  /** The camera before the New painting sheet showed another picture, to go back to. */
  const cameraBefore = useRef<Camera | null>(null);
  /** The outlines' and numbers' ink (1 while painting, 0 once finished, between during the finale). */
  const ink = useRef(1);
  const autoRun = useRef<{ plan: number[]; i: number; timer: number; interval: number; batch: number; pause: number } | null>(null);
  const advanceTimer = useRef(0);
  const skipReplay = useRef(false);
  const persisted = useRef(false);
  const token = useRef(0);

  const setGame = useCallback((next: GameState | null) => {
    gameRef.current = next;
    setGameState(next);
  }, []);
  const setActive = (next: Loaded | null) => {
    activeRef.current = next;
    setActiveState(next);
  };
  const setSheet = (next: SheetKind | null) => {
    sheetRef.current = next;
    setSheetState(next);
  };
  const setBusy = (next: "finale" | "replay" | null) => {
    busyRef.current = next;
    setBusyState(next);
  };
  const setSettings = (next: Settings) => {
    settingsRef.current = next;
    setSettingsState(next);
    saveSettings(next);
    if (next.sound) unlockAudio();
  };
  const announce = (text: string) => setMessage((prev) => (prev === text ? `${text} ` : text));
  /** Applies a rule to the game in hand; returns the game after it. */
  const act = (action: Action): GameState | null => {
    const g = gameRef.current;
    const a = activeRef.current;
    if (!g || !a) return g;
    const next = reduce(g, action, a.board);
    if (next !== g) setGame(next);
    return next;
  };
  const owns = () => ownsGame(tabId.current);

  const showing = sheet === "new" ? preview : null;
  const stagePuzzle = showing ? showing.puzzle : (active?.puzzle ?? null);

  // ── Saving ──────────────────────────────────────────────────────────────────
  const flush = useCallback(() => {
    const g = gameRef.current;
    if (!g || !owns()) return;
    const camera = sheetRef.current === "new" ? cameraBefore.current : (stage.current?.camera() ?? null);
    const work: Work = { saved: toSaved(g), camera: g.done ? null : camera, at: Date.now() };
    saveWork(work);
    setWorks((all) => ({ ...all, [workKey(g.picture, g.level)]: work }));
  }, []);
  useEffect(() => {
    if (!game) return;
    const t = setTimeout(flush, SAVE_MS);
    return () => clearTimeout(t);
  }, [game, flush]);

  // ── Opening a painting ──────────────────────────────────────────────────────
  const stopAuto = useCallback((say: boolean) => {
    const run = autoRun.current;
    if (!run) return;
    clearTimeout(run.timer);
    autoRun.current = null;
    setAutoOn(false);
    if (say) announce("Auto-paint stopped.");
  }, []);

  /**
   * Opens a painting: the one in hand as it is; a saved one on the puzzle it was begun on (the
   * current one or a retired one: players' progress comes first, so a remade puzzle never takes a
   * painting away); or, `fresh`, a new one on the current puzzle.
   */
  const open = async (pictureId: string, level: LevelId, fresh: boolean): Promise<boolean> => {
    const picture = PICTURES.find((p) => p.id === pictureId);
    const entry = picture?.levels.find((l) => l.level === level);
    if (!picture || !entry) return false;
    const held = activeRef.current;
    if (!fresh && held && gameRef.current && held.picture.id === pictureId && held.entry.level === level) {
      // The painting in hand carries on as it is, not as storage last heard of it.
      pendingCamera.current = cameraBefore.current ?? "fit";
      setActive({ ...held });
      return true;
    }
    setLoading(true);
    try {
      const work = fresh ? null : loadWork(pictureId, level);
      const src = puzzleOf(work, entry) ?? entry.src;
      const puzzle = await loadPuzzle(src);
      const { board, hit } = toolsFor(puzzle);
      const resumed = work ? parseSaved(work.saved, board, { picture: pictureId, level, puzzle: puzzle.id }) : null;
      const g = resumed ?? newGame(board, pictureId, level, puzzle.id, levelById(level).magnifiers);
      stopAuto(false);
      clearTimeout(advanceTimer.current);
      ink.current = g.done ? 0 : 1;
      setFocus(-1);
      setActive({ picture, entry, puzzle, board, hit });
      setGame(g);
      pendingCamera.current = resumed && work?.camera ? work.camera : "fit";
      saveCurrent({ picture: pictureId, level });
      setCoach(!g.done && g.order.length === 0 && !loadCoachSeen());
      return true;
    } catch {
      announce("That picture didn't load. Check the connection and try again.");
      return false;
    } finally {
      setLoading(false);
    }
  };

  // The camera a painting comes back to, once its puzzle is on the stage (the stage fits a new
  // puzzle first; this runs after it).
  useEffect(() => {
    const pending = pendingCamera.current;
    if (!pending || !stagePuzzle || stagePuzzle !== active?.puzzle || !stage.current) return;
    pendingCamera.current = null;
    if (pending === "fit") stage.current.fit(false);
    else stage.current.setCamera(pending);
  }, [stagePuzzle, active]);

  // What the stage shows: the chosen picture while choosing, else the painting in hand. The clock
  // changes the game every second; a frame is drawn only when something drawn changes.
  const drawn = useRef<{ r: unknown; painted: unknown; selected: number; done: boolean; focus: number; ink: number } | null>(null);
  useEffect(() => {
    const r = stage.current?.renderer();
    if (!r) return;
    const painted = showing ? showing.painted : game?.painted;
    const last = drawn.current;
    const same = last && last.r === r && last.painted === painted && last.selected === (game?.selected ?? -1) && last.done === !!game?.done && last.focus === focus && last.ink === ink.current;
    drawn.current = { r, painted, selected: game?.selected ?? -1, done: !!game?.done, focus, ink: ink.current };
    if (same) return;
    const now = performance.now();
    if (showing) {
      r.setPainted(showing.painted);
      r.select(-1, now);
      r.sheet = showing.painted.every((p) => p === 1) ? 0 : 1;
      r.focus = -1;
    } else if (game && busyRef.current !== "replay") {
      r.setPainted(game.painted);
      r.select(game.done ? -1 : game.selected, now);
      r.sheet = ink.current;
      r.focus = focus;
    }
    stage.current?.invalidate();
  }, [showing, game, focus, stagePuzzle]);

  // ── Mount: settings, saves, and the painting to resume ───────────────────────
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    tabId.current = Math.random().toString(36).slice(2);
    if (document.visibilityState === "visible") claimGame(tabId.current);
    const loaded = loadSettings();
    settingsRef.current = loaded;
    setSettingsState(loaded);
    setWorks(loadWorks());
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    setCalm(motion.matches);
    motion.addEventListener("change", (e) => setCalm(e.matches));
    setCoarse(matchMedia("(pointer: coarse)").matches);
    const current = loadCurrent();
    if (current && PICTURES.some((p) => p.id === current.picture)) {
      setChoice(current);
      open(current.picture, current.level, false).then((ok) => {
        if (!ok) setSheet("new");
        else if (gameRef.current?.done) setSheet("finished");
      });
    } else setSheet("new");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The New painting sheet shows the chosen picture's sheet behind it, with any painting already on it.
  useEffect(() => {
    if (sheet !== "new") return;
    const picture = PICTURES.find((p) => p.id === choice.picture);
    const entry = picture?.levels.find((l) => l.level === choice.level);
    if (!entry) return;
    let live = true;
    setLoading(true);
    // The painting in hand as it is; else a saved one on the puzzle it was begun on; else the blank sheet.
    const held = activeRef.current && activeRef.current.picture.id === choice.picture && activeRef.current.entry.level === choice.level ? activeRef.current : null;
    const work = held ? null : loadWork(choice.picture, choice.level);
    (held ? Promise.resolve(held.puzzle) : loadPuzzle(puzzleOf(work, entry) ?? entry.src))
      .then((puzzle) => {
        if (!live) return;
        const { board } = toolsFor(puzzle);
        const painted =
          (held && gameRef.current?.painted) ||
          (work && parseSaved(work.saved, board, { picture: choice.picture, level: choice.level, puzzle: puzzle.id })?.painted) ||
          new Uint8Array(puzzle.regions.length);
        setPreview({ key: `${choice.picture}:${choice.level}`, puzzle, painted });
      })
      .catch(() => live && announce("That picture didn't load. Check the connection and try again."))
      .finally(() => live && setLoading(false));
    return () => {
      live = false;
    };
  }, [sheet, choice]);

  const openNew = () => {
    stopAuto(false);
    cameraBefore.current = stage.current?.camera() ?? null;
    if (active) setChoice({ picture: active.picture.id, level: active.entry.level });
    setSheet("new");
  };
  const closeNew = () => {
    setSheet(null);
    // Back to the painting in hand, where it was: at once if its puzzle is still on the stage, else
    // once it is back.
    const back = cameraBefore.current;
    if (!active || !back) return;
    if (preview && preview.puzzle !== active.puzzle) pendingCamera.current = back;
    else stage.current?.setCamera(back);
  };

  // While choosing, the chosen picture's blank sheet sits in the space the sheet leaves above it
  // (a phone's bottom sheet; a centred card on a bigger screen leaves the picture around it).
  useEffect(() => {
    if (sheet !== "new" || !preview) return;
    let frame = 0;
    const place = () => {
      cancelAnimationFrame(frame);
      // Two frames: the sheet is laid out (and its slide-in under way) by then.
      frame = requestAnimationFrame(() => {
        frame = requestAnimationFrame(() => {
          const dialog = document.querySelector<HTMLElement>("dialog.ctp-sheet[open]");
          const box = document.querySelector<HTMLElement>(".ctp-stage");
          if (!dialog || !box || !stage.current) return;
          const d = dialog.getBoundingClientRect();
          const b = box.getBoundingClientRect();
          const docked = d.bottom >= window.innerHeight - 4 && d.width >= b.width - 4;
          const bottom = docked ? Math.max(0, Math.min(b.height * 0.75, b.bottom - d.top + 8)) : 0;
          stage.current.fitInto({ top: 0, right: 0, bottom, left: 0 });
        });
      });
    };
    place();
    // Again once the sheet has finished sliding in.
    const settled = window.setTimeout(place, 380);
    window.addEventListener("resize", place);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(settled);
      window.removeEventListener("resize", place);
    };
  }, [sheet, preview]);
  const startChosen = async () => {
    const ok = await open(choice.picture, choice.level, false);
    if (!ok) return;
    const done = gameRef.current?.done;
    setSheet(done ? "finished" : null);
    if (!done) focusPicture();
  };

  /** Clears the painting in hand; one begun on a retired puzzle starts again on the current one. */
  const restart = async () => {
    const a = activeRef.current;
    if (!a) return;
    stopAuto(false);
    clearTimeout(advanceTimer.current);
    setSheet(null);
    if (a.puzzle.id !== a.entry.id) {
      if (!(await open(a.picture.id, a.entry.level, true))) return;
    } else {
      act({ type: "restart", magnifiers: levelById(a.entry.level).magnifiers });
      ink.current = 1;
      setFocus(-1);
      stage.current?.fit(true);
    }
    announce("A clean sheet.");
  };

  // ── Several tabs: the one last used owns the painting (as Sudoku and Solitaire do) ────────────
  useEffect(() => {
    const take = () => {
      const g = gameRef.current;
      const a = activeRef.current;
      if (!g || !a) return;
      const work = loadWork(g.picture, g.level);
      const next = work ? parseSaved(work.saved, a.board, { picture: g.picture, level: g.level, puzzle: g.puzzle }) : null;
      if (!next || JSON.stringify(toSaved(next)) === JSON.stringify(toSaved(g))) return;
      // A finale or replay under way finishes first; the next claim or storage event takes the save.
      if (busyRef.current) return;
      stopAuto(false);
      clearTimeout(advanceTimer.current);
      ink.current = next.done ? 0 : 1;
      setFocus(-1);
      setGame(next);
      if (next.done && !g.done && !sheetRef.current) setSheet("finished");
      else if (!next.done && sheetRef.current === "finished") setSheet(null);
    };
    const claim = () => {
      if (owns()) return;
      take();
      claimGame(tabId.current);
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key !== WORKS) return;
      setWorks(worksFrom(e.newValue));
      if (!owns()) take();
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") claim();
      else flush();
    };
    const onShow = (e: PageTransitionEvent) => {
      if (e.persisted) take();
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("pagehide", flush);
    window.addEventListener("pageshow", onShow);
    document.addEventListener("visibilitychange", onVisible);
    document.addEventListener("pointerdown", claim, { capture: true });
    document.addEventListener("keydown", claim, { capture: true });
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("pagehide", flush);
      window.removeEventListener("pageshow", onShow);
      document.removeEventListener("visibilitychange", onVisible);
      document.removeEventListener("pointerdown", claim, { capture: true });
      document.removeEventListener("keydown", claim, { capture: true });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flush]);

  // The clock: time spent painting, only while the painting is in view and in hand.
  useEffect(() => {
    let last = performance.now();
    const id = setInterval(() => {
      const now = performance.now();
      const ms = Math.min(2000, now - last);
      last = now;
      const g = gameRef.current;
      if (!g || g.done || sheetRef.current || busyRef.current || document.visibilityState !== "visible" || !owns()) return;
      act({ type: "tick", ms });
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sound wakes inside a gesture (iOS starts audio only from one).
  useEffect(() => {
    if (!settings.sound) return;
    const wake = () => unlockAudio();
    const events = ["touchend", "pointerup", "keydown"] as const;
    events.forEach((e) => document.addEventListener(e, wake, { passive: true }));
    return () => events.forEach((e) => document.removeEventListener(e, wake));
  }, [settings.sound]);

  // ── Painting ────────────────────────────────────────────────────────────────
  const select = (colour: number, say: boolean) => {
    const g = act({ type: "select", colour });
    const a = activeRef.current;
    if (!g || !a) return;
    setFocus(-1);
    if (settingsRef.current.sound) sound.select();
    if (say) {
      const left = a.board.total[colour] - colourProgress(g, a.board)[colour];
      announce(left === 0 ? `Colour ${colour + 1} is finished.` : `Colour ${colour + 1}: ${left} of ${a.board.total[colour]} areas left.`);
    }
  };

  const runFinale = async (replay: boolean) => {
    // Focus stays on the picture (the tools it might be on are disabled for the finale).
    document.querySelector<HTMLCanvasElement>("canvas.ctp-canvas")?.focus({ preventScroll: true });
    setBusy("finale");
    setFocus(-1);
    await wait(250);
    if (settingsRef.current.sound) sound.pictureDone();
    announce("Picture finished!");
    await fadeInk(0, calm ? 200 : 800);
    await wait(calm ? 300 : 1500);
    if (replay && !calm) await runReplay();
    setBusy(null);
    setSheet("finished");
  };

  const fadeInk = (to: number, ms: number) =>
    new Promise<void>((resolve) => {
      const from = ink.current;
      const t0 = performance.now();
      const step = () => {
        const t = Math.min(1, (performance.now() - t0) / ms);
        ink.current = from + (to - from) * t;
        const r = stage.current?.renderer();
        if (r) r.sheet = ink.current;
        stage.current?.invalidate();
        if (t < 1) requestAnimationFrame(step);
        else resolve();
      };
      requestAnimationFrame(step);
    });

  /** The painting again, area by area in the order it was painted, squeezed into a few seconds. */
  const runReplay = () =>
    new Promise<void>((resolve) => {
      const g = gameRef.current;
      const r = stage.current?.renderer();
      if (!g || !r) return resolve();
      setBusy("replay");
      skipReplay.current = false;
      stage.current?.fit(true);
      const shown = new Uint8Array(g.painted.length);
      r.sheet = 0;
      r.select(-1, performance.now());
      r.setPainted(shown);
      const t0 = performance.now();
      let done = 0;
      const step = () => {
        const t = skipReplay.current ? 1 : Math.min(1, (performance.now() - t0) / REPLAY_MS);
        const upTo = Math.floor(t * g.order.length);
        for (; done < upTo; done++) shown[g.order[done]] = 1;
        r.setPainted(shown);
        stage.current?.invalidate();
        if (t < 1) requestAnimationFrame(step);
        else {
          r.setPainted(g.painted);
          setBusy(null);
          resolve();
        }
      };
      requestAnimationFrame(step);
    });

  const paint = (area: number, at: Point, stagePoint: Point | null, auto: boolean) => {
    const g = gameRef.current;
    const a = activeRef.current;
    const st = stage.current;
    if (!g || !a || !st) return;
    const next = reduce(g, { type: "fill", area, auto }, a.board);
    if (next === g) return;
    const r = st.renderer();
    const now = performance.now();
    // The reveal first, so the area isn't shown painted before its paint spreads.
    r?.reveal(area, at.x, at.y, now, calm ? 120 : auto ? AUTO_SPREAD_MS : SPREAD_MS);
    r?.setPainted(next.painted);
    if (r && stagePoint && !auto && a.puzzle.regions[area].labels[0].r * 2 * st.camera().scale >= SPLASH_FROM) r.splash(area, stagePoint.x, stagePoint.y, now);
    setGame(next);
    st.invalidate();

    const colour = a.board.colourOf[area];
    const s = settingsRef.current;
    // A painting worth keeping: ask once, after a real action, for storage the browser won't evict
    // (Firefox may ask the player; asking on every visit would nag).
    if (!persisted.current) {
      persisted.current = true;
      persistStorage();
    }
    if (s.sound) (auto ? sound.autoTick : sound.pop)();
    if (coach) {
      setCoach(false);
      saveCoachSeen();
    }
    if (next.done) {
      if (!auto && s.haptics) feel("double");
      stopAuto(false);
      runFinale(next.auto * 2 <= next.order.length);
      return;
    }
    if (isColourDone(next, a.board, colour)) {
      const finished = colourProgress(next, a.board).reduce((n, painted, c) => n + (painted === a.board.total[c] ? 1 : 0), 0);
      if (s.sound) sound.colourDone(finished);
      if (!auto && s.haptics) feel("double");
      // Auto-paint says only when it starts and stops; a message per colour would queue up.
      if (!auto) announce(`Colour ${colour + 1} finished.`);
      if (!auto && s.autoAdvance) {
        clearTimeout(advanceTimer.current);
        advanceTimer.current = window.setTimeout(() => {
          const latest = gameRef.current;
          if (!latest || latest.done || latest.selected !== colour) return;
          const nextOne = nextColour(latest, a.board, colour);
          if (nextOne >= 0) select(nextOne, true);
        }, ADVANCE_MS);
      }
    } else if (!auto) {
      if (s.haptics) feel("tap");
      const left = a.board.total[colour] - colourProgress(next, a.board)[colour];
      if (left <= 3) announce(`${left} left of colour ${colour + 1}.`);
    }
  };

  const wrong = (area: number) => {
    const a = activeRef.current;
    if (!a) return;
    const colour = a.board.colourOf[area];
    stage.current?.renderer()?.nudge(area, performance.now());
    stage.current?.invalidate();
    if (settingsRef.current.sound) sound.wrong();
    setWiggle({ colour, token: ++token.current });
    announce(`That area is colour ${colour + 1}.`);
  };

  const onTap = (at: Point, scale: number, stagePoint: Point) => {
    const g = gameRef.current;
    const a = activeRef.current;
    if (!g || !a || g.done || sheetRef.current || busyRef.current) return;
    const open = (i: number) => i >= 0 && !g.painted[i] && a.board.colourOf[i] === g.selected;
    const under = a.hit.at(at.x, at.y);
    const target = open(under) ? under : a.hit.near(at.x, at.y, REACH / scale, open);
    if (target >= 0) paint(target, at, stagePoint, false);
    else if (under >= 0 && !g.painted[under]) wrong(under);
  };

  const onPress = () => {
    if (settingsRef.current.sound) unlockAudio();
    if (busyRef.current === "replay") skipReplay.current = true;
    if (autoRun.current) stopAuto(true);
  };
  const onMove = () => {
    if (autoRun.current) stopAuto(true);
  };

  // ── Auto-paint ──────────────────────────────────────────────────────────────
  const stepAuto = () => {
    const run = autoRun.current;
    const a = activeRef.current;
    if (!run || !a) return;
    // A sheet or the finale owns the screen: auto-paint never paints behind it.
    if (sheetRef.current || busyRef.current) {
      stopAuto(false);
      return;
    }
    // A big picture paints a few areas a tick (a timer can't fire much faster than 30 times a
    // second), never across a colour, so the pause still falls between colours.
    let area = run.plan[run.i];
    for (let n = 0; n < run.batch && run.i < run.plan.length; n++) {
      area = run.plan[run.i];
      if (n > 0 && a.board.colourOf[area] !== a.board.colourOf[run.plan[run.i - 1]]) break;
      run.i++;
      paint(area, a.puzzle.regions[area].labels[0], null, true);
      if (!autoRun.current) return;
    }
    if (run.i >= run.plan.length) {
      autoRun.current = null;
      setAutoOn(false);
      return;
    }
    const next = run.plan[run.i];
    run.timer = window.setTimeout(stepAuto, run.interval + (a.board.colourOf[next] !== a.board.colourOf[area] ? run.pause : 0));
  };
  const startAuto = () => {
    const g = gameRef.current;
    const a = activeRef.current;
    const st = stage.current;
    if (!g || !a || !st || g.done || busyRef.current) return;
    const view = st.view();
    const plan = autoPlan(g, a.board, toWork(st.camera(), { x: view.width / 2, y: view.height / 2 }));
    if (plan.length === 0) return;
    let changes = 0;
    for (let i = 1; i < plan.length; i++) if (a.board.colourOf[plan[i]] !== a.board.colourOf[plan[i - 1]]) changes++;
    // About as long at every level: 30 ms an area, 8 to 30 s in all, with a breath between colours.
    const total = Math.min(30000, Math.max(8000, 30 * plan.length));
    const pause = changes > 0 ? Math.min(250, total / 3 / changes) : 0;
    const each = (total - pause * changes) / plan.length;
    const batch = Math.max(1, Math.ceil(33 / each));
    const interval = each * batch;
    setFocus(-1);
    autoRun.current = { plan, i: 0, timer: 0, interval, batch, pause };
    setAutoOn(true);
    announce("Auto-painting. Tap the picture to stop.");
    st.fit(true);
    autoRun.current.timer = window.setTimeout(stepAuto, calm ? 0 : 360);
  };
  useEffect(() => () => stopAuto(false), [stopAuto]);

  // ── The magnifier ───────────────────────────────────────────────────────────
  const magnify = async () => {
    const g = gameRef.current;
    const a = activeRef.current;
    const st = stage.current;
    const r = st?.renderer();
    if (!g || !a || !st || !r || g.done || busyRef.current) return;
    stopAuto(false);
    let colour = g.selected;
    if (isColourDone(g, a.board, colour)) {
      colour = nextColour(g, a.board, colour);
      if (colour < 0) return;
      select(colour, false);
    }
    const open = openAreas(g, a.board, colour);
    const camera = st.camera();
    const view = st.view();
    const hidden = open.filter((i) => {
      const label = a.puzzle.regions[i].labels[0];
      const p = toStage(camera, label);
      return p.x < 0 || p.y < 0 || p.x > view.width || p.y > view.height || 2 * label.r * camera.scale < HIDDEN;
    });
    if (hidden.length === 0) {
      // Every one is already in view: point them out, for free.
      r.ring(open, performance.now(), 1200);
      st.invalidate();
      announce(`All ${open.length} areas of colour ${colour + 1} are in view.`);
      return;
    }
    if (g.magnifiers <= 0) {
      if (settingsRef.current.sound) sound.empty();
      setShake((n) => n + 1);
      announce("No magnifiers left for this painting.");
      return;
    }
    const target = magnifierTarget(hidden, a.board, toWork(camera, { x: view.width / 2, y: view.height / 2 }));
    act({ type: "magnify" });
    const label = a.puzzle.regions[target].labels[0];
    const range = st.range();
    const scale = Math.min(range.max, Math.max(camera.scale, LOOK_AT / (2 * label.r)));
    const goal = centreOn(view, label, scale);
    if (settingsRef.current.sound) sound.magnify(calm ? 0 : flight(camera, goal, view).duration);
    const arrived = await st.fly(goal);
    if (!arrived) return;
    st.renderer()?.ring([target], performance.now(), 1200);
    st.invalidate();
    const left = gameRef.current?.magnifiers ?? 0;
    announce(`Here's one. ${left} magnifier${left === 1 ? "" : "s"} left.`);
  };

  // ── Keys: arrows pan, + − 0 zoom, N finds the next area of the colour, Enter paints it, M magnifies ──
  const goTo = (area: number) => {
    const a = activeRef.current;
    const st = stage.current;
    if (!a || !st) return;
    setFocus(area);
    const label = a.puzzle.regions[area].labels[0];
    const camera = st.camera();
    const view = st.view();
    const p = toStage(camera, label);
    const small = 2 * label.r * camera.scale < HIDDEN;
    if (small || p.x < 40 || p.y < 40 || p.x > view.width - 40 || p.y > view.height - 40) {
      st.fly(centreOn(view, label, Math.min(st.range().max, Math.max(camera.scale, LOOK_AT / (2 * label.r)))));
    }
  };
  const keys = useRef<(e: KeyboardEvent) => void>(() => {});
  keys.current = (e: KeyboardEvent) => {
    if (sheetRef.current || e.metaKey || e.ctrlKey || e.altKey || e.defaultPrevented) return;
    // Escape stops auto-paint wherever focus is (a swatch, the slider).
    if (e.key === "Escape") {
      if (autoRun.current) stopAuto(true);
      return;
    }
    const target = e.target as HTMLElement | null;
    if (target?.closest("input, textarea, select, dialog")) return;
    const g = gameRef.current;
    const a = activeRef.current;
    const st = stage.current;
    if (!g || !a || !st) return;
    if (busyRef.current || g.done) return;
    if (e.key === "m" || e.key === "M") {
      e.preventDefault();
      magnify();
      return;
    }
    if (e.key === "n" || e.key === "N") {
      e.preventDefault();
      const open = openAreas(g, a.board, g.selected);
      if (open.length === 0) return;
      const at = open.indexOf(focus);
      const next = at < 0 ? (e.shiftKey ? open.length - 1 : 0) : (at + (e.shiftKey ? open.length - 1 : 1)) % open.length;
      goTo(open[next]);
      const left = open.length;
      announce(`Area ${next + 1} of ${left} left in colour ${g.selected + 1}. Press Enter to paint it.`);
      return;
    }
    // Keys a focused button or link would use itself.
    if (target?.closest("button, a")) return;
    const view = st.view();
    if ((e.key === "Enter" || e.key === " ") && focus < 0) {
      // Nothing found yet: Enter finds the colour's first open area, as N does.
      e.preventDefault();
      const open = openAreas(g, a.board, g.selected);
      if (open.length === 0) return;
      goTo(open[0]);
      announce(`Area 1 of ${open.length} left in colour ${g.selected + 1}. Press Enter to paint it, N for the next.`);
      return;
    }
    if ((e.key === "Enter" || e.key === " ") && focus >= 0) {
      e.preventDefault();
      if (!g.painted[focus] && a.board.colourOf[focus] === g.selected) {
        const area = focus;
        paint(area, a.puzzle.regions[area].labels[0], null, false);
        const open = openAreas(gameRef.current ?? g, a.board, g.selected).filter((i) => i !== area);
        if (open.length > 0) goTo(open[0]);
        else setFocus(-1);
      }
      return;
    }
    const step = e.shiftKey ? 0.5 : 0.1;
    const pan: Record<string, [number, number]> = { ArrowLeft: [1, 0], ArrowRight: [-1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] };
    if (pan[e.key]) {
      e.preventDefault();
      st.panBy(pan[e.key][0] * view.width * step, pan[e.key][1] * view.height * step);
    } else if (e.key === "+" || e.key === "=") {
      e.preventDefault();
      st.zoomBy(1.25);
    } else if (e.key === "-" || e.key === "_") {
      e.preventDefault();
      st.zoomBy(0.8);
    } else if (e.key === "0") {
      e.preventDefault();
      st.fit(true);
    }
  };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => keys.current(e);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // Development hooks for the end-to-end tests: where an area is on screen, the state, the puzzle.
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    (window as unknown as { __colorTap: unknown }).__colorTap = {
      state: () => gameRef.current,
      puzzle: () => stage.current?.renderer()?.puzzle ?? null,
      point: (area: number) => {
        const p = stage.current?.renderer()?.puzzle;
        return p && stage.current ? stage.current.toClient(p.regions[area].labels[0]) : null;
      },
      camera: () => stage.current?.camera() ?? null,
      range: () => stage.current?.range() ?? null,
      frameMs: () => stage.current?.frameMs() ?? 0,
    };
  }, []);

  // ── What the screen shows ───────────────────────────────────────────────────
  const progress = game && active ? colourProgress(game, active.board) : null;
  const total = active?.puzzle.regions.length ?? 0;
  const done = game?.order.length ?? 0;
  const entryOf = (picture: string, level: LevelId) => PICTURES.find((p) => p.id === picture)?.levels.find((l) => l.level === level);
  const inHand = (picture: string, level: LevelId) => !!active && !!game && active.picture.id === picture && active.entry.level === level;
  /** How far a painting has got, against the puzzle it is on (a retired one may have a different count). */
  const progressOf = (picture: string, level: LevelId): { painted: number; areas: number } => {
    if (inHand(picture, level)) return { painted: done, areas: total };
    const work = works[workKey(picture, level)];
    const entry = entryOf(picture, level);
    const painted = paintedIn(work, entry);
    // Against the puzzle it was begun on: a retired one keeps its own count.
    const retired = work && entry?.retired.find((r) => r.id === work.saved.puzzle);
    return { painted, areas: retired ? retired.areas : (entry?.areas ?? 0) };
  };
  const stageOf = (picture: string, level: LevelId): WorkStage => {
    const { painted, areas } = progressOf(picture, level);
    return painted === 0 ? "blank" : painted >= areas ? "done" : "started";
  };
  const chosen = progressOf(choice.picture, choice.level);
  const percent = chosen.painted > 0 && chosen.areas > 0 ? Math.min(100, Math.floor((100 * chosen.painted) / chosen.areas)) : null;
  const title = showing ? "New painting" : active ? `${active.picture.title} · ${levelById(active.entry.level).name}` : TITLE;
  const canvasLabel = showing
    ? `The blank sheet of ${PICTURES.find((p) => p.id === choice.picture)?.title ?? "the picture"}, ${levelById(choice.level).name}`
    : active && game
      ? `${active.picture.title}: ${done} of ${total} areas painted`
      : "The picture";
  const playing = !!game && !!active && !game.done && !showing;

  return (
    <main id="main" className="ctp-game" data-ready={stagePuzzle ? "" : undefined} data-busy={busy ?? undefined}>
      <h1 className="ctp-sr">{TITLE}</h1>
      <header className="ctp-bar">
        <a className="ctp-round" href={ALL_GAMES.href} aria-label={ALL_GAMES.label}>
          <HouseSimpleIcon size={20} weight="bold" aria-hidden />
        </a>
        <div className="ctp-title">
          <span className="ctp-title-text">{title}</span>
          {active && game && !showing && (
            <span className="ctp-overall" role="progressbar" aria-label="Areas painted" aria-valuemin={0} aria-valuemax={total} aria-valuenow={done}>
              <i style={{ transform: `scaleX(${total ? done / total : 0})` }} />
            </span>
          )}
        </div>
        <button type="button" className="ctp-round" aria-label="Paintings" onClick={openNew} disabled={busy !== null}>
          <ImagesIcon size={20} weight="bold" aria-hidden />
        </button>
        <button
          type="button"
          className="ctp-round"
          aria-label="Settings"
          onClick={() => {
            stopAuto(false);
            setSheet("settings");
          }}
          disabled={busy !== null}
        >
          <GearSixIcon size={20} weight="bold" aria-hidden />
        </button>
      </header>

      <div className="ctp-studio">
        <Stage ref={stage} puzzle={stagePuzzle} onTap={onTap} onMove={onMove} onPress={onPress} zoom={zoom} label={canvasLabel} describedBy="ctp-keys" calm={calm} />
        <p id="ctp-keys" className="ctp-sr">
          {KEYS}
        </p>
        {!stagePuzzle && (
          <p className="ctp-empty" role="status">
            {PICTURES.length > 0 ? "Sketching…" : EMPTY}
          </p>
        )}
        {coach && playing && <p className="ctp-coach">{COACH}</p>}
        {autoOn && (
          <button type="button" className="ctp-stop" onClick={() => stopAuto(true)}>
            <StopIcon size={16} weight="fill" aria-hidden />
            Stop auto-paint
          </button>
        )}
        {busy === "replay" && (
          <button type="button" className="ctp-stop" onClick={() => (skipReplay.current = true)}>
            Skip
          </button>
        )}
        {/* Twice, one shown per layout, so focus runs in the order each layout shows them. */}
        <Tools layout="row" zoom={zoom} stage={stage} ready={!!stagePuzzle} playing={playing && busy === null} autoOn={autoOn} magnifiers={game?.magnifiers ?? 0} shake={shake} onAuto={autoOn ? () => stopAuto(true) : startAuto} onMagnify={magnify} />
        <Tools layout="column" zoom={zoom} stage={stage} ready={!!stagePuzzle} playing={playing && busy === null} autoOn={autoOn} magnifiers={game?.magnifiers ?? 0} shake={shake} onAuto={autoOn ? () => stopAuto(true) : startAuto} onMagnify={magnify} />
      </div>

      <div className="ctp-dock">
        {active && game && progress && !showing ? (
          <Palette palette={active.puzzle.palette} painted={progress} total={active.board.total} selected={game.selected} onSelect={(c) => select(c, true)} wiggle={wiggle} calm={calm} />
        ) : (
          <div className="ctp-palette" aria-hidden />
        )}
      </div>

      <p className="ctp-sr" role="status" aria-live="polite">
        {message}
      </p>

      <Sheet prefix="ctp" open={sheet === "new"} label="New painting" dismissible={active !== null} onClose={closeNew}>
        <NewPaintingPanel
          pictures={PICTURES}
          picture={choice.picture}
          level={choice.level}
          stageOf={stageOf}
          percent={percent}
          onChoose={(picture, level) => setChoice({ picture, level })}
          onStart={startChosen}
          loading={loading}
        />
      </Sheet>
      <Sheet prefix="ctp" open={sheet === "settings"} label="Settings" dismissible onClose={() => setSheet(null)}>
        {/* Keyed to the sheet being up, so its confirm step starts over every time it opens. */}
        <SettingsPanel
          key={sheet === "settings" ? "open" : "closed"}
          settings={settings}
          onSettings={setSettings}
          coarse={coarse}
          onRestart={active && game && game.order.length > 0 ? restart : null}
          onNew={openNew}
        />
      </Sheet>
      <Sheet prefix="ctp" open={sheet === "finished"} label="Finished" dismissible onClose={() => setSheet(null)}>
        {/* Only while it is up, and keyed to the puzzle, so it always draws the painting in hand. */}
        {sheet === "finished" && active && game && (
          <FinishedPanel
            key={active.puzzle.id}
            picture={active.picture}
            level={active.entry.level}
            puzzle={active.puzzle}
            elapsed={game.elapsed}
            auto={game.auto}
            onReplay={async () => {
              setSheet(null);
              await runReplay();
              setSheet("finished");
            }}
            onNew={openNew}
          />
        )}
      </Sheet>
    </main>
  );
}

type Layout = "row" | "column";

/**
 * The tools. In a row under the picture on a phone: Fit, −, the slider, +, Auto-paint, the
 * magnifier. In a column on the right on a tablet or desktop: the magnifier, Auto-paint, +, the
 * slider, −, Fit (the reference layout).
 */
function Tools({
  layout,
  zoom,
  stage,
  ready,
  playing,
  autoOn,
  magnifiers,
  shake,
  onAuto,
  onMagnify,
}: {
  layout: Layout;
  zoom: ZoomStore;
  stage: RefObject<StageHandle | null>;
  /** A picture is on the stage. */
  ready: boolean;
  /** A painting is under way and nothing else owns the screen. */
  playing: boolean;
  autoOn: boolean;
  magnifiers: number;
  shake: number;
  onAuto: () => void;
  onMagnify: () => void;
}) {
  const auto = (
    <button key="auto" type="button" className="ctp-tool ctp-auto" aria-label="Auto-paint" aria-pressed={autoOn} onClick={onAuto} disabled={!playing}>
      <MagicWandIcon size={20} weight="bold" aria-hidden />
      <span aria-hidden>{autoOn ? "Stop" : "Auto"}</span>
    </button>
  );
  const glass = (
    <button
      key="glass"
      type="button"
      className="ctp-tool ctp-glass"
      aria-label={`Magnifier, ${magnifiers} left`}
      onClick={onMagnify}
      disabled={!playing}
      data-empty={magnifiers === 0 ? "" : undefined}
      data-shake={shake ? (shake % 2 ? "a" : "b") : undefined}
    >
      <MagnifyingGlassIcon size={22} weight="bold" aria-hidden />
      <span className="ctp-count" aria-hidden>
        {magnifiers}
      </span>
    </button>
  );
  const controls = <Zoom key="zoom" layout={layout} store={zoom} stage={stage} disabled={!ready} />;
  return (
    <div className="ctp-tools" data-layout={layout} role="toolbar" aria-label="Tools" aria-orientation={layout === "row" ? "horizontal" : "vertical"}>
      {layout === "row" ? [controls, auto, glass] : [glass, auto, controls]}
    </div>
  );
}

/** Fit, −, the zoom slider and + (the slider follows pinches without the game re-rendering). */
function Zoom({ layout, store, stage, disabled }: { layout: Layout; store: ZoomStore; stage: RefObject<StageHandle | null>; disabled: boolean }) {
  const value = useSyncExternalStore(store.subscribe, store.get, () => 0);
  const fit = (
    <button key="fit" type="button" className="ctp-tool" aria-label="Fit the picture" onClick={() => stage.current?.fit(true)} disabled={disabled}>
      <CornersOutIcon size={20} weight="bold" aria-hidden />
    </button>
  );
  const out = (
    <button key="out" type="button" className="ctp-tool ctp-step" aria-label="Zoom out" onClick={() => stage.current?.zoomBy(1 / 1.5)} disabled={disabled}>
      <MinusIcon size={18} weight="bold" aria-hidden />
    </button>
  );
  const slider = (
    <input
      key="slider"
      type="range"
      className="ctp-slider"
      min={0}
      max={1000}
      // 40 steps across the range for the arrow keys.
      step={25}
      value={Math.round(value * 1000)}
      aria-label="Zoom"
      aria-orientation={layout === "row" ? "horizontal" : "vertical"}
      aria-valuetext={`${(store.ratio ** value).toFixed(1)} times`}
      onChange={(e) => stage.current?.setSlider(Number(e.target.value) / 1000)}
      disabled={disabled}
    />
  );
  const zoomIn = (
    <button key="in" type="button" className="ctp-tool ctp-step" aria-label="Zoom in" onClick={() => stage.current?.zoomBy(1.5)} disabled={disabled}>
      <PlusIcon size={18} weight="bold" aria-hidden />
    </button>
  );
  return <div className="ctp-zoom">{layout === "row" ? [fit, out, slider, zoomIn] : [zoomIn, slider, out, fit]}</div>;
}
