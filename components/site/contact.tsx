import { Button, Column, Link, Tile } from "@carbon/react";
import { Grid } from "@/components/ui/grid";
import { Cluster } from "@/components/ui/cluster";
import { Heading, Body, Kicker } from "@/components/ui/text";
import { contact } from "@/data/angeronia";

/**
 * The closing call to action: one panel, one primary action, one plain address.
 *
 * The panel is a Carbon `Tile` at the page's own layer level, so it takes
 * `$layer-01` and reads as a band the way the shaded sections do. Deliberately
 * *not* wrapped in a `<Layer>`: that would step it to `$layer-02`, which is
 * white in the light theme — a panel the same colour as the page it is meant to
 * stand out from.
 */
export function Contact() {
  return (
    <section id="contact" className="site-section" aria-labelledby="contact-heading">
      <Grid className="site-container">
        <Column sm={4} md={8} lg={16}>
          <Tile className="site-contact">
            <Kicker>{contact.label}</Kicker>
            <Heading
              level={2}
              size="section"
              id="contact-heading"
              className="site-measure_heading site-contact__heading"
            >
              {contact.heading}
            </Heading>
            <Body>{contact.body}</Body>
            <Cluster gap="medium" className="site-contact__actions">
              <Button kind="primary" href={contact.cta.href}>
                {contact.cta.label}
              </Button>
              <Link href={`mailto:${contact.emailText}`}>{contact.emailText}</Link>
            </Cluster>
          </Tile>
        </Column>
      </Grid>
    </section>
  );
}
