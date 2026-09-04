import type * as React from "react";
import { Launch } from "@carbon/icons-react";
import { cx, type ClassValue } from "@/lib/slds/cx";
import { copy } from "@/data/angeronia";

/**
 * A text link.
 *
 * SLDS 2's base stylesheet already gives a bare `<a>` the accent-2 colour and
 * the accent-3 hover the guidelines call for, so this adds no styling at all —
 * only the external-link contract: `target`, a safe `rel`, and a labelled
 * glyph so "opens in a new tab" is announced rather than implied by an arrow
 * glued to the label.
 */
export interface LinkProps
  extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "className" | "children"> {
  href: string;
  /** Opens in a new tab, and says so. */
  external?: boolean;
  className?: ClassValue;
  children: React.ReactNode;
}

export function Link({ href, external, className, children, ...rest }: LinkProps) {
  return (
    <a
      {...rest}
      href={href}
      className={cx(external && "site-link_external", className)}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer noopener" : undefined}
    >
      {children}
      {external ? (
        <>
          <Launch
            className="slds-icon slds-icon_xx-small slds-current-color site-link__icon"
            size={16}
            aria-hidden="true"
            focusable="false"
          />
          <span className="slds-assistive-text">{` (${copy.externalLink})`}</span>
        </>
      ) : null}
    </a>
  );
}
