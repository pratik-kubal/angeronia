"use client";

import { useLayoutEffect, useState } from "react";

/** A box in px, from the top-left of the shell (the scene layers' own origin). */
export type Anchor = { x: number; y: number; width: number; height: number };

/**
 * Where a piece of the game sits, so a scene can put things beside it; null until measured, and
 * measured again whenever the shell, the piece or its parent resizes (a rotation, a new window
 * size, the title's text changing with the game). Upright, top to bottom:
 *
 * - ".sdk-bar": the 48px header, a 44px round button at each end (the gear left, home right),
 *   ".sdk-title" centred between them (its first child the theme's mark or emblem).
 * - ".sdk-gap-a": an empty band between the header and the board.
 * - ".sdk-board".
 * - ".sdk-gap-b": an empty band between the board and ".sdk-rule", the divider.
 * - ".sdk-pad": two rows of keys (".sdk-key[data-digit]", the notes key ".sdk-pencil"); the clock,
 *   ".sdk-time", sits in its second row's last slot.
 * - ".sdk-gap-c": an empty band between the pad and ".sdk-dock", the bar at the foot.
 *
 * Also ".sdk-game" (the column) and ".sdk-shell" (the whole screen). The gaps grow with spare height.
 * On a phone on its side the board fills the left column and the right one stacks the header, an
 * empty band, the pad and the dock; the gaps and the divider are not shown there (their boxes are 0).
 */
export function useAnchor(selector: string): Anchor | null {
  const [anchor, setAnchor] = useState<Anchor | null>(null);
  useLayoutEffect(() => {
    const shell = document.querySelector(".sdk-shell");
    const piece = document.querySelector(selector);
    if (!shell || !piece) return;
    const measure = () => {
      const s = shell.getBoundingClientRect();
      const r = piece.getBoundingClientRect();
      const next = { x: r.left - s.left, y: r.top - s.top, width: r.width, height: r.height };
      setAnchor((prev) =>
        prev && prev.x === next.x && prev.y === next.y && prev.width === next.width && prev.height === next.height ? prev : next,
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(shell);
    observer.observe(piece);
    if (piece.parentElement) observer.observe(piece.parentElement);
    return () => observer.disconnect();
  }, [selector]);
  return anchor;
}
