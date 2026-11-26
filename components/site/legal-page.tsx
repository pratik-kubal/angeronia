import type React from "react";
import { copy, LINKS, type LegalDocument, type StatementLine } from "@/data/angeronia";
import { cx } from "@/lib/cx";
import typeStyles from "@/styles/type.module.css";
import { Band } from "./band";
import { Mine, Pair, Yours } from "./pair";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";
import { Spine } from "./spine";
import { Statement } from "./statement";
import styles from "./legal-page.module.css";

/** The title crosses the axis at its last word space: "Privacy | Policy". */
function titleLines(title: string): StatementLine[] {
  const at = title.lastIndexOf(" ");
  return at > 0 ? [{ cross: [title.slice(0, at), title.slice(at + 1)] }] : [{ hang: title }];
}

/**
 * The text as written, with the email address kept on one line: narrow, it
 * would otherwise break at its hyphen and read (and copy) as two pieces.
 */
function keepAddressWhole(text: string): React.ReactNode {
  const pieces = text.split(LINKS.email);
  if (pieces.length === 1) return text;
  return pieces.flatMap((piece, i) =>
    i === 0
      ? [piece]
      : [
          <span key={i} className={styles.nowrap}>
            {LINKS.email}
          </span>,
          piece,
        ],
  );
}

/**
 * A legal document as a page, in the spine's language (ADR-031): the
 * masthead, the title crossing the axis, the date and the lede hanging from
 * it, then each section as a pair, its heading on your side and its text on
 * the studio's, and the site's footer. The privacy policy and the terms both
 * render through here, so the two cannot drift apart. Their text is the
 * company's legal voice and is left as written (ADR-028).
 *
 * The updated date is a `<time>` with a machine-readable `dateTime`, because a
 * legal document's date is its notice.
 */
export function LegalPage({ document: doc }: { document: LegalDocument }) {
  return (
    <>
      <SiteHeader page="other" />
      <main id="main">
        <Band as="article" band="paper" aria-labelledby="legal-title" className={styles.document}>
          <Statement as="h1" id="legal-title" size="display" lines={titleLines(doc.title)} motion="pull" />
          <p className={cx(typeStyles.small, styles.updated)}>
            {copy.lastUpdated} <time dateTime={doc.updatedIso}>{doc.updated}</time>
          </p>
          <p className={cx(typeStyles.lead, styles.lede)}>{doc.lede}</p>

          <div className={styles.sections}>
            {doc.sections.map((section) => (
              <Pair key={section.heading} as="section" narrowOrder="yours-first" className={styles.section}>
                <Yours as="h2" className={cx(typeStyles.lead, styles.heading)}>
                  {section.heading}
                </Yours>
                <Mine as="div" className={styles.body}>
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph}>{keepAddressWhole(paragraph)}</p>
                  ))}
                  {section.bullets ? (
                    <ul className={styles.list}>
                      {section.bullets.map((bullet) => (
                        <li key={bullet}>{keepAddressWhole(bullet)}</li>
                      ))}
                    </ul>
                  ) : null}
                </Mine>
              </Pair>
            ))}
          </div>
        </Band>
      </main>
      <SiteFooter />
      <Spine />
    </>
  );
}
