"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { Close } from "@carbon/icons-react";
import { cx, type ClassValue } from "@/lib/slds/cx";

/** Everything focusable, in document order. */
const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * The SLDS 2 Modal blueprint.
 *
 * The blueprint is style-only, so every behaviour that makes a dialog usable
 * is written here: focus moves in on open and returns to whatever opened it on
 * close, Tab and Shift+Tab cycle inside the dialog, Escape closes, the
 * backdrop closes, and the page behind stops scrolling. Getting any one of
 * those wrong strands a keyboard user behind an invisible wall, so they are
 * tested by the `KeyboardTrap` story rather than left to review.
 *
 * Rendered in a portal on `document.body`, so an ancestor's `overflow` or
 * stacking context cannot clip it.
 */
export interface ModalProps {
  open: boolean;
  onClose: () => void;
  heading: string;
  /** Buttons for the footer. Rendered right-aligned. */
  footer?: React.ReactNode;
  size?: "small" | "medium" | "large";
  className?: ClassValue;
  children: React.ReactNode;
}

export function Modal({ open, onClose, heading, footer, size, className, children }: ModalProps) {
  const dialogRef = React.useRef<HTMLDivElement>(null);
  const openerRef = React.useRef<Element | null>(null);
  const headingId = React.useId();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  React.useEffect(() => {
    if (!open) return;

    openerRef.current = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Focus the dialog itself rather than its first control: a screen reader
    // then announces the dialog's name before anything inside it.
    dialogRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;

      const nodes = dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE);
      if (!nodes || nodes.length === 0) {
        event.preventDefault();
        return;
      }
      const first = nodes[0];
      const last = nodes[nodes.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      document.body.style.overflow = previousOverflow;
      (openerRef.current as HTMLElement | null)?.focus?.();
    };
  }, [open, onClose]);

  if (!mounted || !open) return null;

  return createPortal(
    <>
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        tabIndex={-1}
        ref={dialogRef}
        className={cx("slds-modal slds-fade-in-open", size && `slds-modal_${size}`, className)}
      >
        <div className="slds-modal__container">
          <header className="slds-modal__header">
            <button
              type="button"
              className="slds-button slds-button_icon slds-modal__close slds-button_icon-inverse"
              onClick={onClose}
            >
              <Close className="slds-button__icon" size={16} aria-hidden="true" focusable="false" />
              <span className="slds-assistive-text">Close</span>
            </button>
            <h2 id={headingId} className="slds-modal__title slds-text-heading_medium">
              {heading}
            </h2>
          </header>
          <div className="slds-modal__content slds-p-around_medium">{children}</div>
          {footer ? <footer className="slds-modal__footer">{footer}</footer> : null}
        </div>
      </section>
      {/* Clicking the backdrop closes, but it is not a control: the close
          button and Escape are the announced ways out. */}
      <div className="slds-backdrop slds-backdrop_open" onClick={onClose} />
    </>,
    document.body,
  );
}
