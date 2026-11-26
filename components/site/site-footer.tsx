import type React from "react";
import Image from "next/image";
import { footer } from "@/data/angeronia";
import { cx } from "@/lib/cx";
import motionStyles from "@/styles/motion.module.css";
import typeStyles from "@/styles/type.module.css";
import { Band } from "./band";
import { Mine, Pair, Yours } from "./pair";
import { Statement } from "./statement";
import { TextLink } from "./text-link";
import styles from "./site-footer.module.css";

/**
 * The close: where the name comes from, and the company (the owner's ruling
 * keeps the story of the name). The Angerona statue on your side of the axis,
 * the note and the Fasti Antiates calendar on the studio's; then the city, the
 * links, the address, the copyright and the picture credits, each licence
 * linked, as the licences ask (DESIGN-RULES.md §9).
 *
 * The photographs sit in frames of `--band-frame` that may cross the axis (the
 * line breaks around them) and drift a few percent with the scroll.
 */
export function SiteFooter() {
  const { statue, calendar, credits } = footer;
  return (
    <Band as="footer" band="paper" aria-labelledby="footer-title" className={styles.footer}>
      <Statement as="h2" id="footer-title" size="head" lines={footer.lines} motion="reveal" />

      <div className={styles.name}>
        <figure className={cx(styles.statue, motionStyles.reveal)}>
          <div className={cx(styles.frame, styles.portrait)} data-cross="block">
            <Image
              className={styles.photo}
              src={statue.src}
              width={statue.width}
              height={statue.height}
              alt={statue.alt}
              data-drift=""
            />
          </div>
          <figcaption className={cx(typeStyles.small, styles.caption)}>{statue.caption}</figcaption>
        </figure>
        <div className={styles.text}>
          <p className={cx(typeStyles.lead, styles.note, motionStyles.reveal)}>{footer.note}</p>
          <figure
            className={cx(styles.calendar, motionStyles.reveal)}
            // The stagger index travels as data (DESIGN-RULES.md §1's carve-out).
            style={{ "--i": 1 } as React.CSSProperties}
          >
            <div className={cx(styles.frame, styles.wide)} data-cross="block">
              <Image
                className={styles.photo}
                src={calendar.src}
                width={calendar.width}
                height={calendar.height}
                alt={calendar.alt}
                data-drift=""
              />
            </div>
            <figcaption className={cx(typeStyles.small, styles.caption)}>{calendar.caption}</figcaption>
          </figure>
        </div>
      </div>

      <Pair as="div" narrowOrder="yours-first" className={styles.legal}>
        <Yours as="p" className={styles.city}>
          {footer.city}
        </Yours>
        <Mine as="div" className={styles.rest}>
          <ul className={styles.links} role="list" aria-label={footer.linksLabel}>
            {footer.links.map((link) => (
              <li key={link.href}>
                <TextLink href={link.href} emphasis="quiet" external={link.external}>
                  {link.label}
                </TextLink>
              </li>
            ))}
          </ul>
          <p>
            <TextLink href={footer.email.href} emphasis="quiet" external={false}>
              {footer.email.label}
            </TextLink>
          </p>
          <p>{footer.copyright}</p>
          <p className={cx(typeStyles.small, styles.credits)}>
            {credits.lead}{" "}
            {credits.items.map((item, i) => (
              <span key={item.href}>
                {i > 0 ? "; " : null}
                <TextLink href={item.href} emphasis="strong" external={false}>
                  {item.title}
                </TextLink>{" "}
                {item.by},{" "}
                <TextLink href={item.licenceHref} emphasis="strong" external={false}>
                  {item.licence}
                </TextLink>
              </span>
            ))}
            ; {credits.tail}
          </p>
        </Mine>
      </Pair>
    </Band>
  );
}
