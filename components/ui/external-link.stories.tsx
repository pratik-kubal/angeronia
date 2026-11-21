import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { product } from "@/data/angeronia";
import { ExternalLink } from "./external-link";

const meta = {
  title: "Components/ExternalLink",
  component: ExternalLink,
  parameters: {
    docs: {
      description: {
        component:
          "A link off the site. Opens in a new tab, says so to a screen reader, and carries one " +
          "inline arrow. The underline firms up on hover.",
      },
    },
  },
  args: { href: product.visit.href, children: product.visit.label },
} satisfies Meta<typeof ExternalLink>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
