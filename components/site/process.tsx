import { Path } from "@/components/slds/path";
import { Grid, Col } from "@/components/slds/layout";
import { Section } from "@/components/site/section";
import { processSteps, processHeading, processLabel } from "@/data/angeronia";

/**
 * How the studio works: a static Path over a row of steps.
 *
 * The old version scrubbed the rail as you scrolled. The Path now shows every
 * stage at once with the last one current, which is what the copy actually
 * says — four moves that all happen, not a reveal.
 *
 * The steps below the Path carry only their number and their body: the Path is
 * already the graphic that names them, and repeating "Discover" directly under
 * a rail that just said "Discover" is duplication, not emphasis. The name stays
 * in the DOM as assistive text, so a block still announces as "Step 1,
 * Discover" rather than leaving the mapping to reading order alone.
 *
 * That is also why these are no longer `Tile`s. The Tile blueprint is a title
 * plus detail; a step with no visible title is not one, and loosening the
 * wrapper to allow a headless Tile would weaken it everywhere to suit one page.
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
            <p className="slds-text-title_caps slds-text-color_weak">
              Step {index + 1}
              <span className="slds-assistive-text">, {step.title}</span>
            </p>
            <p className="site-step__body">{step.body}</p>
          </Col>
        ))}
      </Grid>
    </Section>
  );
}
