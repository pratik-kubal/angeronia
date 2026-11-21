import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import { HomePage } from "@/components/site/home-page";
import { PRICES, copy } from "@/data/angeronia";

/**
 * The whole page: the same `HomePage` that `app/page.tsx` renders, so the two
 * cannot drift (design rule 10). Its play test checks what no single section's
 * story can: the page's heading outline, its links and its words.
 */
const meta = {
  title: "Pages/Home",
  component: HomePage,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof HomePage>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Every section's h2, as a screen reader names it: words, with real spaces between the lines. */
const SECTION_HEADINGS = [
  "I’m Pratik, a solo AI engineer in Philadelphia.",
  "Why agent projects stall",
  "Proof of work",
  "Process",
  "FAQ",
  "Also from Angeronia Labs",
  "Have a workflow you want an agent to run?",
];

/** The in-page links the header carries, each to a section that must exist. */
const NAV_TARGETS = ["#offers", "#proof", "#process", "#faq"];

/** Words the page must never say (README §2.3, content.md §1). */
const BANNED = /\[CONFIRM|Try it|shipped|in production|trusted by/i;

const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // 1. One h1, and it is the name.
    const h1s = canvasElement.querySelectorAll("h1");
    await expect(h1s).toHaveLength(1);
    await expect(h1s[0]).toHaveAccessibleName("Angeronia Labs");

    // 2. A level-2 heading for every section. The Offers statement is named by
    //    its price, which is a [CONFIRM] value, so it is read from PRICES.
    for (const name of SECTION_HEADINGS) {
      await expect(canvas.getByRole("heading", { level: 2, name })).toBeInTheDocument();
    }
    await expect(
      canvas.getByRole("heading", { level: 2, name: new RegExp(escape(PRICES.mvpRange)) }),
    ).toBeInTheDocument();

    // 3. No heading level is skipped on the way down.
    const levels = [...canvasElement.querySelectorAll("h1, h2, h3, h4, h5, h6")].map((h) =>
      Number(h.tagName.slice(1)),
    );
    for (let index = 1; index < levels.length; index++) {
      await expect(levels[index] - levels[index - 1]).toBeLessThanOrEqual(1);
    }

    // 4. Ten questions, all open.
    await expect(canvasElement.querySelectorAll("#faq h3")).toHaveLength(10);

    // 5. Every link that opens a new tab withholds the referrer.
    for (const link of canvasElement.querySelectorAll('a[target="_blank"]')) {
      await expect(link.getAttribute("rel") ?? "").toContain("noreferrer");
    }

    // 6. No dead link.
    for (const link of canvasElement.querySelectorAll("a")) {
      const href = (link.getAttribute("href") ?? "").trim();
      await expect(href).not.toBe("");
      await expect(href).not.toBe("#");
    }

    // 7. Nothing untrue or unconfirmed in the page's words.
    const main = canvasElement.querySelector("main");
    await expect(main).not.toBeNull();
    await expect(main?.textContent ?? "").not.toMatch(BANNED);

    // 8. The header's four links, each to a section that is there. The nav is
    //    hidden on a phone, so it is found whatever the canvas width.
    const nav = canvas.getByRole("navigation", { name: copy.navLabel, hidden: true });
    for (const target of NAV_TARGETS) {
      await expect(nav.querySelector(`a[href="${target}"]`)).not.toBeNull();
      await expect(canvasElement.querySelector(target)).not.toBeNull();
    }
  },
};
