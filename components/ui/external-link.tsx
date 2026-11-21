import type * as React from "react";
import { copy } from "@/data/angeronia";
import { cx } from "@/lib/cx";
import styles from "./external-link.module.css";

/**
 * A link that leaves the site: it opens in a new tab, says so to a screen
 * reader, and marks it with one small arrow (design.md §5.2). A server
 * component; there is no icon library and nothing to pass across the boundary.
 */
export function ExternalLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <a href={href} target="_blank" rel="noreferrer noopener" className={cx(styles.link, className)}>
      {children}
      <span className="visually-hidden"> ({copy.externalLink})</span>
      <svg className={styles.arrow} viewBox="0 0 10 10" aria-hidden="true" focusable="false">
        <path d="M2 8 L8 2 M3.5 2 H8 V6.5" />
      </svg>
    </a>
  );
}
