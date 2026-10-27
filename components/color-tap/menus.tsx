"use client";

// Color Tap's sheets (each inside Sudoku's Sheet, prefix "ctp"): New painting, which is also the
// gallery (every photo, with a dot per level: blank, started or done); Settings; and Finished, with
// the kit's before and after side by side with the photo, and the painting to keep.

import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import {
  ArrowCounterClockwiseIcon,
  CaretDownIcon,
  DownloadSimpleIcon,
  MagnifyingGlassIcon,
  PaintBrushIcon,
  PlayIcon,
  QuestionIcon,
  SpeakerHighIcon,
  SquaresFourIcon,
  VibrateIcon,
  WaveformIcon,
} from "@phosphor-icons/react/dist/ssr";
import { ALL_GAMES, HOW_TO_PLAY, LEVEL_LINE, SILENT_MODE } from "@/data/color-tap";
import { LEVELS, levelById } from "@/lib/color-tap/levels";
import type { LevelId, PictureInfo, Puzzle } from "@/lib/color-tap/types";
import { Renderer } from "./renderer";
import type { Settings } from "./storage";

/** How far a painting has got: none, some, or all of its areas. */
export type WorkStage = "blank" | "started" | "done";

export function formatTime(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  if (minutes >= 60) return `${Math.floor(minutes / 60)} h ${minutes % 60} min`;
  if (minutes >= 1) return `${minutes} min`;
  return `${Math.max(1, Math.round(ms / 1000))} s`;
}

function Tile({ children }: { children: ReactNode }) {
  return (
    <span className="ctp-tile" aria-hidden>
      {children}
    </span>
  );
}

function Switch({ label, icon, checked, onChange }: { label: string; icon: ReactNode; checked: boolean; onChange: (on: boolean) => void }) {
  return (
    <label className="ctp-row">
      <Tile>{icon}</Tile>
      <span className="ctp-row-text">{label}</span>
      <input type="checkbox" role="switch" className="ctp-switch" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}

/**
 * Arrow keys (and Home, End) for a group of radios or tabs: one tab stop, the arrows choose. Each
 * option is a button marked with `data-option`; `onPick` gets the chosen index.
 */
function roving(count: number, current: number, onPick: (index: number) => void) {
  return (e: KeyboardEvent<HTMLElement>) => {
    const next =
      e.key === "ArrowRight" || e.key === "ArrowDown"
        ? (current + 1) % count
        : e.key === "ArrowLeft" || e.key === "ArrowUp"
          ? (current - 1 + count) % count
          : e.key === "Home"
            ? 0
            : e.key === "End"
              ? count - 1
              : -1;
    if (next < 0) return;
    e.preventDefault();
    e.stopPropagation();
    onPick(next);
    const group = e.currentTarget;
    requestAnimationFrame(() => group.querySelectorAll<HTMLElement>("[data-option]")[next]?.focus());
  };
}

/** A puzzle drawn into a canvas the width of its box (redrawn when that changes): the blank sheet, or the painting. */
export function Snapshot({ puzzle, painted, sheet, label }: { puzzle: Puzzle; painted: Uint8Array; sheet: boolean; label: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const renderer = new Renderer(puzzle);
    renderer.setPainted(painted);
    renderer.sheet = sheet ? 1 : 0;
    let drawnAt = 0;
    const draw = () => {
      const width = canvas.getBoundingClientRect().width;
      if (width === 0 || width === drawnAt) return;
      drawnAt = width;
      const height = (width * puzzle.height) / puzzle.width;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      renderer.draw(ctx, { width, height }, dpr, { scale: width / puzzle.width, x: 0, y: 0 }, performance.now());
    };
    const observer = new ResizeObserver(draw);
    observer.observe(canvas);
    draw();
    return () => {
      observer.disconnect();
      renderer.dispose();
      canvas.width = 0;
      canvas.height = 0;
    };
  }, [puzzle, painted, sheet]);
  return <canvas ref={ref} className="ctp-snap" role="img" aria-label={label} style={{ aspectRatio: `${puzzle.width} / ${puzzle.height}` }} />;
}

