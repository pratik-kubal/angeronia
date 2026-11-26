import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { productDemo } from "@/data/angeronia";
import { withScript } from "@/stories/with-script";
import { Workspace } from "./workspace";

const meta = {
  title: "Components/Workspace",
  component: Workspace,
  parameters: {
    docs: {
      description: {
        component:
          "The Code.Socratic replica: a real session, the editor with the solution and the side pane " +
          "with its four tabs, in the product's own light theme (its `--ui-*` palette is literal and " +
          "scoped to this component). The tabs work (click, arrow keys, Home, End); Run Tests, Submit " +
          "and Send are `disabled`. Without script every panel shows, stacked, under its name. Both " +
          "fragments carry `data-ui`.",
      },
    },
  },
} satisfies Meta<typeof Workspace>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Without script (stories do not get `html.js`): no tabs, every panel under its name. */
export const NoScript: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.queryByRole("tablist")).toBeNull();
    // No tab panel without a tab: every panel is a plain block under its name.
    await expect(canvas.queryAllByRole("tabpanel")).toHaveLength(0);
    const panels = Object.keys(productDemo.tabs).map((key) =>
      canvasElement.querySelector<HTMLElement>(`[id$="-panel-${key}"]`),
    );
    await expect(panels.map((panel) => panel?.querySelector("p")?.textContent)).toEqual(Object.values(productDemo.tabs));
    for (const panel of panels) await expect(panel).toBeVisible();
    await expect(canvasElement.querySelectorAll("[data-ui]")).toHaveLength(2);
  },
};

export const Tabs: Story = {
  decorators: [withScript],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const tabs = await canvas.findAllByRole("tab");
    await expect(tabs).toHaveLength(4);
    await expect(tabs[0]).toHaveAttribute("aria-selected", "true");
    await waitFor(() => expect(canvas.getAllByRole("tabpanel")).toHaveLength(1));

    // Click.
    await userEvent.click(tabs[3]);
    await expect(tabs[3]).toHaveAttribute("aria-selected", "true");
    await expect(canvas.getByRole("tabpanel")).toHaveAccessibleName(productDemo.tabs.results);
    await expect(canvas.getByText(productDemo.results.heading)).toBeVisible();

    // Arrow keys wrap, Home and End jump; focus follows.
    await userEvent.keyboard("{ArrowRight}");
    await expect(tabs[0]).toHaveFocus();
    await expect(tabs[0]).toHaveAttribute("aria-selected", "true");
    await userEvent.keyboard("{ArrowLeft}");
    await expect(tabs[3]).toHaveFocus();
    await userEvent.keyboard("{Home}");
    await expect(tabs[0]).toHaveFocus();
    await userEvent.keyboard("{End}");
    await expect(tabs[3]).toHaveAttribute("aria-selected", "true");
    await userEvent.keyboard("{ArrowLeft}");
    await expect(tabs[2]).toHaveAttribute("aria-selected", "true");

    // One tab stop for the tablist.
    await expect(tabs.filter((t) => t.tabIndex === 0)).toHaveLength(1);

    // Nothing else acts: Run Tests, Submit and Send are genuinely disabled.
    const others = [...canvasElement.querySelectorAll<HTMLButtonElement>("button:not([role='tab'])")];
    await expect(others.map((b) => b.textContent?.split(" ")[0])).toEqual([
      productDemo.actions.run.split(" ")[0],
      productDemo.actions.submit,
      productDemo.composer.send,
    ]);
    for (const button of others) await expect(button).toBeDisabled();
  },
};

export const Phone: Story = {
  decorators: [withScript],
  globals: { viewport: { value: "phone", isRotated: false } },
};
