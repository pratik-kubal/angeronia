import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import { Column } from "@carbon/react";
import { Grid } from "./grid";

const meta = {
  title: "Components/Grid",
  component: Grid,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Carbon's 2x grid, in CSS Grid mode — 4 columns at `sm`, 8 at `md`, " +
          "16 at `lg` and above.\n\n" +
          "This exists because `@carbon/react`'s own `Grid` dispatches on the " +
          "`enable-css-grid` feature flag and renders the legacy **flexbox** " +
          "grid when it is off, which it is by default in v11. That path needs " +
          "a `<Row>` layer this site has no use for, and `_config.scss` sets " +
          "`$use-flexbox-grid: false`, so its stylesheet is not even emitted. " +
          "The flag has no non-deprecated way to turn on: `FeatureFlags` grew " +
          "a boolean prop for every other flag and not this one.\n\n" +
          "So this renders what Carbon's own `CSSGrid` renders, from the " +
          "exports Carbon publishes — `GridSettings` in `css-grid` mode, which " +
          "is the only thing `Column` reads to pick its classes. In v12, where " +
          "CSS grid is the default, the file collapses back to `Grid` from " +
          "`@carbon/react`. See DECISIONS.md ADR-016.\n\n" +
          "Card rows are **not** built from `Column`s — sixteen does not divide " +
          "by three. See `site-cards` in `styles/_site.scss`.",
      },
    },
  },
} satisfies Meta<typeof Grid>;

export default meta;
type Story = StoryObj<typeof meta>;

function Cell({ children }: { children: React.ReactNode }) {
  return <div className="sb-tile">{children}</div>;
}

/** The splits the site actually uses. Narrow the canvas to watch them collapse. */
export const TheSplitsInUse: Story = {
  args: { children: null },
  render: () => (
    <Grid className="site-container">
      <Column sm={4} md={8} lg={16}>
        <Cell>Full width — every section&rsquo;s content sits in one of these.</Cell>
      </Column>
      <Column sm={4} md={5} lg={9}>
        <Cell>The hero copy — 5/8 at md, 9/16 at lg.</Cell>
      </Column>
      <Column sm={4} md={3} lg={7}>
        <Cell>The hero figure — 3/8, then 7/16.</Cell>
      </Column>
      <Column sm={4} md={8} lg={6}>
        <Cell>The footer lockup — 6/16.</Cell>
      </Column>
      <Column sm={2} md={2} lg={3}>
        <Cell>Footer column</Cell>
      </Column>
      <Column sm={2} md={2} lg={3}>
        <Cell>Footer column</Cell>
      </Column>
      <Column sm={2} md={2} lg={3}>
        <Cell>Footer column</Cell>
      </Column>
    </Grid>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const grid = canvasElement.querySelector(".cds--css-grid");

    // The whole point of the wrapper: CSS Grid, not the flexbox fallback.
    await expect(grid).toBeInTheDocument();
    await expect(getComputedStyle(grid as Element).display).toBe("grid");
    // And `Column` has to have picked its css-grid classes from `GridSettings`.
    await expect(canvas.getByText(/Full width/).closest(".cds--css-grid-column")).toBeTruthy();
  },
};

/** Every column of the grid, so the 4 / 8 / 16 model is visible at each width. */
export const AllSixteen: Story = {
  args: { children: null },
  render: () => (
    <Grid className="site-container">
      {Array.from({ length: 16 }, (_, i) => (
        <Column key={i} sm={1} md={1} lg={1}>
          <Cell>{i + 1}</Cell>
        </Column>
      ))}
    </Grid>
  ),
};

export const Dark: Story = {
  args: { children: null },
  render: TheSplitsInUse.render,
  globals: { colorScheme: "dark" },
};
