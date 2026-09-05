import { Bot, CloudServices, Rocket, Meter } from "@carbon/icons-react";
import { Badge } from "@/components/slds/badge";
import { Card } from "@/components/slds/card";
import { Grid, Col, Cluster } from "@/components/slds/layout";
import { Section } from "@/components/site/section";
import { services, servicesHeading, servicesLabel } from "@/data/angeronia";

const ICONS = [Bot, CloudServices, Rocket, Meter];

/** What the studio takes on: four cards, two by two from the medium breakpoint. */
export function Services() {
  return (
    <Section id="services" kicker={servicesLabel} heading={servicesHeading} shade>
      <Grid wrap stretch gutters>
        {services.map((service, index) => (
          <Col key={service.title} size={12} medium={6} className="slds-m-bottom_medium">
            <Card
              heading={service.title}
              icon={ICONS[index]}
              fill
              footer={
                <Cluster>
                  {service.tags.map((tag) => (
                    <Badge key={tag}>{tag}</Badge>
                  ))}
                </Cluster>
              }
            >
              <p>{service.blurb}</p>
            </Card>
          </Col>
        ))}
      </Grid>
    </Section>
  );
}
