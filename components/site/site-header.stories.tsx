import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SiteHeader } from "./site-header";
import styles from "./site-header.module.css";

const meta = {
  title: "Sections/SiteHeader",
  component: SiteHeader,
  parameters: { layout: "fullscreen" },
  render: (args) => (
    <div className={styles.storyBlock}>
      <SiteHeader {...args} />
    </div>
  ),
} satisfies Meta<typeof SiteHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Transparent at the top of the page, over the photograph; the button waits for the scroll. */
export const Overlay: Story = {
  args: { variant: "overlay" },
};

/** The legal pages: always on the ground, with the button showing. */
export const Solid: Story = {
  args: { variant: "solid" },
};

export const Phone: Story = {
  args: { variant: "solid" },
  parameters: {
    viewport: {
      options: { phone: { name: "Phone", styles: { width: "390px", height: "844px" } } },
    },
  },
  globals: { viewport: { value: "phone", isRotated: false } },
};
