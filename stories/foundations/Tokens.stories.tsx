import type * as React from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import styles from "./tokens.module.css";

/** Every colour token in styles/tokens.css, in the order the file declares them. */
const COLOURS = [
  "--bg",
  "--surface",
  "--ink",
  "--muted",
  "--accent",
  "--accent-strong",
  "--accent-ink",
  "--photo-ground",
  "--inv-bg",
  "--inv-ink",
  "--inv-muted",
] as const;

/** The type steps, largest first, each in the face that uses it (design.md §2). */
const SIZES = [
  { name: "--step-statement", display: true },
  { name: "--step-head", display: true },
  { name: "--step-lead", display: false },
  { name: "--step-body", display: false },
  { name: "--step-small", display: false },
] as const;

function Tokens() {
  return (
    <div className={styles.board}>
      <ul className={styles.swatches}>
        {COLOURS.map((name) => (
          <li key={name} className={styles.swatch}>
            <span
              className={styles.chip}
              aria-hidden="true"
              style={{ "--swatch": `var(${name})` } as React.CSSProperties}
            />
            <span>{name}</span>
          </li>
        ))}
      </ul>
      <ul className={styles.sizes}>
        {SIZES.map((size) => (
          <li
            key={size.name}
            className={size.display ? `display ${styles.size}` : styles.size}
            style={{ "--size": `var(${size.name})` } as React.CSSProperties}
          >
            {size.name}
          </li>
        ))}
      </ul>
    </div>
  );
}

const meta = {
  title: "Foundations/Tokens",
  parameters: { layout: "fullscreen" },
  render: () => <Tokens />,
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
