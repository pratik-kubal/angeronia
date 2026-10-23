import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import { Games } from "./games";

const meta = {
  title: "Sections/Games",
  component: Games,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "The two games, linked from the home page (ADR-020). Each is shown " +
          "by a screenshot of itself, because the games keep their own look " +
          "outside the design system (ADR-019).\n\n" +
          "One link per game, stretched over its block, so the screenshot opens " +
          "the game too without becoming a second tab stop.",
      },
    },
  },
} satisfies Meta<typeof Games>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // One link per game, each to its route, in the same tab.
    const links = canvas.getAllByRole("link");
    await expect(links).toHaveLength(2);
    await expect(canvas.getByRole("link", { name: "Play Sudoku" })).toHaveAttribute("href", "/sudoku");
    await expect(canvas.getByRole("link", { name: "Play Solitaire" })).toHaveAttribute("href", "/solitaire");
    for (const link of links) await expect(link).not.toHaveAttribute("target");

    // Each screenshot is described, not hidden.
    for (const img of canvas.getAllByRole("img")) await expect(img).toHaveAccessibleName();
  },
};

export const Dark: Story = { globals: { colorScheme: "dark" } };
