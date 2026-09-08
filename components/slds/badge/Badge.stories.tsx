import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Checkmark } from "@carbon/icons-react";
import { Badge } from "./Badge";
import { product } from "@/data/angeronia";

const meta = {
  title: "Components/Badge",
  component: Badge,
  parameters: {
    docs: {
      description: {
        component:
          "A badge labels; a pill is removable. Every tag on this site is a " +
          "label, so it is a badge.\n\n" +
          "The feedback variants exist because the blueprint has them, but " +
          "design rule 4 reserves feedback colour for feedback — a technology " +
          "tag is `default`, never `success`.",
      },
    },
  },
  args: { children: "Next.js" },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Variants: Story = {
  render: (args) => (
    <div className="slds-grid slds-wrap slds-gutters_x-small">
      {(["default", "inverse", "lightest", "success", "warning", "error"] as const).map(
        (variant) => (
          <div key={variant} className="slds-col slds-m-bottom_x-small">
            <Badge {...args} variant={variant}>
              {variant}
            </Badge>
          </div>
        ),
      )}
    </div>
  ),
};

export const WithIcon: Story = {
  args: { icon: Checkmark, children: "Server-verified" },
};

export const TagRow: Story = {
  render: () => (
    <div className="slds-grid slds-wrap slds-gutters_xx-small">
      {product.tags.map((tag) => (
        <div key={tag} className="slds-col slds-m-bottom_xx-small">
          <Badge>{tag}</Badge>
        </div>
      ))}
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "How badges are actually used on the page: the Code Socratic stack.",
      },
    },
  },
};

export const LongLabel: Story = {
  args: { children: "A tag with considerably more words in it than a tag should have" },
};

export const Dark: Story = {
  ...Variants,
  globals: { colorScheme: "dark" },
};
