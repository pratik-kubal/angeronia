import type * as React from "react";
import { cx, type ClassValue } from "@/lib/slds/cx";

/**
 * The SLDS 2 Button Group blueprint.
 *
 * A group of related controls that reads as one unit. `label` is required
 * because a visually-obvious grouping is invisible to a screen reader without
 * a name on the `role="group"` — SLDS Button Groups → Accessibility.
 */
export interface ButtonGroupProps {
  /** Accessible name for the group. */
  label: string;
  className?: ClassValue;
  children: React.ReactNode;
}

export function ButtonGroup({ label, className, children }: ButtonGroupProps) {
  return (
    <div className={cx("slds-button-group", className)} role="group" aria-label={label}>
      {children}
    </div>
  );
}
