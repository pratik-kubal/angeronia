import type * as React from "react";
import { Launch } from "@carbon/icons-react";
import { cx, type ClassValue } from "@/lib/slds/cx";
import { Icon } from "@/components/slds/icon";
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
          {/* `slds-current-color` is a *descendant* selector in SLDS, so the
              glyph has to sit inside a container that carries it — which is
              exactly what `Icon` renders. Putting the class on the svg itself
              leaves the icon at its default white fill. */}
          <Icon
            icon={Launch}
            size="xx-small"
            tone="current"
            containerClassName="site-link__icon"
            assistiveText={` (${copy.externalLink})`}
          />
        </>
      ) : null}
    </a>
  );
}
