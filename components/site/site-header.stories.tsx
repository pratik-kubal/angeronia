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
          "Built from layout utilities and Tier-1 parts rather than " +
          "`slds-context-bar` — the SLDS Global Header and Global Navigation " +
          "are Salesforce application chrome and are out of scope (D10).\n\n" +
          "The nav links collapse below the large breakpoint, where the " +
          "in-page anchors they point at are only a scroll away; the CTA and " +
          "the scheme switcher stay, because neither has another route.",
      },
    },
  },
} satisfies Meta<typeof SiteHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Dark: Story = { globals: { colorScheme: "dark" } };
