import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import { ExpandableSection } from "./ExpandableSection";

const meta = {
  title: "Components/ExpandableSection",
  component: ExpandableSection,
  parameters: {
    docs: {
      description: {
        component:
          "One disclosure, not a set. Use `Accordion` when several sections " +
          "are mutually exclusive.",
      },
    },
  },
  args: {
    title: "What we take on",
    children: <p>AI &amp; LLM product engineering, cloud, full-stack, reliability.</p>,
  },
} satisfies Meta<typeof ExpandableSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = {};

export const Closed: Story = { args: { defaultOpen: false } };

export const Interaction: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button", { name: "What we take on" });

    await expect(button).toHaveAttribute("aria-expanded", "true");
    await userEvent.click(button);
    await expect(button).toHaveAttribute("aria-expanded", "false");
    await expect(canvas.queryByRole("region")).not.toBeInTheDocument();
  },
};

export const Dark: Story = { globals: { colorScheme: "dark" } };
