import * as React from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, waitFor } from "storybook/test";
import typeStyles from "@/styles/type.module.css";
import styles from "./tokens.module.css";

/**
 * The tokens in styles/tokens.css, as they render: the band roles and their
 * pairs on both bands, the button, the five type steps, the space scale and the
 * spine's geometry (DESIGN-RULES.md §4–§7). Every value shown is read from the
 * page, not typed here, so the board cannot drift from the file.
 */

// ── Contrast, measured from the rendered colours ────────────────────────────
const channel = (c: number) => {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};
const luminance = (rgb: string) => {
  const [r, g, b] = (rgb.match(/\d+(\.\d+)?/g) ?? ["0", "0", "0"]).map(Number);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
};
const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

/** A foreground role on a background role, with its measured ratio. */
function Pair({ fg, bg, kind, children }: { fg: string; bg: string; kind: "text" | "ui"; children: string }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [ratio, setRatio] = React.useState<string>("…");
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const style = getComputedStyle(el);
    setRatio(contrast(style.color, style.backgroundColor).toFixed(2));
  }, []);
  return (
    <div
      ref={ref}
      className={styles.pair}
      // Data, not design: which two roles this swatch shows (DESIGN-RULES.md §1).
      style={{ "--pair-fg": `var(${fg})`, "--pair-bg": `var(${bg})` } as React.CSSProperties}
      data-kind={kind}
    >
      <span className={styles.sample}>{kind === "text" ? "Aa" : <span className={styles.rule} />}</span>
      <code className={styles.code}>
        {fg} on {bg}
      </code>
      <span>{children}</span>
      <span className={styles.ratio} data-ratio={ratio}>
        {ratio}:1 · {kind === "text" ? "4.5" : "3"}:1 needed
      </span>
    </div>
  );
}

function Band({ band, title }: { band: "paper" | "dark"; title: string }) {
  return (
    <section data-band={band} className={styles.band} aria-label={title}>
      <h3 className={styles.bandTitle}>{title}</h3>
      <div className={styles.pairs}>
        <Pair fg="--band-ink" bg="--band-ground" kind="text">
          Running text and statements
        </Pair>
        <Pair fg="--band-soft" bg="--band-ground" kind="text">
          Secondary text, captions, credits
        </Pair>
        <Pair fg="--band-ground" bg="--band-ink" kind="text">
          Selection; the skip link
        </Pair>
        <Pair fg="--band-spine" bg="--band-ground" kind="ui">
          The spine line
        </Pair>
        <Pair fg="--band-focus" bg="--band-ground" kind="ui">
          The focus ring
        </Pair>
        <Pair fg="--button-ink" bg="--button" kind="text">
          The button label
        </Pair>
        <Pair fg="--button-ink" bg="--button-hover" kind="text">
          The button label, on hover
        </Pair>
      </div>
      <div className={styles.frame}>
        <code className={styles.code}>--band-frame</code> behind a photograph
      </div>
    </section>
  );
}

const STEPS = ["display", "head", "lead", "body", "small"] as const;
const SPACE = [
  "--space-1",
  "--space-2",
  "--space-3",
  "--space-4",
  "--space-5",
  "--space-6",
  "--space-7",
  "--space-8",
  "--space-xs",
  "--space-s",
  "--space-m",
  "--space-l",
  "--space-xl",
  "--space-2xl",
  "--space-3xl",
  "--space-4xl",
  "--margin",
  "--section-space",
];

function TokenBoard() {
  return (
    <div className={styles.board}>
      <h1 className={typeStyles.head}>Tokens</h1>
      <p className={styles.intro}>
        From <code className={styles.code}>styles/tokens.css</code>. Components read the band roles
        and the button&rsquo;s tokens, never the palette. Each pair is checked at AA by{" "}
        <code className={styles.code}>npm run check:contrast</code>; the ratios below are measured
        from the page.
      </p>

      <h2 className={styles.title}>Colour, by role and in pairs</h2>
      <div className={styles.bands}>
        <Band band="paper" title="Paper band (data-band=&quot;paper&quot;, and :root)" />
        <Band band="dark" title="Charcoal band (data-band=&quot;dark&quot;)" />
      </div>

      <h2 className={styles.title}>Type: Hanken Grotesk, five steps</h2>
      <ul className={styles.steps}>
        {STEPS.map((step) => (
          <li key={step} className={styles.step}>
            <code className={styles.code}>
              typeStyles.{step} · --step-{step}
            </code>
            <p className={typeStyles[step]}>One engineer, screen to server</p>
          </li>
        ))}
        <li className={styles.step}>
          <code className={styles.code}>--font-code · IBM Plex Mono, code only</code>
          <pre className={styles.mono}>def solve(heights):</pre>
        </li>
      </ul>

      <h2 className={styles.title}>Space</h2>
      <ul className={styles.space}>
        {SPACE.map((token) => (
          <li key={token} className={styles.spaceRow}>
            <code className={styles.code}>{token}</code>
            <span
              className={styles.spaceBar}
              // Data: which token this bar measures.
              style={{ "--bar": `var(${token})` } as React.CSSProperties}
            />
          </li>
        ))}
      </ul>

      <h2 className={styles.title}>The spine</h2>
      <p className={styles.intro}>
        A <code className={styles.code}>--spine-width</code> line in{" "}
        <code className={styles.code}>--band-spine</code> at{" "}
        <code className={styles.code}>--axis</code> (38% of the width; 22% under 900px). A
        statement crosses it, hangs from it or is pushed past it.
      </p>
      <div className={styles.spine} role="group" aria-label="The spine's three positions">
        <p className={styles.crossing}>
          <span className={styles.left}>crossing:</span> <span className={styles.right}>split at the axis</span>
        </p>
        <p className={styles.hanging}>hanging: starts at --hang</p>
        <p className={styles.pushed}>pushed: --push past the axis</p>
      </div>
    </div>
  );
}

const meta = {
  title: "Foundations/Tokens",
  component: TokenBoard,
  parameters: {
    // The board shows both bands itself.
    band: false,
  },
} satisfies Meta<typeof TokenBoard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    // Every pair on the board measures at or above its bar.
    const ratios = [...canvasElement.querySelectorAll<HTMLElement>("[data-ratio]")];
    await expect(ratios.length).toBe(14);
    await waitFor(() => expect(ratios.every((el) => el.dataset.ratio !== "…")).toBe(true));
    for (const el of ratios) {
      const kind = el.closest("[data-kind]")?.getAttribute("data-kind");
      await expect(Number(el.dataset.ratio)).toBeGreaterThanOrEqual(kind === "text" ? 4.5 : 3);
    }
  },
};

export const Phone: Story = {
  globals: { viewport: { value: "phone", isRotated: false } },
};
