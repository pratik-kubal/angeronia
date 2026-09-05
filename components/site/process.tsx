import { Path } from "@/components/slds/path";
import { Tile } from "@/components/slds/tile";
import { Grid, Col } from "@/components/slds/layout";
import { Section } from "@/components/site/section";
import { processSteps, processHeading, processLabel } from "@/data/angeronia";

/**
 * How the studio works: a static Path over a row of Tiles.
 *
 * The old version scrubbed the rail as you scrolled. The Path now shows every
 * stage at once with the last one current, which is what the copy actually
 * says — four moves that all happen, not a reveal.
 */
export function Process() {
  return (
    <Section id="process" kicker={processLabel} heading={processHeading}>
      {/* No `current`: these are four moves that all happen, not a progress
          state — and SLDS's complete state hides the stage name behind a
          check, which would drop three of the four labels (ADR-007). */}
      <Path steps={processSteps.map((step) => ({ title: step.title }))} label={processLabel} />
      <Grid wrap stretch gutters className="slds-m-top_large">
        {processSteps.map((step, index) => (
          <Col key={step.title} size={12} medium={3} className="slds-m-bottom_medium">
            <Tile title={step.title} meta={`Step ${index + 1}`}>
              <p>{step.body}</p>
            </Tile>
          </Col>
        ))}
      </Grid>
    </Section>
  );
}
