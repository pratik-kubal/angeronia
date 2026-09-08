import { ProgressIndicator, ProgressStep } from "@carbon/react";
import { Section } from "@/components/ui/section";
import { processSteps, processHeading, processLabel } from "@/data/angeronia";

/**
 * How the studio works: a static rail over a row of steps.
 *
 * Carbon's `ProgressIndicator` replaces the SLDS Path, and the substitution
 * settles ADR-007 in passing: SLDS hid a completed stage's name behind a
 * checkmark, which is why every stage here had to render neutral. Carbon keeps
 * the label visible in every state, so the four stages can simply be four
 * stages.
 *
 * `currentIndex={-1}` is deliberate and is the whole of ADR-007 restated for
 * Carbon: these are four moves that all happen, not a progress state. Carbon
 * defaults `currentIndex` to 0, which would paint step one as current and claim
 * a position in a process the section is only describing. With every index
 * above the current one, all four render — and announce — incomplete, which is
 * what a description of a process should say.
 *
 * The steps below carry only their number and their body: the rail is already
 * the graphic that names them, and repeating "Discover" directly under a rail
 * that just said "Discover" is duplication, not emphasis. The name stays in the
 * DOM as assistive text, so a block still announces as "Step 1, Discover"
 * rather than leaving the mapping to reading order alone.
 */
export function Process() {
  return (
    <Section id="process" kicker={processLabel} heading={processHeading}>
      <ProgressIndicator
        currentIndex={-1}
        spaceEqually
        aria-label={processLabel}
        className="site-process__rail"
      >
        {processSteps.map((step) => (
          <ProgressStep key={step.title} label={step.title} />
        ))}
      </ProgressIndicator>

      <div className="site-cards site-cards_4">
        {processSteps.map((step, index) => (
          <div key={step.title}>
            <p className="site-step__label">
              Step {index + 1}
              <span className="cds--visually-hidden">, {step.title}</span>
            </p>
            <p className="site-step__body">{step.body}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}
