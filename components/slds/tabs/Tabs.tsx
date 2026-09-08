"use client";

import * as React from "react";
import { cx, type ClassValue } from "@/lib/slds/cx";

export interface Tab {
  id: string;
  label: string;
  content: React.ReactNode;
}

/**
 * The SLDS 2 Tabs blueprint.
 *
 * The blueprint gives the look; the keyboard contract is ours, and it is the
 * whole component: one tab stop for the tablist (roving `tabindex`), arrows to
 * move between tabs, Home and End to jump to the ends. Tabbing again leaves
 * the tablist for the panel — which is why the panel carries `tabIndex={0}`.
 *
 * `variant="scoped"` is the bordered treatment for tabs inside a container.
 */
export interface TabsProps {
  tabs: Tab[];
  /** Accessible name for the tablist. */
  label: string;
  defaultTab?: string;
  variant?: "default" | "scoped";
  className?: ClassValue;
}

export function Tabs({ tabs, label, defaultTab, variant = "default", className }: TabsProps) {
  // Validated, not just defaulted: an id that matches no tab would leave every
  // tab at `tabIndex={-1}`, so the tablist would have no roving tab stop and
  // could not be reached from the keyboard at all.
  const [active, setActive] = React.useState(
    tabs.some((tab) => tab.id === defaultTab) ? defaultTab : tabs[0]?.id,
  );
  const refs = React.useRef(new Map<string, HTMLAnchorElement>());

  const move = (from: number, delta: number) => {
    const next = (from + delta + tabs.length) % tabs.length;
    const id = tabs[next].id;
    setActive(id);
    refs.current.get(id)?.focus();
  };

  const onKeyDown = (event: React.KeyboardEvent, index: number) => {
    switch (event.key) {
      case "ArrowRight":
        event.preventDefault();
        move(index, 1);
        break;
      case "ArrowLeft":
        event.preventDefault();
        move(index, -1);
        break;
      case "Home":
        event.preventDefault();
        move(0, 0);
        break;
      case "End":
        event.preventDefault();
        move(tabs.length - 1, 0);
        break;
      default:
    }
  };

  const base = variant === "scoped" ? "slds-tabs_scoped" : "slds-tabs_default";

  return (
    <div className={cx(base, className)}>
      <ul className={`${base}__nav`} role="tablist" aria-label={label}>
        {tabs.map((tab, index) => (
          <li
            key={tab.id}
            className={cx(`${base}__item`, active === tab.id && "slds-is-active")}
            role="presentation"
          >
            <a
              ref={(node) => {
                if (node) refs.current.set(tab.id, node);
                else refs.current.delete(tab.id);
              }}
              className={`${base}__link`}
              href={`#${tab.id}`}
              role="tab"
              id={`${tab.id}-tab`}
              aria-selected={active === tab.id}
              aria-controls={tab.id}
              tabIndex={active === tab.id ? 0 : -1}
              onClick={(event) => {
                event.preventDefault();
                setActive(tab.id);
              }}
              onKeyDown={(event) => onKeyDown(event, index)}
            >
              {tab.label}
            </a>
          </li>
        ))}
      </ul>
      {tabs.map((tab) => (
        <div
          key={tab.id}
          id={tab.id}
          className={cx(`${base}__content`, active === tab.id ? "slds-show" : "slds-hide")}
          role="tabpanel"
          aria-labelledby={`${tab.id}-tab`}
          tabIndex={0}
        >
          {tab.content}
        </div>
      ))}
    </div>
  );
}
