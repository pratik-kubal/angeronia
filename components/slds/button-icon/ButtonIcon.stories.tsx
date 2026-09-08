import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import { Sun, Moon, Laptop } from "@carbon/icons-react";
import { ButtonIcon } from "./ButtonIcon";

const meta = {
  title: "Components/ButtonIcon",
  component: ButtonIcon,
  parameters: {
    docs: {
      description: {
        component:
          "A button whose only content is a glyph. `assistiveText` is required " +
          "rather than optional: an icon-only control has no visible name, so " +
          "the accessible name has to come from somewhere.",
      },
    },
  },
  args: { icon: Sun, assistiveText: "Light" },
} satisfies Meta<typeof ButtonIcon>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Variants: Story = {
  render: (args) => (
    <div className="slds-grid slds-gutters_x-small">
      {(["bare", "container", "border", "border-filled", "brand"] as const).map((variant) => (
        <div key={variant} className="slds-col">
          <ButtonIcon {...args} variant={variant} assistiveText={variant} />
        </div>
      ))}
    </div>
  ),
};

export const Sizes: Story = {
  render: (args) => (
    <div className="slds-grid slds-grid_vertical-align-center slds-gutters_x-small">
      {(["xx-small", "x-small", "small", "medium", "large"] as const).map((size) => (
        <div key={size} className="slds-col">
          <ButtonIcon {...args} size={size} assistiveText={size} />
        </div>
      ))}
    </div>
  ),
};

export const Pressed: Story = {
  args: { pressed: true, variant: "border-filled" },
  parameters: {
    docs: {
      description: {
        story:
          "`pressed` sets `aria-pressed`, so a toggle's state is announced " +
          "rather than carried by fill colour alone.",
      },
    },
  },
};

export const Toggles: Story = {
  render: (args) => (
    <div className="slds-button-group" role="group" aria-label="Colour scheme">
      <ButtonIcon {...args} icon={Sun} assistiveText="Light" pressed size="small" />
      <ButtonIcon {...args} icon={Moon} assistiveText="Dark" pressed={false} size="small" />
      <ButtonIcon {...args} icon={Laptop} assistiveText="Match system" pressed={false} size="small" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const light = canvas.getByRole("button", { name: "Light" });
    const dark = canvas.getByRole("button", { name: "Dark" });

    await expect(light).toHaveAttribute("aria-pressed", "true");
    await expect(dark).toHaveAttribute("aria-pressed", "false");

    // The whole group must be reachable and operable from the keyboard.
    await userEvent.tab();
    await expect(light).toHaveFocus();
    await userEvent.tab();
    await expect(dark).toHaveFocus();
  },
};

export const Disabled: Story = {
  args: { disabled: true },
};

export const Dark: Story = {
  args: { variant: "border-filled" },
  globals: { colorScheme: "dark" },
};
