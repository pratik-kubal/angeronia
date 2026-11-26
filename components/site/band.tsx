import type React from "react";
import { cx } from "@/lib/cx";
import styles from "./band.module.css";

type BandElement = "section" | "header" | "footer" | "article" | "div";

export type BandProps = {
  /** The element the band is: a landmark or a section. */
  as: BandElement;
  /** Its ground: paper, or the one charcoal band (DESIGN-RULES.md §4). */
  band: "paper" | "dark";
  /** The section's own layout and padding. `Band` sets none. */
  className?: string;
  children: React.ReactNode;
} & Omit<React.HTMLAttributes<HTMLElement>, "className" | "children">;

/**
 * A full-width band of the page, and the spine through it (DESIGN-RULES.md §4,
 * §7). It sets `data-band`, which swaps the colour roles and scopes the focus
 * ring and selection, and it carries the line:
 *
 * * without script, a `::before` at the axis, one continuous line per band,
 *   hidden behind the words that cross it (each crossing part paints the band's
 *   ground behind itself, in `Statement`);
 * * with script, an empty `aria-hidden` track that `Spine` fills with the
 *   line's pieces, drawn between whatever crosses the axis (`data-spined` is
 *   how it finds the band).
 *
 * Every studio band is a `Band`, so every band carries `data-band`.
 */
export function Band({ as: Tag, band, className, children, ...rest }: BandProps) {
  return (
    <Tag data-band={band} data-spined="" className={cx(styles.band, className)} {...rest}>
      <span className={styles.track} data-spine-track="" aria-hidden="true" />
      {children}
    </Tag>
  );
}
