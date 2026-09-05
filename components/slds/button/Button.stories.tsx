import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ArrowRight, Launch } from "@carbon/icons-react";
import { Button } from "./Button";

const meta = {
  title: "Components/Button",
  component: Button,
  parameters: {
    docs: {
      description: {
        component:
          "The SLDS 2 Button blueprint. Pill radius, the brand variant's hover " +
          "lift and the focus ring all come from the theme — this component " +
          "restates none of them. Passing `href` renders an `<a>`, because a " +
          "control that navigates is a link.",
      },
    },
  },
  args: { children: "Start a project" },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Brand: Story = {
  args: { variant: "brand" },
  parameters: {
    docs: {
      description: {
        story:
          "Teal 60 with white text — 4.99:1 in both colour schemes. The one " +
          "primary action on a page.",
      },
    },
  },
};

export const AllVariants: Story = {
  render: (args) => (
    <div className="slds-grid slds-wrap slds-gutters_x-small">
      {(
        [
          "base",
          "neutral",
          "brand",
          "outline-brand",
          "destructive",
          "text-destructive",
          "success",
        ] as const
      ).map((variant) => (
        <div key={variant} className="slds-col slds-m-bottom_x-small">
          <Button {...args} variant={variant}>
            {variant}
          </Button>
        </div>
      ))}
    </div>
  ),
};

export const Inverse: Story = {
  args: { variant: "inverse", children: "On an inverse surface" },
  render: (args) => (
    <div className="slds-box slds-theme_inverse">
      <Button {...args} />
    </div>
  ),
};

export const WithIcons: Story = {
  render: () => (
    <div className="slds-grid slds-gutters_x-small">
      <div className="slds-col">
        <Button variant="brand" iconRight={ArrowRight}>
          See what we build
        </Button>
      </div>
      <div className="slds-col">
        <Button iconLeft={Launch} href="https://code-socratic.com">
          Visit Code Socratic
        </Button>
      </div>
    </div>
  ),
};

export const AsLink: Story = {
  args: { variant: "brand", href: "#main", children: "Navigates instead of acting" },
};

export const Disabled: Story = {
  args: { variant: "brand", disabled: true },
};

export const LongLabel: Story = {
  args: {
    variant: "neutral",
    children: "A label long enough to test how the pill radius holds up when it wraps",
  },
  render: (args) => (
    <div className="slds-container_small">
      <Button {...args} />
    </div>
  ),
};

export const Stretch: Story = {
  args: { variant: "brand", stretch: true },
  render: (args) => (
    <div className="slds-container_small">
      <Button {...args} />
    </div>
  ),
};

export const Dark: Story = {
  args: { variant: "brand" },
  globals: { colorScheme: "dark" },
};
