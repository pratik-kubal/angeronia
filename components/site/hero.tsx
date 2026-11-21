import { FitText } from "@/components/site/fit-text";
import { ButtonLink } from "@/components/ui/button-link";
import { hero, type Cta } from "@/data/angeronia";
import { cx } from "@/lib/cx";
import styles from "./hero.module.css";

const PHONE = "(max-width: 47.4375rem)";

/**
 * The first screen (design.md §4.2): one photograph, the name fitted to the full
 * width along the bottom edge, and above it the sentence and the one button.
 * DOM order is name, sentence, action so it reads aloud in that order; the grid
 * puts the sentence and the action visually above the name.
 *
 * `secondary` exists so a story can show the layout the demo link will give it.
 * The page passes nothing and gets `hero.secondaryCta`, which is `null` today.
 */
export function Hero({ secondary = hero.secondaryCta }: { secondary?: Cta | null }) {
  return (
    <section className={styles.hero} aria-labelledby="hero-name">
      <picture className={styles.photo}>
        <source
          media={PHONE}
          type="image/avif"
          srcSet="/hero/schuylkill-portrait-780.avif 780w, /hero/schuylkill-portrait-1170.avif 1170w"
          sizes="100vw"
        />
        <source
          media={PHONE}
          srcSet="/hero/schuylkill-portrait-780.jpg 780w, /hero/schuylkill-portrait-1170.jpg 1170w"
          sizes="100vw"
        />
        <source
          type="image/avif"
          srcSet="/hero/schuylkill-1440.avif 1440w, /hero/schuylkill-2160.avif 2160w, /hero/schuylkill-2880.avif 2880w"
          sizes="100vw"
        />
        <img
          src="/hero/schuylkill-2160.jpg"
          srcSet="/hero/schuylkill-1440.jpg 1440w, /hero/schuylkill-2160.jpg 2160w, /hero/schuylkill-2880.jpg 2880w"
          sizes="100vw"
          width={2160}
          height={1184}
          alt={hero.photo.alt}
          fetchPriority="high"
          decoding="async"
        />
      </picture>
      <div className={styles.scrimTop} aria-hidden="true" />
      <div className={styles.scrim} aria-hidden="true" />
      <div className={styles.title}>
        <h1 id="hero-name" className={cx("display", styles.name)}>
          <FitText>{hero.name}</FitText>
        </h1>
        <p className={styles.statement}>{hero.statement}</p>
        <div className={styles.actions}>
          <ButtonLink href={hero.primaryCta.href}>{hero.primaryCta.label}</ButtonLink>
          {secondary ? (
            <a className={styles.second} href={secondary.href}>
              {secondary.label}
            </a>
          ) : null}
        </div>
      </div>
    </section>
  );
}
