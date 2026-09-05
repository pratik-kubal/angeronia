# Decision log — angeronia.com design system

Every architectural decision behind the SLDS 2 redesign, plus every deviation
from [`docs/plans/slds2-redesign-plan.md`](../plans/slds2-redesign-plan.md)
made during implementation.

**Rule:** record a deviation here *before* acting on it. Entries are append-only;
supersede rather than rewrite.

---

## 1. Plan decisions D1–D11 (settled 2026-09-04, plan §0)

| # | Decision | Rationale |
|---|----------|-----------|
| **D1** | Consume **`@salesforce-ux/design-system-2`** from npm (v2.264.1, "Summer '26") — not the archived GitHub repo, not SLDS 1 (`@salesforce-ux/design-system`). | `salesforce-ux/design-system` on GitHub is archived / read-only (last push 2026-06-02) and is the SLDS 1 Sass source. SLDS 2 ships only as an npm dist; its monorepo is private. |
| **D2** | Theme = **Cosmos + an Angeronia theme layer** (`app/theme.angeronia.css`) that swaps the brand reference palette to **Carbon Teal** (Teal 60 light / Teal 40 dark) and re-tints the semantic hooks Cosmos hard-codes in blue. Light + dark + system via `color-scheme`. | SLDS 2 reserves value assignment for the theme layer ("value assignment is reserved for theming tools"), so a theme file is the sanctioned place to re-brand. Luminance-matched mapping preserves every Cosmos contrast pairing (plan §2.8). |
| **D3** | Framework stays **Next.js App Router + React 19 + TypeScript**; SLDS 2 CSS is consumed as plain CSS with SLDS class names (component blueprints), wrapped in thin React components. | SLDS 2's Lightning Base Components are LWC-only. Blueprints are explicitly published for "environments where Salesforce's Lightning Component framework isn't available". |
| **D4** | **Storybook 10.x with `@storybook/nextjs-vite`** is the design source of truth. Every UI component ships stories; pages are composed only from storied components. | Requested; matches how Salesforce ships SLDS 2 and how the sister product Code Socratic works. |
| **D5** | **Remove** everything not expressible in SLDS 2: the rough.js Möbius canvas, scroll-scrubbed continuity line / process rail / meter graph, scroll spine, enter-reveals, the Noir theme and grain, the citron UI palette, hard "block" shadows, 0–2 px radii, the Google display fonts, Tailwind and `tw-animate-css`. | Plan §4 maps each removal to the guideline it violates. |
| **D6** | The Angeronia **logo mark** (disc + cursor) is kept as a brand SVG and **re-tinted to teal**: disc `--slds-g-color-accent-container-1`, cursor `--slds-g-color-on-accent-1`. `app/icon.svg` is re-mapped onto the Carbon teal ramp at equal OKLab lightness; the raster logos in `public/` are regenerated. Citron leaves the repo entirely. | Matches Code Socratic's teal favicon — one accent across the family. |
| **D7** | Global (`--slds-g-*`), shared (`--slds-s-*`) and reference (`--slds-r-*`) hooks are **referenced in components, never reassigned**. The only file allowed to assign them is `app/theme.angeronia.css`. | Hard rule from the Global Styling Hooks and Develop guidelines; the theme file is the one sanctioned exception. |
| **D8** | Styles live in `.css` files — never inline `style={}`, never Tailwind — so **`@salesforce-ux/slds-linter`** can lint them in CI. | The linter is ESLint-based and reads `.css` / `.html` / `.js`, not TSX. |
| **D9** | Install the Salesforce **AI development skills** (`forcedotcom/sf-skills`: `design-systems-slds-apply`, `design-systems-slds-validate`, `design-systems-slds2-migrate`, Apache-2.0) for every future agent session. | Official and Claude-Code-compatible; ships search scripts so agents verify hooks / blueprints / utilities exist before using them. |
| **D10** | **No Salesforce icons, illustrations, product assets or trademarks.** `@salesforce-ux/icons` (CC-BY-ND) is not installed; SLDS illustrations, Global Header / Navigation chrome, Brand Band, Dynamic (Einstein) Icons, App Launcher, Welcome Mat, Trial Bar and Setup Assistant are out of scope; no attribution line and no "Salesforce" wording in the UI. Icons come from **`@carbon/icons-react`** (Apache-2.0). | Keeps both Angeronia properties on one icon language and one accent hue. `slds-*` class names are CSS identifiers, not trademark use; the SLDS 2 Terms of Use require no attribution. |
| **D11** | **Typeface = IBM Plex Sans (300/400/600/700) + IBM Plex Mono (400)**, self-hosted through `next/font/google` and assigned to `--slds-g-font-family-base` / `--slds-g-font-family-monospace` in theme block C. | Brand-family consistency with Code Socratic; real 300/600 cuts on every OS; one mono family for code, tags and numerals. ≈171 KB latin woff2, with a size-adjusted fallback so CLS stays 0. SLDS 2 guidance prefers system fonts, but font family is a theme-layer value — this is sanctioned theming, not a violation. |

