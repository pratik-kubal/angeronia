import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import { games, type Game } from "@/data/angeronia";
import { Games } from "./games";

const meta = {
  title: "Sections/Games",
  component: Games,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "The games launcher on the home page (ADR-020): one tile per game, " +
          "each the game's own Add to Home Screen icon, its name and one line, " +
          "in a grid that wraps to fit however many games there are.\n\n" +
          "A list of links, one per game. The name is the link, stretched over " +
          "the tile, so the icon opens the game too without becoming a second " +
          "tab stop.",
      },
    },
  },
  args: { games },
} satisfies Meta<typeof Games>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // One list item and one link per game, each to its route, in the same tab.
    await expect(canvas.getAllByRole("listitem")).toHaveLength(games.length);
    await expect(canvas.getAllByRole("link")).toHaveLength(games.length);
    for (const game of games) {
      const link = canvas.getByRole("link", { name: game.name });
      await expect(link).toHaveAttribute("href", game.href);
      await expect(link).not.toHaveAttribute("target");
    }

    // The icons repeat the names beside them, so they stay out of the tree.
    await expect(canvas.queryAllByRole("img")).toHaveLength(0);
  },
};

export const Dark: Story = { globals: { colorScheme: "dark" } };

/**
 * A fixture, not a roadmap: the two real games repeated to twelve tiles, to
 * show the grid wrapping the way it will once there are many games.
 */
const many: Game[] = Array.from({ length: 12 }, (_, i) => {
  const game = games[i % games.length];
  return { ...game, name: `${game.name} ${i + 1}`, href: `${game.href}?tile=${i + 1}` };
});

export const ManyGames: Story = {
  args: { games: many },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByRole("listitem")).toHaveLength(many.length);
  },
};

export const ManyGamesDark: Story = { args: { games: many }, globals: { colorScheme: "dark" } };
