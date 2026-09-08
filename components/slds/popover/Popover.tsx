"use client";

import * as React from "react";
import { Close } from "@carbon/icons-react";
import { cx, type ClassValue } from "@/lib/slds/cx";

/**
 * The SLDS 2 Popover blueprint — a non-modal panel anchored to a trigger.
 *
 * Non-modal is the whole distinction from `Modal`: the page behind stays
 * interactive, so there is no focus trap and no backdrop. What it does need is
 * a way out that does not require a mouse — Escape closes and returns focus to
 * the trigger — and a click outside that dismisses it.
 */
export interface PopoverProps {
  /** Rendered as the trigger. Must accept a ref and `aria-*` props. */
  trigger: (props: {
    ref: React.Ref<HTMLButtonElement>;
    "aria-expanded": boolean;
    "aria-controls": string;
    onClick: () => void;
  }) => React.ReactNode;
  heading?: string;
  position?: "top" | "bottom" | "left" | "right";
  className?: ClassValue;
  children: React.ReactNode;
}

const NUBBIN: Record<NonNullable<PopoverProps["position"]>, string> = {
  top: "slds-nubbin_bottom",
  bottom: "slds-nubbin_top",
  left: "slds-nubbin_right",
  right: "slds-nubbin_left",
};

export function Popover({ trigger, heading, position = "bottom", className, children }: PopoverProps) {
  const id = React.useId();
  const [open, setOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const panelRef = React.useRef<HTMLElement>(null);

  React.useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      triggerRef.current?.focus();
    };
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (panelRef.current?.contains(target) || triggerRef.current?.contains(target)) return;
      setOpen(false);
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  return (
    <div className={cx("site-popover", className)}>
      {trigger({
        ref: triggerRef,
        "aria-expanded": open,
        "aria-controls": id,
        onClick: () => setOpen((v) => !v),
      })}
      <section
        id={id}
        ref={panelRef}
        className={cx("slds-popover", "site-popover__panel", NUBBIN[position], `site-popover_${position}`)}
        role="dialog"
        aria-label={heading}
        hidden={!open}
      >
        <button
          type="button"
          className="slds-button slds-button_icon slds-popover__close slds-button_icon-small"
          onClick={() => {
            setOpen(false);
            triggerRef.current?.focus();
          }}
        >
          <Close className="slds-button__icon" size={16} aria-hidden="true" focusable="false" />
          <span className="slds-assistive-text">Close</span>
        </button>
        {heading ? (
          <header className="slds-popover__header">
            <h2 className="slds-text-heading_small">{heading}</h2>
          </header>
        ) : null}
        <div className="slds-popover__body">{children}</div>
      </section>
    </div>
  );
}
