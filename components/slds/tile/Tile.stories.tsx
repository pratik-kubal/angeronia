import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Tile } from "./Tile";
import { processSteps } from "@/data/angeronia";

const meta = {
  title: "Components/Tile",
  component: Tile,
  parameters: {
    docs: {
      description: {
        component:
          "A compact title-plus-detail block — lighter than a Card because it " +
          "carries no header row, figure or footer. Used under the Path to " +
          "carry each stage's copy.",
      },
    },
  },
  args: {
    title: processSteps[0].title,
    children: <p>{processSteps[0].body}</p>,
  },
} satisfies Meta<typeof Tile>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithMeta: Story = { args: { meta: "Step one" } };

export const Row: Story = {
  render: () => (
    <div className="slds-grid slds-wrap slds-gutters">
      {processSteps.map((step, index) => (
        <div key={step.title} className="slds-col slds-size_1-of-1 slds-medium-size_3-of-12">
          <Tile title={step.title} meta={`Step ${index + 1}`}>
            <p>{step.body}</p>
          </Tile>
        </div>
      ))}
    </div>
  ),
};

export const Dark: Story = {
  ...Row,
  globals: { colorScheme: "dark" },
};
