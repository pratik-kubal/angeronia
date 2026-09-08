import { Bot, CloudServices, Rocket, Meter } from "@carbon/icons-react";
import { Tag } from "@carbon/react";
import { Card } from "@/components/ui/card";
import { Cluster } from "@/components/ui/cluster";
import { Section } from "@/components/ui/section";
import { services, servicesHeading, servicesLabel } from "@/data/angeronia";

const ICONS = [Bot, CloudServices, Rocket, Meter];

/**
 * What the studio takes on: four cards, two by two from `md`.
 *
 * The technology tags are Carbon `Tag`s in the neutral `outline` type. Design
 * rule 4 reserves the coloured types for meaning, and a technology tag means
 * nothing beyond itself.
 */
export function Services() {
  return (
    <Section id="services" kicker={servicesLabel} heading={servicesHeading}>
      <div className="site-cards site-cards_2">
        {services.map((service, index) => (
          <Card
            key={service.title}
            heading={service.title}
            icon={ICONS[index]}
            footer={
              <Cluster>
                {service.tags.map((tag) => (
                  <Tag key={tag} type="outline" size="sm">
                    {tag}
                  </Tag>
                ))}
              </Cluster>
            }
          >
            <p>{service.blurb}</p>
          </Card>
        ))}
      </div>
    </Section>
  );
}
