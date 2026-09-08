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
          "and `CodeBlock`, all fed by `@repo/shared` — bringing those across " +
          "would mean rebuilding three product components to render one " +
          "marketing panel. The side tabs are likewise hand-rolled rather than " +
          "Carbon `Tabs`, because what is wanted is the *product's* " +
          "contained-tab look inside a replica frame; the keyboard contract is " +
          "the standard tablist one.\n\n" +
          "The syntax palette is now the product's own: both properties run on " +
          "Carbon, so the four token classes take the same `@carbon/colors` " +
          "stops the real editor paints with, declared per theme in " +
          "`styles/_themes.scss` (ADR-015).\n\n" +
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
