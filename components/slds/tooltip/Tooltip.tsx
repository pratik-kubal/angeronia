"use client";

import * as React from "react";
import { cx, type ClassValue } from "@/lib/slds/cx";

/**
 * The SLDS 2 Tooltip blueprint.
 *
 * A tooltip *describes* a control that already has a name — it is never the
 * name itself, because a tooltip is unreachable by touch and disappears the
 * moment focus moves. So this wires `aria-describedby`, not `aria-labelledby`,
 * and shows on focus as well as hover (WCAG 1.4.13).
 *
 * The trigger must be a single focusable element that accepts a ref.
 */
export interface TooltipProps {
  content: string;
  position?: "top" | "bottom" | "left" | "right";
  className?: ClassValue;
  children: React.ReactElement<{ "aria-describedby"?: string }>;
}

const NUBBIN: Record<NonNullable<TooltipProps["position"]>, string> = {
  top: "slds-nubbin_bottom",
  bottom: "slds-nubbin_top",
  left: "slds-nubbin_right",
  right: "slds-nubbin_left",
};

export function Tooltip({ content, position = "top", className, children }: TooltipProps) {
  const id = React.useId();
  const [visible, setVisible] = React.useState(false);

  // Escape dismisses the tooltip without moving focus — WCAG 1.4.13
  // "Content on Hover or Focus".
  React.useEffect(() => {
    if (!visible) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setVisible(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [visible]);

  return (
    <span
      className={cx("site-tooltip", className)}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {React.cloneElement(children, { "aria-describedby": visible ? id : undefined })}
      <span
        id={id}
        role="tooltip"
        className={cx(
          "slds-popover slds-popover_tooltip",
          "site-popover__panel",
          NUBBIN[position],
          `site-tooltip_${position}`,
        )}
        hidden={!visible}
      >
        <span className="slds-popover__body">{content}</span>
      </span>
    </span>
  );
}
