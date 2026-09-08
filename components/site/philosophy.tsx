import { Idea, Compare, Package } from "@carbon/icons-react";
import { Card } from "@/components/ui/card";
import { Section } from "@/components/ui/section";
import { philosophy } from "@/data/angeronia";

/**
 * Three beats, three cards.
 *
 * Shaded because of where it sits, not because of what it is: the page runs
 * four card sections back to back (clients, product, services, this), and the
 * band alternates across them so no two shaded grounds touch. Move this section
 * and the `shade` has to move with it — see `services.tsx`, which gave the band
 * up when the two swapped.
 *
 * This replaces the scroll-drawn continuity line: the idea it illustrated —
 * one unbroken stroke from scope to hand-off — is now carried by the copy and
 * by the cards sitting on one row, rather than by an animation nobody with
 * reduced motion could see.
 */
const ICONS = [Idea, Compare, Package];

export function Philosophy() {
  return (
    <Section id="philosophy" kicker={philosophy.kicker} heading={philosophy.heading} shade>
      <div className="site-cards site-cards_3">
        {philosophy.beats.map((beat, index) => (
          <Card key={beat.tag} heading={beat.tag} icon={ICONS[index]}>
            <p>{beat.text}</p>
          </Card>
        ))}
      </div>
    </Section>
  );
}