## 2. Plan open questions O1–O12 (plan §10)

| # | Question | Outcome |
|---|----------|---------|
| O1 | Accent colour | **Carbon Teal via the Angeronia theme layer** (D2, plan §2.8). |
| O2 | Tailwind | **Removed entirely**; SLDS utilities replace it. |
| O3 | Hero illustration | **None** in Phase 3. A static flat teal Möbius SVG (hooks only, one per page) may be added later as its own storied `Illustration` component — separate ADR. |
| O4 | Scheme persistence | **Keep `next-themes`** (plan §2.3). |
| O5 | Next.js version | **Stay on 15.5.x** for the migration; upgrade to 16 in a separate PR after Phase 5. |
| O6 | Storybook hosting | **Separate Vercel project** (e.g. `design.angeronia.com`). |
| O7 | Licensing | **Open — the user's call before Phase 1 ships to production.** SLDS 2 CSS and tokens are under the Salesforce Terms of Use (non-OSI, with an indemnification clause); Carbon icons are Apache-2.0 and IBM Plex is OFL 1.1. Nothing else in the plan blocks on this. |
| O8 | Density toggle | **Spike in Phase 2**; expose only if SLDS 2 offers a supported switch, else document "comfy only". |
| O9 | Proof numbers | **Static** Progress Bar values, no counting animation. |
| O10 | Logo mark colour | **Re-tinted to teal** (D6). |
| O11 | Typeface | **IBM Plex Sans 300/400/600/700 + IBM Plex Mono 400** (D11). |
| O12 | Icon set | **Carbon** (`@carbon/icons-react`, D10). |

---

## 3. Implementation decisions

Recorded as the phases land. Each entry states what the plan said, what was
done instead, and why.

### ADR-001 — Skills installed by direct copy, not `npx skills add` (Phase 0)

**Plan:** §8 Phase 0.4 — `npx skills add forcedotcom/sf-skills`.

**Done:** the `skills` CLI blocked on an interactive prompt in a
non-interactive shell and began copying the *entire* 40-skill catalogue.
`forcedotcom/sf-skills` was cloned instead and only the three
`design-systems-*` skills were copied into `.claude/skills/`, alongside the
upstream `LICENSE.txt` as `SF-SKILLS-LICENSE.txt`.

**Why:** the plan's intent is those three skills, not the Agentforce /
Commerce / Data360 catalogue, which would add ~40 MB of unrelated context to
every session. Re-sync with:

```bash
git clone --depth 1 https://github.com/forcedotcom/sf-skills.git /tmp/sf-skills
cp -R /tmp/sf-skills/skills/design-systems-slds{-apply,-validate,2-migrate} .claude/skills/
```

### ADR-002 — Verified package versions (Phase 0/1)

The plan's §1.1 table was written against npm on 2026-09-04. Installed and
verified on the same day:

| Package | Plan | Installed |
|---|---|---|
| `@salesforce-ux/design-system-2` | 2.264.1 | 2.264.1 |
| `@salesforce-ux/design-tokens` | 4.1.0 | 4.1.0 |
| `@salesforce-ux/slds-linter` | 1.2.1 | 1.2.1 |
| `@carbon/icons-react` | 11.87.0 | 11.87.0 |
| `@carbon/colors` | 11.57.0 | 11.57.0 |

`@salesforce-ux/design-system-2` exact-pinned (no `^`) so a patch bump cannot
silently move a blue literal out from under theme block B — see plan §11.

