import type * as React from "react";
import { Checkmark } from "@carbon/icons-react";
import { cx, type ClassValue } from "@/lib/slds/cx";

/**
 * The SLDS 2 Progress Indicator blueprint, as a static summary.
 *
 * `.slds-progress` positions a `slds-progress-bar` track absolutely behind the
 * markers — without it the markers float with nothing connecting them, so the
 * track is part of the component rather than something a caller remembers to
 * add.
 *
 * Every step announces its own state in `slds-assistive-text`, because the
 * completed / active / upcoming distinction is otherwise carried by a marker's
 * fill colour alone (design rule 10).
 *
 * This is a display, not a wizard: the markers are `<span>`s, so nothing is
 * focusable and there is no keyboard contract to get wrong.
 */

export interface ProgressStep {
  label: string;
}

export interface ProgressIndicatorProps {
  steps: ProgressStep[];
  /** Index of the step in progress. Everything before it reads as complete. */
  current: number;
  /** Accessible name for the sequence. */
  label: string;
  /**
   * Print each step's name under its marker.
   *
   * The labels are positioned out of flow, so they do not change the row
   * height and SLDS's absolutely-centred track stays on the markers.
   */
  showLabels?: boolean;
  className?: ClassValue;
}

export function ProgressIndicator({
  steps,
  current,
  label,
  showLabels,
  className,
}: ProgressIndicatorProps) {
  const completed = Math.min(steps.length, Math.max(0, current));
  // The track runs from the first marker to the last, so it is full at the
  // last step rather than at a phantom step beyond it.
  const percent = steps.length > 1 ? (Math.min(completed, steps.length - 1) / (steps.length - 1)) * 100 : 0;

  return (
    <div
      className={cx("slds-progress", showLabels && "site-progress_labelled", className)}
    >
      <ol className="slds-progress__list" aria-label={label}>
        {steps.map((step, index) => {
          const complete = index < completed;
          const active = index === completed;
          const state = complete ? "Complete" : active ? "In progress" : "Upcoming";

          return (
            <li
              key={step.label}
              className={cx(
                "slds-progress__item",
                "site-progress__step",
                complete && "slds-is-completed",
                active && "slds-is-active",
              )}
            >
              <span
                className={cx("slds-progress__marker", complete && "slds-progress__marker_icon")}
              >
                {complete ? (
                  <Checkmark
                    className="slds-icon slds-icon_xx-small"
                    size={16}
                    aria-hidden="true"
                    focusable="false"
                  />
                ) : null}
                <span className="slds-assistive-text">{`${step.label} — ${state}`}</span>
              </span>
              {showLabels ? (
                <span className="slds-text-title site-progress__label" aria-hidden="true">
                  {step.label}
                </span>
              ) : null}
            </li>
          );
        })}
      </ol>
      {/*
        Decorative. The track runs marker-to-marker, so it reaches the marker
        you are *on* — which is one step ahead of how many are complete. As a
        `progressbar` it therefore announced "2 of 3 complete" while drawing a
        full bar, contradicting itself. The list above already announces every
        step's state ("Label — Complete / In progress / Upcoming"), which is the
        accurate account; this is the same information drawn, so it is hidden
        rather than restated.
      */}
      <div className="slds-progress-bar slds-progress-bar_x-small" aria-hidden="true">
        <span
          className="slds-progress-bar__value site-progress-bar__value"
          style={{ "--site-progress-bar-value": `${percent}%` } as React.CSSProperties}
        />
      </div>
    </div>
  );
}
