"use client";

import { useEffect, useRef, type PointerEvent, type ReactNode } from "react";
import { XIcon } from "@phosphor-icons/react/dist/ssr";

type Props = {
  open: boolean;
  label: string;
  /** False keeps the sheet up until a choice is made (Escape, the backdrop and a drag do nothing). */
  dismissible: boolean;
  onClose: () => void;
  children: ReactNode;
};

/** How far down (px) a drag on the grabber must pull the sheet to dismiss it. */
const DISMISS_DRAG = 90;

/**
 * A modal sheet on the native <dialog> (focus trap, Escape and the top layer for free): an iOS
 * bottom sheet on phones, with a grabber that drags it away, and a centred card on wider screens.
 * Only the content scrolls, so the rim, the grabber and the close button stay put. Sheets stack
 * (the theme picker opens over Settings, Settings over the first game's New game sheet, and the
 * collection or New game over the result): one that comes back puts focus where it was, and when
 * the last one closes focus returns to the page control that opened them.
 */
export function Sheet({ open, label, dismissible, onClose, children }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const drag = useRef<{ y: number; dy: number } | null>(null);
  /** The page control that opened this sheet. */
  const opener = useRef<HTMLElement | null>(null);
  /** Where focus was in this sheet when another sheet covered it. */
  const within = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    // autofocus on the dialog itself: opening focuses the sheet, not a ringed first button.
    dialog.setAttribute("autofocus", "");
    if (open && !dialog.open) {
      const active = document.activeElement as HTMLElement | null;
      if (active && !active.closest("dialog")) opener.current = active;
      dialog.showModal();
      const back = within.current;
      // After a frame: the sheet that covered this one closes in the same commit and moves focus.
      if (back?.isConnected) requestAnimationFrame(() => back.focus());
    }
    if (!open && dialog.open) {
      const active = document.activeElement as HTMLElement | null;
      within.current = active && active !== dialog && dialog.contains(active) ? active : null;
      dialog.close();
      requestAnimationFrame(() => {
        if (document.querySelector("dialog.sdk-sheet[open]")) return;
        within.current = null;
        if (opener.current?.isConnected) opener.current.focus();
      });
    }
  }, [open]);

  const onGrab = (e: PointerEvent<HTMLDivElement>) => {
    if (!dismissible) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { y: e.clientY, dy: 0 };
  };
  const onDrag = (e: PointerEvent<HTMLDivElement>) => {
    if (!drag.current || !ref.current) return;
    drag.current.dy = Math.max(0, e.clientY - drag.current.y);
    ref.current.style.translate = `0 ${drag.current.dy}px`;
  };
  const onRelease = () => {
    if (!drag.current || !ref.current) return;
    const { dy } = drag.current;
    drag.current = null;
    ref.current.style.translate = "";
    if (dy > DISMISS_DRAG) onClose();
  };

  return (
    <dialog
      ref={ref}
      className="sdk-sheet"
      aria-label={label}
      onCancel={(e) => {
        e.preventDefault();
        if (dismissible) onClose();
      }}
      // Browsers may close a modal anyway (a repeated Escape or back gesture makes "cancel"
      // uncancelable): a sheet that must stay opens again; any other reports the close, so
      // React's open state follows the dialog.
      onClose={() => {
        if (!open) return;
        if (dismissible) onClose();
        else ref.current?.showModal();
      }}
      onClick={(e) => {
        if (dismissible && e.target === e.currentTarget) onClose();
      }}
    >
      {/* The body fills the dialog, so a click whose target is the dialog itself is on the backdrop. */}
      <div className="sdk-sheet-body">
        <div
          className="sdk-grab"
          aria-hidden
          onPointerDown={onGrab}
          onPointerMove={onDrag}
          onPointerUp={onRelease}
          onPointerCancel={onRelease}
        >
          <span />
        </div>
        {dismissible && (
          <button type="button" className="sdk-sheet-x" aria-label="Close" onClick={onClose}>
            <XIcon size={13} weight="bold" />
          </button>
        )}
        <div className="sdk-sheet-scroll">{children}</div>
      </div>
    </dialog>
  );
}
