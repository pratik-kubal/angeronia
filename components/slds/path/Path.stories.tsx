import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Path } from "./Path";
import { processSteps, processLabel } from "@/data/angeronia";

const meta = {
  title: "Components/Path",
  component: Path,
  parameters: {
    docs: {
      description: {
        component:
          "SLDS's Path is normally an interactive listbox for moving a record " +
          "between stages. Here it describes a process nobody is editing, so " +
          "each stage is a `<span>` inside an `<li>`: the blueprint's structure " +
          "and styling, none of its interaction. Blueprints are style-only — " +
          "the behaviour and ARIA are ours, and the right behaviour here is " +
          "none.\n\n" +
          "Every stage announces its own state, so complete / current / " +
          "upcoming is not carried by marker colour alone.",
      },
    },
  },
  args: {
    steps: processSteps.map((step) => ({ title: step.title })),
    current: 2,
    label: processLabel,
  },
} satisfies Meta<typeof Path>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const AtEachStage: Story = {
  render: (args) => (
    <div className="slds-grid slds-grid_vertical">
      {args.steps.map((_, index) => (
        <div key={index} className="slds-col slds-m-bottom_medium">
          <p className="slds-text-title_caps slds-text-color_weak slds-m-bottom_xx-small">
            {`current = ${index}`}
          </p>
          <Path {...args} current={index} />
        </div>
      ))}
    </div>
  ),
};

export const AllComplete: Story = {
  args: { current: 4 },
};

export const Dark: Story = {
  globals: { colorScheme: "dark" },
};
