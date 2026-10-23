"use client";

import { memo, type CSSProperties, type RefObject } from "react";
import { boxOf, colOf, digitsOf, rowOf } from "@/lib/sudoku/grid";
import { mulberry32 } from "@/lib/random";
import { reelDelay, type Fx } from "./use-move-fx";

type Props = {
  /** Null before the game loads: an empty, inert board. */
  puzzle: readonly number[] | null;
  grid: readonly number[];
  notes: readonly number[];
  /** The digits with all nine on the board, digit d as bit d. */
  done: number;
  selected: number | null;
  lit: Fx["lit"];
  sweeps: Fx["sweeps"];
  miss: Fx["miss"];
  reel: Fx["reel"];
  onSelect: (cell: number) => void;
  boardRef: RefObject<HTMLDivElement | null>;
};

const CELLS = Array.from({ length: 81 }, (_, i) => i);

/**
 * A cell's number reel: a few digits that spin past (a shuffle seeded by the cell and the spin,
 * so no two cells spin alike) before it lands on its own value, or on nothing for an empty cell.
 */
function Reel({ reel, cell, value }: { reel: NonNullable<Fx["reel"]>; cell: number; value: number }) {
  const spins = reel.kind === "deal" ? 6 : 5;
  const rng = mulberry32(reel.token * 131 + cell);
  const digits = Array.from({ length: spins }, () => 1 + Math.floor(rng() * 9));
  return (
    <span
      key={reel.token}
      className="sdk-reel"
      data-kind={reel.kind}
      style={{ "--n": spins, "--delay": `${reelDelay(reel, cell)}ms` } as CSSProperties}
      aria-hidden
    >
      <span className="sdk-reel-strip">
        {digits.map((d, k) => (
          <span key={k} data-digit={d}>
            {d}
          </span>
        ))}
        <span className="sdk-reel-end">{value || ""}</span>
      </span>
    </span>
  );
}

/** Where a finished unit's band sits: --x / --y in ninths for a row or column, thirds for a box. */
function sweepPlace({ kind, index }: Fx["sweeps"][number]) {
  const [x, y] = kind === "row" ? [0, index] : kind === "column" ? [index, 0] : [index % 3, Math.floor(index / 3)];
  return { "--x": x, "--y": y };
}
const NOTE_DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

/**
 * The 9×9 board, row by row. The grid lines are one overlay above the cells; a finished row,
 * column or box gets a band that sweeps across it. The selected cell and its row, column and box
 * shade, and every cell holding the selected digit gets a pill. A cell carries its digit (for the
 * digit's colour) and whether all nine of it are placed (a theme may draw those differently). While
 * the reels spin (a deal or a win) every cell shows its reel instead of its digit or notes.
 */
export const Board = memo(function Board({ puzzle, grid, notes, done, selected, lit, sweeps, miss, reel, onSelect, boardRef }: Props) {
  const focus = selected ?? 0;
  const selDigit = selected !== null ? grid[selected] : 0;
  const related = (i: number) =>
    selected !== null && (rowOf(i) === rowOf(selected) || colOf(i) === colOf(selected) || boxOf(i) === boxOf(selected));

  return (
    <div ref={boardRef} className="sdk-board" role="group" aria-label="Sudoku board" data-reel={reel?.kind}>
      {sweeps.map((s) => (
        <span
          key={s.token}
          className="sdk-sweep"
          data-kind={s.kind}
          style={sweepPlace(s) as CSSProperties}
          aria-hidden
        />
      ))}
      {CELLS.map((i) => {
        const value = grid[i];
        const given = puzzle !== null && puzzle[i] !== 0;
        const wrong = miss?.cell === i ? miss : null;
        const marks = digitsOf(notes[i]);
        const flash = lit[i];
        const label = [
          `Row ${rowOf(i) + 1}, column ${colOf(i) + 1}`,
          value ? `${value}${given ? ", clue" : ""}` : "empty",
          !value && marks.length ? `notes ${marks.join(" ")}` : null,
        ]
          .filter(Boolean)
          .join(", ");
        return (
          <button
            key={i}
            type="button"
            className="sdk-cell"
            data-digit={value || undefined}
            data-done={value && done & (1 << value) ? "" : undefined}
            data-given={given ? "" : undefined}
            data-selected={selected === i ? "" : undefined}
            data-peer={related(i) ? "" : undefined}
            data-same={selected !== i && selDigit && value === selDigit ? "" : undefined}
            data-miss={wrong ? "" : undefined}
            tabIndex={i === focus ? 0 : -1}
            disabled={puzzle === null}
            aria-label={label}
            aria-pressed={selected === i}
            onClick={() => onSelect(i)}
            // Focus is selection: tabbing onto the board selects the cell it lands on.
            onFocus={() => selected !== i && onSelect(i)}
          >
            {reel ? (
              <Reel reel={reel} cell={i} value={value} />
            ) : value ? (
              <span
                key={flash?.token ?? 0}
                className="sdk-digit"
                data-lit={flash?.kind}
                style={flash ? ({ "--delay": `${flash.delay}ms` } as CSSProperties) : undefined}
              >
                {value}
              </span>
            ) : wrong ? (
              <span key={wrong.token} className="sdk-digit sdk-wrong">
                {wrong.digit}
              </span>
            ) : marks.length ? (
              <span className="sdk-notes" aria-hidden>
                {NOTE_DIGITS.map((d) => {
                  const marked = (notes[i] & (1 << d)) !== 0;
                  return (
                    <span key={d} data-digit={marked ? d : undefined} data-hot={marked && d === selDigit ? "" : undefined}>
                      {marked ? d : ""}
                    </span>
                  );
                })}
              </span>
            ) : null}
          </button>
        );
      })}
      <span className="sdk-lines" aria-hidden />
    </div>
  );
});
