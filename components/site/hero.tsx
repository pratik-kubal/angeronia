import type React from "react";
import { hero } from "@/data/angeronia";
import { cx } from "@/lib/cx";
import typeStyles from "@/styles/type.module.css";
import { Band } from "./band";
import { Button } from "./button";
import { Mine, Pair, Yours } from "./pair";
import { Statement } from "./statement";
import styles from "./hero.module.css";

/**
 * The first screen: the owner's headline stepping across the spine ("One
 * engineer," hanging, "screen | to server" crossing), then the supporting
 * sentence on the studio's side and the button on yours. The headline arrives
 * on load; the sentence and the button rise in after it (CSS only, so it plays
 * from the first paint and rests finished without script or motion).
 */
export function Hero() {
  return (
    <Band as="section" band="paper" id="top" aria-labelledby="hero-title" className={styles.hero}>
      <div>
        <Statement as="h1" id="hero-title" size="display" lines={hero.lines} motion="arrive" />
        {/* The sentence before the button in the DOM, as on a phone (ADR-032). */}
        <Pair as="div" narrowOrder="mine-first" className={styles.foot}>
          <Mine
            as="p"
            className={cx(typeStyles.lead, styles.load)}
            // Its delay, in staggers, travels as data (DESIGN-RULES.md §1).
            style={{ "--d": 5.5 } as React.CSSProperties}
          >
            {hero.lead}
          </Mine>
          <Yours as="div" className={cx(styles.action, styles.load)} style={{ "--d": 7 } as React.CSSProperties}>
            <Button href={hero.action.href} size="body">
              {hero.action.label}
            </Button>
          </Yours>
        </Pair>
      </div>
    </Band>
  );
}
