import type React from "react";
import { cx } from "@/lib/cx";
import styles from "./button.module.css";

type ButtonProps = {
  href: string;
  /** `body` beside a lead paragraph (the hero); `lead` at Contact. */
  size: "body" | "lead";
  className?: string;
  children: React.ReactNode;
};

/**
 * The one primary action: a link set as a sage block (DESIGN-RULES.md §4).
 * Sage is its fill and nothing else's; its label is the paired ink, so the
 * button is known by its words, not its colour. Square, as everything is.
 *
 * It may cross the axis, so it carries `data-cross`: the line breaks around it.
 */
export function Button({ href, size, className, children }: ButtonProps) {
  return (
    <a href={href} className={cx(styles.button, styles[size], className)} data-cross="block">
      {children}
    </a>
  );
}
