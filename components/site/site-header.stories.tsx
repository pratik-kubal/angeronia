import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SiteHeader } from "./site-header";

const meta = {
  title: "Sections/SiteHeader",
  component: SiteHeader,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Built from the 2x grid and Tier-1 parts rather than Carbon's " +
          "`UIShell` header — the UI Shell is application chrome for a product " +
          "with a global nav, and this is a five-link marketing bar that has " +
          "to sit inside the page's own container.\n\n" +
          "The nav links collapse below `lg`, where the in-page anchors they " +
          "point at are only a scroll away; the CTA and the scheme switcher " +
          "stay, because neither has another route.",
      },
    },
  },
} satisfies Meta<typeof SiteHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Dark: Story = { globals: { colorScheme: "dark" } };
