import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import Home from "@/app/page";
import { SkipLink } from "@/components/site/skip-link";
import { games, hero, LINKS } from "@/data/angeronia";

/**
 * The whole page: the skip link the layout renders, then `app/page.tsx` itself,
 * so the page and its story cannot drift (DESIGN-RULES.md §11). Stories have
 * no `html.js`, so this is the finished, no-script page.
 */
function Page() {
  return (
    <>
      <SkipLink />
      <Home />
    </>
  );
}

const meta = {
  title: "Pages/Home",
  component: Page,
  parameters: {
    // The page brings its own bands.
    band: false,
  },
} satisfies Meta<typeof Page>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The page's text outside the Code.Socratic replica (whose words are product UI). */
function studioText(root: HTMLElement) {
  const copy = root.cloneNode(true) as HTMLElement;
  for (const el of copy.querySelectorAll("[data-ui], .visually-hidden")) el.remove();
  return copy.textContent ?? "";
}

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // One h1, and it is the owner's headline.
    await expect(canvasElement.querySelectorAll("h1")).toHaveLength(1);
    await expect(canvas.getByRole("heading", { level: 1 })).toHaveTextContent(hero.headline);

    // The skip link is first in the tab order and lands on <main id="main">.
    await expect(canvasElement.querySelector("a")).toHaveTextContent("Skip to main content");
    await expect(canvas.getByRole("main")).toHaveAttribute("id", "main");

    // No heading level is skipped.
    const levels = [...canvasElement.querySelectorAll("h1,h2,h3,h4,h5,h6")].map((h) => Number(h.tagName.slice(1)));
    for (let i = 1; i < levels.length; i++) {
      await expect(levels[i] - levels[i - 1]).toBeLessThanOrEqual(1);
    }

    // The sections, in the page's order, and every studio band carries data-band.
    const ids = [...canvasElement.querySelectorAll("main > [data-band]")].map((s) => s.id);
    await expect(ids).toEqual(["top", "belief", "services", "code-socratic", "process", "about", "games", "contact"]);
    for (const band of canvasElement.querySelectorAll("[data-spined]")) await expect(band).toHaveAttribute("data-band");
    await expect(canvasElement.querySelectorAll('[data-band="dark"]')).toHaveLength(1);
    await expect(canvas.getByRole("banner")).toBeInTheDocument();
    await expect(canvas.getByRole("contentinfo")).toBeInTheDocument();

    // ADR-020: one Games section, one link per game.
    const gamesSection = canvasElement.querySelector<HTMLElement>("#games")!;
    await expect(within(gamesSection).getAllByRole("link")).toHaveLength(games.length);

    // The third person (ADR-028): no I, me, my, we, our or us in the studio's words.
    const text = studioText(canvasElement);
    await expect(text).not.toMatch(/\b(I|I’m|me|my|mine|we|our|us)\b/);
    // The owner's rulings: no test figures, no "then hand them over".
    await expect(text).not.toMatch(/2\s*\/\s*2|7\s*\/\s*7|84\s*ms/);
    await expect(text).not.toMatch(/hand them over/);

    // Code.Socratic is linked at its own address, never the old one.
    const productLinks = canvasElement.querySelectorAll<HTMLAnchorElement>('a[href^="http"][href*="code-socratic"]');
    await expect(productLinks.length).toBeGreaterThan(0);
    for (const a of productLinks) {
      await expect(a.getAttribute("href")).toBe(LINKS.codeSocratic);
    }
  },
};

export const Tablet: Story = {
  globals: { viewport: { value: "tablet", isRotated: false } },
};

export const Phone: Story = {
  globals: { viewport: { value: "phone", isRotated: false } },
};
