import { SiteHeader } from "@/components/site/site-header";
import { Hero } from "@/components/site/hero";
import { Philosophy } from "@/components/site/philosophy";
import { Services } from "@/components/site/services";
import { Process } from "@/components/site/process";
import { ProductSpotlight } from "@/components/site/product-spotlight";
import { WhoWeBuildFor } from "@/components/site/who-we-build-for";
import { About } from "@/components/site/about";
import { Contact } from "@/components/site/contact";
import { SiteFooter } from "@/components/site/site-footer";

/**
 * The home page: a composition of storied sections and nothing else.
 *
 * `Pages/Home` in Storybook renders exactly this list, so the two cannot drift
 * (design rule 11).
 */
export default function Home() {
  return (
    <>
      <SiteHeader />
      <main id="main">
        <Hero />
        <WhoWeBuildFor />
        <ProductSpotlight />
        <Services />
        <Philosophy />
        <Process />
        <About />
        <Contact />
      </main>
      <SiteFooter />
    </>
  );
}
