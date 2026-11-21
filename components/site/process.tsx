import { process } from "@/data/angeronia";
import { Reveal } from "@/components/site/reveal";
import styles from "./process.module.css";

/** `--i` is the one inline style a section may carry: the stagger index, as data. */
function index(n: number): React.CSSProperties {
  return { "--i": n } as React.CSSProperties;
}

/**
 * The five steps, from the first call to the handoff. Order is carried by
 * position and by the words, never by a number. The large figure repeats what
 * the paragraph already says, so it is hidden from assistive technology.
 */
export function Process() {
  return (
    <Reveal
      as="section"
      id="process"
      aria-labelledby="process-heading"
      className={`frame section ${styles.process}`}
    >
      <h2
        id="process-heading"
        className={`h-head ${styles.heading}`}
        data-reveal="rise"
        style={index(0)}
      >
        {process.heading}
      </h2>
      <ol className={styles.steps}>
        {process.steps.map((step, i) => (
          <li key={step.title} className={styles.step} data-reveal="rise" style={index(i + 1)}>
            <p className={styles.body}>
              <strong>{step.title}</strong> {step.body}
            </p>
            <p className={`display ${styles.fact}`} aria-hidden="true">
              {step.fact}
            </p>
          </li>
        ))}
      </ol>
    </Reveal>
  );
}
