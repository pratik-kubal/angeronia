"use client";

import { ArrowClockwiseIcon, CardsIcon, ChartBarIcon, PlayIcon, QuestionIcon, SquaresFourIcon } from "@phosphor-icons/react/dist/ssr";
import { ALL_GAMES, HOW_TO_PLAY, STATS_COPY, WIN_HEADING, WIN_HEADINGS } from "@/data/solitaire";
import type { Stats } from "./storage";
import type { FxKind } from "./win";

/** "4:07", or "1:02:09" past an hour. */
export function formatTime(ms: number): string {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const mm = String(Math.floor((s % 3600) / 60));
  const ss = String(s % 60).padStart(2, "0");
  return h ? `${h}:${mm.padStart(2, "0")}:${ss}` : `${mm}:${ss}`;
}

type MenuProps = {
  deal: number;
  canRestart: boolean;
  onNew: () => void;
  onRestart: () => void;
  onStats: () => void;
  onHelp: () => void;
};

export function MenuPanel({ deal, canRestart, onNew, onRestart, onStats, onHelp }: MenuProps) {
  return (
    <>
      <h2 className="sol-sheet-title">Solitaire</h2>
      <p className="sol-sheet-sub">Turn three · Deal #{deal}</p>
      <div className="sol-menu">
        <button type="button" className="sol-menu-item" onClick={onNew}>
          <CardsIcon size={20} weight="duotone" aria-hidden />
          <span>New game</span>
        </button>
        <button type="button" className="sol-menu-item" onClick={onRestart} disabled={!canRestart}>
          <ArrowClockwiseIcon size={20} weight="duotone" aria-hidden />
          <span>Restart this deal</span>
        </button>
        <button type="button" className="sol-menu-item" onClick={onStats}>
          <ChartBarIcon size={20} weight="duotone" aria-hidden />
          <span>Statistics</span>
        </button>
        <button type="button" className="sol-menu-item" onClick={onHelp}>
          <QuestionIcon size={20} weight="duotone" aria-hidden />
          <span>How to play</span>
        </button>
        {/* The way back to the /games launcher: saved to a home screen, the app has no back button (ADR-021). */}
        <a className="sol-menu-item" href={ALL_GAMES.href}>
          <SquaresFourIcon size={20} weight="duotone" aria-hidden />
          <span>{ALL_GAMES.label}</span>
        </a>
      </div>
    </>
  );
}

function StatsGrid({ stats }: { stats: Stats }) {
  const rate = stats.played ? `${Math.round((100 * stats.won) / stats.played)}%` : "–";
  const rows: [string, string][] = [
    [STATS_COPY.played, String(stats.played)],
    [STATS_COPY.won, String(stats.won)],
    [STATS_COPY.rate, rate],
    [STATS_COPY.streak, String(stats.streak)],
    [STATS_COPY.bestStreak, String(stats.bestStreak)],
    [STATS_COPY.bestTime, stats.bestTime === null ? "–" : formatTime(stats.bestTime)],
    [STATS_COPY.bestScore, stats.bestScore === null ? "–" : stats.bestScore.toLocaleString("en-US")],
  ];
  return (
    <dl className="sol-stats">
      {rows.map(([k, v]) => (
        <div key={k}>
          <dt>{k}</dt>
          <dd>{v}</dd>
        </div>
      ))}
    </dl>
  );
}

export function StatsPanel({ stats }: { stats: Stats }) {
  return (
    <>
      <h2 className="sol-sheet-title">Statistics</h2>
      <StatsGrid stats={stats} />
    </>
  );
}

export function HelpPanel() {
  return (
    <>
      <h2 className="sol-sheet-title">How to play</h2>
      <ul className="sol-help">
        {HOW_TO_PLAY.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </>
  );
}

type ResultProps = {
  fx: FxKind | null;
  deal: number;
  elapsed: number;
  score: number;
  moves: number;
  stats: Stats;
  onNew: () => void;
  /** Plays the win animation again (absent with reduced motion). */
  onReplay?: () => void;
};

export function ResultPanel({ fx, deal, elapsed, score, moves, stats, onNew, onReplay }: ResultProps) {
  return (
    <>
      <h2 className="sol-sheet-title">{fx ? WIN_HEADINGS[fx] : WIN_HEADING}</h2>
      <p className="sol-sheet-sub">Deal #{deal}</p>
      <div className="sol-result">
        <div>
          <span>{formatTime(elapsed)}</span>
          <small>Time</small>
        </div>
        <div>
          <span>{score.toLocaleString("en-US")}</span>
          <small>Score</small>
        </div>
        <div>
          <span>{moves}</span>
          <small>Moves</small>
        </div>
      </div>
      <StatsGrid stats={stats} />
      <div className="sol-actions">
        {onReplay && (
          <button type="button" className="sol-button" data-quiet onClick={onReplay}>
            <PlayIcon size={16} weight="fill" aria-hidden />
            Watch again
          </button>
        )}
        <button type="button" className="sol-button" onClick={onNew}>
          <CardsIcon size={18} weight="duotone" aria-hidden />
          New game
        </button>
      </div>
    </>
  );
}
