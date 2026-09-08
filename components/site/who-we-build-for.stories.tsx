import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { WhoWeBuildFor } from "./who-we-build-for";

const meta = {
  title: "Sections/WhoWeBuildFor",
  component: WhoWeBuildFor,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "The studio's engagements — who it is building for, and the terms it " +
          "will start on — as two halves of one section. The page opens on " +
          "this because it is the question a visitor arrives with.\n\n" +
          "The three cards sit on one two-up grid, so the low-bono offer is a " +
          "peer of the client cards rather than an aside — a bordered client " +
          "card beside unbordered prose would read as one real thing next to a " +
          "footnote, and the offer is not a footnote.\n\n" +
          "The client card says what the organisation is before what the " +
          "studio does for them, and carries its status as a `Tag` — \"In " +
          "progress\" is a fact a reader scans for, and holding it explicitly " +
          "stops the section ageing into a claim about finished work.",
      },
    },
  },
} satisfies Meta<typeof WhoWeBuildFor>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Dark: Story = { globals: { colorScheme: "dark" } };
