import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { CodeSocraticDemo } from "./code-socratic-demo";

const meta = {
  title: "Sections/CodeSocraticDemo",
  component: CodeSocraticDemo,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "The Code Socratic session workspace with the problem solved — the " +
          "same session as the preview on the product's own landing page: bar, " +
          "editor and gutter, four side tabs, the tutor's phase rail and " +
          "exchange, the run actions and the composer (ADR-014).\n\n" +
          "The content is carried over; the implementation is not. Over there " +
          "the preview reuses Code Socratic's real `SidePane`, `ResultsPanel` " +
          "and `CodeBlock`, which are Carbon — and Carbon cannot enter an SLDS " +
          "2 site (design rule 1). The side tabs are hand-rolled rather than " +
          "the `Tabs` wrapper, because what is wanted is the *product's* " +
          "contained-tab look inside a replica frame; the keyboard contract is " +
          "the wrapper's, copied verbatim.\n\n" +
          "The syntax palette is the one thing that could not be literal. The " +
          "product uses Carbon's blue, purple, teal and grey; rule 3 allows no " +
          "hex here, so each token class takes the SLDS palette hook playing " +
          "the same role — and because those are `light-dark()` pairs, the " +
          "dark scheme inverts them without a second set.\n\n" +
          "Nothing acts. Both actions and the send control are really " +
          "`disabled`, the composer is a `<span>` rather than a dead field, and " +
          "the footnote says so rather than leaving a visitor to find out.",
      },
    },
  },
} satisfies Meta<typeof CodeSocraticDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Dark: Story = { globals: { colorScheme: "dark" } };
