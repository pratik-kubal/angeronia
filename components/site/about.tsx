import { Avatar } from "@/components/slds/avatar";
import { Badge } from "@/components/slds/badge";
import { MediaObject } from "@/components/slds/media-object";
import { Cluster } from "@/components/slds/layout";
import { Body } from "@/components/slds/text";
import { Section } from "@/components/site/section";
import { aboutCoda, aboutHeading, aboutLabel, aboutRange } from "@/data/angeronia";
import { aboutLead } from "@/data/angeronia";

/**
 * Who you work with.
 *
 * The old coverage strip was a row of pill segments that implied a scale
 * nobody had measured. It is a list of badges now: the same five areas, with
 * no invented gradient.
 */
export function About() {
  return (
    <Section id="about" kicker={aboutLabel} heading={aboutHeading}>
      <MediaObject
        responsive
        figure={<Avatar initials="PK" label="Pratik Kubal" size="large" circle />}
      >
        <Body>{aboutLead}</Body>

        <Cluster className="slds-m-top_large">
          {aboutRange.map((area) => (
            <Badge key={area}>{area}</Badge>
          ))}
        </Cluster>

        <blockquote className="site-coda">
          <p>{aboutCoda}</p>
        </blockquote>
      </MediaObject>
    </Section>
  );
}
