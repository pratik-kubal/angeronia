import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import { contact, hero } from "@/data/angeronia";
import { Button } from "./button";

const meta = {
  title: "Components/Button",
  component: Button,
  parameters: {
    docs: {
      description: {
        component:
          "The one primary action: a link set as a sage block, its label in the paired ink. Sage is " +
          "on buttons and nowhere else. `body` beside the hero's sentence; `lead` at Contact. It may " +
          "cross the axis, so it carries `data-cross`.",
      },
    },
  },
  args: { href: hero.action.href, size: "body", children: hero.action.label },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Body: Story = {
  play: async ({ canvasElement }) => {
    const link = within(canvasElement).getByRole("link", { name: hero.action.label });
    await expect(link.getAttribute("href")).toMatch(/^mailto:pratik-kubal@outlook\.com\?subject=/);
    await expect(link).toHaveAttribute("data-cross", "block");
    // At least a 44px target.
    await expect(link.getBoundingClientRect().height).toBeGreaterThanOrEqual(44);
  },
};

export const Lead: Story = {
  args: { href: contact.action.href, size: "lead", children: contact.action.label },
};
