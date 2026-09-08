import { Tag } from "@carbon/react";
import { Avatar } from "@/components/ui/avatar";
import { Cluster } from "@/components/ui/cluster";
import { MediaObject } from "@/components/ui/media-object";
import { Section } from "@/components/ui/section";
import { Body } from "@/components/ui/text";
import { aboutCoda, aboutHeading, aboutLabel, aboutRange, aboutLead } from "@/data/angeronia";

/**
 * Who you work with.
 *
 * The old coverage strip was a row of pill segments that implied a scale
 * nobody had measured. It is a list of tags now: the same five areas, with no
 * invented gradient.
 */
export function About() {
  return (
    <Section id="about" kicker={aboutLabel} heading={aboutHeading}>
      <MediaObject figure={<Avatar initials="PK" label="Pratik Kubal" size="large" />}>
        <Body>{aboutLead}</Body>

        <Cluster className="site-about__range">
          {aboutRange.map((area) => (
            <Tag key={area} type="outline" size="sm">
              {area}
            </Tag>
          ))}
        </Cluster>

        <blockquote className="site-coda">
          <p>{aboutCoda}</p>
        </blockquote>
      </MediaObject>
    </Section>
  );
}
