import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Spinner } from "./Spinner";

const meta = {
  title: "Components/Spinner",
  component: Spinner,
  parameters: {
    docs: {
      description: {
        component:
          "Pure CSS, no image — which is not incidental. SLDS 1's spinner was " +
          "a GIF from the Salesforce asset set, which D10 puts out of scope; " +
          "this one draws itself from two pseudo elements, so nothing is " +
          "loaded and nothing is licensed.\n\n" +
          "`label` is required: \"Loading\" has to be announced, not implied by " +
          "motion.",
      },
    },
  },
  args: { label: "Loading", inline: true },
} satisfies Meta<typeof Spinner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Sizes: Story = {
  render: (args) => (
    <div className="slds-grid slds-grid_vertical-align-center slds-gutters_large slds-p-around_large">
      {(["xx-small", "x-small", "small", "medium", "large"] as const).map((size) => (
        <div key={size} className="slds-col slds-is-relative slds-text-align_center">
          <Spinner {...args} size={size} />
          <p className="slds-text-body_small slds-text-color_weak slds-m-top_large">{size}</p>
        </div>
      ))}
    </div>
  ),
};

export const Brand: Story = { args: { variant: "brand", size: "small" } };

export const Dark: Story = { args: { size: "small" }, globals: { colorScheme: "dark" } };
