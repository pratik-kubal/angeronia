import { SiteHeader } from "@/components/site/site-header";
import { Hero } from "@/components/site/hero";
import { Intro } from "@/components/site/intro";
import { Problems } from "@/components/site/problems";
import { Offers } from "@/components/site/offers";
import { Proof } from "@/components/site/proof";
import { Process } from "@/components/site/process";
import { Faq } from "@/components/site/faq";
import { Product } from "@/components/site/product";
import { Close } from "@/components/site/close";

/**
 * The home page. `app/page.tsx` and the `Pages/Home` story both render this,
 * so the page and its story cannot drift (design rule 10).
 */
export function HomePage() {
  return (
    <div className="studio">
      <SiteHeader variant="overlay" />
      <main id="main">
        <Hero />
        <Intro />
        <Problems />
        <Offers />
        <Proof />
        <Process />
        <Faq />
        <Product />
      </main>
      <Close />
    </div>
  );
}
