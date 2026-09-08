import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import { Pill, PillContainer } from "./Pill";
import { product } from "@/data/angeronia";

const meta = {
  title: "Components/Pill",
  component: Pill,
  parameters: {
    docs: {
      description: {
        component:
          "A pill is removable; a badge is not. If nothing can be taken away, " +
          "the component you want is `Badge`.\n\n" +
          "The remove control names what it removes, so a list of them does " +
          "not announce as six identical \"Remove\" buttons.",
      },
    },
  },
  args: { label: "Next.js" },
} satisfies Meta<typeof Pill>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Removable: Story = { args: { onRemove: () => {} } };

export const Group: Story = {
  render: () => (
    <PillContainer label="Stack">
      {product.tags.map((tag) => (
        <Pill key={tag} label={tag} onRemove={() => {}} />
      ))}
    </PillContainer>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Each remove button names its own pill.
    await expect(canvas.getByRole("button", { name: "Remove Stripe" })).toBeInTheDocument();
    await expect(canvas.getByRole("button", { name: "Remove E2B" })).toBeInTheDocument();
  },
};

export const Dark: Story = { ...Group, globals: { colorScheme: "dark" } };
