"use client";

// The paint box: one round swatch per colour along the bottom, in number order, scrolled so the
// one in hand sits in the middle. A ring around each fills as its areas are painted; the selected
// swatch lifts, and shows how many of its areas are left. A finished colour keeps its place with a
// tick. It is a radiogroup: arrow keys, Home and End move the selection.

import { memo, useEffect, useRef, type CSSProperties, type KeyboardEvent } from "react";
import { CheckIcon } from "@phosphor-icons/react/dist/ssr";
import { inkOn } from "@/lib/color-tap/color";

type Props = {
  palette: readonly string[];
  /** Per colour: its areas painted, and its areas in all. */
  painted: Int32Array;
  total: Int32Array;
  selected: number;
  onSelect: (colour: number) => void;
  /** A wrong tap points here: the swatch the tapped area wanted shakes (token restarts it). */
  wiggle: { colour: number; token: number } | null;
  /** Reduced motion: scroll without smoothing. */
  calm: boolean;
};

export const Palette = memo(function Palette({ palette, painted, total, selected, onSelect, wiggle, calm }: Props) {
  const dock = useRef<HTMLDivElement>(null);

  // Keep the selected swatch in the middle (scrolling the dock only: scrollIntoView could move the page).
  useEffect(() => {
    const d = dock.current;
    const el = d?.querySelector<HTMLElement>(`[data-colour="${selected}"]`);
    if (!d || !el) return;
    const vertical = d.scrollHeight > d.clientHeight + 1 && d.scrollWidth <= d.clientWidth + 1;
    if (vertical) d.scrollTo({ top: el.offsetTop - (d.clientHeight - el.offsetHeight) / 2, behavior: calm ? "auto" : "smooth" });
    else d.scrollTo({ left: el.offsetLeft - (d.clientWidth - el.offsetWidth) / 2, behavior: calm ? "auto" : "smooth" });
  }, [selected, calm, palette.length]);

  const move = (e: KeyboardEvent<HTMLDivElement>) => {
    const last = palette.length - 1;
    const next =
      e.key === "ArrowRight" || e.key === "ArrowDown"
        ? Math.min(last, selected + 1)
        : e.key === "ArrowLeft" || e.key === "ArrowUp"
          ? Math.max(0, selected - 1)
          : e.key === "Home"
            ? 0
            : e.key === "End"
              ? last
              : -1;
    if (next < 0) return;
    e.preventDefault();
    e.stopPropagation();
    onSelect(next);
    requestAnimationFrame(() => dock.current?.querySelector<HTMLElement>(`[data-colour="${next}"]`)?.focus());
  };

  return (
    <div ref={dock} className="ctp-palette" role="radiogroup" aria-label="Colours" onKeyDown={move}>
      {palette.map((hex, c) => {
        const left = total[c] - painted[c];
        const done = left === 0;
        const on = c === selected;
        return (
          <button
            key={c}
            type="button"
            role="radio"
            aria-checked={on}
            tabIndex={on ? 0 : -1}
            className="ctp-swatch"
            data-colour={c}
            data-done={done ? "" : undefined}
            data-wiggle={wiggle && wiggle.colour === c ? (wiggle.token % 2 ? "a" : "b") : undefined}
            style={{ "--c": hex, "--ink": inkOn(hex), "--p": total[c] ? painted[c] / total[c] : 1 } as CSSProperties}
            aria-label={`Colour ${c + 1}, ${done ? "finished" : `${left} of ${total[c]} areas left`}`}
            onClick={() => onSelect(c)}
          >
            <svg className="ctp-ring" viewBox="0 0 56 56" aria-hidden>
              <circle className="ctp-ring-track" cx="28" cy="28" r="25" />
              <circle className="ctp-ring-fill" cx="28" cy="28" r="25" pathLength={100} />
            </svg>
            <span className="ctp-disc" aria-hidden>
              {done ? <CheckIcon size={20} weight="bold" /> : c + 1}
            </span>
            {on && !done && (
              <span className="ctp-left" data-few={left <= 3 ? "" : undefined} aria-hidden>
                {left}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
});
