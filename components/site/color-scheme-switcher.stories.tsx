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

    // The toggles are found by position, not by accessible name. Carbon's
    // `IconButton` names its button with `aria-labelledby` pointing at the
    // tooltip, and the tooltip is `aria-hidden` until it opens — a reference
    // the accname spec says to follow anyway (and axe does, which is why the
    // a11y pass on this story is green), but which `dom-accessibility-api`
    // resolves to the empty string. So the naming path is asserted explicitly
    // below rather than assumed by the query.
    const [light, dark] = canvas.getAllByRole("button");

    for (const [button, expected] of [
      [light, "Light"],
      [dark, "Dark"],
    ] as const) {
      const labelId = button.getAttribute("aria-labelledby");
      await expect(labelId).toBeTruthy();
      await expect(document.getElementById(labelId as string)).toHaveTextContent(expected);
    }

    await userEvent.click(dark);
    await expect(dark).toHaveAttribute("aria-pressed", "true");
    await expect(light).toHaveAttribute("aria-pressed", "false");

    await userEvent.click(light);
    await expect(light).toHaveAttribute("aria-pressed", "true");
    await expect(dark).toHaveAttribute("aria-pressed", "false");
  },
};

export const Dark: Story = { globals: { colorScheme: "dark" } };
