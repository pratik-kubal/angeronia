"use client";

import * as React from "react";
import { ChevronRight } from "@carbon/icons-react";
import { cx, type ClassValue } from "@/lib/slds/cx";

/**
 * The SLDS 2 Expandable Section blueprint: one disclosure, not a set.
 *
 * Use this when a section stands alone; use `Accordion` when several of them
 * are mutually exclusive.
 */
export interface ExpandableSectionProps {
  title: string;
  defaultOpen?: boolean;
  headingLevel?: 2 | 3 | 4;
  className?: ClassValue;
  children: React.ReactNode;
}

export function ExpandableSection({
  title,
  defaultOpen = true,
  headingLevel = 3,
  className,
  children,
}: ExpandableSectionProps) {
  const id = React.useId();
  const [open, setOpen] = React.useState(defaultOpen);
  const Heading = `h${headingLevel}` as const;
  const contentId = `${id}-content`;
  const buttonId = `${id}-button`;

  return (
    <div className={cx("slds-section", open && "slds-is-open", className)}>
      <Heading className="slds-section__title">
        <button
          type="button"
          id={buttonId}
          aria-controls={contentId}
          aria-expanded={open}
          className="slds-button slds-section__title-action"
          onClick={() => setOpen((v) => !v)}
        >
          <ChevronRight
            className="slds-section__title-action-icon slds-button__icon slds-button__icon_left"
            size={16}
            aria-hidden="true"
            focusable="false"
          />
          <span className="slds-truncate">{title}</span>
        </button>
      </Heading>
      <div
        id={contentId}
        role="region"
        aria-labelledby={buttonId}
        className="slds-section__content"
        hidden={!open}
      >
        {children}
      </div>
    </div>
  );
}
