import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { HomePage } from "@/components/site/home-page";

/**
 * The whole page: the same `HomePage` that `app/page.tsx` renders, so the two
 * cannot drift (design rule 10).
 */
const meta = {
  title: "Pages/Home",
  component: HomePage,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof HomePage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
