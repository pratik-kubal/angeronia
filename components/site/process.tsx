import { projectProcess } from "@/data/angeronia";
import { cx } from "@/lib/cx";
import motionStyles from "@/styles/motion.module.css";
import typeStyles from "@/styles/type.module.css";
import { Band } from "./band";
import { Mine, Pair, Yours } from "./pair";
import { Statement } from "./statement";
import styles from "./process.module.css";

/**
 * How a project runs: four steps, each sitting on the spine like a vertebra,
 * its name centred on the axis, what you do on your side and what the studio
 * does on its own. An ordered list; the order shows in position only.
 */
export function Process() {
  return (
    <Band as="section" band="paper" id="process" aria-labelledby="process-title" className={styles.process}>
      <Statement as="h2" id="process-title" size="display" lines={projectProcess.lines} motion="pull" />
      <p className={cx(typeStyles.lead, styles.intro, motionStyles.reveal)}>{projectProcess.intro}</p>
      <ol className={styles.steps} role="list">
        {projectProcess.steps.map((step) => (
          <li key={step.name} className={styles.step}>
            <Statement as="h3" size="head" lines={[{ centre: step.name }]} motion="reveal" />
            <Pair as="div" narrowOrder="yours-first" className={styles.pair}>
              <Yours as="p" reveal={0}>
                {step.yours}
              </Yours>
              <Mine as="p" reveal={1}>
                {step.mine}
              </Mine>
            </Pair>
          </li>
        ))}
      </ol>
    </Band>
  );
}
