import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Idea, ArrowRight } from "@carbon/icons-react";
import { Card } from "./Card";
import { Badge } from "@/components/slds/badge";
import { Button } from "@/components/slds/button";
import { philosophy } from "@/data/angeronia";

const meta = {
  title: "Components/Card",
  component: Card,
  parameters: {
    docs: {
      description: {
        component:
          "The SLDS 2 Card blueprint: header (a media object, so a figure and " +
          "a title share a baseline), body, footer. Radius (`border-4`) and " +
          "shadow come from the theme.\n\n" +
          "`headingLevel` is separate from the visual size on purpose — the " +
          "level follows the page's document outline, which is a property of " +
          "where the card sits, not of what it looks like.",
      },
    },
  },
  args: {
    heading: "Strategy is engineering",
    children: <p>The people who scope it write it. No seam to drop.</p>,
  },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithIcon: Story = {
  args: { icon: Idea },
};

export const WithFooter: Story = {
  args: {
    icon: Idea,
    footer: (
      <div className="slds-grid slds-wrap slds-gutters_xx-small">
        {["Agent loops", "Tool use & guardrails", "Server-verified evals"].map((tag) => (
          <div key={tag} className="slds-col slds-m-bottom_xx-small">
            <Badge>{tag}</Badge>
          </div>
        ))}
      </div>
    ),
  },
};

export const WithActions: Story = {
  args: {
    icon: Idea,
    actions: (
      <Button variant="neutral" iconRight={ArrowRight}>
        Read more
      </Button>
    ),
  },
};

export const Grid: Story = {
  render: () => (
    <div className="slds-grid slds-wrap slds-gutters">
      {philosophy.beats.map((beat) => (
        <div key={beat.tag} className="slds-col slds-size_1-of-1 slds-medium-size_4-of-12">
          <Card heading={beat.tag} icon={Idea}>
            <p>{beat.text}</p>
          </Card>
        </div>
      ))}
    </div>
  ),
  parameters: {
    docs: { description: { story: "Three cards on one row, as the Philosophy section uses them." } },
  },
};

export const LongContent: Story = {
  args: {
    icon: Idea,
    heading: "A heading long enough to find out where the card header wraps and whether it still lines up",
    children: (
      <p>
        {"Body copy repeated to see the body grow. ".repeat(12)}
      </p>
    ),
  },
};

export const Dark: Story = {
  ...WithFooter,
  globals: { colorScheme: "dark" },
};
