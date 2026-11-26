import type React from "react";
import { gamesSection, type Game } from "@/data/angeronia";
import { cx } from "@/lib/cx";
import motionStyles from "@/styles/motion.module.css";
import typeStyles from "@/styles/type.module.css";
import { Band } from "./band";
import { Statement } from "./statement";
import styles from "./games.module.css";

/**
 * The games launcher on the home page (ADR-020), in the spine's language: a
 * crossing heading, one line hanging from the axis, and one tile per game in a
 * grid that starts at the hang and wraps to fit however many there are.
 *
 * Each tile is the game's own Add to Home Screen icon, by URL (an `href` is not
 * an import, so ADR-019's boundary holds both ways; `alt=""`, because the name
 * beside it says the same), its name and its line. The name is the tile's one
 * link, stretched over it, so the icon opens the game too and a keyboard meets
 * one stop per game. A plain `<a>`: a game loads as its own page.
 *
 * The list is a prop, so Storybook can show many games before there are many.
 */
export function Games({ games }: { games: Game[] }) {
  return (
    <Band as="section" band="paper" id="games" aria-labelledby="games-title" className={styles.games}>
      <Statement as="h2" id="games-title" size="display" lines={gamesSection.lines} motion="pull" />
      <p className={cx(typeStyles.lead, styles.intro, motionStyles.reveal)}>{gamesSection.intro}</p>
      <ul className={styles.tiles} role="list">
        {games.map((game, i) => (
          <li
            key={game.href}
            className={cx(styles.tile, motionStyles.reveal)}
            // The stagger index travels as data (DESIGN-RULES.md §1's carve-out).
            style={{ "--i": i } as React.CSSProperties}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- the icon is
                already 180 × 180 and images are unoptimized site-wide. */}
            <img className={styles.icon} src={game.icon} alt="" width={180} height={180} loading="lazy" />
            <div className={styles.text}>
              <a className={styles.link} href={game.href}>
                {game.name}
              </a>
              <p className={styles.line}>{game.line}</p>
            </div>
          </li>
        ))}
      </ul>
    </Band>
  );
}
