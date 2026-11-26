import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import { SkipLink } from "./skip-link";

const meta = {
  title: "Components/SkipLink",
  component: SkipLink,
  parameters: {
    docs: {
      description: {
        component:
          "The first focusable thing on every page, rendered by `app/layout.tsx`. It waits above " +
          "the top of the screen and drops into the top-left corner on keyboard focus, in the " +
          "band's inverse (`--band-ground` on `--band-ink`). It renders on the server, so it " +
          "works before hydration.",
      },
    },
  },
} satisfies Meta<typeof SkipLink>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div>
      <SkipLink />
      <main id="main">
        <p>Press Tab: the link drops in over the top-left of the page.</p>
      </main>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const link = canvas.getByRole("link", { name: "Skip to main content" });

    // Off the top of the screen until focused, then inside it.
    await expect(link.getBoundingClientRect().bottom).toBeLessThanOrEqual(0);

    await userEvent.tab();
    await expect(link).toHaveFocus();
    await expect(link.getBoundingClientRect().top).toBeGreaterThanOrEqual(0);
    await expect(link).toHaveAttribute("href", "#main");
  },
};
