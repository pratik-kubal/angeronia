import { services } from "@/data/angeronia";
import { cx } from "@/lib/cx";
import motionStyles from "@/styles/motion.module.css";
import typeStyles from "@/styles/type.module.css";
import { Band } from "./band";
import { Mine, Pair, Yours } from "./pair";
import { Statement } from "./statement";
import styles from "./services.module.css";

/**
 * Four kinds of work, a stepped ledger on the spine: each area's name crosses,
 * hangs from or is pushed past the axis, then its pair, your need on the left
 * and the studio's build on the right, with its four parts as a real list,
 * shown inline.
 */
export function Services() {
  return (
    <Band as="section" band="paper" id="services" aria-labelledby="services-title" className={styles.services}>
      <Statement as="h2" id="services-title" size="display" lines={services.lines} motion="pull" />
      <p className={cx(typeStyles.lead, styles.intro, motionStyles.reveal)}>{services.intro}</p>

      <div className={styles.areas}>
        {services.areas.map((area) => (
          <article key={area.yours} className={styles.area}>
            <Statement
              as="h3"
              size="head"
              lines={area.lines}
              // A name with a crossing line is pulled open; one that only hangs reveals.
              motion={area.lines.some((line) => "cross" in line) ? "pull" : "reveal"}
            />
            <Pair as="div" narrowOrder="yours-first" className={styles.pair}>
              <Yours as="p" reveal={0}>
                {area.yours}
              </Yours>
              <Mine as="div" reveal={1}>
                <p>{area.mine}</p>
                <ul className={styles.parts} role="list" aria-label={services.partsLabel}>
                  {area.parts.map((part) => (
                    <li key={part}>{part}</li>
                  ))}
                </ul>
              </Mine>
            </Pair>
          </article>
        ))}
      </div>
    </Band>
  );
}
