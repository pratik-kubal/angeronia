import type React from "react";
import { copy } from "@/data/angeronia";
import { cx } from "@/lib/cx";
import styles from "./text-link.module.css";

type TextLinkProps = {
  href: string;
  /**
   * `quiet` shows its underline on hover (navigation, lists of links);
   * `strong` is underlined until hover (a link inside or after a sentence).
   */
  emphasis: "quiet" | "strong";
  /** Opens in a new tab, and says so to assistive tech. */
  external: boolean;
  className?: string;
  children: React.ReactNode;
};

/**
 * A link in the band's ink. A plain `<a>`, so a link to a game or a legal page
 * loads that page as its own, and a hash link scrolls natively (ADR-025).
 */
export function TextLink({ href, emphasis, external, className, children }: TextLinkProps) {
  return (
    <a
      href={href}
      className={cx(styles.link, styles[emphasis], className)}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {children}
      {external ? <span className="visually-hidden"> {copy.externalLink}</span> : null}
    </a>
  );
}
