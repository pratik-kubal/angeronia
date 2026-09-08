import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import { SkipLink } from "./skip-link";

const meta = {
  title: "Sections/SkipLink",
  component: SkipLink,
  parameters: {
    docs: {
      description: {
        component:
          "The first focusable thing on the page. Carbon's " +
          "`.cds--visually-hidden` hides it from sight but not from the " +
          "accessibility tree; `.site-skip-link:focus` brings it back on " +
          "keyboard focus. It renders on the server, so it works before " +
          "hydration.",
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
      <p>
        Press <kbd>Tab</kbd> — the link appears over the top-left of the page.
      </p>
      <main id="main">
        <p>Main content.</p>
      </main>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const link = canvas.getByRole("link", { name: "Skip to main content" });

    // Clipped to a 1px box until focused, then laid out over the page.
    await expect(link.getBoundingClientRect().width).toBeLessThan(2);

    await userEvent.tab();
    await expect(link).toHaveFocus();
    await expect(link.getBoundingClientRect().width).toBeGreaterThan(80);
  },
};
