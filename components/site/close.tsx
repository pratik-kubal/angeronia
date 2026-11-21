import type * as React from "react";
import { FitText } from "@/components/site/fit-text";
import { Reveal } from "@/components/site/reveal";
import { ButtonLink } from "@/components/ui/button-link";
import { ExternalLink } from "@/components/ui/external-link";
import { close, copy, footer, photoCredit } from "@/data/angeronia";
import styles from "./close.module.css";

/** The one inline style the page allows: a reveal index, which is data. */
const stagger = (i: number) => ({ "--i": i }) as React.CSSProperties;

type FooterLink = (typeof footer.links)[number];

function SiteLink({ link }: { link: FooterLink }) {
  return link.external ? (
    <ExternalLink href={link.href}>{link.label}</ExternalLink>
  ) : (
    <a href={link.href}>{link.label}</a>
  );
}

/**
 * The closing ask and the footer under it (design.md §4.10). `full` is the home
 * page's: the ask, both link lists, the legal row and the cropped name.
 * `compact` is the legal pages': the site links, the legal row and the name.
 */
export function Close({ variant = "full" }: { variant?: "full" | "compact" }) {
  const full = variant === "full";
  const [first, second] = close.heading;
  return (
    <footer id="contact" className={styles.close} data-variant={variant}>
      <Reveal className={`frame ${styles.top}`}>
        {full ? (
          <div className={styles.ask}>
            <h2 className="h-statement lines">
              <span className={styles.line}>
                <span data-reveal="line" style={stagger(0)}>
                  {first}
                </span>
              </span>{" "}
              <span className={styles.line}>
                <span data-reveal="line" style={stagger(1)}>
                  {second}
                </span>
              </span>
            </h2>
            <p className={`lead ${styles.body}`} data-reveal="rise" style={stagger(2)}>
              {close.body}
            </p>
            <p className={styles.actions} data-reveal="rise" style={stagger(3)}>
              <ButtonLink variant="ink" href={close.primaryCta.href}>
                {close.primaryCta.label}
              </ButtonLink>
              <span>
                {close.email.lead} <a href={`mailto:${close.email.address}`}>{close.email.address}</a>
              </span>
            </p>
          </div>
        ) : null}
        <nav
          className={styles.links}
          aria-label={copy.footerNavLabel}
          data-reveal="rise"
          style={stagger(4)}
        >
          {full ? (
            <ul>
              {footer.page.map((item) => (
                <li key={item.href}>
                  <a href={item.href}>{item.label}</a>
                </li>
              ))}
            </ul>
          ) : null}
          <ul>
            {footer.links.map((link) => (
              <li key={link.href}>
                <SiteLink link={link} />
              </li>
            ))}
          </ul>
        </nav>
      </Reveal>
      <p className={`frame small ${styles.legal}`}>
        {footer.legal.map((line) => (
          <span key={line}>{line}</span>
        ))}
        <span>
          <ExternalLink href={photoCredit.href}>{photoCredit.text}</ExternalLink>
        </span>
        <span>
          <ExternalLink href={photoCredit.licenseHref}>{photoCredit.license}</ExternalLink>
        </span>
      </p>
      <div className={styles.crop} aria-hidden="true">
        <p className={`display ${styles.wordmark}`}>
          <FitText>{close.wordmark}</FitText>
        </p>
      </div>
    </footer>
  );
}
