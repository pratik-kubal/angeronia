import * as React from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { Modal } from "./Modal";
import { Button } from "@/components/slds/button";
import { Input } from "@/components/slds/input";

/** A trigger plus the dialog, because a dialog with no opener cannot be tested. */
function ModalDemo({ size }: { size?: "small" | "medium" | "large" }) {
  const [open, setOpen] = React.useState(false);

  return (
    <div>
      <Button variant="brand" onClick={() => setOpen(true)}>
        Start a project
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        heading="Tell us about the work"
        size={size}
        footer={
          <>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button variant="brand" onClick={() => setOpen(false)}>
              Send
            </Button>
          </>
        }
      >
        <Input label="Email" type="email" required />
      </Modal>
    </div>
  );
}

const meta = {
  title: "Components/Modal",
  component: ModalDemo,
  parameters: {
    docs: {
      description: {
        component:
          "The blueprint is style-only, so every behaviour that makes a " +
          "dialog usable is written in the component: focus moves in on open " +
          "and returns to the opener on close, Tab and Shift+Tab cycle inside, " +
          "Escape closes, the backdrop closes, and the page behind stops " +
          "scrolling. Getting any one wrong strands a keyboard user behind an " +
          "invisible wall, so the `KeyboardTrap` story tests them rather than " +
          "leaving them to review.",
      },
    },
  },
} satisfies Meta<typeof ModalDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Large: Story = { args: { size: "large" } };

export const KeyboardTrap: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const opener = canvas.getByRole("button", { name: "Start a project" });

    await userEvent.click(opener);

    // The modal renders in a portal on <body>, so query the document.
    const body = within(document.body);
    const dialog = await waitFor(() => body.getByRole("dialog"));
    await expect(dialog).toHaveAccessibleName("Tell us about the work");

    // Focus lands on the dialog, so its name is announced before its contents.
    await waitFor(() => expect(dialog).toHaveFocus());

    // Tab cycles: from the last control, focus wraps to the first.
    const send = body.getByRole("button", { name: "Send" });
    send.focus();
    await userEvent.tab();
    await expect(body.getByRole("button", { name: "Close" })).toHaveFocus();

    // Shift+Tab from the first wraps back to the last.
    await userEvent.tab({ shift: true });
    await expect(send).toHaveFocus();

    // Escape closes and returns focus to whatever opened it.
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("dialog")).not.toBeInTheDocument());
    await waitFor(() => expect(opener).toHaveFocus());
  },
};

export const Dark: Story = { globals: { colorScheme: "dark" } };
