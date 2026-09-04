import type * as React from "react";
import { cx, type ClassValue } from "@/lib/slds/cx";

/**
 * The SLDS 2 Progress Bar blueprint.
 *
 * A labelled bar, not a bare one: `label` and `valueText` are required so the
 * figure is readable as text and not only as a length. Colour and length alone
 * would be a colour-only meaning (design rule 10).
 *
 * The fill length is data, not design, so it travels as a custom property
 * (`--site-progress-bar-value`) that `app/site.css` consumes — see
 * `docs/design-system/DECISIONS.md` ADR-005.
 */

export type ProgressBarSize = "x-small" | "small" | "medium" | "large";

const SIZE_CLASS: Record<ProgressBarSize, string | null> = {
  "x-small": "slds-progress-bar_x-small",
  small: "slds-progress-bar_small",
  medium: null,
  large: "slds-progress-bar_large",
};

export interface ProgressBarProps {
  /** 0–100. */
  value: number;
  /** Visible name for the measure, e.g. "API latency". */
  label: string;
  /** The figure, as a person would read it aloud, e.g. "90% faster". */
  valueText: string;
  size?: ProgressBarSize;
  /** Supporting note under the bar. */
  note?: string;
  className?: ClassValue;
}

export function ProgressBar({
  value,
  label,
  valueText,
  size = "medium",
  note,
  className,
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div className={cx("site-metric", className)}>
      <div className="slds-grid slds-grid_align-spread slds-m-bottom_xx-small">
        <span className="slds-text-title">{label}</span>
        <span className="slds-text-title_bold">{valueText}</span>
      </div>
      <div
        className={cx("slds-progress-bar", SIZE_CLASS[size])}
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={clamped}
        aria-valuetext={valueText}
      >
        <span
          className="slds-progress-bar__value site-progress-bar__value"
          style={{ "--site-progress-bar-value": `${clamped}%` } as React.CSSProperties}
        />
      </div>
      {note ? (
        <p className="slds-text-body_small slds-text-color_weak slds-m-top_xx-small">{note}</p>
      ) : null}
    </div>
  );
}
