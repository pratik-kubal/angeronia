import type * as React from "react";
import { cx, type ClassValue } from "@/lib/slds/cx";

/**
 * A heading whose document level and visual size are set independently.
 *
 * SLDS Typography ships three heading sizes and a title style; the outline of
 * a page is a separate question from how big a heading looks. Conflating them
 * is the usual source of skipped heading levels, so this component takes both.
 *
 * `display` is the marketing-page top end: `font-scale-8` at weight 3, which
 * SLDS's own utilities stop short of because an app shell never needs it. It
 * is the one size here that needs a rule of its own (`site-heading_display` in
 * `app/site.css`).
 */

export type HeadingSize = "display" | "large" | "medium" | "small" | "title" | "title-caps";

const SIZE_CLASS: Record<HeadingSize, string> = {
  display: "site-heading_display",
  large: "slds-text-heading_large",
  medium: "slds-text-heading_medium",
  small: "slds-text-heading_small",
  title: "slds-text-title",
  "title-caps": "slds-text-title_caps",
};

export interface HeadingProps {
  /** Document outline level — `h1`…`h6`. */
  level: 1 | 2 | 3 | 4 | 5 | 6;
  /** Visual size. Independent of `level`. */
  size?: HeadingSize;
  id?: string;
  className?: ClassValue;
  children: React.ReactNode;
}

export function Heading({ level, size = "medium", id, className, children }: HeadingProps) {
  const Tag = `h${level}` as const;
  return (
    <Tag id={id} className={cx(SIZE_CLASS[size], className)}>
      {children}
    </Tag>
  );
}

/** The eyebrow above a section heading: small, uppercase, quiet. */
export function Kicker({ className, children }: { className?: ClassValue; children: React.ReactNode }) {
  return (
    <p className={cx("slds-text-title_caps", "slds-text-color_weak", className)}>{children}</p>
  );
}

/**
 * Body copy at the marketing scale, held to a readable measure.
 *
 * Deliberately *not* `slds-text-body_regular`. That utility pins the size to
 * `font-scale-base` — 13px, which is right for a dense application shell and
 * too small for a page someone reads at arm's length. The page root consumes
 * `font-scale-2` (1rem) instead, which plan §2.4 calls for explicitly, and
 * body copy inherits it. `small` still uses the utility, because a footnote
 * *should* be the design system's small.
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
    <p className={cx(size === "small" && "slds-text-body_small", measure && "site-measure", className)}>
      {children}
    </p>
  );
}
