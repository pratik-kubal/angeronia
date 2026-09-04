import { Nav } from "@/components/angeronia/nav";
import { Hero } from "@/components/angeronia/hero";
import { Philosophy } from "@/components/angeronia/philosophy";
import { Services } from "@/components/angeronia/services";
import { Process } from "@/components/angeronia/process";
import { ProductSpotlight } from "@/components/angeronia/product-spotlight";
import { Metrics } from "@/components/angeronia/metrics";
import { About } from "@/components/angeronia/about";
import { Contact } from "@/components/angeronia/contact";
import { SiteFooter } from "@/components/angeronia/site-footer";
import { ScrollSpine } from "@/components/angeronia/scroll-spine";
import { Reveals } from "@/components/angeronia/reveals";

export default function Home() {
  return (
    <div id="top" className="ang-root">
      <Nav />
      <main className="ang-main">
        <Hero />
        <Philosophy />
        <Services />
        <Process />
        <ProductSpotlight />
        <Metrics />
        <About />
        <Contact />
        <SiteFooter />
      </main>
      <ScrollSpine />
      <Reveals />
    </div>
  );
}