### ADR-003 — Phase 4's deletion was pulled forward into Phase 1

**Plan:** §8 Phase 4 removes `components/angeronia/`, `lib/angeronia/`,
`components/theme-provider.tsx` and `lib/utils.ts` after the new page lands.

**Done:** they were deleted in Phase 1, at the same commit that removed
Tailwind, `tailwind-merge`, `roughjs` and `animejs`.

**Why:** every one of those files imports a dependency Phase 1.2 removes, so
the moment the dependency list changed they stopped compiling — and Phase 1's
own acceptance criterion is a green *strict* build (`tsc --noEmit` covers the
whole project, not just what the page imports). Keeping them would have meant
carrying `typescript.ignoreBuildErrors` two phases longer than the plan wants.
`brand-mark.tsx` and `theme-provider.tsx` moved to `components/site/` as the
plan intends; the rest is preserved at the `pre-slds2` tag.

### ADR-004 — The vendor CSS is assembled, not imported directly

**Plan:** §2.2 Option A — `app/slds.css` imports
`@salesforce-ux/design-system-2/dist/css/bundled/slds2.cosmos.css` directly,
with the modular build as a Phase 1.7 spike.

**Done:** `scripts/build-vendor-css.mjs` assembles `vendor/slds2.css` (git-
ignored, regenerated by `predev` / `prebuild` / `pretypecheck`), and
`app/slds.css` imports that.

**Why:** the published dist references eight Salesforce image assets it does
not ship — `../../public/profile_avatar_{96,160,200}.png`, the matching
`group_avatar_*`, `einstein-figure.svg`, `einstein-header-background.svg` and
`bg-info@2x.png`. Bundlers resolve `url()` statically, so importing the vendor
CSS unchanged fails the build outright:

```
Module not found: Can't resolve '../../public/profile_avatar_96.png'
Import trace: ./app/slds.css
```

All eight are Salesforce artwork — default avatars, the Einstein figure and
header, the Welcome Mat ground — which D10 already puts out of scope, so the
script replaces each with `none`. It asserts the exact removal list, so a
design-system bump that adds a ninth reference fails the build rather than
smuggling artwork into the bundle. The vendor files on disk are never edited.

**Bundled vs modular (the Phase 1.7 spike), measured 2026-09-04 with
`node scripts/build-vendor-css.mjs --measure`:**

| Build | Raw | Gzip |
|---|---:|---:|
| Bundled (`slds2.cosmos.css`) | 973 KB | 108 KB |
| Modular (theme + reset + 24 utilities + 12 components) | 285 KB | 37 KB |

Both are inside the ≤ 150 KB budget. **Bundled ships for now**: it is correct
by construction, whereas the modular assembly reproduces the bundle's layer
assignment by hand and would need per-component computed-style verification to
trust. The manifest is written and measured, so Phase 5.1 is a flag change
(`--mode=modular`) plus that verification, not a rewrite.

### ADR-005 — Progress-bar length travels as a custom property

**Plan:** design rule 12 — "Styles in `.css` files only — no inline `style`, no
CSS-in-JS."

**Done:** `ProgressBar` sets `--site-progress-bar-value` through the `style`
attribute; `app/site.css` contains the only rule that reads it:

```css
.site-progress-bar__value {
  inline-size: var(--site-progress-bar-value, 0%);
}
```

**Why:** a bar's fill length is a datum from `data/angeronia.ts`, not a design
decision, and it cannot be expressed as a class without enumerating a
percentage scale in CSS — which the linter rejects as hard-coded values
anyway. The SLDS blueprint itself writes `style="width: 45%"`. This keeps every
*design* value (fill, radius, transition, height) in CSS where `slds-linter`
can see it, and confines the inline attribute to a single number.

Rule 12 in `DESIGN-RULES.md` states this carve-out explicitly: the `style`
attribute may carry a `--site-*` custom property whose value is data, and
nothing else.

### ADR-006 — `slds-linter` is run at `error` with one scoped exemption

**Plan:** §2.7 — "`slds-linter` clean. Zero violations to merge."

**Done:** `eslint.slds.config.mjs` promotes every rule the linter emits from
`warn` to `error`, then turns three of them off for `app/theme.angeronia.css`
alone: `no-slds-namespace-for-custom-hooks`, `no-hardcoded-values-slds2` and
`no-slds-var-without-fallback`.

