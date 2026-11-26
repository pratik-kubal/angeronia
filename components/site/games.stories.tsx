import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import { games, gamesSection, statementText, type Game } from "@/data/angeronia";
import { Games } from "./games";

const meta = {
  title: "Sections/Games",
  component: Games,
  parameters: {
    band: false,
    docs: {
      description: {
        component:
          "The games launcher on the home page (ADR-020), on the spine: a crossing heading, one line " +
          "hanging from the axis, and one tile per game in a grid that starts at the hang and wraps. " +
          "Each tile is the game's own Add to Home Screen icon (`alt=\"\"`), its name as the tile's one " +
          "link, stretched over it, and its line.",
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
    await expect(canvas.getByRole("heading", { level: 2 })).toHaveTextContent(statementText(gamesSection.lines));

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
    const icons = [...canvasElement.querySelectorAll("img")];
    await expect(icons.map((img) => img.getAttribute("src"))).toEqual(games.map((g) => g.icon));
  },
};

/**
 * A fixture, not a roadmap: the real games repeated to twelve tiles, to show
 * the grid wrapping the way it will once there are many games.
 */
const many: Game[] = Array.from({ length: 12 }, (_, i) => {
  const game = games[i % games.length];
  return { ...game, name: `${game.name} ${i + 1}`, href: `${game.href}?tile=${i + 1}` };
});

export const ManyGames: Story = {
  args: { games: many },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getAllByRole("link")).toHaveLength(12);
  },
};

export const Phone: Story = {
  globals: { viewport: { value: "phone", isRotated: false } },
};
