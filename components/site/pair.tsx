import type React from "react";
import { cx } from "@/lib/cx";
import motionStyles from "@/styles/motion.module.css";
import styles from "./pair.module.css";

type PairProps = {
  as: "div" | "p" | "li" | "section";
  /**
   * Under 900px the two sides stack, hanging from the axis, in DOM order:
   * yours first, or, with `narrowOrder="mine-first"`, the studio's side first
   * (the hero and Contact put the button last). For `mine-first` the caller
   * writes `Mine` before `Yours`, so focus and reading follow what is seen;
   * wide, the sides keep their columns on one row (ADR-032).
   */
  narrowOrder: "yours-first" | "mine-first";
  /**
   * The pair's own spacing and its sides' measures. A caller sets the measures
   * through `--pair-yours` and `--pair-mine` (defaults 16em and 24em), never by
   * overriding this module's rules.
   */
  className?: string;
  children: React.ReactNode;
} & Omit<React.HTMLAttributes<HTMLElement>, "className" | "children">;

type SideProps = {
  as: "div" | "p" | "span" | "h2" | "h3";
  /** Reveal once on scroll, with this stagger index (none: never moves). */
  reveal?: number;
  className?: string;
  children: React.ReactNode;
} & Omit<React.HTMLAttributes<HTMLElement>, "className" | "children">;

/**
 * The reading rule (DESIGN-RULES.md §7): two blocks side by side, the
 * reader's side (the need) ending at the axis, right-aligned, and the studio's
 * side (the build) starting after it. Paragraphs never cross the axis, so they
 * never cut the line.
 *
 * As a `<p>` with two `<span>` sides it is one statement read straight through,
 * and under 900px it flows as one paragraph; with block sides they stack.
 */
export function Pair({ as: Tag, narrowOrder, className, children, ...rest }: PairProps) {
  return (
    <Tag className={cx(styles.pair, narrowOrder === "mine-first" && styles.mineFirst, className)} {...rest}>
      {children}
    </Tag>
  );
}

function side(base: string, { as: Tag, reveal, className, children, style, ...rest }: SideProps) {
  return (
    <Tag
      className={cx(base, reveal !== undefined && motionStyles.reveal, className)}
      // The stagger index travels as data (DESIGN-RULES.md §1's carve-out).
      style={reveal !== undefined ? ({ ...style, "--i": reveal } as React.CSSProperties) : style}
      {...rest}
    >
      {children}
    </Tag>
  );
}

/** The reader's side of a `Pair`: ends at the axis. */
export function Yours(props: SideProps) {
  return side(styles.yours, props);
}

/** The studio's side of a `Pair`: starts after the axis. */
export function Mine(props: SideProps) {
  return side(styles.mine, props);
}
