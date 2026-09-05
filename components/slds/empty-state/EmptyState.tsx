import type * as React from "react";
import { cx, type ClassValue } from "@/lib/slds/cx";
import { Heading, Body } from "@/components/slds/text";

/**
 * An empty state: what is missing, and what to do about it.
 *
 * SLDS's Empty State is built around its illustration set, which D10 puts out
 * of scope — so this is the text-and-action half, composed from utilities. An
 * empty state without an action is a dead end, so `action` is where most of the
 * value is.
 */
export interface EmptyStateProps {
  heading: string;
  body?: string;
  /** What to do next. An empty state without one is a dead end. */
  action?: React.ReactNode;
  headingLevel?: 2 | 3 | 4;
  className?: ClassValue;
}

export function EmptyState({
  heading,
  body,
  action,
  headingLevel = 3,
  className,
}: EmptyStateProps) {
  return (
    <div className={cx("slds-box slds-text-align_center site-empty-state", className)}>
      <Heading level={headingLevel} size="small">
        {heading}
      </Heading>
      {body ? (
        <Body measure={false} className="slds-m-top_x-small slds-text-color_weak">
          {body}
        </Body>
      ) : null}
      {action ? <div className="slds-m-top_medium">{action}</div> : null}
    </div>
  );
}
