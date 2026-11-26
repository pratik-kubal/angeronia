import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import { hero } from "@/data/angeronia";
import { Hero } from "./hero";

const meta = {
  title: "Sections/Hero",
  component: Hero,
  parameters: {
    band: false,
    docs: {
      description: {
        component:
          "The first screen: \"One engineer,\" hanging from the spine and \"screen | to server\" " +
          "crossing it, then the sentence that names the studio and Pratik Kubal, and the button. " +
          "Under 900px the button follows the sentence.",
      },
    },
  },
} satisfies Meta<typeof Hero>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("heading", { level: 1 })).toHaveTextContent(hero.headline);
    // (A string matcher is compared as written, so the name's non-breaking space is normalised here.)
    await expect(canvasElement).toHaveTextContent(hero.lead.replace(/\s+/g, " "));
    // The owner's ruling: the sentence no longer ends "then hand them over."
    await expect(canvasElement).not.toHaveTextContent(/hand them over/);
    await expect(canvas.getByRole("link", { name: hero.action.label })).toBeVisible();
  },
};

export const Phone: Story = {
  globals: { viewport: { value: "phone", isRotated: false } },
};
