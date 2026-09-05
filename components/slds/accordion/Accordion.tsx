"use client";

import * as React from "react";
import { ChevronRight } from "@carbon/icons-react";
import { cx, type ClassValue } from "@/lib/slds/cx";

export interface AccordionItem {
  id: string;
  summary: string;
  content: React.ReactNode;
}

/**
 * The SLDS 2 Accordion blueprint.
 *
 * Blueprints are style-only, so the behaviour here is ours: the summary is a
 * real `<button>` inside a heading, wired to its panel with `aria-controls`
 * and `aria-expanded`, and closed panels are removed from the accessibility
 * tree rather than merely hidden. Headings are what let a screen-reader user
 * jump between sections, so `headingLevel` follows the page outline.
 *
 * `allowMultiple` decides whether this is an accordion (one open) or a set of
 * independent disclosures.
 */
export interface AccordionProps {
  items: AccordionItem[];
  /** Ids open on first render. */
  defaultOpen?: string[];
  allowMultiple?: boolean;
  headingLevel?: 2 | 3 | 4;
  className?: ClassValue;
}

export function Accordion({
  items,
  defaultOpen = [],
  allowMultiple,
  headingLevel = 3,
  className,
}: AccordionProps) {
  const [open, setOpen] = React.useState<string[]>(defaultOpen);
  const Heading = `h${headingLevel}` as const;

  const toggle = (id: string) => {
    setOpen((current) => {
      if (current.includes(id)) return current.filter((x) => x !== id);
      return allowMultiple ? [...current, id] : [id];
    });
  };

  return (
    <ul className={cx("slds-accordion", className)}>
      {items.map((item) => {
        const isOpen = open.includes(item.id);
        const panelId = `${item.id}-panel`;
        const buttonId = `${item.id}-button`;

        return (
          <li key={item.id} className="slds-accordion__list-item">
            <section className={cx("slds-accordion__section", isOpen && "slds-is-open")}>
              <div className="slds-accordion__summary">
                <Heading className="slds-accordion__summary-heading">
                  <button
                    type="button"
                    id={buttonId}
                    aria-controls={panelId}
                    aria-expanded={isOpen}
                    className="slds-button slds-button_reset slds-accordion__summary-action"
                    onClick={() => toggle(item.id)}
                  >
                    <ChevronRight
                      className="slds-accordion__summary-action-icon slds-button__icon slds-button__icon_left"
                      size={16}
                      aria-hidden="true"
                      focusable="false"
                    />
                    <span className="slds-accordion__summary-content">{item.summary}</span>
                  </button>
                </Heading>
              </div>
              <div
                id={panelId}
                role="region"
                aria-labelledby={buttonId}
                className="slds-accordion__content"
                hidden={!isOpen}
              >
                {item.content}
              </div>
            </section>
          </li>
        );
      })}
    </ul>
  );
}
