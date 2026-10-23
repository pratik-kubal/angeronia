"use client";

import { memo } from "react";
import { PencilSimpleIcon, PlusIcon } from "@phosphor-icons/react/dist/ssr";

type Props = {
  /** How many of each digit (index 1–9) are on the board. */
  counts: readonly number[];
  notesMode: boolean;
  /** The selected cell's digit: its key stands ringed. */
  active: number;
  disabled: boolean;
  onDigit: (digit: number) => void;
  onNotes: () => void;
};

const DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

/**
 * Where each key sits on the pad's twelve half-key columns ([row, first column], two columns wide):
 * 1 to 5 across the top, then the pencil and 6 to 9 below, half a key to the right, so the rows
 * stagger. The second row's last slot is the timer's.
 */
const SLOTS: Record<number, readonly [row: number, column: number]> = {
  1: [1, 2],
  2: [1, 4],
  3: [1, 6],
  4: [1, 8],
  5: [1, 10],
  6: [2, 3],
  7: [2, 5],
  8: [2, 7],
  9: [2, 9],
};
const PENCIL = [2, 1] as const;

const area = ([row, column]: readonly [number, number]) => `${row} / ${column} / span 1 / span 2`;

/**
 * The number pad, under the board: two staggered rows of keys, each in its digit's colour. Beside a
 * key a little stack holds one bar for every one of its digit still to place; once all nine are on
 * the board the key is spent, a bare numeral. The pencil toggles notes, so a key pencils a mark
 * instead of placing.
 */
export const Pad = memo(function Pad({ counts, notesMode, active, disabled, onDigit, onNotes }: Props) {
  return (
    <div className="sdk-pad" data-notes={notesMode ? "" : undefined} role="group" aria-label={notesMode ? "Pencil a digit" : "Place a digit"}>
      {DIGITS.map((d) => {
        const left = 9 - counts[d];
        return (
          <button
            key={d}
            type="button"
            className="sdk-key"
            style={{ gridArea: area(SLOTS[d]) }}
            data-digit={d}
            data-active={active === d ? "" : undefined}
            data-spent={left === 0 ? "" : undefined}
            disabled={disabled || left === 0}
            aria-label={`${d}, ${left} left`}
            onClick={() => onDigit(d)}
          >
            <span className="sdk-key-face">
              <span className="sdk-key-n">{d}</span>
              {left > 0 && (
                <span className="sdk-stack" aria-hidden>
                  {Array.from({ length: left }, (_, k) => (
                    <i key={k} />
                  ))}
                </span>
              )}
            </span>
          </button>
        );
      })}
      <button
        type="button"
        className="sdk-key sdk-pencil"
        style={{ gridArea: area(PENCIL) }}
        aria-label="Notes"
        aria-pressed={notesMode}
        disabled={disabled}
        onClick={onNotes}
      >
        <span className="sdk-key-face">
          <PencilSimpleIcon size={22} weight="fill" aria-hidden />
          <span className="sdk-pencil-plus" aria-hidden>
            <PlusIcon size={9} weight="bold" />
          </span>
        </span>
      </button>
    </div>
  );
});
