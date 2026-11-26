import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import { footer } from "@/data/angeronia";
import { SiteFooter } from "./site-footer";

const meta = {
  title: "Sections/SiteFooter",
  component: SiteFooter,
  parameters: {
    band: false,
    docs: {
      description: {
        component:
          "The story of the name (the Angerona statue and the Fasti Antiates, each captioned), then " +
          "the company: the city, the links, the address, the copyright, and the picture credits with " +
          "each licence linked.",
      },
    },
  },
} satisfies Meta<typeof SiteFooter>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("contentinfo")).toBeInTheDocument();
    await expect(canvas.getByRole("img", { name: footer.statue.alt })).toBeInTheDocument();
    await expect(canvas.getByRole("img", { name: footer.calendar.alt })).toBeInTheDocument();
    await expect(canvas.getByText(footer.statue.caption)).toBeInTheDocument();
    await expect(canvas.getByText(footer.calendar.caption)).toBeInTheDocument();

    // Each picture's licence is linked, as the licences ask.
    for (const credit of footer.credits.items) {
      await expect(canvas.getByRole("link", { name: credit.title })).toHaveAttribute("href", credit.href);
      await expect(canvas.getByRole("link", { name: credit.licence })).toHaveAttribute("href", credit.licenceHref);
    }
    await expect(canvas.getByRole("link", { name: "Privacy" })).toHaveAttribute("href", "/privacy");
    await expect(canvas.getByRole("link", { name: "Terms" })).toHaveAttribute("href", "/terms");
  },
};

export const Phone: Story = {
  globals: { viewport: { value: "phone", isRotated: false } },
};
