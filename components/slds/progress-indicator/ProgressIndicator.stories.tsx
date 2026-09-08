import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ProgressIndicator } from "./ProgressIndicator";
import { product } from "@/data/angeronia";

const meta = {
  title: "Components/ProgressIndicator",
  component: ProgressIndicator,
  parameters: {
    docs: {
      description: {
        component:
          "A static summary of a sequence. The markers are `<span>`s, so " +
          "nothing is focusable and there is no keyboard contract to get " +
          "wrong; each one announces its own state in assistive text.",
      },
    },
  },
  args: {
    steps: product.loop.map((label) => ({ label })),
    current: 1,
    label: "Code Socratic loop",
  },
} satisfies Meta<typeof ProgressIndicator>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const FirstStep: Story = { args: { current: 0 } };

export const Complete: Story = { args: { current: 3 } };

export const Dark: Story = {
  globals: { colorScheme: "dark" },
};
