import { showcase } from "@/data/angeronia";
import { cx } from "@/lib/cx";
import motionStyles from "@/styles/motion.module.css";
import typeStyles from "@/styles/type.module.css";
import { Band } from "./band";
import { Mine, Pair, Yours } from "./pair";
import { Statement } from "./statement";
import { TextLink } from "./text-link";
import { Workspace } from "./workspace";
import styles from "./showcase.module.css";

/**
 * Code.Socratic: the product Pratik built alone, as the page's proof. The
 * statement, what the product is (a pair), how a session runs, then the
 * replica of a real session laid across the spine at full width, and the
 * product layer by layer from the screen to the server, each a pair.
 *
 * No test figures here (the owner's ruling): the caption says what the replica
 * is, and the session's results show only inside it, as the product shows them.
 */
export function Showcase() {
  return (
    <Band as="section" band="paper" id="code-socratic" aria-labelledby="cs-title" className={styles.showcase}>
      <Statement as="h2" id="cs-title" size="display" lines={showcase.lines} motion="pull" regroup />
      <Pair as="p" narrowOrder="yours-first" className={cx(typeStyles.lead, styles.pair)}>
        <Yours as="span" reveal={0}>
          {showcase.yours}
        </Yours>{" "}
        <Mine as="span" reveal={1}>
          {showcase.mine}
        </Mine>
      </Pair>
      <p className={cx(styles.session, motionStyles.reveal)}>{showcase.session}</p>

      <figure className={styles.figure}>
        <Workspace />
        <figcaption className={cx(typeStyles.small, styles.caption, motionStyles.reveal)}>{showcase.caption}</figcaption>
      </figure>
      <p className={cx(styles.try, motionStyles.reveal)}>
        <TextLink href={showcase.cta.href} emphasis="strong" external>
          {showcase.cta.label}
        </TextLink>
      </p>

      <p className={cx(typeStyles.lead, styles.layersLead, motionStyles.reveal)}>{showcase.layersLead}</p>
      <ul className={styles.layers} role="list">
        {showcase.layers.map((layer) => (
          <Pair key={layer.name} as="li" narrowOrder="yours-first" className={styles.layer}>
            <Yours as="h3" className={cx(typeStyles.lead, styles.layerName)} reveal={0}>
              {layer.name}
            </Yours>
            <Mine as="p" reveal={1}>
              {layer.does} <span className={styles.soft}>{layer.detail}</span>
            </Mine>
          </Pair>
        ))}
      </ul>
    </Band>
  );
}
