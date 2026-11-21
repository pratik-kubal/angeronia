import type * as React from "react";
import { copy } from "@/data/angeronia";
import { cx } from "@/lib/cx";
import styles from "./button-link.module.css";

export interface ButtonLinkProps {
  href: string;
  variant?: "accent" | "ink";
  size?: "md" | "sm";
  className?: string;
  children: React.ReactNode;
}

/**
 * The page's one button shape: a link with square corners and a flat fill
 * (design.md §5.1). Gold on the dark page; `ink` on the white closing section,
 * where gold would fail contrast. A `mailto:`, `#` or `/` link opens in place;
 * an `http` link opens in a new tab and says so.
 */
export function ButtonLink({
  href,
  variant = "accent",
  size = "md",
  className,
  children,
}: ButtonLinkProps): React.JSX.Element {
  const external = /^https?:/.test(href);
  return (
    <a
      href={href}
      className={cx(
        styles.button,
        variant === "ink" ? styles.ink : styles.accent,
        size === "sm" && styles.sm,
        className,
      )}
      {...(external ? { target: "_blank", rel: "noreferrer noopener" } : {})}
    >
      {children}
      {external ? <span className="visually-hidden"> ({copy.externalLink})</span> : null}
    </a>
  );
}
