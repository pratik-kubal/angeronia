import { belief } from "@/data/angeronia";
import { cx } from "@/lib/cx";
import typeStyles from "@/styles/type.module.css";
import { Band } from "./band";
import { Mine, Pair, Yours } from "./pair";
import { Statement } from "./statement";
import styles from "./belief.module.css";

/**
 * The belief, on the page's one charcoal band (ADR-024), and its one held
 * scene (ADR-025): on desktop, with motion allowed, the band is 1.8 screens
 * tall and its stage sticks for 0.8 of a screen while the statement closes
 * evenly, "The only" and your side from the left margin, "hand-off / is to you"
 * and the studio's side from the right, until the halves meet on the axis and
 * the line disappears behind "The only hand-off". The held height and the
 * sticky stage are CSS, from the first paint, wherever the scene will be held
 * (`html.js`, 900px and up, motion allowed), so nothing below moves when the
 * script starts (ADR-032). `Spine` drives the halves through `data-scene`,
 * `data-scene-stage` and `data-seam`, and marks the running scene `data-live`.
 * Everywhere else (a phone, reduced motion, no script) the band rests closed.
 */
export function Belief() {
  return (
    <Band
      as="section"
      band="dark"
      id="belief"
      aria-labelledby="belief-title"
      className={styles.belief}
      data-scene="seam"
    >
      <div className={styles.stage} data-scene-stage="">
        <div className={styles.inner}>
          <Statement as="h2" id="belief-title" size="display" lines={belief.lines} motion="seam" />
          <Pair as="p" narrowOrder="yours-first" className={cx(typeStyles.lead, styles.pair)}>
            <Yours as="span" data-seam="l">
              {belief.yours}
            </Yours>{" "}
            <Mine as="span" data-seam="r">
              {belief.mine}
            </Mine>
          </Pair>
        </div>
      </div>
    </Band>
  );
}
