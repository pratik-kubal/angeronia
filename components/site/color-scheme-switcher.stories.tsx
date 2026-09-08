import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import { ColorSchemeSwitcher } from "./color-scheme-switcher";
import { ThemeProvider } from "./theme-provider";

const meta = {
  title: "Sections/ColorSchemeSwitcher",
  component: ColorSchemeSwitcher,
  parameters: {
    docs: {
      description: {
        component:
          "A choice with a persistent selection is a set of toggles, not a " +
          "cycling button: `aria-pressed` says which one is on, so the current " +
          "scheme is announced rather than inferred from an icon.\n\n" +
          "There is no Match-system button, but `system` is still the default " +
          "scheme — a first visit follows the reader's OS. That is why the " +
          "pressed state reads `resolvedTheme` rather than `theme`: on a " +
          "system-dark machine Dark is the button that reads pressed, because " +
          "dark is what the reader is actually looking at.\n\n" +
          "Before hydration it is unknown, so both render unpressed — " +
          "rendering a guess would announce the wrong state to anyone whose " +
          "scheme differs from the default.",
      },
    },
  },
  // The switcher reads and writes `next-themes`, so its story has to supply the
  // same provider the app does — otherwise `setTheme` is a no-op and the
  // pressed state can never be exercised.
  decorators: [
    (Story) => (
      <ThemeProvider>
        <Story />
      </ThemeProvider>
    ),
  ],
} satisfies Meta<typeof ColorSchemeSwitcher>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const KeyboardAndState: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const group = canvas.getByRole("group", { name: "Colour scheme" });
    await expect(group).toBeInTheDocument();

    const dark = canvas.getByRole("button", { name: "Dark" });
    await userEvent.click(dark);
    await expect(dark).toHaveAttribute("aria-pressed", "true");

    const light = canvas.getByRole("button", { name: "Light" });
    await userEvent.click(light);
    await expect(light).toHaveAttribute("aria-pressed", "true");
    await expect(dark).toHaveAttribute("aria-pressed", "false");
  },
};

export const Dark: Story = { globals: { colorScheme: "dark" } };
