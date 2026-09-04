import type * as React from "react";
import type { CarbonIconType } from "@carbon/icons-react";
import { cx, type ClassValue } from "@/lib/slds/cx";
import { Icon } from "@/components/slds/icon";

/**
 * The SLDS 2 Card blueprint.
 *
 * Structure is the blueprint's: `slds-card` → `__header` (a media object, so a
 * figure and a title share a baseline) → `__body` → `__footer`. Radius and
 * shadow come from the theme's card hooks; nothing here restates them.
 *
 * `headingLevel` is separate from the visual size on purpose — the heading
 * level has to follow the page's document outline, which is a property of
 * where the card sits, not of what it looks like (design rule 10).
 */
export interface CardProps {
  heading: React.ReactNode;
  headingLevel?: 2 | 3 | 4;
  /** Decorative figure in the header. Repeats the heading, so it is hidden. */
  icon?: CarbonIconType;
  /** Controls rendered opposite the heading, e.g. a button. */
  actions?: React.ReactNode;
  footer?: React.ReactNode;
  /** Pad the body. Off when the body supplies its own layout. */
  bodyInner?: boolean;
  className?: ClassValue;
  children?: React.ReactNode;
}

export function Card({
  heading,
  headingLevel = 3,
  icon,
  actions,
  footer,
  bodyInner = true,
  className,
  children,
}: CardProps) {
  const Heading = `h${headingLevel}` as const;

  return (
    <article className={cx("slds-card", className)}>
      <div className="slds-card__header slds-grid">
        <header className="slds-media slds-media_center slds-has-flexi-truncate">
          {icon ? (
            <div className="slds-media__figure">
              <Icon icon={icon} size="small" tone="default" decorative />
            </div>
          ) : null}
          <div className="slds-media__body">
            <Heading className="slds-card__header-title slds-text-heading_small">{heading}</Heading>
          </div>
        </header>
        {actions ? <div className="slds-no-flex">{actions}</div> : null}
      </div>
      {children ? (
        <div className={cx("slds-card__body", bodyInner && "slds-card__body_inner")}>{children}</div>
      ) : null}
      {footer ? <footer className="slds-card__footer">{footer}</footer> : null}
    </article>
  );
}
