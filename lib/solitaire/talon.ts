// The talon (stock and waste together) as one sequence, for the solver. In turn three only every
// third card is in reach, and taking one shifts the threes behind it, so instead of tapping the
// stock card by card the solver asks which waste tops some number of taps can bring up.
//
// T lists the talon in dealing order: the waste bottom to top, then the stock top to bottom, so
// T = [...waste, ...stock.reverse()], and p (the waste's size) points past the waste top T[p − 1].
// A tap turns up to three (p = min(p + 3, n)) or, with the stock empty, turns the waste over
// (p = 0) without changing T. Taking T[i] off the waste leaves T without it and p = i, whichever
// way the taps went, so the shortest way there is as good as any.

/** The waste tops taps alone can bring up from (n, p), each with the fewest taps that do. */
export function reachable(n: number, p: number): { index: number; taps: number }[] {
  const best = new Map<number, number>();
  const offer = (index: number, taps: number) => {
    const known = best.get(index);
    if (known === undefined || taps < known) best.set(index, taps);
  };
  if (p > 0) offer(p - 1, 0);
  // The rest of this pass.
  let taps = 0;
  for (let q = p; q < n; ) {
    q = Math.min(q + 3, n);
    offer(q - 1, ++taps);
  }
  // Turn the waste over (one more tap), then a whole pass. Later passes bring up the same cards.
  if (n > 0) {
    taps++;
    for (let q = 0; q < n; ) {
      q = Math.min(q + 3, n);
      offer(q - 1, ++taps);
    }
  }
  return [...best].map(([index, t]) => ({ index, taps: t })).sort((a, b) => a.taps - b.taps || a.index - b.index);
}
