import { Button } from "@/components/slds/button";
import { Box, Container, Cluster } from "@/components/slds/layout";
import { Link } from "@/components/slds/link";
import { Heading, Body } from "@/components/slds/text";
import { contact } from "@/data/angeronia";

/** The closing call to action: one box, one primary action, one plain address. */
export function Contact() {
  return (
    <section id="contact" className="site-section" aria-labelledby="contact-heading">
      <Container size="x-large">
        <Box theme="shade" className="site-contact">
          <p className="slds-text-title_caps slds-text-color_weak">{contact.label}</p>
          <Heading
            level={2}
            size="large"
            id="contact-heading"
            className="site-measure_heading slds-m-top_x-small"
          >
            {contact.heading}
          </Heading>
          <Body className="slds-m-top_medium">{contact.body}</Body>
          <Cluster gap="medium" className="slds-m-top_large">
            <Button variant="brand" href={contact.cta.href}>
              {contact.cta.label}
            </Button>
            <Link href={`mailto:${contact.emailText}`}>{contact.emailText}</Link>
          </Cluster>
        </Box>
      </Container>
    </section>
  );
}
