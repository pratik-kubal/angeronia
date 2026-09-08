import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { Information } from "@carbon/icons-react";
import { Tooltip } from "./Tooltip";
import { ButtonIcon } from "@/components/slds/button-icon";

const meta = {
  title: "Components/Tooltip",
  component: Tooltip,
  parameters: {
    docs: {
      description: {
        component:
          "A tooltip *describes* a control that already has a name — never " +
          "the name itself, because a tooltip is unreachable by touch and " +
          "disappears the moment focus moves. So this wires " +
          "`aria-describedby`, not `aria-labelledby`, shows on focus as well as " +
          "hover, and dismisses on Escape (WCAG 1.4.13).",
      },
    },
  },
  args: {
    content: "Server-verified: the reference solution never leaves the server.",
    children: <ButtonIcon icon={Information} assistiveText="About server verification" />,
  },
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Positions: Story = {
  render: (args) => (
    <div className="slds-grid slds-gutters_large slds-p-around_x-large slds-text-align_center">
      {(["top", "bottom", "left", "right"] as const).map((position) => (
        <div key={position} className="slds-col">
          <Tooltip {...args} position={position} content={`Anchored ${position}`}>
            <ButtonIcon icon={Information} assistiveText={`Tooltip ${position}`} />
          </Tooltip>
        </div>
      ))}
    </div>
  ),
};

export const FocusAndEscape: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("button", { name: "About server verification" });

    // Hidden until the trigger is focused — and `hidden`, so it is out of the
    // accessibility tree entirely rather than merely invisible. Reachable by
    // keyboard, not only by pointer.
    await expect(canvas.queryByRole("tooltip")).not.toBeInTheDocument();

    await userEvent.tab();
    await expect(trigger).toHaveFocus();
    await waitFor(() => expect(canvas.getByRole("tooltip")).toBeVisible());

    // It describes the control; it is not the control's name.
    await expect(trigger).toHaveAccessibleName("About server verification");
    await expect(trigger).toHaveAccessibleDescription(/Server-verified/);

    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(canvas.queryByRole("tooltip")).not.toBeInTheDocument());
  },
};

export const Dark: Story = { globals: { colorScheme: "dark" } };
