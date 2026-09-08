import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Board, Pairing, Swatch } from "./Swatch";
import { CARBON_BLUE, CARBON_TEAL, TEAL_STEPS, contrast, token } from "./tokens";

/**
 * What the Angeronia brand override changes about Carbon — measured against the
 * live page rather than a copy of the theme.
 */
function BrandBoard() {
  return (
    <div>
      <Board title="The swap — Carbon Teal for Carbon Blue">
        <p className="sb-note site-measure">
          Carbon ships Blue 60 as its interactive colour. Angeronia&rsquo;s accent is Teal, which is
          in Carbon&rsquo;s own palette — Teal 60/40 are luminance twins of Blue 60/40, so the family
          drops into the slots Carbon designed around blue and every contrast pairing survives.
        </p>
        <div className="sb-ramp">
          <span className="sb-quiet">Step</span>
          <span className="sb-quiet">Teal (Angeronia)</span>
          <span className="sb-quiet">Blue (Carbon)</span>
          {TEAL_STEPS.map((step) => (
            <RampRow key={step} step={step} />
          ))}
        </div>
      </Board>

      <Board title="Where the teal actually lands">
        <div className="sb-grid">
          <Pairing on="--cds-text-on-color" container="--cds-button-primary" />
          <Pairing on="--cds-link-primary" container="--cds-background" />
          <Pairing on="--cds-link-primary" container="--cds-layer-01" />
          <Pairing on="--cds-link-primary" container="--cds-layer-02" />
        </div>
      </Board>

      <Board title="Kept apart from status">
        <p className="sb-note site-measure">
          Teal sits near Carbon&rsquo;s success green on the wheel, so they are deliberately never
          adjacent in the UI. <code className="sb-mono">support-success</code> means a status and
          nothing else; the brand never borrows it (design rule 4).
        </p>
        <div className="sb-grid">
          <Swatch name="--cds-background-brand" label="background-brand (Teal 60)" />
          <Swatch name="--cds-support-success" label="support-success" />
          <Swatch name="--cds-support-warning" label="support-warning" />
          <Swatch name="--cds-support-error" label="support-error" />
          <Swatch name="--cds-support-info" label="support-info" />
        </div>
      </Board>

      <Board title="Contrast, live">
        <p className="sb-note site-measure">
          The same pairings <code className="sb-mono">npm run check:theme</code> asserts in CI,
          computed here from the rendered page in whichever scheme is selected.{" "}
          <code className="sb-mono">docs/design-system/theme-report.md</code> is the committed copy.
        </p>
        <ContrastMatrix />
      </Board>
    </div>
  );
}

function RampRow({ step }: { step: number }) {
  return (
    <>
      <code className="sb-mono">{step}</code>
      <span className="sb-ramp__bar" style={{ background: CARBON_TEAL[step] }}>
        <span className="cds--visually-hidden">{`Carbon Teal ${step}: ${CARBON_TEAL[step]}`}</span>
      </span>
      <span className="sb-ramp__bar" style={{ background: CARBON_BLUE[step] }}>
        <span className="cds--visually-hidden">{`Carbon Blue ${step}: ${CARBON_BLUE[step]}`}</span>
      </span>
    </>
  );
}

const GROUNDS = ["background", "layer-01", "layer-02"];

/**
 * Every pairing the brand override creates. 4.5:1 for anything that renders as
 * text, 3:1 for a non-text boundary — WCAG 1.4.3 and 1.4.11.
 */
const PAIRS: { fg: string; bg: string; min: number }[] = [
  ...["link-primary", "link-primary-hover", "link-secondary"].flatMap((fg) =>
    GROUNDS.map((bg) => ({ fg, bg, min: 4.5 })),
  ),
  ...["button-primary", "button-primary-hover", "button-primary-active", "background-brand"].map(
    (bg) => ({ fg: "text-on-color", bg, min: 4.5 }),
  ),
  ...["focus", "border-interactive", "icon-interactive"].flatMap((fg) =>
    GROUNDS.map((bg) => ({ fg, bg, min: 3 })),
  ),
];

function ContrastMatrix() {
  return (
    <div className="sb-scroll">
      <table className="sb-table">
        <caption className="cds--visually-hidden">
          Contrast ratios for every pairing the brand override creates, in the current scheme
        </caption>
        <thead>
          <tr>
            <th scope="col">Foreground</th>
            <th scope="col">Background</th>
            <th scope="col">Ratio</th>
            <th scope="col">Minimum</th>
            <th scope="col">Result</th>
          </tr>
        </thead>
        <tbody>
          {PAIRS.map(({ fg, bg, min }) => {
            const ratio = contrast(token(`--cds-${fg}`), token(`--cds-${bg}`));
            return (
              <tr key={`${fg}-${bg}`}>
                <td>
                  <code className="sb-mono">{fg}</code>
                </td>
                <td>
                  <code className="sb-mono">{bg}</code>
                </td>
                <td>{ratio.toFixed(2)}:1</td>
                <td>{min}:1</td>
                <td>{ratio >= min ? "Pass" : "FAIL"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

const meta = {
  title: "Foundations/Brand",
  component: BrandBoard,
  parameters: {
    docs: {
      description: {
        component:
          "What the Angeronia brand override changed about Carbon, measured " +
          "against the live page rather than a copy of the theme.",
      },
    },
  },
} satisfies Meta<typeof BrandBoard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Light: Story = {};

export const Dark: Story = { globals: { colorScheme: "dark" } };
