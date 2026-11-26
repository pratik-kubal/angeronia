import { About } from "@/components/site/about";
import { Belief } from "@/components/site/belief";
import { Contact } from "@/components/site/contact";
import { Games } from "@/components/site/games";
import { Hero } from "@/components/site/hero";
import { Process } from "@/components/site/process";
import { Services } from "@/components/site/services";
import { Showcase } from "@/components/site/showcase";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { Spine } from "@/components/site/spine";
import { games } from "@/data/angeronia";

/**
 * The home page: the spine (ADR-023), a composition of storied sections, each
 * a `Band` on the one line. `stories/pages/Home.stories.tsx` renders this
 * component itself, so the page and its story cannot drift.
 *
 * Every section renders its finished state on the server. `Spine`, mounted
 * last, draws and moves the line once the page has hydrated (ADR-025, ADR-031).
 */
export default function Home() {
  return (
    <>
      <SiteHeader page="home" />
      <main id="main">
        <Hero />
        <Belief />
        <Services />
        <Showcase />
        <Process />
        <About />
        {/* ADR-020: the one Games section, after the argument and before the close. */}
        <Games games={games} />
        <Contact />
      </main>
      <SiteFooter />
      <Spine />
    </>
  );
}
