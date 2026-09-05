"use client";

import type * as React from "react";
import { Close } from "@carbon/icons-react";
import { cx, type ClassValue } from "@/lib/slds/cx";

/**
 * The SLDS 2 Pill blueprint.
 *
 * A pill is removable; a badge is not. If nothing can be taken away, the
 * component you want is `Badge` — SLDS Pills → "Badge vs Pill".
 *
 * The remove control names what it removes, so a list of them does not
 * announce as six identical "Remove" buttons.
 */
export interface PillProps {
  label: string;
  onRemove?: () => void;
  /** Leading figure — an avatar or icon. */
  figure?: React.ReactNode;
  className?: ClassValue;
}

export function Pill({ label, onRemove, figure, className }: PillProps) {
  return (
    <span className={cx("slds-pill", className)}>
      {figure ? <span className="slds-pill__icon_container">{figure}</span> : null}
      <span className="slds-pill__label" title={label}>
        {label}
      </span>
      {onRemove ? (
        <button
          type="button"
          className="slds-button slds-button_icon slds-pill__remove"
          onClick={onRemove}
        >
          <Close className="slds-button__icon" size={16} aria-hidden="true" focusable="false" />
          <span className="slds-assistive-text">{`Remove ${label}`}</span>
        </button>
      ) : null}
    </span>
  );
}

/** Groups pills so they wrap and share spacing. */
export function PillContainer({
  label,
  className,
  children,
}: {
  label: string;
  className?: ClassValue;
  children: React.ReactNode;
}) {
  return (
    <div className={cx("slds-pill_container site-cluster", className)} role="list" aria-label={label}>
      {children}
    </div>
  );
}
