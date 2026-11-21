import { faq } from "@/data/angeronia";
import { Reveal } from "@/components/site/reveal";
import styles from "./faq.module.css";

/** `--i` is the one inline style a section may carry: the stagger index, as data. */
function index(n: number): React.CSSProperties {
  return { "--i": n } as React.CSSProperties;
}

/** The index stops at 8 so no row waits more than about 560ms (design.md 6.3). */
const LAST_INDEX = 8;

/**
 * The questions, large, with the answer beside. Every answer is open on every
 * width; nothing collapses.
 */
export function Faq() {
  return (
    <Reveal as="section" id="faq" aria-labelledby="faq-heading" className="frame section">
      <h2
        id="faq-heading"
        className={`h-head ${styles.heading}`}
        data-reveal="rise"
        style={index(0)}
      >
        {faq.heading}
      </h2>
      <div className={styles.rows}>
        {faq.items.map((item, i) => (
          <div
            key={item.q}
            className={styles.row}
            data-reveal="rise"
            style={index(Math.min(i + 1, LAST_INDEX))}
          >
            <h3 className={styles.q}>{item.q}</h3>
            <p className={styles.a}>{item.a}</p>
          </div>
        ))}
      </div>
    </Reveal>
  );
}
