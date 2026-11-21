import type * as React from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import styles from "./tokens.module.css";

interface Group {
  /** What the group is: where these colours are used. */
  caption: string;
  tokens: readonly string[];
}

/**
 * Every colour token in styles/tokens.css, grouped by the ground it is used
 * on. Each group sits on a strip it contrasts with, so every swatch can be
 * seen without a border: the dark strip is the page's own `--bg`, the light
 * one the closing section's `--inv-bg`. A ground is shown on the other strip.
 */
const STRIPS: readonly { light: boolean; groups: readonly Group[] }[] = [
  {
    light: false,
    groups: [
      {
        caption: "Used on the dark grounds, --bg and --surface",
        tokens: ["--ink", "--muted", "--accent", "--accent-strong"],
      },
      {
        caption: "The closing section’s ground, and the ink button’s label",
        tokens: ["--inv-bg"],
      },
    ],
  },
  {
    light: true,
    groups: [
      {
        caption: "Used on the closing section, and on the gold",
        tokens: ["--inv-ink", "--inv-muted", "--accent-ink"],
      },
      {
        caption: "The dark grounds: the page, the tone step, and behind the photograph",
        tokens: ["--bg", "--surface", "--photo-ground"],
      },
    ],
  },
];

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
      {STRIPS.map((strip) => (
        <div
          key={strip.groups[0].caption}
          className={strip.light ? `${styles.strip} ${styles.light}` : styles.strip}
        >
          {strip.groups.map((group) => (
            <div key={group.caption}>
              <p className={styles.caption}>{group.caption}</p>
              <ul className={styles.swatches}>
                {group.tokens.map((name) => (
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
            </div>
          ))}
        </div>
      ))}
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
