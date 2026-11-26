import { contact } from "@/data/angeronia";
import { cx } from "@/lib/cx";
import typeStyles from "@/styles/type.module.css";
import { Band } from "./band";
import { Button } from "./button";
import { Mine, Pair, Yours } from "./pair";
import { Statement } from "./statement";
import { TextLink } from "./text-link";
import styles from "./contact.module.css";

/**
 * The close: what to write, and to whom. The button prepares the email (the
 * subject written, three prompts in the body); the address is shown in full
 * and linked, so it can be copied; then LinkedIn and GitHub. Under 900px the
 * address comes first and the button last, which is also the DOM order.
 */
export function Contact() {
  return (
    <Band as="section" band="paper" id="contact" aria-labelledby="contact-title" className={styles.contact}>
      <Statement as="h2" id="contact-title" size="display" lines={contact.lines} motion="pull" />
      <Pair as="p" narrowOrder="yours-first" className={cx(typeStyles.lead, styles.pair)}>
        <Yours as="span" reveal={0}>
          {contact.yours}
        </Yours>{" "}
        <Mine as="span" reveal={1}>
          {contact.mine}
        </Mine>
      </Pair>
      {/* The address and links before the button in the DOM, as on a phone (ADR-032). */}
      <Pair as="div" narrowOrder="mine-first" className={styles.reach}>
        <Mine as="div" reveal={1}>
          <p className={cx(typeStyles.head, styles.address)}>
            <TextLink href={contact.address.href} emphasis="strong" external={false} className={styles.addressLink}>
              {contact.address.label}
            </TextLink>
          </p>
          <ul className={styles.links} role="list">
            {contact.links.map((link) => (
              <li key={link.href}>
                <TextLink href={link.href} emphasis="quiet" external>
                  {link.label}
                </TextLink>
              </li>
            ))}
          </ul>
        </Mine>
        <Yours as="div" className={styles.action} reveal={0}>
          <Button href={contact.action.href} size="lead">
            {contact.action.label}
          </Button>
        </Yours>
      </Pair>
    </Band>
  );
}
