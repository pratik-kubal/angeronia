import type * as React from "react";
import { cx, type ClassValue } from "@/lib/cx";

/**
 * The three type roles Carbon has no component for.
 *
 * Carbon ships type as Sass tokens (`type-style('fluid-heading-05')`), not as
 * React components — `@carbon/react`'s own `Heading` only manages the document
 * level, never the size. So the site's three recurring roles are named here and
 * painted by `styles/_site.scss`, and everything else uses a Carbon token
 * directly in CSS.
 */

export type HeadingSize = "display" | "section";

const SIZE_CLASS: Record<HeadingSize, string> = {
  display: "site-heading_display",
  section: "site-heading_section",
};

export interface HeadingProps {
  /**
   * Document outline level — `h1`…`h6`. Independent of `size` on purpose: the
   * outline follows where the heading sits on the page, which is a different
   * question from how big it looks. Conflating the two is the usual source of
   * skipped heading levels.
   */
  level: 1 | 2 | 3 | 4 | 5 | 6;
  size?: HeadingSize;
  id?: string;
  className?: ClassValue;
  children: React.ReactNode;
}

export function Heading({ level, size = "section", id, className, children }: HeadingProps) {
  const Tag = `h${level}` as const;
  return (
    <Tag id={id} className={cx(SIZE_CLASS[size], className)}>
      {children}
    </Tag>
  );
}

/** The eyebrow above a section heading: small, uppercase, quiet. */
export function Kicker({
  className,
  children,
}: {
  className?: ClassValue;
  children: React.ReactNode;
}) {
  return <p className={cx("site-kicker", className)}>{children}</p>;
}

/**
 * Body copy, held to a readable measure.
 *
 * The page root already carries `body-02` (16px/24), so `regular` adds only the
 * measure. `small` is Carbon's `body-01`, which is what a footnote should be.
 */
export function Body({
  size = "regular",
  measure = true,
  className,
  children,
}: {
  size?: "regular" | "small";
  measure?: boolean;
  className?: ClassValue;
  children: React.ReactNode;
}) {
  return (
    <p
      className={cx(
        size === "small" && "site-body_small",
        measure && "site-measure",
        className,
      )}
    >
      {children}
    </p>
  );
}
