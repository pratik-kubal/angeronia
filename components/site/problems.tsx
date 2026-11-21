import type * as React from "react";
import { problems } from "@/data/angeronia";
import { cx } from "@/lib/cx";
import { Reveal } from "./reveal";
import styles from "./problems.module.css";

/** The stagger index: a custom property whose value is data (README 4.1, rule 3). */
const at = (i: number) => ({ "--i": i }) as React.CSSProperties;

/** Why agent projects stall: three problems, then the sentence that answers them. */
export function Problems() {
  const [first, second] = problems.heading;
  return (
    <Reveal
      as="section"
      aria-labelledby="problems-heading"
      className={cx("frame", "section", styles.problems)}
    >
      <h2
        id="problems-heading"
        className={cx("h-head", "lines", styles.heading)}
        data-reveal="rise"
        style={at(0)}
      >
        <span>{first}</span>{" "}
        <span>{second}</span>
      </h2>
      <ul className={styles.rows}>
        {problems.items.map((item, index) => (
          <li key={item.title} className={styles.row} data-reveal="rise" style={at(index + 1)}>
            <h3 className={styles.title}>{item.title}</h3>
            <p className={styles.body}>{item.body}</p>
          </li>
        ))}
      </ul>
      <p className={cx("lead", styles.bridge)} data-reveal="rise" style={at(4)}>
        {problems.bridge}
      </p>
    </Reveal>
  );
}
