import { Checkmark } from "@carbon/icons-react";
import { cx, type ClassValue } from "@/lib/slds/cx";

/**
 * The SLDS 2 Path blueprint, rendered as a static sequence.
 *
 * SLDS's Path is normally an interactive listbox for moving a record between
 * stages. Here it describes a process that is not being edited, so each stage
 * is a `<span>` inside an `<li>`: the blueprint's structure and styling, none
 * of its interaction. Component Blueprints are style-only — the behaviour and
 * ARIA are ours, and the correct behaviour here is none.
 *
 * `site-path__step` (in `app/site.css`) drops the pointer affordance that
 * `.slds-path__link` assumes, rather than overriding the SLDS class.
 */

export interface PathStep {
  title: string;
  /** Optional detail rendered beneath the track. */
  body?: string;
}

export interface PathProps {
  steps: PathStep[];
  /** Index of the current stage. Everything before it reads as complete. */
  current: number;
  /** Accessible name for the sequence. */
  label: string;
  className?: ClassValue;
}

export function Path({ steps, current, label, className }: PathProps) {
  return (
    <div className={cx("slds-path", className)}>
      <div className="slds-grid slds-path__track">
        <div className="slds-grid slds-path__scroller-container">
          <div className="slds-path__scroller">
            <div className="slds-path__scroller_inner">
              <ol className="slds-path__nav" aria-label={label}>
                {steps.map((step, index) => {
                  const complete = index < current;
                  const active = index === current;
                  const state = complete ? "Complete" : active ? "Current" : "Upcoming";

                  return (
                    <li
                      key={step.title}
                      className={cx(
                        "slds-path__item",
                        complete && "slds-is-complete",
                        active && "slds-is-current slds-is-active",
                        !complete && !active && "slds-is-incomplete",
                      )}
                    >
                      <span className="slds-path__link site-path__step">
                        <span className="slds-path__stage">
                          {complete ? (
                            <Checkmark
                              className="slds-icon slds-icon_xx-small"
                              size={16}
                              aria-hidden="true"
                              focusable="false"
                            />
                          ) : null}
                          <span className="slds-assistive-text">{state}</span>
                        </span>
                        <span className="slds-path__title">{step.title}</span>
                      </span>
                    </li>
                  );
                })}
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
