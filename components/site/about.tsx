import { about } from "@/data/angeronia";
import { cx } from "@/lib/cx";
import typeStyles from "@/styles/type.module.css";
import { Band } from "./band";
import { Mine, Pair, Yours } from "./pair";
import { Statement } from "./statement";
import styles from "./about.module.css";

/**
 * Who you'd work with: Pratik Kubal, named, and the background behind the
 * studio, as a pair; then the belief the page is built on, set on the spine as
 * two crossing lines at heading size (a lead paragraph below 1100px).
 */
export function About() {
  return (
    <Band as="section" band="paper" id="about" aria-labelledby="about-title" className={styles.about}>
      <Statement as="h2" id="about-title" size="display" lines={about.lines} motion="pull" />
      <Pair as="p" narrowOrder="yours-first" className={cx(typeStyles.lead, styles.pair)}>
        <Yours as="span" reveal={0}>
          {about.yours}
        </Yours>{" "}
        <Mine as="span" reveal={1}>
          {about.mine}
        </Mine>
      </Pair>
      <Statement as="p" size="head" lines={about.statement} motion="pull" collapse className={styles.statement} />
    </Band>
  );
}
