import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import { LINKS, privacyPolicy, termsOfService } from "@/data/angeronia";
import { LegalPage } from "./legal-page";

const meta = {
  title: "Pages/LegalPage",
  component: LegalPage,
  parameters: {
    // The page brings its own bands.
    band: false,
    docs: {
      description: {
        component:
          "`/privacy` and `/terms` both render through this component, on the spine: the masthead, the " +
          "title crossing the axis, the date and the lede hanging from it, each section as a pair " +
          "(its heading on your side, its text on the studio's), and the site's footer. The legal " +
          "text is left as written.",
      },
    },
  },
} satisfies Meta<typeof LegalPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Privacy: Story = {
  args: { document: privacyPolicy },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("heading", { level: 1 })).toHaveTextContent(privacyPolicy.title);
    await expect(canvasElement.querySelector("time")).toHaveAttribute("datetime", privacyPolicy.updatedIso);
    const main = canvas.getByRole("main");
    await expect(main).toHaveAttribute("id", "main");
    await expect(within(main).getAllByRole("heading", { level: 2 })).toHaveLength(privacyPolicy.sections.length);
    // Every paragraph of the document is on the page, unchanged (the email
    // address sits in its own span, kept on one line, so compare whole text).
    const shown = [...main.querySelectorAll("p")].map((p) => p.textContent);
    for (const section of privacyPolicy.sections) {
      for (const paragraph of section.paragraphs) await expect(shown).toContain(paragraph);
    }
    // The address never breaks at its hyphen.
    const address = within(main).getAllByText(LINKS.email);
    await expect(address.length).toBeGreaterThan(0);
    for (const el of address) await expect(getComputedStyle(el).whiteSpace).toBe("nowrap");
    // The masthead leads back to the home page's sections.
    await expect(canvas.getByRole("link", { name: "Services" })).toHaveAttribute("href", "/#services");
  },
};

export const Terms: Story = { args: { document: termsOfService } };

export const Phone: Story = {
  args: { document: privacyPolicy },
  globals: { viewport: { value: "phone", isRotated: false } },
};
