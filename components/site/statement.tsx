import * as React from "react";
import type { StatementLine } from "@/data/angeronia";
import { cx } from "@/lib/cx";
import motionStyles from "@/styles/motion.module.css";
import typeStyles from "@/styles/type.module.css";
import styles from "./statement.module.css";

/**
 * How a statement moves (DESIGN-RULES.md §8, ADR-025). Every one rests in its
 * finished place without script and under reduced motion.
 * * `pull` — split open at the axis while low on the screen, closed by
 *   mid-screen (desktop; `Spine` drives it).
 * * `reveal` — each line fades and rises in once (for statements with no
 *   crossing line to pull).
 * * `arrive` — the hero: on load, the hanging line comes in from the right and
 *   the crossing parts close from both sides (CSS only).
 * * `seam` — the belief's held scene moves it (`data-seam` on every piece).
 * * `still` — never moves.
 */
export type StatementMotion = "pull" | "reveal" | "arrive" | "seam" | "still";

export type StatementProps = {
  as: "h1" | "h2" | "h3" | "p";
  id?: string;
  /** The type step: `display` for a section's statement, `head` for the rest. */
  size: "display" | "head";
  lines: readonly StatementLine[];
  motion: StatementMotion;
  /**
   * Under 600px, run the words on as one paragraph whose first line hangs from
   * the axis, so a long heading stays at two lines (the draft's `.flow-n`).
   */
  regroup?: boolean;
  /**
   * Below 1100px, set it as a lead paragraph hanging from the axis rather than
   * as crossing lines (About's closing statement).
   */
  collapse?: boolean;
  className?: string;
};

const KIND = { cross: "x", hang: "h", push: "p", centre: "c" } as const;

/**
 * A statement set on the spine (DESIGN-RULES.md §7): each line crosses the
 * axis, hangs from it, is pushed past it, or is centred on it.
 *
 * A crossing line is two parts. On desktop the left part ends on the axis and
 * the right part starts `--spine-gap` after it; at rest they meet with a word
 * space and hide the line, each painting its band's ground behind itself so the
 * no-script line breaks there too. Under 900px a crossing line starts at the
 * margin and may wrap; everything else still hangs.
 *
 * The lines are joined with real spaces, so the heading reads as the sentence
 * it is. `data-statement`, `data-line` and `data-part` are how `Spine` finds
 * what to measure and move.
 */
export function Statement({ as: Tag, id, size, lines, motion, regroup, collapse, className }: StatementProps) {
  const reveal = motion === "reveal";
  const seam = motion === "seam";

  return (
    <Tag
      id={id}
      className={cx(
        typeStyles[size],
        styles.statement,
        motion === "arrive" && styles.arrive,
        regroup && styles.regroup,
        collapse && styles.collapse,
        className,
      )}
      data-statement=""
      data-motion={motion}
    >
      {lines.map((line, i) => {
        const kind = "cross" in line ? "cross" : "hang" in line ? "hang" : "push" in line ? "push" : "centre";
        const lineClass = cx(styles.line, styles[kind], reveal && motionStyles.reveal);
        // The stagger index travels as data (DESIGN-RULES.md §1's carve-out).
        const lineStyle = reveal ? ({ "--i": i } as React.CSSProperties) : undefined;
        return (
          <React.Fragment key={i}>
            {i > 0 ? " " : null}
            {"cross" in line ? (
              <span className={lineClass} style={lineStyle} data-line={KIND[kind]}>
                <span className={cx(styles.part, styles.left)} data-part="l" data-seam={seam ? "l" : undefined}>
                  {line.cross[0]}
                </span>{" "}
                <span className={cx(styles.part, styles.right)} data-part="r" data-seam={seam ? "r" : undefined}>
                  {line.cross[1]}
                </span>
              </span>
            ) : (
              <span
                className={lineClass}
                style={lineStyle}
                data-line={KIND[kind]}
                data-seam={seam ? "r" : undefined}
              >
                {"hang" in line ? line.hang : "push" in line ? line.push : line.centre}
              </span>
            )}
          </React.Fragment>
        );
      })}
    </Tag>
  );
}
