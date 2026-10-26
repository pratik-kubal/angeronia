"use client";

import { ArrowCounterClockwiseIcon, LampIcon, PlayIcon, SignOutIcon } from "@phosphor-icons/react/dist/ssr";
import { Sheet } from "@/components/sudoku/sheet";
import { PAUSE_COPY } from "@/data/lamplighter";

type PauseProps = {
  open: boolean;
  canRetry: boolean;
  onResume: () => void;
  onRetry: () => void;
  onRestart: () => void;
  onLeave: () => void;
};

/** The pause sheet: keep flying (Escape, the backdrop or a drag do that too), retry, restart or leave. */
export function PauseSheet({ open, canRetry, onResume, onRetry, onRestart, onLeave }: PauseProps) {
  return (
    <Sheet open={open} label={PAUSE_COPY.title} dismissible onClose={onResume} prefix="lmp">
      <h2 className="lmp-sheet-title">{PAUSE_COPY.title}</h2>
      <div className="lmp-menu">
        <button type="button" className="lmp-menu-item" onClick={onResume}>
          <PlayIcon size={20} weight="fill" aria-hidden />
          {PAUSE_COPY.resume}
        </button>
        <button type="button" className="lmp-menu-item" onClick={onRetry} disabled={!canRetry}>
          <LampIcon size={20} weight="fill" aria-hidden />
          {PAUSE_COPY.retry}
        </button>
        <button type="button" className="lmp-menu-item" onClick={onRestart}>
          <ArrowCounterClockwiseIcon size={20} weight="bold" aria-hidden />
          {PAUSE_COPY.restart}
        </button>
        <button type="button" className="lmp-menu-item" onClick={onLeave}>
          <SignOutIcon size={20} weight="bold" aria-hidden />
          {PAUSE_COPY.leave}
        </button>
      </div>
    </Sheet>
  );
}
