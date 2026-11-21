import type * as React from "react";
import { intro } from "@/data/angeronia";
import { cx } from "@/lib/cx";
import { Reveal } from "./reveal";
import styles from "./intro.module.css";

/** The stagger index: a custom property whose value is data (README 4.1, rule 3). */
const at = (i: number) => ({ "--i": i }) as React.CSSProperties;

/** Who you are hiring: a short column of first-person text, and the four terms. */
export function Intro() {
  return (
    <Reveal as="section" aria-labelledby="intro-heading" className="frame section">
      <div className={styles.who}>
        <h2
          id="intro-heading"
          className={cx("lead", styles.heading)}
          data-reveal="rise"
          style={at(0)}
        >
          {intro.heading}
        </h2>
        {intro.paragraphs.map((paragraph, index) => (
          <p
            key={paragraph}
            className={styles.paragraph}
            data-reveal="rise"
            style={at(index + 1)}
          >
            {paragraph}
          </p>
        ))}
      </div>
      <ul className={styles.facts} aria-label={intro.factsLabel}>
        {intro.facts.map((fact, index) => (
          <li key={fact} className={styles.fact} data-reveal="rise" style={at(index + 2)}>
            {fact}
          </li>
        ))}
      </ul>
    </Reveal>
  );
}
