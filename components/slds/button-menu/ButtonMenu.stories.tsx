import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { ButtonMenu } from "./ButtonMenu";

const items = [
  { id: "edit", label: "Edit" },
  { id: "share", label: "Share" },
  { id: "archive", label: "Archive" },
  { id: "delete", label: "Delete", disabled: true },
];

const meta = {
  title: "Components/ButtonMenu",
  component: ButtonMenu,
  parameters: {
    docs: {
      description: {
        component:
          "A menu is not a listbox and not a dialog: the trigger owns " +
          "`aria-haspopup` and `aria-expanded`, the items are `role=\"menuitem\"` " +
          "inside `role=\"menu\"`, and the keyboard contract is arrows to move, " +
          "Enter to choose, Escape to leave — with focus returning to the " +
          "trigger every time it closes.",
      },
    },
  },
  args: { items, label: "Record actions" },
} satisfies Meta<typeof ButtonMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const RightAligned: Story = {
  args: { align: "right" },
  render: (args) => (
    <div className="slds-text-align_right">
      <ButtonMenu {...args} />
    </div>
  ),
};

export const KeyboardNavigation: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("button", { name: "Record actions" });

    await expect(trigger).toHaveAttribute("aria-haspopup", "true");
    await expect(trigger).toHaveAttribute("aria-expanded", "false");

    await userEvent.click(trigger);
    await expect(trigger).toHaveAttribute("aria-expanded", "true");

    // Opening focuses the first item.
    const edit = canvas.getByRole("menuitem", { name: "Edit" });
    await waitFor(() => expect(edit).toHaveFocus());

    await userEvent.keyboard("{ArrowDown}");
    await waitFor(() => expect(canvas.getByRole("menuitem", { name: "Share" })).toHaveFocus());

    await userEvent.keyboard("{End}");
    await waitFor(() => expect(canvas.getByRole("menuitem", { name: "Delete" })).toHaveFocus());

    // Escape closes and hands focus back, so nobody is dropped at the top of
    // the page.
    await userEvent.keyboard("{Escape}");
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await waitFor(() => expect(trigger).toHaveFocus());
  },
};

export const Dark: Story = { globals: { colorScheme: "dark" } };
