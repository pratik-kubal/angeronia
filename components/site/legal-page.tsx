import { Container } from "@/components/slds/layout";
import { Heading, Body } from "@/components/slds/text";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import type { LegalDocument } from "@/data/angeronia";

/**
 * A legal document as a page: the privacy policy and the terms both render
 * through here, so the two cannot drift apart in layout or in type.
 *
 * The measure is `sizing-content-3` (60ch) rather than the page's full width —
 * these are the only pages on the site that are read as continuous prose, and
 * a 1200px line is unreadable at that length.
 *
 * The updated date is a `<time>` with a machine-readable `dateTime`, because a
 * legal document's date is the notice: it should be as legible to a crawler or
 * a reader-mode as it is on the page.
 */
export function LegalPage({ document: doc }: { document: LegalDocument }) {
  return (
    <>
      <SiteHeader />
      <main id="main">
        <section className="site-section" aria-labelledby="legal-heading">
          <Container size="x-large">
            <Heading level={1} size="display" id="legal-heading" className="site-measure_heading">
              {doc.title}
            </Heading>
            <p className="site-legal__updated">
              Last updated <time dateTime={doc.updatedIso}>{doc.updated}</time>
            </p>
            <Body className="site-legal__lede site-measure">{doc.lede}</Body>

            <div className="site-legal">
              {doc.sections.map((section) => (
                <section key={section.heading}>
                  <h2 className="site-legal__heading">{section.heading}</h2>
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                  {section.bullets ? (
                    <ul className="site-legal__list">
                      {section.bullets.map((bullet) => (
                        <li key={bullet}>{bullet}</li>
                      ))}
                    </ul>
                  ) : null}
                </section>
              ))}
            </div>
          </Container>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
