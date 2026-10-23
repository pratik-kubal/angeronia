// Who throws the snowball: the title's snowman, or the yard's (or the nook's) on its third quick
// poke. The Backdrop marks the poked snowman as the poke lands, just before the tap fires the
// secret; the Overlay's snowball then starts at him instead of the title.

type Point = { x: number; y: number };

/** The poked snowman's top (px from the shell's top-left, the scene layers' origin), and when. */
let mark: (Point & { at: number }) | null = null;
/** The cue follows in the same tap: an older mark is from an earlier throw. */
const FRESH_MS = 1000;

/** The snowman drawn in `el` (its hit area) is throwing now. */
export function markThrow(el: Element) {
  const shell = document.querySelector(".sdk-shell");
  if (!shell) return;
  const s = shell.getBoundingClientRect();
  const r = el.getBoundingClientRect();
  // Lobbed from just under his top, so the ball starts on him, not in the sky above.
  mark = { x: r.left + r.width / 2 - s.left, y: r.top + Math.min(8, r.height / 4) - s.top, at: performance.now() };
}

/** Where a snowball thrown now starts, if a poked snowman just threw it (else the title's snowman did). */
export function thrower(): Point | null {
  return mark && performance.now() - mark.at < FRESH_MS ? { x: mark.x, y: mark.y } : null;
}

/** The throw has been drawn: a title throw right after it must not reuse the mark. */
export function forgetThrow() {
  mark = null;
}
