import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { Popover } from "./Popover";

const meta = {
  title: "Components/Popover",
  component: Popover,
  parameters: {
    docs: {
      description: {
        component:
          "A non-modal panel anchored to a trigger. Non-modal is the whole " +
          "distinction from `Modal`: the page behind stays interactive, so " +
          "there is no focus trap and no backdrop. What it does need is a way " +
          "out that does not require a mouse — Escape closes and returns focus " +
          "to the trigger.",
      },
    },
  },
  args: {
    heading: "How we scope",
    children: <p>We write the ambiguity down until it is testable, then price that.</p>,
    trigger: (props) => (
      <button type="button" className="slds-button slds-button_neutral" {...props}>
        How we scope
      </button>
    ),
  },
} satisfies Meta<typeof Popover>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Interaction: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("button", { name: "How we scope" });

    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(trigger);
    await expect(trigger).toHaveAttribute("aria-expanded", "true");

    const panel = await waitFor(() => canvas.getByRole("dialog", { name: "How we scope" }));
    await expect(panel).toBeVisible();

    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(trigger).toHaveAttribute("aria-expanded", "false"));
    await expect(trigger).toHaveFocus();
  },
};

export const Dark: Story = { globals: { colorScheme: "dark" } };
