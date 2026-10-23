// The 9×9 board as 81 cells, row by row: cell i sits at row ⌊i/9⌋, column i mod 9.
// A digit d is bit d of a mask (bit 0 unused), so ALL holds 1–9.

export const CELLS = 81;
export const ALL = 0x3fe;

export const rowOf = (i: number) => Math.floor(i / 9);
export const colOf = (i: number) => i % 9;
export const boxOf = (i: number) => Math.floor(rowOf(i) / 3) * 3 + Math.floor(colOf(i) / 3);

export type UnitKind = "row" | "column" | "box";
export type Unit = { kind: UnitKind; index: number; cells: readonly number[] };

const NINE = [0, 1, 2, 3, 4, 5, 6, 7, 8];

export const ROWS: readonly Unit[] = NINE.map((r) => ({ kind: "row", index: r, cells: NINE.map((c) => r * 9 + c) }));
export const COLUMNS: readonly Unit[] = NINE.map((c) => ({ kind: "column", index: c, cells: NINE.map((r) => r * 9 + c) }));
export const BOXES: readonly Unit[] = NINE.map((b) => {
  const top = Math.floor(b / 3) * 3;
  const left = (b % 3) * 3;
  return { kind: "box", index: b, cells: NINE.map((k) => (top + Math.floor(k / 3)) * 9 + left + (k % 3)) };
});
export const UNITS: readonly Unit[] = [...ROWS, ...COLUMNS, ...BOXES];

/** A cell's row, column and box, in that order. */
export const UNITS_OF: readonly (readonly Unit[])[] = Array.from({ length: CELLS }, (_, i) => [
  ROWS[rowOf(i)],
  COLUMNS[colOf(i)],
  BOXES[boxOf(i)],
]);

/** The 20 other cells sharing a row, column or box with each cell. */
export const PEERS: readonly (readonly number[])[] = Array.from({ length: CELLS }, (_, i) => {
  const peers = new Set(UNITS_OF[i].flatMap((u) => u.cells));
  peers.delete(i);
  return [...peers];
});

export function popcount(mask: number): number {
  let n = 0;
  for (let m = mask; m; m &= m - 1) n++;
  return n;
}

/** The digits whose bits are set, ascending. */
export function digitsOf(mask: number): number[] {
  const out: number[] = [];
  for (let d = 1; d <= 9; d++) if (mask & (1 << d)) out.push(d);
  return out;
}

/** "Row 3", "Column 7", "Box 5": one-based, as a player counts. */
export function unitLabel(unit: Unit): string {
  return `${unit.kind[0].toUpperCase()}${unit.kind.slice(1)} ${unit.index + 1}`;
}
