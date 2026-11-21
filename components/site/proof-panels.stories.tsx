import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ProofPanel } from "./proof-panels";

/**
 * The four Code.Socratic panels Proof of work sets beside its claims: pictures
 * of another product, in its own aubergine and blush.
 */
const meta = {
  title: "Sections/ProofPanel",
  component: ProofPanel,
  parameters: {
    layout: "fullscreen",
    viewport: {
      options: {
        phone: { name: "Phone", styles: { width: "390px", height: "844px" }, type: "mobile" },
      },
    },
  },
  args: { id: "talk" },
} satisfies Meta<typeof ProofPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

/** `talk`: the tutor asks for the plan, then for its cost. */
export const Default: Story = {};

/** `run`: the run step, with two of nine tests still failing. */
export const Run: Story = { args: { id: "run" } };

/** `credits`: what one problem costs, 1 : 2 : 4. */
export const Credits: Story = { args: { id: "credits" } };

/** `boundary`: what the tutor says when a test fails. */
export const Boundary: Story = { args: { id: "boundary" } };

/** On a phone the three cost tiles stack. */
export const Phone: Story = {
  args: { id: "credits" },
  globals: { viewport: { value: "phone", isRotated: false } },
};
