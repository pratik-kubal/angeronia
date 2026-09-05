import type * as React from "react";
import { cx, type ClassValue } from "@/lib/slds/cx";

/**
 * The SLDS 2 Tile blueprint: a compact title-plus-detail block, lighter than a
 * Card because it carries no header row, figure or footer.
 *
 * `headingLevel` follows the page outline, as with Card — the visual weight is
 * a separate decision from the document structure.
 */
export interface TileProps {
  title: React.ReactNode;
  headingLevel?: 2 | 3 | 4 | 5;
  /** Small quiet line above the title, e.g. a step number. */
  meta?: React.ReactNode;
  className?: ClassValue;
  children?: React.ReactNode;
}

export function Tile({ title, headingLevel = 3, meta, className, children }: TileProps) {
  const Heading = `h${headingLevel}` as const;

  return (
    <article className={cx("slds-tile", className)}>
      {meta ? <p className="slds-tile__meta slds-text-title_caps slds-text-color_weak">{meta}</p> : null}
      <Heading className="slds-truncate slds-text-heading_small">{title}</Heading>
      {children ? <div className="slds-tile__detail">{children}</div> : null}
    </article>
  );
}
