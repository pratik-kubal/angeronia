import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { close, hero, nav } from "@/data/angeronia";
import { ButtonLink } from "./button-link";
import styles from "./button-link.stories.module.css";

const meta = {
  title: "Components/ButtonLink",
  component: ButtonLink,
  parameters: {
    docs: {
      description: {
        component:
          "The page's one button shape: a link, square, flat fill. `accent` (gold) on the dark " +
          "page; `ink` on the white closing section. `size=\"sm\"` is the header's 44px button.",
      },
    },
  },
  args: { href: hero.primaryCta.href, children: hero.primaryCta.label },
} satisfies Meta<typeof ButtonLink>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Ink: Story = {
  args: { variant: "ink", href: close.primaryCta.href, children: close.primaryCta.label },
  render: (args) => (
    <div className={styles.storyInverse}>
      <ButtonLink {...args} />
    </div>
  ),
};

export const Small: Story = {
  args: { size: "sm", href: nav.cta.href, children: nav.cta.label },
};
