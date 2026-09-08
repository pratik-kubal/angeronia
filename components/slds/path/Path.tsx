import { Checkmark } from "@carbon/icons-react";
import { cx, type ClassValue } from "@/lib/slds/cx";
import { Icon } from "@/components/slds/icon";

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
  /**
   * Index of the current stage; everything before it reads as complete.
   *
   * Omit it to render every stage neutral, which is what a *description* of a
   * process wants. SLDS's complete state flips the stage name away and shows a
   * check in its place — right for a sales path where only the current stage
   * matters, wrong for a list of four moves whose names are the content. It
   * also paints complete stages in the success green, which design rule 4
   * reserves for feedback. See DECISIONS.md ADR-007.
   */
  current?: number;
  /** Accessible name for the sequence. */
  label: string;
  className?: ClassValue;
}

export function Path({ steps, current, label, className }: PathProps) {
  const stateful = current !== undefined;
  return (
    <div className={cx("slds-path", className)}>
      <div className="slds-grid slds-path__track">
        <div className="slds-grid slds-path__scroller-container">
          <div className="slds-path__scroller">
            <div className="slds-path__scroller_inner">
              <ol className="slds-path__nav" aria-label={label}>
                {steps.map((step, index) => {
                  const complete = stateful && index < current;
                  const active = stateful && index === current;
                  const state = !stateful
                    ? undefined
                    : complete
                      ? "Complete"
                      : active
                        ? "Current"
                        : "Upcoming";

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
                          {/* SLDS colours the completed check through
                              `.slds-path__stage .slds-icon-text-default`, so
                              the glyph needs that container to pick up the
                              on-success ink. */}
                          {complete ? (
                            <Icon icon={Checkmark} size="xx-small" tone="default" decorative />
                          ) : null}
                          {state ? <span className="slds-assistive-text">{state}</span> : null}
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
