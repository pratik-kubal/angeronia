import { Link } from "@carbon/react";
import { Section } from "@/components/ui/section";
import { gamesHeading, gamesLabel, type Game } from "@/data/angeronia";

/**
 * The games launcher on the home page (ADR-020): one tile per game, each its
 * own icon, its name and one line, in a grid that wraps to fit however many
 * games there are.
 *
 * The icon is the game's own Add to Home Screen icon, by URL. The games keep
 * their own look outside the design system (ADR-019), and an `href` is not an
 * import, so the tile shows the game's artwork without any game code crossing
 * into the site. It repeats the name beside it, so it is decorative (`alt=""`).
 *
 * A list of links, one per game. The link is the game's name, stretched over
 * the tile (`.site-game__link::after`), so a click on the icon opens the game
 * too without the icon becoming a second tab stop. A plain Carbon `Link`, not
 * `ExternalLink`: the games are on this site and open in the same tab.
 *
 * The list comes in as a prop, not straight from the data file as the other
 * sections' copy does, so Storybook can show the launcher with many games
 * before there are many.
 */
export function Games({ games }: { games: Game[] }) {
  return (
    <Section id="games" kicker={gamesLabel} heading={gamesHeading}>
      <ul className="site-games">
        {games.map((game) => (
          <li key={game.href} className="site-game">
            {/* eslint-disable-next-line @next/next/no-img-element -- images are
                unoptimized site-wide, so next/image would only add a wrapper;
                the icons are already 180 × 180. */}
            <img className="site-game__icon" src={game.icon} alt="" width={180} height={180} />
            <Link href={game.href} size="lg" className="site-game__link">
              {game.name}
            </Link>
            <p className="site-game__line">{game.line}</p>
          </li>
        ))}
      </ul>
    </Section>
  );
}
