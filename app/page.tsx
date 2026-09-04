import { Button } from "@/components/slds/button";
import { hero } from "@/data/angeronia";

/**
 * Placeholder home page (plan §8 Phase 1.9).
 *
 * Phase 3 replaces this with the real composition of `components/site/*`. It
 * exists so the strict build has something to compile and so the Phase 1
 * acceptance checks — teal brand button, IBM Plex, light/dark with no flash —
 * have a surface to run against.
 */
export default function Home() {
  return (
    <main id="main" className="site-section site-container">
      <div className="slds-container_medium slds-container_center">
        <h1 className="slds-text-heading_large site-measure_heading">{hero.h1}</h1>
        <p className="slds-m-top_medium slds-text-body_regular site-measure">{hero.body}</p>
        <p className="slds-m-top_large">
          <Button variant="brand" href={hero.ctaPrimary.href}>
            {hero.ctaPrimary.label}
          </Button>
        </p>
      </div>
    </main>
  );
}
