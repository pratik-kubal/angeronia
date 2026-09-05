import { ProgressBar } from "@/components/slds/progress-bar";
import { Grid, Col } from "@/components/slds/layout";
import { Section } from "@/components/site/section";
import { metrics, metricsHeading, metricsLabel, metricsFootnote } from "@/data/angeronia";

/** Formats a metric the way a person would read it aloud. */
function readOut(metric: (typeof metrics)[number]) {
  const figure = `${metric.value.toFixed(metric.decimals)}${metric.suffix}`;
  return metric.word ? `${figure} ${metric.word}` : figure;
}

/**
 * Numbers from shipped work.
 *
 * Each figure is written out beside its bar, so the measure is legible as text
 * and does not depend on reading a length (design rule 10). The values are
 * static — no count-up (O9).
 */
export function Proof() {
  return (
    <Section id="proof" kicker={metricsLabel} heading={metricsHeading}>
      <Grid wrap gutters>
        {metrics.map((metric) => (
          <Col key={metric.label} size={12} medium={6} className="slds-m-bottom_large">
            <ProgressBar
              value={metric.percent}
              label={metric.label}
              valueText={readOut(metric)}
              note={metric.note}
            />
          </Col>
        ))}
      </Grid>
      <p className="slds-text-body_small slds-text-color_weak site-measure">{metricsFootnote}</p>
    </Section>
  );
}