**Why:** "zero violations" is only meaningful if violations fail the run, and
the linter's own emitted config marks most rules `warn`. The three exempted
rules all exist to stop *application* code assigning design-system hooks —
which is exactly what a theme layer does, and what D7 designates that one file
to do. `npm run check:theme` enforces a far stricter contract in its place:
every assigned hook must already exist in Cosmos, block A must match its
generator byte for byte, block B may not contain a hex, and every resulting
pairing must clear WCAG AA in both schemes.

### ADR-007 — Path renders neutral when no stage is current

**Plan:** §4 and §7 — "Path (static, all complete/current) + 4-col Tile grid".

**Done:** `Path` takes `current` as optional. The Process section omits it, so
every stage renders `slds-is-incomplete`.

**Why:** the plan's suggestion does not survive contact with the CSS. SLDS's
Path flips a completed stage's *name* out of view and rotates a checkmark in
its place —

```css
.slds-is-complete .slds-path__stage { transform: translate(-50%, -50%) rotateX(0deg); }
```

— which is right for a sales path where only the current stage matters, and
wrong for four moves whose names are the content: three of the four labels
disappear. Completed stages are also painted
`--slds-g-color-success-container-1`, and design rule 4 reserves the feedback
families for feedback.

Rendering the four stages neutral keeps every name visible, keeps the success
green out of a non-feedback context, and still says what the section says:
four stages on one track. `current` stays available for a genuine progress
state, and the `AtEachStage` story exercises it.

### ADR-008 — The modular vendor build ships, verified by computed style

**Supersedes the "bundled ships for now" note in ADR-004.**

`scripts/compare-vendor-css.mjs` loads the running page under each build and
compares the resolved value of 25 CSS properties across 28 elements in both
colour schemes — **1400 computed values, all identical**. That is the only
thing that could have differed: the modular build reproduces the bundle's
cascade-layer assignment by hand, which a diff of the CSS cannot check.

With parity demonstrated, modular ships: **38 KB gzip against the bundle's
108 KB**, a 65 % reduction on the largest asset the page loads. Measured after
the switch, the page's total CSS is ~32 KB gzip.

The one failure mode modular has and bundled does not is a wrapper whose
stylesheet is missing from the manifest — the symptom would be an unstyled
component rather than an error. `assertManifestCoversWrappers` in
`build-vendor-css.mjs` fails the build if `components/slds/` grows a folder
with no entry in `WRAPPER_TO_DIST`, so adding a component forces the manifest
question to be answered.

Re-run the comparison after any `@salesforce-ux/design-system-2` bump:

```bash
npm run dev            # in one terminal
npm run check:vendor-css
```

### ADR-009 — The page's real contrast pairings are audited by axe, not by check:theme

**Plan:** §8 Phase 5.3 — "Contrast audit of every pairing actually used
(extends `check:theme` with the page's real combinations)".

**Done:** `npm run test:storybook` runs axe over every story — including
`Pages/Home` in both colour schemes — with `a11y: { test: "error" }`, so a
contrast violation fails the run.

**Why:** axe measures the *rendered* pairing, including inherited colour,
opacity and overlapping backgrounds. A second implementation inside
`check:theme` would have to re-derive all of that from the DOM and would be
strictly weaker at it. `check:theme` keeps the job it is uniquely good at —
the theme's own hook-to-hook pairings, checked without a browser, on every
commit — and the page's real combinations are checked where they actually
exist.

### ADR-010 — Lighthouse findings fixed rather than waived

Two real defects surfaced only in the audit:

* **Label in Name (WCAG 2.5.3).** The header's brand link carried
  `aria-label="Angeronia Labs — home"` over a lockup that renders "Angeronia
  Labs / Philadelphia" as text, so its accessible name did not contain its
  visible name. The label is gone; the visible words are the name.
* **No `robots.txt` or sitemap.** Added `app/robots.ts` and `app/sitemap.ts`,
  both built from `SITE_URL` in `data/angeronia.ts`.

Mobile scores after the fixes, against the production build: **performance 98,
accessibility 100, best practices 100, SEO 100, CLS 0**, LCP 2.3 s, TBT 10 ms.