/** The finished painting as a PNG, twice the work size, with no lines or numbers. */
export function paintingBlob(puzzle: Puzzle): Promise<Blob | null> {
  const canvas = document.createElement("canvas");
  const scale = 2;
  canvas.width = puzzle.width * scale;
  canvas.height = puzzle.height * scale;
  const ctx = canvas.getContext("2d");
  if (!ctx) return Promise.resolve(null);
  const renderer = new Renderer(puzzle);
  renderer.setPainted(new Uint8Array(puzzle.regions.length).fill(1));
  renderer.sheet = 0;
  renderer.draw(ctx, { width: canvas.width, height: canvas.height }, 1, { scale, x: 0, y: 0 }, performance.now());
  renderer.dispose();
  return new Promise((resolve) =>
    canvas.toBlob((blob) => {
      canvas.width = 0;
      canvas.height = 0;
      resolve(blob);
    }, "image/png"),
  );
}

export function NewPaintingPanel({
  pictures,
  picture,
  level,
  stageOf,
  percent,
  onChoose,
  onStart,
  loading,
}: {
  pictures: readonly PictureInfo[];
  picture: string;
  level: LevelId;
  /** How far the painting of a picture at a level has got. */
  stageOf: (picture: string, level: LevelId) => WorkStage;
  /** Percent painted of the chosen picture at the chosen level, or null if not started. */
  percent: number | null;
  onChoose: (picture: string, level: LevelId) => void;
  onStart: () => void;
  /** The chosen puzzle is still on its way. */
  loading: boolean;
}) {
  const chosen = pictures.find((p) => p.id === picture);
  const done = percent === 100;
  const lv = levelById(level);
  const info = chosen?.levels.find((x) => x.level === level);
  return (
    <>
      <h2 className="ctp-sheet-title">New painting</h2>
      <p className="ctp-sheet-sub">Pick a picture, then how many colours.</p>
      <div
        className="ctp-pictures"
        role="radiogroup"
        aria-label="Picture"
        onKeyDown={roving(pictures.length, Math.max(0, pictures.findIndex((p) => p.id === picture)), (i) => onChoose(pictures[i].id, level))}
      >
        {pictures.map((p) => {
          const painted = LEVELS.filter((l) => stageOf(p.id, l.id) === "done").length;
          const begun = LEVELS.filter((l) => stageOf(p.id, l.id) === "started").length;
          return (
            <button
              key={p.id}
              type="button"
              role="radio"
              data-option=""
              aria-checked={p.id === picture}
              tabIndex={p.id === picture ? 0 : -1}
              aria-label={`${p.title}, ${painted} of ${LEVELS.length} levels painted${begun ? `, ${begun} started` : ""}`}
              className="ctp-picture"
              onClick={() => onChoose(p.id, level)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- images are unoptimized site-wide; the thumbnail is already small. */}
              <img src={p.thumb} alt="" width={180} height={Math.round((180 * p.height) / p.width)} />
              <span className="ctp-picture-name" aria-hidden>
                {p.title}
              </span>
              <span className="ctp-dots" aria-hidden>
                {LEVELS.map((l) => (
                  <i key={l.id} data-stage={stageOf(p.id, l.id)} />
                ))}
              </span>
            </button>
          );
        })}
      </div>
      {/* Five chips in a row, so the sheet stays short and the blank sheet shows above it. */}
      <div
        className="ctp-levels"
        role="radiogroup"
        aria-label="Difficulty"
        onKeyDown={roving(LEVELS.length, LEVELS.findIndex((l) => l.id === level), (i) => onChoose(picture, LEVELS[i].id))}
      >
        {LEVELS.map((l) => {
          const x = chosen?.levels.find((e) => e.level === l.id);
          const stage = stageOf(picture, l.id);
          const colours = x?.colours ?? l.colours;
          return (
            <button
              key={l.id}
              type="button"
              role="radio"
              data-option=""
              aria-checked={l.id === level}
              tabIndex={l.id === level ? 0 : -1}
              aria-label={`${l.name}, ${colours} colours${x ? `, ${x.areas} areas` : ""}, ${l.magnifiers} magnifiers${stage === "done" ? ", painted" : stage === "started" ? ", started" : ""}`}
              className="ctp-level"
              data-stage={stage}
              onClick={() => onChoose(picture, l.id)}
            >
              <span className="ctp-level-count" aria-hidden>
                {colours}
              </span>
              <span className="ctp-level-name" aria-hidden>
                {l.name}
              </span>
            </button>
          );
        })}
      </div>
      <p className="ctp-level-line">
        <span>
          {info ? `${info.areas} areas` : `${lv.colours} colours`} · {LEVEL_LINE[level]}
        </span>
        <span className="ctp-level-glass">
          <MagnifyingGlassIcon size={14} weight="bold" aria-hidden />
          {lv.magnifiers}
          <span className="ctp-sr"> magnifiers</span>
        </span>
      </p>
      <button type="button" className="ctp-primary" onClick={onStart} disabled={loading || !chosen}>
        {loading ? "Sketching…" : done ? "See it again" : percent !== null ? `Continue · ${percent}%` : "Start painting"}
      </button>
      <details className="ctp-group ctp-rules">
        <summary className="ctp-row">
          <Tile>
            <QuestionIcon size={17} weight="bold" />
          </Tile>
          <span className="ctp-row-text">How to play</span>
          <CaretDownIcon className="ctp-chevron" size={16} weight="bold" aria-hidden />
        </summary>
        <ul>
          {HOW_TO_PLAY.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ul>
      </details>
      <div className="ctp-group">
        <a className="ctp-row" href={ALL_GAMES.href}>
          <Tile>
            <SquaresFourIcon size={17} weight="bold" />
          </Tile>
          <span className="ctp-row-text">{ALL_GAMES.label}</span>
        </a>
      </div>
    </>
  );
}

export function SettingsPanel({
  settings,
  onSettings,
  coarse,
  onRestart,
  onNew,
}: {
  settings: Settings;
  onSettings: (next: Settings) => void;
  /** A touch screen: haptics are offered. */
  coarse: boolean;
  /** Clears this painting, or null with none under way. */
  onRestart: (() => void) | null;
  onNew: () => void;
}) {
  const [confirm, setConfirm] = useState(false);
  return (
    <>
      <h2 className="ctp-sheet-title">Settings</h2>
      <div className="ctp-group">
        <Switch label="Sound" icon={<SpeakerHighIcon size={17} weight="bold" />} checked={settings.sound} onChange={(sound) => onSettings({ ...settings, sound })} />
        {coarse && <Switch label="Haptics" icon={<VibrateIcon size={17} weight="bold" />} checked={settings.haptics} onChange={(haptics) => onSettings({ ...settings, haptics })} />}
        <Switch
          label="Next colour when one is done"
          icon={<WaveformIcon size={17} weight="bold" />}
          checked={settings.autoAdvance}
          onChange={(autoAdvance) => onSettings({ ...settings, autoAdvance })}
        />
      </div>
      <p className="ctp-note">{SILENT_MODE}</p>
      <div className="ctp-group">
        <button type="button" className="ctp-row" onClick={onNew}>
          <Tile>
            <PaintBrushIcon size={17} weight="bold" />
          </Tile>
          <span className="ctp-row-text">New painting</span>
        </button>
        {onRestart &&
          (confirm ? (
            <button type="button" className="ctp-row ctp-danger" onClick={onRestart}>
              <Tile>
                <ArrowCounterClockwiseIcon size={17} weight="bold" />
              </Tile>
              <span className="ctp-row-text">Yes, clear this painting</span>
            </button>
          ) : (
            <button type="button" className="ctp-row" onClick={() => setConfirm(true)}>
              <Tile>
                <ArrowCounterClockwiseIcon size={17} weight="bold" />
              </Tile>
              <span className="ctp-row-text">Start this painting again</span>
            </button>
          ))}
        <a className="ctp-row" href={ALL_GAMES.href}>
          <Tile>
            <SquaresFourIcon size={17} weight="bold" />
          </Tile>
          <span className="ctp-row-text">{ALL_GAMES.label}</span>
        </a>
      </div>
    </>
  );
}

type View = "before" | "after" | "photo";

export function FinishedPanel({
  picture,
  level,
  puzzle,
  elapsed,
  auto,
  onReplay,
  onNew,
}: {
  picture: PictureInfo;
  level: LevelId;
  puzzle: Puzzle;
  elapsed: number;
  /** Areas auto-paint painted. */
  auto: number;
  onReplay: () => void;
  onNew: () => void;
}) {
  const [view, setView] = useState<View>("after");
  const [note, setNote] = useState("");
  const none = useMemo(() => new Uint8Array(puzzle.regions.length), [puzzle]);
  const all = useMemo(() => new Uint8Array(puzzle.regions.length).fill(1), [puzzle]);
  const views: View[] = ["before", "after", "photo"];
  const name = `${picture.title}, ${levelById(level).name}`;

  const save = async () => {
    const blob = await paintingBlob(puzzle);
    if (!blob) return;
    const file = new File([blob], `${picture.id}-${level}.png`, { type: "image/png" });
    try {
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: name });
        return;
      }
    } catch (error) {
      // The player closed the share sheet: nothing to do.
      if (error instanceof DOMException && error.name === "AbortError") return;
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setNote("Saved to your downloads.");
  };

  return (
    <>
      <h2 className="ctp-sheet-title">Finished!</h2>
      <p className="ctp-sheet-sub">{name}</p>
      <div className="ctp-compare">
        <div className="ctp-tabs" role="tablist" aria-label="Show" onKeyDown={roving(views.length, views.indexOf(view), (i) => setView(views[i]))}>
          {views.map((v) => (
            <button
              key={v}
              id={`ctp-tab-${v}`}
              type="button"
              role="tab"
              data-option=""
              aria-selected={view === v}
              aria-controls="ctp-compare-view"
              tabIndex={view === v ? 0 : -1}
              className="ctp-tab"
              onClick={() => setView(v)}
            >
              {v === "before" ? "Before" : v === "after" ? "After" : "Photo"}
            </button>
          ))}
        </div>
        <div id="ctp-compare-view" role="tabpanel" aria-labelledby={`ctp-tab-${view}`} className="ctp-frame" style={{ aspectRatio: `${puzzle.width} / ${puzzle.height}` }}>
          {view === "photo" ? (
            // eslint-disable-next-line @next/next/no-img-element -- images are unoptimized site-wide.
            <img src={picture.src} alt={`The photo: ${picture.title}`} width={picture.width} height={picture.height} />
          ) : (
            <Snapshot key={view} puzzle={puzzle} painted={view === "after" ? all : none} sheet={view === "before"} label={view === "after" ? `Your painting of ${picture.title}` : `The blank sheet of ${picture.title}`} />
          )}
        </div>
      </div>
      <dl className="ctp-stats">
        <div>
          <dt>Areas</dt>
          <dd>{puzzle.regions.length}</dd>
        </div>
        <div>
          <dt>Colours</dt>
          <dd>{puzzle.palette.length}</dd>
        </div>
        <div>
          <dt>Time</dt>
          <dd>{formatTime(elapsed)}</dd>
        </div>
        {auto > 0 && (
          <div>
            <dt>Auto-painted</dt>
            <dd>{auto}</dd>
          </div>
        )}
      </dl>
      <div className="ctp-actions">
        <button type="button" className="ctp-secondary" onClick={onReplay}>
          <PlayIcon size={16} weight="fill" aria-hidden />
          Replay
        </button>
        <button type="button" className="ctp-secondary" onClick={save}>
          <DownloadSimpleIcon size={16} weight="bold" aria-hidden />
          Save image
        </button>
      </div>
      {note && (
        <p className="ctp-note" role="status">
          {note}
        </p>
      )}
      <button type="button" className="ctp-primary" onClick={onNew}>
        New painting
      </button>
    </>
  );
}
