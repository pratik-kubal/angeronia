import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import { SiteHeader } from "@/components/site/site-header";
import { SkipLink } from "@/components/site/skip-link";
import { Hero } from "@/components/site/hero";
import { Philosophy } from "@/components/site/philosophy";
import { Services } from "@/components/site/services";
import { Process } from "@/components/site/process";
import { ProductSpotlight } from "@/components/site/product-spotlight";
import { Proof } from "@/components/site/proof";
import { About } from "@/components/site/about";
import { Contact } from "@/components/site/contact";
import { SiteFooter } from "@/components/site/site-footer";

/**
 * The whole page, in the same order `app/page.tsx` composes it — the two lists
 * are the deliverable of design rule 11, so a section that changes here
 * changes there.
 */
function Home() {
  return (
    <>
      <SkipLink />
      <SiteHeader />
      <main id="main">
        <Hero />
        <Philosophy />
        <Services />
        <Process />
        <ProductSpotlight />
        <Proof />
        <About />
        <Contact />
      </main>
      <SiteFooter />
    </>
  );
}

const meta = {
  title: "Pages/Home",
  component: Home,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "`app/page.tsx` composes exactly this list of storied sections and " +
          "nothing else, so the page and its story cannot drift.",
      },
    },
  },
} satisfies Meta<typeof Home>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Light: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // One h1, and the section headings under it — the outline the page
    // promises assistive technology.
    await expect(canvasElement.querySelectorAll("h1")).toHaveLength(1);

    for (const name of [
      "One line. No hand-off cliff.",
      "What we take on",
      "Four moves, one continuous line.",
      "Numbers from shipped work.",
      "Senior hands, not a hand-off.",
    ]) {
      await expect(canvas.getByRole("heading", { level: 2, name })).toBeInTheDocument();
    }

    // The skip link is the first thing in the tab order.
    const first = canvasElement.querySelector("a");
    await expect(first).toHaveTextContent("Skip to main content");

    // No heading level is skipped.
    const levels = [...canvasElement.querySelectorAll("h1,h2,h3,h4,h5,h6")].map((h) =>
      Number(h.tagName.slice(1)),
    );
    for (let i = 1; i < levels.length; i++) {
      await expect(levels[i] - levels[i - 1]).toBeLessThanOrEqual(1);
    }
  },
};

export const Dark: Story = { globals: { colorScheme: "dark" } };
