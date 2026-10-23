import { Link } from "@carbon/react";
import { Section } from "@/components/ui/section";
import { Body } from "@/components/ui/text";
import { games, gamesHeading, gamesLabel } from "@/data/angeronia";

/**
 * The two games, linked from the home page (ADR-020).
 *
 * The games keep their own look, outside the design system (ADR-019), so each
 * one is shown by a screenshot of itself rather than redrawn in Carbon: the
 * picture is the game, and the frame around it is the site's.
 *
 * One link per game, stretched over its whole block (`.site-game__link::after`),
 * so a click on the screenshot opens the game without the screenshot becoming a
 * second tab stop, and the screenshot keeps its own alt text instead of
 * becoming a link's name. A plain Carbon `Link`, not `ExternalLink`: the games
 * are on this site and open in the same tab.
 */
export function Games() {
  return (
    <Section id="games" kicker={gamesLabel} heading={gamesHeading}>
      <div className="site-cards site-cards_2">
        {games.map((game) => (
          <div key={game.href} className="site-game">
            {/* eslint-disable-next-line @next/next/no-img-element -- images are
                unoptimized site-wide, so next/image would only add a wrapper;
                the screenshots are sized when they are taken. */}
            <img
              className="site-game__shot"
              src={game.shot.src}
              alt={game.shot.alt}
              width={game.shot.width}
              height={game.shot.height}
              loading="lazy"
            />
            <h3 className="site-game__title">{game.name}</h3>
            <Body className="site-game__body">{game.blurb}</Body>
            <p className="site-game__action">
              <Link href={game.href} className="site-game__link">
                {game.cta}
              </Link>
            </p>
          </div>
        ))}
      </div>
    </Section>
  );
}
