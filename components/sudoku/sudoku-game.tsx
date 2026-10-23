"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef, useState, type MouseEvent } from "react";
import { GearSixIcon, HouseSimpleIcon, LightbulbIcon, PaintBrushIcon, TimerIcon, TrophyIcon } from "@phosphor-icons/react/dist/ssr";
import { DIFFICULTY_COPY, THEME_COPY } from "@/data/sudoku";
import { TROPHIES } from "@/data/sudoku-trophies";
import { digitCounts, finishedBy, newGame, reduce, type Action, type GameState, type Move } from "@/lib/sudoku/game";
import type { Difficulty } from "@/lib/sudoku/generate";
import { BOXES, colOf, rowOf, unitLabel } from "@/lib/sudoku/grid";
import {
  EMBLEM_TAP_MS,
  IDLE_MARKS,
  RECENT_MOVES,
  THEMES,
  resolveTheme,
  secretsAt,
  type Moment,
  type SecretDef,
  type ThemeChoice,
  type ThemeId,
} from "@/lib/sudoku/themes";
import { collect, drawTrophy, foundCount, winCount, type Collection } from "@/lib/sudoku/trophies";
import { Board } from "./board";
import { haptic, setVoice, sound, unlockAudio } from "./feedback";
import { Fireworks } from "./fireworks";
import { CollectionPanel, NewGamePanel, ResultPanel, SettingsPanel, ThemePanel, formatClock, formatTime } from "./menus";
import { Pad } from "./pad";
import { Sheet } from "./sheet";
import {
  GAME,
  claimGame,
  gameFrom,
  loadArrived,
  loadBest,
  loadCollection,
  loadGame,
  loadSecrets,
  loadSettings,
  ownsGame,
  resolveScheme,
  saveArrived,
  saveBest,
  saveCollection,
  saveGame,
  saveSecrets,
  saveSettings,
  type Best,
  type Found,
  type Settings,
} from "./storage";
import { SKINS, type Beat, type Cue } from "./themes";
import { useMoveFx } from "./use-move-fx";

// /sudoku: one screen, no scrolling, sized for a phone held upright. The game is client-only
// state (generated and saved in the browser), so the server renders an empty board and the
// mount resumes the saved game or opens the New game sheet to pick a first difficulty (with a way
// to Settings first, since that sheet can't be closed until there is a game).

const reduceLoaded = (state: GameState | null, action: Action) =>
  action.type === "load" ? action.state : state && reduce(state, action);

const EMPTY = Array<number>(81).fill(0);
const DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

/** "Row 3, column 7", for the live region. */
const where = (cell: number) => `Row ${rowOf(cell) + 1}, column ${colOf(cell) + 1}`;

const gameKey = (state: GameState) => `${state.difficulty}:${state.seed}`;

/** A secret found or a season come in, shown for a few seconds under the bar. */
type Toast = { token: number; emoji: string; kicker: string; title: string };
const TOAST_MS = 3400;
/** The toast waits while the surprise plays its best part (it sits where scenes put their surprises). */
const TOAST_DELAY_MS = 1400;

