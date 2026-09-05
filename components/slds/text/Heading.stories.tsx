import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Heading, Kicker, Body } from "./Heading";
import { hero } from "@/data/angeronia";

const meta = {
  title: "Components/Heading",
  component: Heading,
  parameters: {
    docs: {
      description: {
        component:
          "A heading whose document level and visual size are set " +
          "independently. Conflating the two is the usual source of skipped " +
          "heading levels, so this takes both.\n\n" +
          "`display` is the marketing top end — `font-scale-8` at weight 3 — " +
          "which SLDS's utilities stop short of because an app shell never " +
          "needs it.",
      },
    },
  },
  args: { level: 2, children: "Numbers from shipped work." },
} satisfies Meta<typeof Heading>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Sizes: Story = {
  render: (args) => (
    <div>
      {(["display", "large", "medium", "small", "title", "title-caps"] as const).map((size) => (
        <div key={size} className="slds-m-bottom_medium">
          <p className="slds-text-body_small slds-text-color_weak">{size}</p>
          <Heading {...args} size={size}>
            {args.children}
          </Heading>
        </div>
      ))}
    </div>
  ),
};

export const LevelIsIndependentOfSize: Story = {
  render: () => (
    <div>
      <Heading level={1} size="display">
        An h1 set at display size
      </Heading>
      <Heading level={2} size="small" className="slds-m-top_medium">
        An h2 set at small size
      </Heading>
      <Heading level={3} size="large" className="slds-m-top_medium">
        An h3 set at large size
      </Heading>
    </div>
  ),
};

export const PageOpening: Story = {
  render: () => (
    <div>
      <Kicker>{hero.kicker}</Kicker>
      <Heading level={1} size="display" className="site-measure_heading slds-m-top_small">
        {hero.h1}
      </Heading>
      <Body className="slds-m-top_medium">{hero.body}</Body>
    </div>
  ),
};

export const Dark: Story = {
  ...Sizes,
  globals: { colorScheme: "dark" },
};
