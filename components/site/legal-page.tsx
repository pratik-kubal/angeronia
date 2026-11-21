import { Fragment } from "react";
import { SiteHeader } from "@/components/site/site-header";
import { Close } from "@/components/site/close";
import { copy, type LegalDocument } from "@/data/angeronia";
import styles from "./legal-page.module.css";

/**
 * A legal document (design.md §4.11): a reading column from column 4, under the
 * solid header, with the compact close beneath. One `h1`, then `h2` per section.
 */
export function LegalPage({ document }: { document: LegalDocument }) {
  return (
    <div className="studio">
      <SiteHeader variant="solid" />
      <main id="main" className={`frame ${styles.legal}`}>
        <h1 className={`h-head ${styles.title}`}>{document.title}</h1>
        <p className={`small ${styles.updated}`}>
          {copy.updated} <time dateTime={document.updatedIso}>{document.updated}</time>
        </p>
        <p className={`lead ${styles.lede}`}>{document.lede}</p>
        <div className={styles.body}>
          {document.sections.map((section) => (
            <Fragment key={section.heading}>
              <h2>{section.heading}</h2>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
              {section.bullets ? (
                <ul>
                  {section.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              ) : null}
            </Fragment>
          ))}
        </div>
      </main>
      <Close variant="compact" />
    </div>
  );
}
