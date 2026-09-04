import { Checkmark } from "@carbon/icons-react";
import { cx, type ClassValue } from "@/lib/slds/cx";

/**
 * The SLDS 2 Progress Indicator blueprint, as a static summary.
 *
 * Every step announces its own state in `slds-assistive-text`, because the
 * completed / active / upcoming distinction is otherwise carried by a marker's
 * fill colour alone (design rule 10).
 *
 * This is a display, not a wizard: the markers are `<span>`s, so nothing here
 * is focusable and there is no keyboard contract to get wrong.
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
  className?: ClassValue;
}

export function ProgressIndicator({
  steps,
  current,
  label,
  className,
}: ProgressIndicatorProps) {
  return (
    <div className={cx("slds-progress", className)}>
      <ol className="slds-progress__list" aria-label={label}>
        {steps.map((step, index) => {
          const complete = index < current;
          const active = index === current;
          const state = complete ? "Complete" : active ? "In progress" : "Upcoming";

          return (
            <li
              key={step.label}
              className={cx(
                "slds-progress__item",
                complete && "slds-is-completed",
                active && "slds-is-active",
              )}
            >
              <span
                className={cx(
                  "slds-progress__marker",
                  complete && "slds-progress__marker_icon",
                )}
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
            </li>
          );
        })}
      </ol>
    </div>
  );
}
