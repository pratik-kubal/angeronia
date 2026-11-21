import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { BrandMark } from "./brand-mark";

const meta = {
  title: "Components/BrandMark",
  component: BrandMark,
  parameters: {
    docs: {
      description: {
        component:
          "The disc-and-cursor mark, gold on warm black. Always `aria-hidden`: it sits beside " +
          "the name, which the header writes itself.",
      },
    },
  },
} satisfies Meta<typeof BrandMark>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
