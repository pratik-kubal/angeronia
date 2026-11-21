import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ProofPanel } from "./proof-panels";

const meta = {
  title: "Sections/ProofPanel",
  component: ProofPanel,
  parameters: { layout: "fullscreen" },
  args: { id: "talk" },
} satisfies Meta<typeof ProofPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
