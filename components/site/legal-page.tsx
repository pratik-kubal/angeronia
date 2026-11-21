import { Fragment } from "react";
import { SiteHeader } from "@/components/site/site-header";
import { Close } from "@/components/site/close";
import { copy, type LegalDocument } from "@/data/angeronia";

/** A legal document. Stub: the whole document, unstyled. Phase B (B6) builds it. */
export function LegalPage({ document }: { document: LegalDocument }) {
  return (
    <div className="studio">
      <SiteHeader variant="solid" />
      <main id="main">
        <h1>{document.title}</h1>
        <p>
          {copy.updated} <time dateTime={document.updatedIso}>{document.updated}</time>
        </p>
        <p>{document.lede}</p>
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
      </main>
      <Close variant="compact" />
    </div>
  );
}
