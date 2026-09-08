import type * as React from "react";
import type { CarbonIconType } from "@carbon/icons-react";
import { Tile } from "@carbon/react";
import { cx, type ClassValue } from "@/lib/cx";

/**
 * A card: a Carbon `Tile` with a header row, a body and a footer.
 *
 * Carbon's `Tile` is a padded surface and nothing more — it has no header,
 * no title and no footer — so the three rows are this component's, painted by
 * the `site-card__*` block in `styles/_site.scss` (plan §4.1).
 *
 * Carbon 11 has no elevation scale, so the card's edge is a border rather than
 * a shadow (ADR-015, plan §6), and its ground is Carbon's `$layer` token: on a
 * shaded section the surrounding `<Layer>` steps it up automatically, so the
 * card never has to know which band it is sitting on.
 *
 * `headingLevel` is separate from the visual size on purpose — the heading
 * level has to follow the page's document outline, which is a property of where
 * the card sits, not of what it looks like (design rule 10).
 */
export interface CardProps {
  heading: React.ReactNode;
  headingLevel?: 2 | 3 | 4;
  /** Decorative figure in the header. Repeats the heading, so it is hidden. */
  icon?: CarbonIconType;
  footer?: React.ReactNode;
  className?: ClassValue;
  children?: React.ReactNode;
}

export function Card({
  heading,
  headingLevel = 3,
  icon: Glyph,
  footer,
  className,
  children,
}: CardProps) {
  const Heading = `h${headingLevel}` as const;

  return (
    <Tile className={cx("site-card", className)}>
      <div className="site-card__header">
        {Glyph ? (
          <span className="site-card__icon">
            <Glyph size={20} aria-hidden="true" focusable="false" />
          </span>
        ) : null}
        <Heading className="site-card__title">{heading}</Heading>
      </div>
      {children ? <div className="site-card__body">{children}</div> : null}
      {footer ? <div className="site-card__footer">{footer}</div> : null}
    </Tile>
  );
}