export function SudokuGame() {
  const [state, dispatch] = useReducer(reduceLoaded, null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [best, setBest] = useState<Best>({});
  const [collection, setCollection] = useState<Collection>({});
  /** The New game sheet (Play's). */
  const [menu, setMenu] = useState(false);
  /** The Settings sheet (the gear's). */
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [result, setResult] = useState(false);
  const [shelf, setShelf] = useState(false);
  /** The theme picker. */
  const [picker, setPicker] = useState(false);
  const [newBest, setNewBest] = useState(false);
  /** The theme on screen and the scheme it's drawn in (from the settings; null until they load). */
  const [look, setLook] = useState<{ theme: ThemeId; scheme: "light" | "dark" } | null>(null);
  const [secrets, setSecrets] = useState<Found>({});
  /** The secrets first found during a game (by its key), for its result. */
  const [gameSecrets, setGameSecrets] = useState<{ game: string; found: SecretDef[] }>({ game: "", found: [] });
  const [cue, setCue] = useState<Cue | null>(null);
  const [beat, setBeat] = useState<Beat | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  /** Counts cues, beats and toasts, so each is new. */
  const token = useRef(0);
  /** The live region's text: each move's news, or a pencil mark. */
  const [live, setLive] = useState("");
  /** The seq of the last game loaded (new, resumed or from another tab): its moves are not news. */
  const loadedSeq = useRef(0);
  /** A game resumed at mount already won but never drew its trophy (the page died between the two saves). */
  const owedTrophy = useRef(false);

  /** This game's moves made in this tab (a secret's `recent`), the game they belong to and its seq. */
  const recent = useRef<{ game: string; moves: Move[]; seq: number }>({ game: "", moves: [], seq: 0 });

  const adopt = useCallback((next: GameState) => {
    loadedSeq.current = next.seq;
    // Another game, or moves made elsewhere: this tab's run starts over from here. (Another tab's
    // clock, selection or notes leave the seq alone, and the run with it.)
    const game = gameKey(next);
    if (recent.current.game !== game || recent.current.seq !== next.seq) recent.current = { game, moves: [], seq: next.seq };
    dispatch({ type: "load", state: next });
  }, []);

  const boardRef = useRef<HTMLDivElement>(null);
  /** The last state taken from another tab: the director shows it at rest (that tab played it). */
  const remote = useRef<GameState | null>(null);
  /** This tab's id: the tab the player last used owns the game (storage.ts claimGame). */
  const tabId = useRef("");
  const owns = useCallback(() => ownsGame(tabId.current), []);
  /** The running clock: when it last counted, and whether the page was in view. */
  const clock = useRef<{ last: number; visible: boolean } | null>(null);
  const fx = useMoveFx(state, settings?.sound ?? false, remote);

  useEffect(() => {
    tabId.current = Math.random().toString(36).slice(2);
    if (document.visibilityState === "visible") claimGame(tabId.current);
    setSettings(loadSettings());
    setBest(loadBest());
    setCollection(loadCollection());
    setSecrets(loadSecrets());
    const saved = loadGame();
    if (saved) {
      owedTrophy.current = saved.status === "won" && saved.trophy === null;
      adopt(saved);
    } else setMenu(true);
  }, [adopt]);

  useEffect(() => {
    if (state && owns()) saveGame(state);
  }, [state, owns]);

  // Several tabs: the one the player last used owns the game, alone saving it and running its
  // clock; the others follow its saves, shown at rest. Using a tab (a touch, a key, bringing it
  // into view) takes the game over, from the latest save.
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);
  useEffect(() => {
    const take = (other: GameState | null) => {
      const mine = stateRef.current;
      if (!other || (mine && JSON.stringify(other) === JSON.stringify(mine))) return;
      remote.current = other;
      adopt(other);
      setCollection(loadCollection());
      // The other tab counted the time up to its save; count only from here on.
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
      if (document.visibilityState !== "visible") return;
      claim();
      setCollection(loadCollection());
      setSecrets(loadSecrets());
    };
    window.addEventListener("storage", onStorage);
    document.addEventListener("visibilitychange", onVisible);
    document.addEventListener("pointerdown", claim, true);
    document.addEventListener("keydown", claim, true);
    return () => {
      window.removeEventListener("storage", onStorage);
      document.removeEventListener("visibilitychange", onVisible);
      document.removeEventListener("pointerdown", claim, true);
      document.removeEventListener("keydown", claim, true);
    };
  }, [adopt, owns]);

  // The look: the chosen appearance (or the system's, as it changes) and the chosen theme (or the
  // season's, checked again whenever the page comes back into view). LOOK_SCRIPT set both before
  // paint, so nothing changes until the settings have loaded. Safari tints its bars with theme-color.
  const appearance = settings?.appearance;
  const choice = settings?.theme;
  useEffect(() => {
    if (!appearance || !choice) return;
    const root = document.documentElement;
    const media = matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const next = { theme: resolveTheme(choice, new Date()), scheme: resolveScheme(appearance) };
      root.dataset.sdkScheme = next.scheme;
      root.dataset.sdkTheme = next.theme;
      setLook((prev) => (prev?.theme === next.theme && prev.scheme === next.scheme ? prev : next));
      const ground = getComputedStyle(root).getPropertyValue("--bg").trim();
      document.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.setAttribute("content", ground));
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") apply();
    };
    apply();
    media.addEventListener("change", apply);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      media.removeEventListener("change", apply);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [appearance, choice]);

  const themeId = look?.theme ?? null;
  const theme = themeId ? THEMES[themeId] : null;
  const skin = themeId ? SKINS[themeId] : null;
  useEffect(() => {
    if (themeId) setVoice(SKINS[themeId].voice);
  }, [themeId]);

  // iOS only lets audio start inside a gesture: wake it on every touch, click and key.
  const soundOn = settings?.sound ?? false;
  useEffect(() => {
    if (!soundOn) return;
    const wake = () => unlockAudio();
    const events = ["touchend", "pointerup", "keydown"] as const;
    events.forEach((e) => document.addEventListener(e, wake, { passive: true }));
    return () => events.forEach((e) => document.removeEventListener(e, wake));
  }, [soundOn]);

  // The clock runs while a game is under way, no sheet is up, the page is in view and this tab owns
  // the game. Every stop
  // (a sheet, hiding the page, the effect ending) counts the part-second since the last tick, and a
  // move counts it first, so the winning move's time is in the best time.
  const playing = state?.status === "playing";
  const paused = menu || settingsOpen || shelf || picker;
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

  // A solved board wins its trophy once, in the tab whose move won it (the game keeps its id, so a
  // reload or another tab never draws again), and sets the best time for its difficulty (read
  // fresh, so a resumed win is never "new").
  const recorded = useRef<string | null>(null);
  useEffect(() => {
    if (!state || state.status !== "won") return;
    if (state.trophy === null && state.last !== null && (state.last.seq > loadedSeq.current || owedTrophy.current)) {
      owedTrophy.current = false;
      const owned = loadCollection();
      const won = drawTrophy(state.seed, owned);
      const next = collect(owned, won.id);
      saveCollection(next);
      setCollection(next);
      dispatch({ type: "award", trophy: won.id });
    }
    const key = `${state.difficulty}:${state.seed}`;
    if (recorded.current === key) return;
    recorded.current = key;
    const prev = loadBest();
    const record = prev[state.difficulty];
    const isBest = record === undefined || state.elapsed < record;
    setNewBest(isBest);
    if (isBest) {
      const next = { ...prev, [state.difficulty]: state.elapsed };
      saveBest(next);
      setBest(next);
    }
  }, [state]);

  // The result sheet waits for the last move's animation (and the finale) to finish; until the
  // director has taken the move up (an effect after this render), fx.running hasn't turned on yet.
  const over = state?.status === "won";
  const settled = fx.seq === (state?.last?.seq ?? 0) && !fx.running;
  useEffect(() => {
    if (!over) setResult(false);
    else if (settled) setResult(true);
  }, [over, settled]);

  // Secrets: each moment of play is checked against the theme's secrets. A secret met plays its
  // surprise (every time); the first time, it is saved, announced and listed in the game's result.
  const themeRef = useRef(themeId);
  const soundRef = useRef(false);
  useEffect(() => {
    themeRef.current = themeId;
    soundRef.current = settings?.sound ?? false;
  }, [themeId, settings?.sound]);

  const toastTimer = useRef(0);
  const announce = useCallback((emoji: string, kicker: string, title: string) => {
    clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast({ token: ++token.current, emoji, kicker, title }), TOAST_DELAY_MS);
  }, []);
  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const fire = useCallback(
    (...moments: Moment[]) => {
      const theme = themeRef.current;
      if (!theme) return;
      const now = new Date();
      const met = moments.flatMap((moment) => secretsAt(theme, { moment, now, recent: recent.current.moves }));
      const hits = met.filter((s, k) => met.findIndex((t) => t.id === s.id) === k);
      if (!hits.length) return;
      const known = loadSecrets();
      const mine = known[theme] ?? [];
      const fresh = hits.filter((s) => !mine.includes(s.id));
      const shown = fresh[0] ?? hits[0];
      setCue({ token: ++token.current, surprise: shown.surprise });
      if (soundRef.current) sound.secret(shown.surprise);
      if (!fresh.length) return;
      const next = { ...known, [theme]: [...mine, ...fresh.map((s) => s.id)] };
      saveSecrets(next);
      setSecrets(next);
      announce(shown.emoji, THEME_COPY.secretFound, shown.name);
      const game = recent.current.game;
      setGameSecrets((prev) => ({ game, found: [...(prev.game === game ? prev.found : []), ...fresh] }));
    },
    [announce],
  );

  const start = useCallback(
    (difficulty: Difficulty) => {
      const next = newGame(difficulty, Math.floor(Math.random() * 2 ** 31));
      adopt(next);
      setMenu(false);
      setResult(false);
      setShelf(false);
      setNewBest(false);
      setBeat({ token: ++token.current, kind: "deal" });
      fire({ kind: "deal", state: next });
    },
    [adopt, fire],
  );

  // Every move made in this tab is a beat for the scene and a moment for the secrets (a move that
  // came with a loaded game, or from another tab, is neither).
  useEffect(() => {
    const move = state?.last;
    if (!state || !move) return;
    const game = gameKey(state);
    if (recent.current.game !== game) recent.current = { game, moves: [], seq: 0 };
    if (move.seq <= loadedSeq.current || move.seq <= recent.current.seq) return;
    recent.current = { game, moves: [...recent.current.moves, move].slice(-RECENT_MOVES), seq: move.seq };
    const won = state.status === "won";
    setBeat(
      move.kind === "miss"
        ? { token: ++token.current, kind: "miss", cell: move.cell, digit: move.digit }
        : { token: ++token.current, kind: won ? "win" : move.kind, cell: move.cell, digit: move.digit, units: move.units, digitDone: move.digitDone },
    );
    fire({ kind: "move", state, move }, ...(won ? [{ kind: "win" as const, state }] : []));
  }, [state, fire]);

  // Idle: a game under way with no move for a while (the clock running, the page in view).
  const seq = state?.seq;
  useEffect(() => {
    if (!playing || paused || !themeId) return;
    const timers = IDLE_MARKS.map((seconds) =>
      window.setTimeout(() => {
        const now = stateRef.current;
        if (now?.status === "playing" && document.visibilityState === "visible") fire({ kind: "idle", seconds, state: now });
      }, seconds * 1000),
    );
    return () => timers.forEach(clearTimeout);
  }, [playing, paused, themeId, seq, fire]);

  // The title: every tap hops the emblem, and taps in a row count up.
  const taps = useRef({ n: 0, at: -Infinity });
  const [hop, setHop] = useState(0);
  const onEmblem = () => {
    const now = performance.now();
    taps.current = { n: now - taps.current.at <= EMBLEM_TAP_MS ? taps.current.n + 1 : 1, at: now };
    setHop((h) => h + 1);
    fire({ kind: "emblem", taps: taps.current.n });
  };

  /** A tap on a piece of the scene marked data-tap. */
  const onScene = (e: MouseEvent<HTMLDivElement>) => {
    const piece = (e.target as Element).closest<HTMLElement>("[data-tap]");
    if (piece?.dataset.tap) fire({ kind: "scene", target: piece.dataset.tap });
  };

  // A season come in: when Seasonal brings in a theme it hasn't shown before, it says so once,
  // with the scene's "arrive" surprise, in view and with no sheet up (a won board waits for the next
  // game: its result sheet opens a render after the board settles). A first visit out of season
  // stays quiet; Aurora, between seasons, says so.
  const sheetUp = menu || settingsOpen || shelf || picker || result || over;
  useEffect(() => {
    if (!themeId || choice !== "seasonal" || sheetUp) return;
    const arrive = () => {
      if (document.visibilityState !== "visible") return;
      document.removeEventListener("visibilitychange", arrive);
      const last = loadArrived();
      if (last === themeId) return;
      saveArrived(themeId);
      if (last === null && themeId === "aurora") return;
      const theme = THEMES[themeId];
      setCue({ token: ++token.current, surprise: "arrive" });
      announce(theme.emoji, theme.season ? THEME_COPY.arrived : THEME_COPY.between, theme.arrival);
      if (soundRef.current) sound.secret("arrive");
    };
    arrive();
    document.addEventListener("visibilitychange", arrive);
    return () => document.removeEventListener("visibilitychange", arrive);
  }, [themeId, choice, sheetUp, announce]);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), TOAST_MS);
    return () => clearTimeout(id);
  }, [toast]);

  // Development only: e2e and the theme tools play a scene's surprise by name.
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    (window as unknown as { __sudoku: unknown }).__sudoku = {
      cue: (surprise: string) => setCue({ token: ++token.current, surprise }),
    };
  }, []);

  const changeSettings = useCallback((next: Settings) => {
    // Turning sound on is itself a gesture: wake the audio now, not on the next tap.
    if (next.sound) unlockAudio();
    setSettings(next);
    saveSettings(next);
  }, []);

  const feel = (kind: "tap" | "double") => {
    if (settings?.haptics) haptic(kind);
  };

  // Haptics fire here, inside the tap (iOS ties them to the gesture), so the outcome is worked out ahead.
  const onDigit = (digit: number) => {
    if (!state || state.status !== "playing" || state.selected === null || state.grid[state.selected]) return;
    const cell = state.selected;
    if (state.notesMode) {
      feel("tap");
      if (soundOn) sound.pencil();
      setLive(`${where(cell)}: note ${digit} ${state.notes[cell] & (1 << digit) ? "removed" : "added"}.`);
    } else if (digit !== state.solution[cell]) feel("double");
    else {
      const grid = state.grid.slice();
      grid[cell] = digit;
      const { units, digitDone } = finishedBy(grid, cell, digit);
      feel(units.length || digitDone ? "double" : "tap");
    }
    flushClock();
    dispatch({ type: "digit", digit });
  };

  const onNotes = useCallback(() => dispatch({ type: "notes" }), []);

  const onSelect = useCallback((cell: number) => dispatch({ type: "select", cell }), []);

  const onHint = () => {
    if (!state || state.status !== "playing" || state.hintsLeft === 0) return;
    feel("tap");
    flushClock();
    dispatch({ type: "hint" });
  };

  // Keyboard play on desktop: digits, arrows, N for notes, H for a hint.
  useEffect(() => {
    if (!state || menu || settingsOpen || result || shelf || picker) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const arrows: Record<string, [number, number]> = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };
      // A held key repeats: only the arrows may (a held H would spend every hint).
      if (e.repeat && !(e.key in arrows)) return;
      if (/^[1-9]$/.test(e.key)) onDigit(Number(e.key));
      else if (e.key in arrows) {
        const [dRow, dCol] = arrows[e.key];
        dispatch({ type: "step", dRow, dCol });
        requestAnimationFrame(() => boardRef.current?.querySelector<HTMLElement>("[data-selected]")?.focus());
      } else if (e.key === "n" || e.key === "N") dispatch({ type: "notes" });
      else if (e.key === "h" || e.key === "H") onHint();
      else return;
      e.preventDefault();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  });

  // The live region: each move once, by position (so a run of the same digit is still news), and
  // never the move a load restored; pencil marks set it in their handler.
  const last = state?.last;
  const moveNews = useMemo(() => {
    if (!last || last.seq <= loadedSeq.current) return "";
    if (last.kind === "miss") return `${where(last.cell)}: ${last.digit} doesn't fit.`;
    const finished = [...last.units.map(unitLabel), ...(last.digitDone ? [`all nine ${last.digit}s`] : [])];
    return `${where(last.cell)}: ${last.kind === "hint" ? "hint, " : ""}${last.digit}.${finished.length ? ` Finished ${finished.join(", ")}.` : ""}`;
  }, [last]);
  // The same words twice in a row would not be read again: every other move gets a trailing space.
  useEffect(() => {
    if (moveNews && last) setLive(moveNews + (last.seq % 2 ? "" : "\u00a0"));
  }, [moveNews, last]);

  const counts = useMemo(() => digitCounts(state?.grid ?? EMPTY), [state?.grid]);
  const done = useMemo(() => counts.reduce((mask, n, d) => (d && n === 9 ? mask | (1 << d) : mask), 0), [counts]);
  const grid = state?.grid ?? EMPTY;
  const boxes = useMemo(() => BOXES.reduce((mask, box, b) => (box.cells.every((i) => grid[i]) ? mask | (1 << b) : mask), 0), [grid]);
  const filled = useMemo(() => grid.filter(Boolean).length / grid.length, [grid]);
  const Backdrop = skin?.Backdrop;
  const Overlay = skin?.Overlay;
  const found = foundCount(collection);
  // The player's Nth board: the boards won so far, and this one until its trophy is drawn.
  const title = state ? `${DIFFICULTY_COPY[state.difficulty].name} Puzzle ${winCount(collection) + (state.trophy === null ? 1 : 0)}` : "Sudoku";
  const selectedValue = state && state.selected !== null ? state.grid[state.selected] : 0;

  return (
    <>
      {Backdrop && (
        // Pointer-only easter eggs: nothing here is needed to play, so the scene stays out of the accessibility tree.
        <div className="sdk-scene" aria-hidden onClick={onScene}>
          <Backdrop boxes={boxes} filled={filled} beat={beat} cue={cue} />
        </div>
      )}
      <main id="main" className="sdk-game">
        <header className="sdk-bar">
          <button type="button" className="sdk-round" aria-label="Settings" onClick={() => setSettingsOpen(true)}>
            <GearSixIcon size={20} weight="bold" />
          </button>
          <h1 className="sdk-title" onClick={onEmblem}>
            {theme?.emblem ? (
              <span key={hop} className="sdk-emblem" data-hop={hop ? "" : undefined} aria-hidden>
                {theme.emblem}
              </span>
            ) : (
              <span key={hop} className="sdk-mark" data-hop={hop ? "" : undefined} aria-hidden />
            )}
            {title}
          </h1>
          <a href="/" className="sdk-round" aria-label="Back to angeronia.com">
            <HouseSimpleIcon size={20} weight="bold" />
          </a>
        </header>

        <div className="sdk-gap-a" aria-hidden />

        <div className="sdk-stage">
          <Board
            puzzle={state?.puzzle ?? null}
            grid={state?.grid ?? EMPTY}
            notes={state?.notes ?? EMPTY}
            done={done}
            selected={state?.selected ?? null}
            lit={fx.lit}
            sweeps={fx.sweeps}
            miss={fx.miss}
            reel={fx.reel}
            onSelect={onSelect}
            boardRef={boardRef}
          />
          {fx.burst !== null && <Fireworks token={fx.burst} glyphs={theme?.sparks ?? []} />}
        </div>

        <div className="sdk-gap-b" aria-hidden />
        <div className="sdk-rule" aria-hidden />

        <div className="sdk-deck">
          <Pad
            counts={counts}
            notesMode={state?.notesMode ?? false}
            active={selectedValue}
            disabled={!playing}
            onDigit={onDigit}
            onNotes={onNotes}
          />
          <span className="sdk-time" role="timer" aria-label={`Time ${formatTime(state?.elapsed ?? 0)}`}>
            <span className="sdk-time-face" aria-hidden>
              <TimerIcon size={17} weight="bold" />
              <span>{formatClock(state?.elapsed ?? 0)}</span>
            </span>
          </span>
        </div>

        <div className="sdk-gap-c" aria-hidden />

        <nav className="sdk-dock" aria-label="Game">
          <button type="button" className="sdk-dock-btn" onClick={() => setPicker(true)}>
            <PaintBrushIcon size={24} weight="fill" aria-hidden />
            <span>Themes</span>
          </button>
          <button
            type="button"
            className="sdk-dock-btn"
            aria-label={`Hint, ${state?.hintsLeft ?? 0} left`}
            disabled={!playing || state?.hintsLeft === 0}
            onClick={onHint}
          >
            <LightbulbIcon size={24} weight="fill" aria-hidden />
            <span>Hint</span>
            {!!state?.hintsLeft && (
              <span className="sdk-count" aria-hidden>
                {state.hintsLeft}
              </span>
            )}
          </button>
          <button type="button" className="sdk-dock-btn" onClick={() => setMenu(true)}>
            <span className="sdk-play-mark" aria-hidden>
              {DIGITS.map((d) => (
                <i key={d} data-digit={d} />
              ))}
            </span>
            <span>Play</span>
          </button>
          <button type="button" className="sdk-dock-btn" aria-label={`Collection, ${found} of ${TROPHIES.length} found`} onClick={() => setShelf(true)}>
            <TrophyIcon size={24} weight="fill" aria-hidden />
            <span>Collection</span>
          </button>
        </nav>

        <p className="sdk-sr" aria-live="polite">
          {live}
        </p>
        {/* The toast's news, in a region of its own: a move's news would overwrite it in the same commit. */}
        <p className="sdk-sr" aria-live="polite">
          {toast ? `${toast.kicker}: ${toast.title}` : ""}
        </p>

        {/* Before the first game Settings opens over this sheet, which comes back when it closes. */}
        <Sheet open={menu && !settingsOpen && !shelf && !picker} label="New game" dismissible={state !== null} onClose={() => setMenu(false)}>
          <NewGamePanel
            best={best}
            current={playing ? state.difficulty : null}
            onStart={start}
            onSettings={state === null ? () => setSettingsOpen(true) : null}
          />
        </Sheet>

        <Sheet open={settingsOpen && !picker} label="Settings" dismissible onClose={() => setSettingsOpen(false)}>
          {settings && <SettingsPanel settings={settings} theme={themeId} onSettings={changeSettings} onThemes={() => setPicker(true)} />}
        </Sheet>

        {state && (
          <Sheet open={result && !menu && !settingsOpen && !shelf && !picker} label="Result" dismissible onClose={() => setResult(false)}>
            <ResultPanel
              state={state}
              best={best}
              newBest={newBest}
              collection={collection}
              solved={theme?.solved ?? THEMES.aurora.solved}
              secrets={gameSecrets.game === gameKey(state) ? gameSecrets.found : []}
              onAgain={() => start(state.difficulty)}
              onMenu={() => setMenu(true)}
              onCollection={() => setShelf(true)}
            />
          </Sheet>
        )}

        <Sheet open={shelf} label="Collection" dismissible onClose={() => setShelf(false)}>
          {shelf && <CollectionPanel collection={collection} highlight={state?.trophy ?? null} />}
        </Sheet>

        <Sheet open={picker} label={THEME_COPY.title} dismissible onClose={() => setPicker(false)}>
          {picker && settings && look && (
            <ThemePanel
              choice={settings.theme}
              active={look.theme}
              scheme={look.scheme}
              secrets={secrets}
              onChoose={(theme: ThemeChoice) => changeSettings({ ...settings, theme })}
            />
          )}
        </Sheet>
      </main>
      {Overlay && (
        <div className="sdk-overlay" aria-hidden>
          <Overlay boxes={boxes} filled={filled} beat={beat} cue={cue} />
        </div>
      )}
      {toast && (
        <div key={toast.token} className="sdk-toast" aria-hidden>
          <span className="sdk-toast-emoji">{toast.emoji}</span>
          <span className="sdk-toast-text">
            <small>{toast.kicker}</small>
            <b>{toast.title}</b>
          </span>
        </div>
      )}
    </>
  );
}
