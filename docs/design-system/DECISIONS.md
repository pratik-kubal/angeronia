# Decision log — angeronia.com design system

Every architectural decision behind the site's design system, and every
deviation from the plan that produced it.

The log spans two migrations, in order:

* **§1–§4** — the SLDS 2 redesign ([`slds2-redesign-plan.md`](../plans/slds2-redesign-plan.md)),
  landed 2026-09-04. D1–D11, O1–O12 and ADR-001 … ADR-014.
* **ADR-015 … ADR-018** — the move off SLDS 2 onto IBM Carbon
  ([`carbon-migration-plan.md`](../plans/carbon-migration-plan.md)), landed
  2026-09-08.

ADR-019 (2026-10-23) is later: the games that moved here from `../portfolio`
keep their own look, outside the design system. ADR-020 (the same day) links
them from the home page, and ADR-021 moves them under `/games`, behind a
launcher. ADR-022 (2026-10-27) adds a third game, Color Tap, whose pictures are
converted from JPGs at build time.

* **ADR-023 … ADR-030** — the move off Carbon onto **the spine**, the owner's
  chosen draft (2026-11-25): plain CSS, Hanken Grotesk, one colour scheme.
  ADR-031 is the port into React and where it departs from the draft; ADR-032
  the fixes after the port's review.

**Read ADR-023 first if you want the current state.** It says what the studio
site is built on today and which entries are history. In short: ADR-015 …
ADR-018 (Carbon), ADR-012 and ADR-013 (the Möbius and its autoplay waiver), O4
(`next-themes`), D6 (the teal disc-and-cursor mark), D10's Carbon icons and D11's
IBM Plex Sans are **history** — the record of how the site got here, not a
description of what ships. **ADR-019, ADR-020, ADR-021 and ADR-022 still hold**
(the games, their home-page section, `/games` and Color Tap), amended only where
ADR-023 and ADR-029 say so. Everything from §1 to ADR-018 is history.

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
| **D5** | **Remove** everything not expressible in SLDS 2: the rough.js Möbius canvas, scroll-scrubbed continuity line / process rail / meter graph, scroll spine, enter-reveals, the Noir theme and grain, the citron UI palette, hard "block" shadows, 0–2 px radii, the Google display fonts, Tailwind and `tw-animate-css`. | Plan §4 maps each removal to the guideline it violates. **The Möbius clause is reversed by ADR-012**; every other removal stands. |
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
| O3 | Hero illustration | **Settled — superseded by ADR-012.** Was: none in Phase 3, with a static flat teal Möbius SVG possible later. The hero now carries the rough.js Möbius canvas ported from `../portfolio`, re-tinted from hooks, autoplaying under the ADR-013 waiver. |
| O4 | Scheme persistence | **Keep `next-themes`** (plan §2.3). |
| O5 | Next.js version | **Stay on 15.5.x** for the migration; upgrade to 16 in a separate PR after Phase 5. |
| O6 | Storybook hosting | **Separate Vercel project** (e.g. `design.angeronia.com`). |
| O7 | Licensing | **Closed 2026-09-08 by ADR-015 — the Salesforce Terms of Use are not accepted.** `@salesforce-ux/*` is removed and the UI layer is rebuilt on IBM Carbon (Apache-2.0). Was: open, the user's call before Phase 1 ships to production. |
| O8 | Density toggle | **Spike in Phase 2**; expose only if SLDS 2 offers a supported switch, else document "comfy only". |
| O9 | Proof numbers | **Moot — the Proof section was removed** (the figures were the founder's own, not the studio's). Was: static Progress Bar values, no counting animation. |
| O10 | Logo mark colour | **Re-tinted to teal** (D6). |
| O11 | Typeface | **IBM Plex Sans 300/400/600/700 + IBM Plex Mono 400** (D11). |
| O12 | Icon set | **Carbon** (`@carbon/icons-react`, D10). |

---

## 3. Implementation decisions

Recorded as the phases land. Each entry states what the plan said, what was
done instead, and why. ADR-001 … ADR-014 belong to the SLDS 2 redesign;
ADR-015 … ADR-018 to the Carbon migration; ADR-019 … ADR-022 to the games;
ADR-023 onward to the spine.

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

Because the file is generated and git-ignored, **every entry point that reads
it needs a `pre` script**: `predev`, `prebuild`, `pretypecheck`, `prestorybook`,
`prebuild-storybook`, `pretest:storybook` and `precheck:vendor-css`. CI caught
the one that was missing — `test:storybook` — as 50 test files failing to
import their setup on a clean checkout, which is exactly the failure a
developer with a warm `vendor/` never sees.

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

### ADR-011 — The modular manifest lists the library, not the page

Adding the Tier-2 components (Phase 5.5) grew `vendor/slds2.css` from 38 KB to
60 KB gzip, and the page's total CSS from ~32 KB to ~47 KB, because the
manifest is shared by the site and Storybook and now covers components no page
renders yet. Lighthouse mobile performance went 98 → 97.

That is the intended trade. The manifest describes what the *library* offers,
and a component only enters the library once it is storied, a11y-clean and
ready to use — so any page can then use any wrapper without a CSS change or a
second build mode. Splitting it into "what the home page renders" and "what
Storybook renders" would mean Storybook no longer loading the production
`app/slds.css`, which plan §6.1 makes a rule precisely so a story cannot look
right against a stylesheet the site does not ship.

Revisit if the site grows several pages with genuinely disjoint component sets;
the mechanism for that is per-route CSS, not a second manifest.

---

### ADR-012 — The rough.js Möbius returns to the hero, reversing D5 and O3

*History: superseded 2026-11-25 by ADR-026. The Möbius is retired.*

D5 removed `mobius-figure.tsx` outright, and O3 left the door open only for "a
static flat teal Möbius SVG (hooks only) … as its own storied `Illustration`
component". Both are now superseded: the hero carries the **rough.js canvas
figure ported from `../portfolio`**, re-tinted teal, with its drag-and-fling
interaction intact.

The reasoning behind the removal was that a hand-drawn sketch language does not
belong to Cosmos's geometry — which is still true of *chrome*. It is not true
of a single decorative figure. Angeronia and Code Socratic already share a hue,
a typeface and an icon set; the Möbius is the one mark the studio owns
outright, and a flat SVG of it is a diagram where the canvas is a figure. Rule
9 is satisfied — it is the only illustration on the page, and it sits beside
the hero copy rather than replacing it.

What the port changes, so it stays inside the rest of the contract:

* **Colour comes from hooks, never from a literal (rule 3).** The portfolio
  version hard-codes `#C7DD3A` / `#FBFAF6` / `#14130F`. Here the wrapper and the
  canvas carry `color` in `app/site.css` and the component reads the *resolved*
  `rgb()` back with `getComputedStyle`. That is a consumption of the hooks, not
  an assignment, and it is why `light-dark()` has to resolve through a real CSS
  property rather than be parsed out of the custom property's token stream.

  Each scheme names its own lit/shade pair, because the scheme-aware accent
  hooks all travel together — `accent-container-2` and `-3` are two ramp steps
  apart in either scheme, too narrow a range to shade a solid with. So all four
  are the scheme-independent hooks, picked per scheme:

  | Scheme | Lit face | Shaded end |
  |---|---|---|
  | light | `accent-container-1` — Teal 60, the brand button's teal | `accent-dark-1` — Teal 90 |
  | dark | `accent-light-2` — Teal 20 | `accent-dark-2` — Teal 100 |

  Light needs the narrower, darker-lit pair: on a near-white ground a Teal 20
  band would wash out, and shading toward Teal 100 turned the whole figure
  black-green rather than teal.
* **No inline styles (rule 12).** Every rule lives in `app/site.css`; the
  canvas element is given a class, not a `cssText`.
* **A story before the page (rule 11).** `mobius-figure.stories.tsx` covers
  both schemes and the reduced-motion frame.
* **Rule 1 holds.** `roughjs` is a canvas drawing library, not a CSS framework
  or an icon set. It is a lazy `import()`, so it is a separate chunk that only
  loads when the figure is actually on screen — and never on phones, where the
  figure is `display:none` and the IntersectionObserver therefore never fires.

Revisit if the sketch language spreads past this one figure; the rule it is an
exception to is still the rule.

---

### ADR-013 — Rule 8's "no autoplay" is waived for the hero Möbius

*History: the waiver ended 2026-11-25 with the Möbius (ADR-025, ADR-026).*

The figure rotates continuously at 30°/s from the moment it is visible. Rule 8
says "SLDS durations only. Nothing scroll-linked. No autoplay", and this
deviates on two of the three counts: the rotation is autoplaying, and a
continuous `requestAnimationFrame` spin has no `--slds-g-duration-*` to be
expressed in. Nothing here is scroll-linked, which is the clause the rule cares
most about and the one D5 removed a whole category of work over.

Taken deliberately. The turn is what makes a Möbius band legible as a Möbius
band — a still frame of it reads as a twisted ring, and the one-sidedness only
resolves when the surface travels. That is the figure supporting the text
(rule 9), which is the job the illustration was let in to do.

The guard rails that keep it from being the thing rule 8 exists to prevent:

* `prefers-reduced-motion: reduce` draws **one static frame** and never starts
  the loop, and the drag handler is not attached at all.
* An `IntersectionObserver` stops the loop the moment the hero leaves the
  viewport, so the page is not redrawing 128 quads behind the fold.
* The figure is `display:none` below 640px, so no phone runs the loop.
* It is decorative: `role="img"` with a label on the wrapper, `aria-hidden` on
  the canvas. Nothing in the page's meaning depends on the motion.

Revisit if a second autoplaying element is ever proposed — the waiver is for
this figure, not a general licence.

---

### ADR-014 — The product spotlight carries a replica of a Code Socratic session

*Its intent stands (a replica, honest about being static, only the tabs work); its markup and palette are history. ADR-023 says what replaces them.*

The spotlight used to argue for Code Socratic in the studio's voice — a list of
what it is built from, closing on "the same team that consults for you shipped
a production, multi-tenant AI SaaS". That is a builder talking to a builder. The
section now approaches the product the way a customer meets it: the product's
own headline, three benefits that answer "why would I use this", and a replica
of a session with the problem solved.

The replica's content is lifted from the product's own landing page
(`../code-socratic/apps/web/components/SessionPreview.tsx`) — same problem, same
Socratic exchange, same clean run, same workspace: the bar, the editor with its
gutter, the four side tabs, the tutor's status rail, the run actions and the
composer. What is *not* carried over is the implementation. Over there the
preview reuses the product's real `SidePane`, `ResultsPanel` and `CodeBlock`,
all Carbon, all fed by `@repo/shared`. Bringing those across would mean either
importing Carbon into an SLDS 2 site — which rule 1 forbids outright — or
rebuilding three product components to render one marketing panel.

So the markup is this site's, in two files plus a `site-demo__*` block in
`app/site.css`:

* `code-socratic-demo.tsx` — the workspace. The side tabs are hand-rolled rather
  than the `Tabs` wrapper: the wrapper renders the SLDS tab look, and what is
  wanted here is the *product's* contained-tab look inside a replica frame. The
  keyboard contract is copied from the wrapper verbatim (roving `tabindex`,
  arrows, Home/End), so the two behave identically even though they do not look
  alike. Both action buttons and the send control are really `disabled`, and the
  composer is a `<span>` rather than a disabled `<textarea>` — a picture of a
  field, not a field that rejects you.
* `code-block.tsx` — the Python highlighter, ported from the product's own
  `CodeBlock.tsx` including Monaco's keyword list verbatim. That list is why
  `len` and `max` colour as keywords rather than as calls: Monaco's Python
  tokenizer has no function scope, so the real editor does not colour a call
  either, and agreeing with the product means matching what it emits.

**The syntax palette is the one place this cannot be literal.** The product
paints four token classes with Carbon values — `blue-60` keywords, `purple-70`
numbers, `teal-70` strings, `gray-60` comments — and rule 3 does not allow a
hex here. SLDS ships its own palette hooks, so each class takes the hook that
plays the same role: `palette-blue-40`, `palette-purple-40`,
`accent-2` and `on-surface-2`. They are `light-dark()` pairs, so the scheme
swap that Code Socratic does with two hand-written sets happens here for free.
Blue re-entering a page that was rebranded off Salesforce blue is deliberate and
contained: it is the conventional colour of a keyword inside a code sample, not
a UI colour, and it appears nowhere outside `.site-code__keyword`.

Two things follow from it being a replica rather than an embed:

* **It is honest about being static.** Only the tabs work. The demo says so in
  its own footnote rather than leaving a visitor to discover that the composer
  is dead. Nothing animates, so rule 8 is untouched — the ADR-013 waiver stays
  scoped to the Möbius. The one scripted behaviour is the chat opening on the
  newest turn, which the live panel does too: the exchange is longer than the
  pane and the turn worth reading is the tutor's last question.
* **It is not the page's illustration.** Rule 9 allows one illustration per
  page and that is the hero Möbius. This is a product screenshot rendered in
  markup: it shows the thing being described, and every word in it is real
  content from the product.

The risk is drift — the product's session UI will move and this will not follow
it. Accepted: the replica is making a claim about the *conversation*, which is
the part of Code Socratic that is stable. Revisit if it ever starts standing in
for a screenshot of current chrome.

---

### ADR-015 — SLDS 2 is removed; the UI layer is rebuilt on IBM Carbon (closes O7)

*History: superseded 2026-11-25 by ADR-023. Its reasons for leaving SLDS 2 stand, and so does the ban on `@salesforce-ux/*`.*

**Recorded 2026-09-08, before any code, per the rule at the top of this file.**

O7 ("licensing acceptance") is **closed: the Salesforce Terms of Use are not
accepted**, and `@salesforce-ux/*` leaves the repository. The replacement is
IBM Carbon (`@carbon/react`, Apache-2.0). The reasoning, the measurements and
the phased route are in
[`docs/plans/carbon-migration-plan.md`](../plans/carbon-migration-plan.md); this
entry records the decision and what it costs.

**Why.** The grant in `@salesforce-ux/design-system-2/LICENSE.txt` is generous,
but three clauses are not. The indemnity runs to "any application you develop
with the Software that infringes … or defames any person or violates their
rights of publicity or privacy" — limb (b) is about the content of *this site*,
is uncapped, and runs to a company rather than a hobby project. Salesforce also
reserves the right to "modify, suspend, or discontinue the Software … with or
without notice", with no liability, underneath a commercial storefront. The
"AS IS" clause is ordinary on its own and combines badly with the other two.

Renaming the classes does not help: "These Terms shall be included in all copies
or substantial portions of the Software", and a renamed copy is a derivative
work that is still subject to them — and one whose provenance is now hidden.
Removal has to mean replacement.

**What this supersedes.**

| Superseded | By |
|---|---|
| **D1** — consume `@salesforce-ux/design-system-2` from npm | `@carbon/react` from npm, Apache-2.0 |
| **D2** — Cosmos + `app/theme.angeronia.css`, brand ramp swapped to Carbon Teal | Carbon White / Gray 100 + `styles/_themes.scss`, teal as a `--cds-*` brand override. The teal is the *same* teal: theme block A was already a hand-mapped copy of `@carbon/colors` teal 10–100. |
| **D3** — SLDS blueprints wrapped in thin React components | `@carbon/react` ships the components; the wrapper layer is deleted, not ported (C1) |
| **D7** — only `app/theme.angeronia.css` may assign `--slds-*` | only `styles/_themes.scss` may assign `--cds-*` |
| **D8** — styles in `.css` so `slds-linter` can lint them | styles in `.scss`; the linter is retired (C4, below) |
| **ADR-004 / ADR-008 / ADR-011** — the assembled vendor stylesheet, its modular build, and the manifest that describes the library | all three vanish with `vendor/`. Carbon is imported as Sass and tree-shaken by the bundler; there is no dangling-artwork problem to solve because Carbon ships no artwork. |
| **ADR-006** — `slds-linter` at `error` with one scoped exemption | retired with the linter (C4) |
| **ADR-014**'s premise that "rule 1 keeps Carbon out" | Carbon is now the design system. The Code Socratic replica keeps its own markup — see the note in ADR-014's own section — but its syntax palette can finally be the product's own Carbon values instead of the SLDS palette hooks that stood in for them. |

**What it costs, stated plainly.**

* **The site changes visibly, and that is accepted (C3).** Cosmos rounds; Carbon
  is square. Design rule 7 ("buttons pill, cards `border-4`, inputs `border-2`")
  is **replaced, not reinterpreted** — Carbon buttons are rectangles and stay
  rectangles. Carbon 11 has no elevation scale, so the card's one shadow level
  becomes a border. The focus ring moves from outset to a 2px inset outline.
  Carbon's type scale and control heights are tighter than Cosmos's
  marketing-tuned sizes.
* **Angeronia converges visually with Code Socratic, deliberately (C5).**
  `CLAUDE.md` says the two share "hue, typeface and icon set, not its geometry".
  After this they share the geometry too. That sentence is amended in Phase 5
  because it becomes actively wrong, not merely stale.
* **A CI gate disappears (C4).** `slds-linter` has no Carbon equivalent and is
  **retired rather than replaced**. A `stylelint` config invented to fill the
  hole would be ceremony, not coverage; the axe pass over every story is the
  gate that catches real problems, and it stays.
* **`check:theme` loses most of its job (C7).** It exists to police a theme
  layer that re-values another vendor's hooks — a contract that no longer
  exists. Resolved in Phase 5; see ADR-018.
* **Roughly the same effort as the original SLDS redesign, minus the design
  work.** The copy, information architecture and page composition are unchanged.

**What does *not* change.** IBM Plex, self-hosted via `next/font` (D11). Carbon
icons (D10, O12). Carbon Teal as the accent (O1) — byte-identical, because it
was always Carbon's teal. `next-themes` for scheme persistence (O4). Storybook
as the source of truth (D4). Next.js 15 App Router (O5). Copy in
`data/angeronia.ts`. Nothing about the site's words or its shape.

**Open questions resolved on the plan's own recommendation** (§8, all marked
"not blocking"): C1 — use `@carbon/react` directly in site components rather
than re-creating a wrapper library, since the wrappers only ever existed because
SLDS ships no React. C2 — delete the 25 unused wrappers rather than port them.
C6 — port the Foundations boards to Carbon tokens rather than drop them.

---

### ADR-016 — Three places the §4.1 component mapping did not survive contact

*History: superseded 2026-11-25 by ADR-023.*

The Carbon migration plan's §4.1 table is a good map and was followed almost
everywhere. Three entries did not work as written, and the reasons are worth
recording because each is a property of Carbon rather than of this site.

**1. `layout (Grid/Col)` → `Grid` / `Column`: the wrapper is ours, not
Carbon's.** `@carbon/react`'s `Grid` dispatches on the `enable-css-grid`
feature flag and renders the legacy **flexbox** grid when it is off — which it
is by default in v11. That path was never an option: it needs a `<Row>` layer
between grid and column, and `styles/_config.scss` sets
`$use-flexbox-grid: false`, so its stylesheet is not even emitted. The flag has
no supported way to turn on in v11 either: `FeatureFlags` grew a boolean prop
for every other flag and not this one, leaving the deprecated `flags` map or a
`CARBON_ENABLE_CSS_GRID` environment variable that would have to be threaded
through Next, Vite and Vitest alike.

`components/ui/grid.tsx` renders exactly what Carbon's own `CSSGrid` renders,
from exports Carbon actually publishes: `GridSettings` in `css-grid` mode,
which is the only thing `Column` reads to decide which classes to emit. No
flag, no deprecated prop, and `Column` behaves as documented. In v12, where CSS
grid is the default, the file collapses back to `Grid` from `@carbon/react`.

**2. Card rows are a CSS grid, not `Column`s.** Carbon's 2x grid has 16 columns
at `lg` and 8 at `md`. Sixteen does not divide by three, and two of the four
card rows on the home page are three-up; `lg={5}` ×3 leaves a visible 1/16 of
slack against the right edge that the section heading above is flush to. One
`site-cards` grid serves every card row instead — two-up, three-up and four-up
as modifier classes — which also gives equal-height cards for free. The page
grid is still Carbon's; only the rows inside a full-width column are not.

**3. `button-group` → `ButtonSet`: not for the scheme switcher.**
`.cds--btn-set` puts `inline-size: 100%` on every descendant `.cds--btn`, which
is right for a pair of full-width form actions and wrong for two 32px toggles —
and `IconButton` nests its button inside a tooltip trigger, so the descendant
selector reaches it anyway. The switcher is a plain `role="group"` with two
`IconButton`s. It gained something in the move: Carbon's `IconButton` names the
control visibly on hover and focus, where the SLDS version could only do it with
assistive text.

Everything else in §4.1 landed as written: `Button`, `Tag`, `Tile`, `Link`,
`ProgressIndicator`, plain lists, and `Avatar` / `MediaObject` / `Cluster` /
`Section` kept as site components.

---

### ADR-017 — Carbon ships whole; the page's CSS more than doubles

*History: superseded 2026-11-25 by ADR-023.*

**Plan:** §4 — `globals.scss` is `@use config, @carbon/react, themes, site`.

**Done:** exactly that. Measured on 2026-09-08 against the production build:

| | Raw | Gzip |
|---|---:|---:|
| Carbon, whole (`@use '@carbon/react'`) | 973 KB | **105 KB** |
| The SLDS 2 modular build it replaces | 458 KB | 60 KB |
| Total page CSS before the migration | — | ~47 KB |

That is a real regression — roughly 2.2× the CSS the page used to ship — and it
is stated here rather than left to be discovered. It is inside the ≤ 150 KB
gzip budget the original plan set, and `First Load JS` is 143 KB after adding
`@carbon/react` to `optimizePackageImports` (339 KB without it, so that line in
`next.config.mjs` is load-bearing).

**The lever, measured but not pulled.** Carbon's component partials are
self-emitting, so a modular stylesheet is a short file:

```scss
@use './config';
@use '@carbon/react/scss/reset';
@use '@carbon/react/scss/grid';
@use '@carbon/react/scss/layer';
@use '@carbon/react/scss/components/button';
@use '@carbon/react/scss/components/tag';
@use '@carbon/react/scss/components/tile';
@use '@carbon/react/scss/components/link';
@use '@carbon/react/scss/components/progress-indicator';
@use '@carbon/react/scss/components/tooltip';
@use './themes';
@use './site';
```

That measures **28 KB gzip** — better than the SLDS build it replaces, and a
quarter of what ships today.

It is not what ships, for the reason ADR-011 already learned the hard way: a
component missing from the list produces an *unstyled component*, not an error,
and the harness that caught that class of mistake for SLDS
(`compare-vendor-css.mjs`, which diffed 1400 computed values across two builds)
was deleted with the rest of the vendor tooling. Shipping the whole of Carbon is
correct by construction. Revisit if page weight starts to matter — the switch is
the file above plus a way to verify it, and both are a day's work, not a
rewrite.

---

### ADR-018 — `lint:slds` is retired and `check:theme` is rewritten, not retired (closes C4 and C7)

*History: `check:theme` was superseded 2026-11-25 by ADR-030. There is still no CSS linter.*

**C4 — decided in the plan, executed here.** `slds-linter` has no Carbon
equivalent and is **retired rather than replaced**: the script, the
`@salesforce-ux/*` packages behind it, `eslint.slds.config.mjs` and the CI step
are all gone, and ADR-006 goes with them. A `stylelint` config invented to fill
the hole would be ceremony, not coverage. The gate that catches real problems is
`npm run test:storybook` — axe over every story in both themes, with violations
failing the run — and it stays, now covering 79 tests across 29 files.

**C7 — decided here: `check:theme` is rewritten, and it gets narrower.** The old
gate existed to police a theme layer that re-valued *another vendor's* hooks: it
checked that block A matched its generator byte for byte, that block B contained
no hex, that the list of blue literals Cosmos hard-codes had not moved, and that
58 SLDS pairings cleared AA. None of that contract exists any more. There is no
generated ramp — the teal is `@carbon/colors` teal, used directly — and no
block B, because Carbon derives its interactive family from tokens rather than
hard-coding hexes.

What is left is worth keeping, so `scripts/check-contrast.mjs` does it:

1. **Parity.** Every `--cds-*` token assigned in `styles/_themes.scss` is a
   token Carbon actually defines. A typo in an override is otherwise silent: it
   declares a custom property that nothing reads.
2. **Contrast.** Every pairing the brand override creates, in both themes,
   against WCAG 2.2 — 4.5:1 for text, 3:1 for non-text boundaries. 21 tokens,
   40 pairings.
3. **Report.** `docs/design-system/theme-report.md`, committed for review.

It is narrower than the SLDS version *on purpose*. Carbon publishes contrast
guarantees for its own tokens and tests them upstream; re-deriving those
pairings here would be checking IBM's homework. What is ours is the teal, so
that is what is checked.

The mechanism is worth a line of its own: `scripts/carbon-tokens.mjs` compiles
`styles/globals.scss` with `sass-embedded` and reads the custom properties back
out of the emitted CSS, following `var()` chains. Nothing is duplicated in
JavaScript, so the thing being checked cannot drift from the thing that ships —
and `scripts/build-logos.mjs` draws the OG rasters from the same resolver, which
is how the logo's teal stays the page's teal.

---

### ADR-019 — The games keep their own look, outside the design system

**Recorded 2026-10-23, before the code that deviates, per the rule at the top of
this file.**

Sudoku moves here from `../portfolio`, where it shipped (portfolio #36 and #38),
and Solitaire follows it. They are games, not pages of the studio site, and each
was designed and tested as an app of its own: Sudoku's six themes, each in
light and dark, with their scenes, sounds and secrets; Solitaire's felt, card art
and win shows. Rebuilding either on Carbon would be a redesign, not a move. So
they keep their own look, and the design rules do not govern them.

**What is carved out.** `app/sudoku/` *(now `app/games/sudoku/`, with the
launcher at `app/games/page.tsx`; ADR-021)*, `components/sudoku/`, `lib/sudoku/`,
`data/sudoku.ts`, `data/sudoku-trophies.ts`, `components/games/`, `lib/random.ts`
and `e2e/`; Solitaire's equivalents when it lands. Inside them, rules 1–9, 11 and
13 do not apply:

* **Their own stylesheets, in plain CSS.** Each game's `.css` is imported by its
  page alone, so none of it reaches the studio's stylesheet (checked against the
  build: the home page's CSS holds no `sdk-` rule), and every rule is scoped to
  the route (`html:has(.sdk-shell)`, `.sdk-*`). Literal colours, radii, shadows,
  type sizes and durations are the games' design, not a breach of it.
* **Their own icons:** `@phosphor-icons/react`, imported only under the games'
  folders. Rule 1's "Carbon icons only" still holds for the site.
* **Their own type:** the iOS system font stack, through each game's `--font`.
* **Their own motion:** deal-ins, fireworks, theme scenes and win shows play on
  their own; reduced motion turns them off.
* **No stories.** Their gates are their own: unit tests (`npm test`, the Vitest
  `unit` project in node) and Playwright specs (`npm run test:e2e`, desktop
  Chromium and an iPhone in WebKit).
* **Their own copy files,** not `data/angeronia.ts`.

**What still applies.** Rule 10's accessibility bar (semantic HTML, focus
management for the sheets, labelled icons; the e2e specs play the games by
keyboard), rule 12's TypeScript and strict-build gates, and rule 14.

**The boundary runs both ways.** Nothing in the studio site imports from the
games' folders, and the games import nothing from `components/site/`,
`components/ui/` or `styles/`. They stay unlisted (not in the header, the footer
or `sitemap.ts`, and `noindex`), so the site never links to them. *(Amended by
ADR-020: the home page links to them. The rest of this sentence holds.)*

**What the root layout still gives them, and the base that undoes it.**
*(Amended by ADR-029: since 2026-11-25 it is the spine's `tokens.css` and
`base.css` that reach them, and the parity gate checks the result.)* The
games render under `app/layout.tsx`, so Carbon's global stylesheet, the Plex
variables, `next-themes` and the skip link reach them. Carbon's reset and default
type are not what the games were written against (the portfolio loaded Tailwind
v4's preflight on every page), and the difference is visible: an `h1` at
heading-06's line height, buttons at the browser's 13.33px with its padding, an
underlined home link, SVGs on the baseline, the grey tap flash back on iOS. One
difference breaks a feature: Carbon ships `[data-hidden]:not([data-fixed]) {
display: none }` globally, which hid every secret not yet found in Sudoku's theme
picker. So:

* `components/games/base.css` puts back the parts of the preflight the games
  rely on, scoped to a game's shell. `html body` then a `:where()` gives it
  specificity 0,0,2: above Carbon's bare-element rules (0,0,1), below every game
  rule (all carry a class). Element lists go in `:where()`, never `:is()`, because
  the build prefixes `:is()` as `:-webkit-any()`, which counts as a class.
* Sudoku's locked secrets are marked `data-locked`, not `data-hidden`.
* The game's container is a `<main id="main">`, so the skip link lands on it.

The base was checked by measurement, not by eye: every element's computed style
on the game screen and its four sheets, in every theme and scheme, on an iPhone
and a desktop, compared against the portfolio running the same saved game. Inside
the game nothing differs; outside it only `<html>` and `<body>` do, and the games
paint over both.

**What it costs.** The games load Carbon's global stylesheet, which they do not
use (about 100 KB gzipped, the stylesheet every studio page loads), and a second
icon package ships, on their routes only. A route group with its own root layout would avoid both, but
would move the studio pages under `app/(site)/` and give the app two root layouts
to keep in step; not worth it for two unlisted pages. Revisit if a game is ever
listed on the site.

### ADR-020 — The home page links to the games, through one launcher

**Recorded 2026-10-23, before the code that deviates, per the rule at the top of
this file.** Amends one sentence of ADR-019: "they stay unlisted … so the site
never links to them". The rest of ADR-019 stands.

**What changes.** The home page gets one Games section, between About and
Contact: a launcher, one tile per game, each its icon, its name and one line.
There are two games now and there will be more, so the section is built to grow.
The tiles come from the `games` list in `data/angeronia.ts`, and the grid wraps
(`repeat(auto-fill, minmax(--site-game-tile, 1fr))`), so a new game is one more
entry and nothing else. The heading names no number ("Games for a break") for
the same reason.

Nothing else lists them. The header, the footer and `sitemap.ts` stay as they
are, and every game stays `noindex`. A visitor can find the games from the home
page; search engines are still told to leave them out. Indexing them is a
separate decision: each page's `robots` metadata and one sitemap entry each.

**Where it sits, and why not higher.** The page argues for the studio: its
product, its services, how it works, who you work with. The games are not part
of that argument. They are things the studio made, and they come after it and
before the closing call to action. Unshaded, like About above it: the icons are
small, and a band for one row of tiles would be the heaviest thing in the
section.

**The icon is the game's own Add to Home Screen icon, by URL.** Every game
already ships one at `app/games/<slug>/apple-icon.png` (180 × 180, full-bleed,
square) and Next serves it at `/games/<slug>/apple-icon.png` (paths as of ADR-021). The tile points at that URL:

* An `href` is not an import, so ADR-019's boundary holds both ways. No game
  code or CSS reaches the site, and the site imports nothing from a game.
* No second copy to drift. When a game changes its icon, the launcher follows.
* Rule 3 is untouched: the games' colours are inside their artwork, not in a
  stylesheet. Rule 7 is untouched: the icons are square, as Carbon is, and iOS
  rounds them only on a home screen. Rule 9 is untouched: an icon is the game's
  mark, not the page's illustration; the hero Möbius still is.
* The icon repeats the name beside it, so it is `alt=""`.
* Storybook serves only `public/`, so `.storybook/main.ts` lists `app/games/`
  and serves every `apple-icon.png` it finds at the same URL. A new game needs no
  entry there either.

A new game listed here therefore needs its `apple-icon.png`, which it needs
anyway for Add to Home Screen.

**One link per tile, stretched over it.** The game's name is the link, and its
`::after` covers the tile, so a click on the icon opens the game too, keyboard
users get one tab stop per game, and the whole tile is a large touch target
(rule 10). The tiles are a `<ul>`, because a launcher is a list of links.

**The list is a prop.** Every other section reads its copy straight from
`data/angeronia.ts`. `Games` takes `games` instead, and the page passes the real
list, so Storybook can show the launcher with twelve tiles (`ManyGames`) before
there are twelve games.

**ADR-019's "revisit if a game is ever listed".** Revisited. That cost is
Carbon's stylesheet loading on the game routes. A link from the home page does
not change which routes load what, and a route group would still move every
studio page under `app/(site)/`. Still not worth it.

### ADR-021 — The games move under `/games`, behind a launcher saved as a web app

**Recorded 2026-10-23, before the code, per the rule at the top of this file.**
Extends ADR-019's carve-out to one more page and moves the games' routes. The
home page's launcher (ADR-020) stays; its tiles point at the new paths.

**The paths.**

| Path | What |
|---|---|
| `/games` | The launcher: the games' icons and names, nothing else. |
| `/games/sudoku` | Sudoku (was `/sudoku`). |
| `/games/solitaire` | Solitaire (was `/solitaire`). `/games/Solitaire`, in any casing, serves it too, as `/Solitaire` did. |
| `/sudoku`, `/solitaire`, `/Solitaire` | Permanent redirects (308) to the new paths, so a shared link or a game already saved to a home screen still opens. |

A new game goes at `app/games/<slug>/`, with its own `apple-icon.png`, and one
entry in `games` in `data/angeronia.ts`. Both launchers read that list.

**The old `/Solitaire` rule no longer applies.** It was a rewrite because a
redirect from `/Solitaire` would also catch `/solitaire` (custom routes ignore
case) and loop. The game no longer lives at either, so both now redirect to
`/games/solitaire`, and `/games/Solitaire` takes over the rewrite, for the same
reason as before.

The card faces stay at `/solitaire/cards/v1/`. They are versioned, cached for a
year, and the redirect matches `/solitaire` exactly, not what is under it.

**The launcher is a games page, not a studio page.** It is meant to be saved to
an iPhone's home screen from Safari or Chrome. It then opens full screen as
"Games", and every game opens inside that one app. That makes it the games'
home screen, so it takes the games' side of ADR-019:

* Its own look, in `components/games/launcher.css` and scoped to `.gml-*`. It is
  laid out like a home screen: square artwork rounded the way iOS rounds an icon,
  the name under each icon, the system font, and the system's grouped ground in
  light and dark. It follows the device's colour scheme, not the site's
  `data-theme`, as the games do. Carbon's square rule does not reach it.
* `components/games/base.css` covers its shell as it covers the games'.
* The skip link lands on its `<main id="main">`, and its heading is a visually
  hidden `h1`. "Just the icons" is a visual brief, not a reason to leave the
  page without a title.
* `noindex`, like the games, and not in the sitemap.

It reads the game list from `data/angeronia.ts`, which is plain data. ADR-019
keeps the games' own copy out of that file and keeps the games from importing
`components/site/`, `components/ui/` and `styles/`. Neither changes: the list is
the studio's, and one list means a new game is still one entry.

**Its own icon.** `app/games/apple-icon.png` is generated by
`npm run games:icon` (`scripts/build-games-icon.ts`, sharp): the games' own
icons, small, on a dark ground, like an iOS folder. Re-run it when a game is
added.

**Inside the saved app there is no back button**, so each game needs a way back
to the launcher. Sudoku's home button, which pointed at `/`, now points at
`/games`. Solitaire had no way out; its Menu gets an "All games" row. Both
appear in the game's own look.

**Status bar.** The launcher saves with `statusBarStyle: "default"`, so every
page in the app starts below the status bar, and each page's `theme-color`
tints it. `black-translucent` would put Solitaire's felt under the clock, but
it would also put white status text over Sudoku's light aurora.

### ADR-022 — Color Tap joins the games; its pictures are converted at build time

**Recorded 2026-10-27, before the code, per the rule at the top of this file.**
Extends ADR-019's carve-out to a third game. ADR-020 and ADR-021 apply to it
unchanged: one more `games` entry, an `apple-icon.png`, a link back to `/games`.

**What it is.** Color Tap is paint-by-numbers. Every photo in
`public/paint-by-numbers/` becomes a picture of outlines and numbers on white,
at five levels (12, 20, 30, 45 and 60 colours). The player picks a colour and
taps its areas. The owner's calls: the route is `/games/paint-by-numbers`
(`/games/<slug>`, ADR-021), with **no** short `/paint-by-numbers` redirect;
the look is a dark studio (navy ground, white paper); magnifier uses grow with
the level (3 / 4 / 5 / 6 / 8).

**What is carved out**, on the same terms as ADR-019 (rules 1–9, 11 and 13 off;
rule 10, rule 12's TypeScript and strict-build gates, and rule 14 on):
`app/games/paint-by-numbers/`, `components/color-tap/`,
`lib/color-tap/`, `data/color-tap.ts`, `public/paint-by-numbers/` and the
`scripts/*color-tap*` tools. Its CSS is `components/color-tap/color-tap.css`,
scoped to `html:has(.ctp-shell)` and `.ctp-*`; `.ctp-shell` joins every
selector list in `components/games/base.css`.

**Conversion runs at build time, not in the browser.** A photo could be
converted on the phone, in a worker, when it is picked. It is not, because:

* The result would not be stable. Engines decode and downscale JPEGs
  differently, `Math.cbrt` and `Math.pow` may differ in the last bit, and
  Safari's fingerprinting protection adds noise to canvas reads. A picture's
  areas could differ between browsers or between visits, and saved progress
  would no longer fit.
* Under `next dev --turbopack`, Next 15.5 starts a worker from a `blob:` URL
  with `importScripts`, which a module worker cannot run. The worker would need
  special care and a fallback for every engine.
* An older iPhone would spend seconds of battery on every new picture.

So `npm run color-tap:puzzles` (`scripts/build-color-tap-puzzles.ts`, sharp in
Node) converts every JPG, JPEG or PNG at the top of `public/paint-by-numbers/`,
and only the ones whose source, settings or pipeline version changed. It runs
from `predev` and `prebuild`, so a photo dropped into the folder just works
after a dev restart or a deploy (sharp and tsx are devDependencies, which
Vercel installs). Its output is committed, as Solitaire's deals and card faces
are:

* `public/paint-by-numbers/puzzles/<picture>-<level>.<hash>.json`, named by a
  hash of their content, so `next.config.mjs` serves the folder `immutable`;
* `lib/color-tap/pictures.ts`, the generated manifest the page reads.

The conversion itself (`lib/color-tap/`) is pure TypeScript on typed arrays, so
the unit tests run exactly what ships.

**A bad photo is stopped at the pull request, never at a deploy.** Because the
conversion runs before every build, one damaged file, or two photos whose names
come out the same (`Leaves.jpg` and `leaves.png`), could otherwise fail the
build of every page of the site. So the two runs differ:

* `predev` and `prebuild` leave a photo they can't use out, with a warning, and
  the rest of the site builds. A picture already listed keeps its earlier
  puzzles, current and retired, so a bad replacement photo takes no painting
  away.
* CI's **Color Tap photos** job runs `npm run color-tap:puzzles -- --check`,
  which writes nothing and fails on a damaged photo, a name collision, an image
  in a format it doesn't read (HEIC, WebP…), a puzzle that breaks its level's
  promises, or a photo whose puzzles weren't made and committed. Listed as a
  required status check in the `main` ruleset (a repository setting, outside
  this code), it stops such a pull request merging. `npm test` checks the same
  freshness (`scripts/color-tap-puzzles.test.ts`).

**Players' progress comes first (the owner's call).** A puzzle is remade only
when something deliberate changes: its photo, its level's conversion settings
(not its name or its magnifiers), the seed,
the work size or `PIPELINE_VERSION`. The conversion's code and the image library
are not part of that key on purpose, so a comment edit, a change to the shared
`lib/random.ts` or a routine sharp update never remakes a puzzle or fails the
check. The cost, accepted: a change to `lib/color-tap/` that does alter what it
makes must bump `PIPELINE_VERSION`, by hand, and be looked at with
`npm run color-tap:preview`. And a remade puzzle never takes a painting away:
the puzzle it replaces stays in the folder, listed in the manifest as
**retired** (with its own area count), and a painting begun on it resumes and
finishes on it. Only "Start this painting again" moves a player to the current
puzzle. A retired puzzle is deleted only when its photo is removed.

**Borrowed from Sudoku, as Solitaire borrows.** The sheets are
`components/sudoku/sheet.tsx` (its `prefix` gains `"ctp"`), and the sounds are
built on Sudoku's synth (`unlockAudio`, `tone`, `haptic` from
`components/sudoku/feedback.ts`), not Sudoku's voice. Both games stay free of
`components/site/`, `components/ui/` and `styles/`.

---

### ADR-023 — The studio site leaves Carbon for the spine

**Recorded 2026-11-25, before any code, per the rule at the top of this file.**

The owner chose a redesign on 2026-11-25: **the spine**, the draft kept (outside
git) at `.taste-skill/round2/type-only-statement/`. Its `index.html`, `css/` and
`js/` are the visual source of truth; its `notes.md` records how it was made;
`final/` holds its screenshots at 1440, 768 and 390. The first attempt at a
redesign (PR #10, "name as a monument") was scrapped on the same day, and none
of its design, tokens, copy, plans or photographs is reused. Only its
design-neutral plumbing is: the games parity script (ADR-029), the Storybook axe
fix, the games' `base.css` corrections, and a starting point for the contrast
script (ADR-030).

**What the spine is.** Type and nothing else, in Hanken Grotesk, near-black ink
on off-white paper. One 2px line in ink runs the length of the page at a fixed
axis (38% of the width; 22% under 900px). Every statement is set on it in one of
three positions: **crossing** it (split at the axis into two parts that meet with
a word space and hide the line), **hanging** from it, or **pushed** past it.
Paired paragraphs keep a reading rule: the reader's side (the need) ends at the
axis, the studio's side (the build) starts there. One band is charcoal (the
belief, the page's one held scene); sage appears only on buttons. The footer
tells the story of the name with two photographs: the Angerona statue at
Schönbrunn and the Fasti Antiates calendar, each credited.

**The stack it is built on.**

* **Plain CSS.** `styles/tokens.css` (the palette by role, the type scale, space,
  the spine's geometry, motion) and `styles/base.css` (reset, type, focus) are
  the only global stylesheets, imported once by `app/layout.tsx`. Every
  component styles itself with a CSS Module beside it
  (`<name>.module.css`). No CSS framework, no utility library, no CSS-in-JS, no
  Sass. The only inline `style` allowed is a custom property whose value is
  data (ADR-005's carve-out, kept).
* **Fonts through `next/font/google`:** Hanken Grotesk at 400, 500 and 600 for
  everything, and IBM Plex Mono 400 for code only (inside the Code.Socratic
  replica). Both are exposed as CSS variables on `<html>` and read only by
  `--font-sans` and `--font-code` in `tokens.css`. The draft's `fonts/` folder
  is a reference, not a source.
* **No icon set.** The spine is type. The replica draws its few glyphs as
  inline SVG, `aria-hidden`. The games keep Phosphor (ADR-019).
* **Storybook stays the source of truth (D4):** every component has a story
  before a page uses it, and the page is a story.
* Next.js 15 App Router, React 19, TypeScript, statically prerendered (O5
  stands).

**What this supersedes, and what is now history.**

| Superseded | By |
|---|---|
| **ADR-015** — the UI layer on IBM Carbon | the spine on plain CSS. Its reasons for leaving SLDS 2 stand, and `@salesforce-ux/*` stays banned. |
| **ADR-016** — Carbon's grid, card rows and `ButtonSet` | gone with Carbon. Layout is CSS grid in each component's module, measured from the axis. |
| **ADR-017** — Carbon ships whole (≈105 KB of CSS, gzipped) | the page ships its own CSS only: two global files and one module per component. |
| **ADR-018** — `check:theme` | `check:contrast` (ADR-030). There is still no CSS linter. |
| The rules ADR-015 to ADR-018 set: the selection ladder, `--cds-*` only in `styles/_themes.scss`, never override `.cds--*`, `site-*` classes in `_site.scss`, `<Layer>` stepping, `type-style()`, `$spacing-*`, "Carbon is square", Carbon durations | `docs/design-system/DESIGN-RULES.md`, rewritten as the spine's contract. Square stays (no radius, no elevation), for the spine's own reasons. |
| **D10 / O12** — Carbon icons | no icon set on the studio site |
| **D11 / O11** — IBM Plex Sans 300–700 | Hanken Grotesk 400/500/600; IBM Plex Mono 400 stays, for code only |
| **O4** — `next-themes` | one colour scheme (ADR-024) |
| **ADR-012, ADR-013, O3, D6** — the Möbius, its autoplay waiver, the teal disc-and-cursor mark | retired (ADR-025, ADR-026) |
| **ADR-014** — the replica's markup and its SLDS/Carbon syntax palette | the draft's replica: the product's own light theme as `--ui-*` values inside the replica's own module. ADR-014's intent stands: a replica, not an embed; honest about being static; only the tabs work. |

**What stays.**

* **ADR-019.** The games keep their own look outside the design system. Its
  carve-out keeps the same rule numbers: rules 1–9, 11 and 13 do not reach the
  games; rule 10 (accessibility), rule 12's TypeScript and strict-build gates
  and rule 14 (packages never reinstalled) do. Its paragraph on what the root
  layout gives the games is amended by ADR-029 (the studio's base, not Carbon's
  reset). The boundary still runs both ways: nothing in the studio site imports
  from the games, and the games import nothing from `components/site/`,
  `components/ui/` or `styles/`.
* **ADR-020.** The home page keeps exactly one Games section, read from the
  `games` list in `data/angeronia.ts`, the list passed as a prop, each tile the
  game's own `apple-icon.png` by URL with `alt=""`, one link per tile. It is
  restyled for the spine. Its Carbon specifics (`Link`, `--site-game-tile`,
  "square, as Carbon is", "the hero Möbius is the page's illustration") are
  history.
* **ADR-021** (`/games`, the launcher, the redirects) and **ADR-022** (Color Tap)
  unchanged.
* Copy in `data/angeronia.ts`. Storybook as the source of truth. The ban on
  `@salesforce-ux/*`.

**The owner's rulings on the draft (2026-11-25).** The port builds the draft
with these changes, and they bind later work too:

* The spine line is **2px**.
* The voice is **third person** (ADR-028).
* The story of the name stays: the Angerona statue and the Fasti calendar
  photographs in the footer, with their credits.
* The headline stays: **"One engineer, screen to server"**.
* "then hand them over." is removed from the hero's supporting sentence.
* The sample-test and hidden-test metrics are removed: the big "2 / 2 sample
  tests · 7 / 7 hidden tests, 84 ms" figures and any page sentence or caption
  that states them. The replica's own Results tab is product UI and stays as the
  product shows it.
* Code.Socratic is linked at `https://www.code-socratic.com`;
  `code-socratic.angeronia.com` returns 404 and is not used.

**What it costs.** The page changes completely, by the owner's choice. The
Carbon-era components, foundation stories and generated reports are deleted,
not ported: their design is what is being replaced. The CI "theme" gate is
replaced (ADR-030). The family resemblance with Code.Socratic (Carbon, teal,
Plex) ends on this site; the replica shows the product as it looks, inside its
own frame.

---

### ADR-024 — One colour scheme; `next-themes` and the switcher are removed

**Recorded 2026-11-25, before the code.** Supersedes O4 and the light/dark/system
half of D2 and ADR-015.

The spine has one colour scheme: paper and ink, with one charcoal band. There is
no dark mode, no `prefers-color-scheme` variant and no switcher. `next-themes`,
`components/site/theme-provider.tsx`, `components/site/color-scheme-switcher.tsx`
and `lib/theme.ts` are deleted, and `<html>` no longer carries `data-theme`. (It
keeps `suppressHydrationWarning`, now for the one-line script that adds the `js`
class, ADR-025.) `tokens.css` declares
`color-scheme: light` on `:root`, so form controls and scrollbars match.

The charcoal band is not a second scheme. It is one band that sets
`data-band="dark"`, which swaps the band roles (`--band-ground`, `--band-ink`,
`--band-soft`, `--band-spine`, `--band-focus`, `--band-frame`) for the charcoal
set. Components read only the
roles, so a component never knows which band it is on.

Why: the draft was designed, juried and chosen in one scheme, and a dark
variant would be a second design to make and keep in contrast. The games are
unaffected: each sets its own `color-scheme` and follows the device (ADR-019,
ADR-021).

Revisit only if the owner asks for a dark mode. It would be a new role set
under `prefers-color-scheme`, and `check:contrast` would check it.

---

### ADR-025 — Scroll-linked motion is allowed for the spine; reduced motion and no script get the finished page

**Recorded 2026-11-25, before the code.** Replaces design rule 8 ("nothing
scroll-linked, no autoplay"). ADR-013's autoplay waiver ends with the Möbius it
was for (ADR-026); nothing on the studio site autoplays in a loop.

The spine's motion is its idea, so the rule against scroll-linked motion goes.
What the draft does, and what is now allowed:

* **The line is drawn** down the first screen as the page loads (about 1.15 s),
  then kept just ahead of the reader as the page scrolls. It is measured, not
  painted over: it breaks wherever a statement, a picture or the replica crosses
  the axis.
* **The pull (desktop only):** a crossing statement low on the screen is split
  open at the axis, and it closes as it rises; closed from 45% of the screen up.
* **The belief** is one held scene: a sticky stage, 0.8 of a screen of scroll,
  that closes the statement onto the axis.
* **Reveals** once per block, and the hero's arrival on load.

The conditions, all required:

1. **The finished page is the default.** Without script, under
   `prefers-reduced-motion: reduce`, and on a failed script, every element is
   in its final place, the line is drawn whole (one line per band, hidden behind
   the words that cross it), and nothing is hidden waiting for a reveal. Motion
   styles key off `html.js` (a one-line script in `<head>` adds it) and sit
   inside `@media (prefers-reduced-motion: no-preference)`.
2. **Native scrolling.** No wheel capture, no smooth-scroll library, no scroll
   hijack. The scrollbar always tells the truth.
3. **The phone gets the finished composition** of the held scene and no pull
   (below 900px).
4. **Transforms and opacity only** for anything that moves on scroll, so
   nothing is laid out again per frame. One `requestAnimationFrame` loop, run
   only while something changes.
5. **Durations and easings are tokens** (`--dur-*`, `--ease-*` in `tokens.css`).
6. **No loop that plays on its own.** Two photographs drift a few percent with
   the scroll (scroll-linked, not autoplaying); under reduced motion they are
   still.
7. Nothing that carries meaning moves only on scroll: the words, their order
   and their links are all there in the finished page.

---

### ADR-026 — The Möbius is retired; a new favicon and social image

**Recorded 2026-11-25, before the code.** The owner retired the Möbius mark on
2026-11-20. Supersedes ADR-012, O3 and D6, and ends ADR-013 (ADR-025).

The Möbius is never reused anywhere: not as the hero figure, not in
`app/icon.svg`, not in the social image or a logo. `components/site/mobius-figure.tsx`
and its story are deleted, and `roughjs`, which only it used, is uninstalled.

The disc-and-cursor mark (D6) and its teal OG lockups
(`public/angeronia-logo-*.{svg,png}`, drawn by `scripts/build-logos.mjs` from
Carbon's teal) belong to the retired palette. `build-logos.mjs`,
`retint-favicon.mjs`, `carbon-tokens.mjs` and `oklab.mjs` are deleted with
Carbon. The spine has no mark: the masthead is the wordmark "Angeronia Labs",
set in type.

**Left for the port agent:** a new `app/icon.svg` and a new social image, in the
spine's palette and type (the wordmark or an initial on paper and ink, with no
Möbius), and the metadata that points at them. Until then, `app/icon.svg` is
still the old Möbius favicon and `app/layout.tsx` still points the social
image at `public/angeronia-logo-light.png`, so both files stay in place. Delete
them when nothing refers to them. *(Done by ADR-031 item 10: `app/icon.svg` is
the spine's mark, the social image is `app/opengraph-image.tsx`, and
`public/angeronia-logo-*` are deleted.)*

---

### ADR-027 — Scroll scenes in plain JavaScript, not GSAP

**Recorded 2026-11-25, before the code.**

The draft loads GSAP 3.15 and ScrollTrigger from a CDN, and uses them for one
thing: the belief's held scene, a sticky stage whose two halves move with
`ease: "none"` from the margins to the axis over 0.8 of a screen. Everything
else the draft moves (the line, its breaks, the pull, the photographs' drift,
the reveals, the tabs) is already plain JavaScript in `js/page.js`, on one
`requestAnimationFrame` loop and an `IntersectionObserver`.

**Decided: no GSAP.** The held scene is a linear map from scroll position to two
`translateX` values: `progress = (scrollY − top) / (height − innerHeight)`,
clamped. It joins the loop that already runs; it needs no timeline, no
sequencing and no easing curve. Adding GSAP for it would ship two libraries
(about 45 KB gzipped) for one linear scrub, add a second scroll listener with
its own refresh cycle beside the line's, and put a CDN `<script>` on a page that
otherwise loads nothing from a third party. GSAP's standard licence is free for
commercial use, so this is not a licence question; it is weight and one more
moving part.

So the port writes the spine's behaviour as client components (`"use client"`)
in plain TypeScript, with `useEffect` setup and teardown. No CDN script, no
smooth-scroll library (ADR-025).

**Revisit** if a later scene needs real sequencing (several tweens with their
own easings, or scrubbed timelines across several elements). Then GSAP goes in as
an npm dependency (`gsap`, pinned to an exact version), imported only by the
client component that needs it, never from a CDN, by a new ADR.

---

### ADR-028 — The studio speaks in the third person

**Recorded 2026-11-25, before the code. The owner's ruling.**

The studio's marketing copy uses **no "I", "me", "my" or "we"** (nor "our",
"us"). Pratik Kubal is named, or the subject is "the studio" or "Angeronia
Labs". **No pronoun is used for Pratik at all** (no he, she or they): none were
stated, so the copy repeats the name or rephrases.

* The draft is written in the first person ("I build…", "What I take on", "How I
  work", "Email me", "I'm Pratik Kubal"). The port rewrites every such line in
  `data/angeronia.ts` without changing what it claims. A heading split at the
  spine keeps its shape: the split moves with the words.
* Addressing the reader as "you" stays. It is the reading rule's other side.
* Applies to everything the studio says about itself: page copy, headings,
  buttons and links, `<title>`, meta descriptions, the social image and the
  JSON-LD `description`.
* **Not covered:** product UI inside the Code.Socratic replica (its chat turns,
  "You" and "Tutor", its own labels) shows the product as it is. Quoted
  third-party text, and photo credits, stay as written.
* **Open:** the privacy policy and terms use "we" to name a legal party. They
  are not marketing copy, so they are left as they are until the owner rules.

---

### ADR-029 — How the games stay identical: their base, and a parity gate

**Recorded 2026-11-25, before the code.** Amends ADR-019's paragraph "What the
root layout still gives them".

The games render under `app/layout.tsx`, so the studio's global CSS reaches
them, as Carbon's reset and `<body>` did before. Leaving Carbon changes what
reaches them: the Carbon reset and the Plex `<body>` (16px, line height 1) go,
and the spine's `tokens.css` and `base.css` (Hanken Grotesk, a fluid body size,
line height 1.5, its own reset) arrive. The games must render exactly as
before, so:

1. **`components/games/base.css` stays the games' base.** It still puts back
   the browser defaults the games were built on, at `html body :where(…)`
   (specificity 0,0,2: above the studio's bare-element rules, below every game
   rule), never `:is()`. It now also restores, on the four shells, the inherited
   values Carbon's `<body>` gave them and the spine's `<body>` would change.
   Only what the parity run shows a game needs goes in.
2. **The studio's base is written to stay out of the games' way.** Its element
   rules sit in `:where()` (specificity 0), so any game rule wins. The two
   rules a computed-style snapshot cannot see, the focus ring and the
   selection colour, are scoped to `[data-band]`, which every studio band
   carries and no game does, so they never reach a game. (A `data-tone`
   attribute was avoided: Sudoku's blossom theme already uses one.)
3. **The parity gate.** `scripts/games-parity.ts` (`npm run games:parity --
   baseline|compare`) loads the launcher and each game against a production
   server on `PARITY_PORT` (default 3417), at desktop and phone size, with the
   clock, the random source and motion pinned, and records the computed style
   of every element. Take `baseline` on the tree *before* a change to anything
   global (`styles/`, `app/layout.tsx`, `components/games/base.css`, the
   fonts), and `compare` after. It fails if any element at or inside a game's
   shell differs; differences in `<html>`, `<body>` and the skip link are
   reported as notes, because each game paints over both. The baseline lives in
   `.parity/` (git-ignored), so it is always taken locally.
4. What the snapshot cannot see is checked by reading: `-moz-osx-font-smoothing`
   (Firefox only) is restored in `base.css` as PR #10 found; focus rings and
   selection are kept out by (2).
5. **The page frame stays.** Carbon's layout wrapped every page in a flex
   column at least a screen tall, and the shells were measured as its flex
   items. Without it their resolved `min-width` and `min-height` change (`auto`
   becomes `0px`). So `app/layout.tsx` keeps a plain frame
   (`app/layout.module.css`: `display: flex; flex-direction: column;
   min-block-size: 100dvh`) and nothing else from the old wrapper: its body-02
   type is pinned on the shells instead (1). For the studio it is harmless and
   useful: a short page keeps its footer at the foot of the screen.
6. **No token takes a name a game defines.** The tokens sit on `:root`, which a
   game page shares, and the games set their own variables on `<html>` with
   `html:has(.<shell>)`, which outranks `:root`. The draft's names `--ink`,
   `--accent`, `--ground` and `--muted` are all taken by a game, and a shared
   name would quietly take the game's value on a game page (the skip link, for
   one, would have been drawn in a game's colours). So the colour tokens are namespaced
   (`--palette-*`, `--band-*`, `--button*`), and a new token's name is checked
   against every custom property the games define before it lands. The games
   read no token either.

Game files change only in comments that named Carbon or `next-themes` (the
"no Carbon" grep covers `components/`). No game logic, markup or style rule
changes.

---

### ADR-030 — `check:contrast` replaces `check:theme`

**Recorded 2026-11-25, before the code.** Supersedes ADR-018's C7.

`check:theme` compiled Carbon's Sass to read the brand override back out, and
checked the Möbius favicon against the teal ramp. Neither exists now. Its
replacement, `npm run check:contrast` (`scripts/check-contrast.mjs`, adapted
from PR #10's), reads `styles/tokens.css` and nothing else:

* **The pairs are declared in `tokens.css`**, beside the tokens, as
  `@contrast` lines in one comment block: a foreground, a background, a kind
  (`text`, `large` or `ui`) and its use. A new colour role is not done until its
  pairs are declared there.
* **Role pairs are checked in every band.** A pair written in roles
  (`--band-ink on --band-ground`) is resolved in each role set (`:root`, which is the paper
  band, and `[data-band="dark"]`), following `var()` chains, so the charcoal
  band is checked by the same line as the paper.
* **WCAG 2.2 AA:** 4.5:1 for `text`, 3:1 for `large` text and for `ui`
  (non-text: the spine, focus rings, boundaries).
* It fails on a pair under its bar, a token it cannot find, a value that is not
  a hex colour, or no pairs at all. It prints a table; nothing is committed, so
  there is no report to drift.

Pairs it does not cover, by design: the Code.Socratic replica's `--ui-*` palette
(the product's own colours, checked where they render by axe in the replica's
story) and the photographs. The axe pass over every story (`test:storybook`)
remains the check on what actually renders.

---

### ADR-031 — The port: how the spine is built in React, and where it departs from the draft

**Recorded 2026-11-25, before the port's code.** Builds ADR-023 to ADR-030 into
`app/` and `components/site/`. The draft stays the visual source of truth; this
entry lists every place the built page knowingly differs from it, and the shape
of the code that replaces its `index.html`, `css/` and `js/`.

**Three building blocks carry the spine, so no section re-implements it.**

* **`Band`** renders a band's outermost element with `data-band` and the line:
  a `::before` at the axis (the no-script line) and an empty, `aria-hidden`
  track that the script fills with the line's pieces. A section passes its own
  padding as a `className`; `Band` sets no padding.
* **`Statement`** sets a heading (or a statement paragraph) on the axis from
  data: a list of lines, each **crossing** (`cross: [left, right]`), **hanging**,
  **pushed** or **centred** (the draft's `.vertebra`, the process steps' names).
  It owns the ground patch behind each crossing part, the hero's arrival and
  the phone regroup (`.flow-n`). Lines are joined with real spaces, so the
  heading reads as one sentence.
* **`Pair`** (`Pair`, `Yours`, `Mine`) is the reading rule: the reader's side
  ends at the axis, the studio's side starts after it, and under 900px they
  stack, hanging. A caller sets its sides' measures through two custom
  properties, `--pair-yours` and `--pair-mine`, on the className it passes,
  never by overriding `Pair`'s rules.

**The behaviour is one client component, `Spine`,** mounted once per studio page
(the home page and the legal pages): the draft's `js/page.js` and the belief's
held scene (ADR-027) on one `requestAnimationFrame` loop and one
`IntersectionObserver`. It finds what it moves through data attributes
(`data-spined`, `data-statement`, `data-line`, `data-part`, `data-cross`,
`data-seam`, `data-scene`, `data-drift`), never through CSS Module class names,
and undoes everything on unmount. It runs only when `<html>` carries `js`, so a
story (which does not) shows the finished, no-script page. The replica's tabs
are their own client component, `Workspace`.

**Where the built page departs from the draft:**

1. **The words** are `copy-v2.md`'s (ADR-028, the owner's rulings): third person,
   "Email Pratik", no "then hand them over.", and no test figures. With the
   figures gone, "Every layer, from the screen down to the server, is one
   engineer’s work." follows "Try Code.Socratic" directly.
2. **Reveals wait for the script, not just for `html.js`.** The draft hides a
   reveal from first paint under `.js`. Here a reveal hides only once `Spine` has
   started (`html.spine-live`), and whatever is already on screen at that moment
   is marked revealed first. So a script that fails to load, or a story, hides
   nothing (ADR-025 condition 1), and nothing on the first screen blinks.
3. **The no-script line waits for the script, briefly.** Next paints the server
   HTML before it hydrates, so the draft's whole-line-then-drawn-line order
   would flash. Under `html.js` and motion allowed, the `::before` line is held
   transparent for `--dur-script-wait` (2.5 s, a new token); `Spine` replaces it
   before then. If the script never comes, the whole line appears. Under reduced
   motion it is never held.
4. **The replica's accessible structure.** The workspace is a `<figure>` whose
   `<figcaption>` is the caption (the draft put an `aria-label` on a plain
   `div`, which ARIA does not allow). Its scrollable areas (the code, the
   exchange, the instructions and results panels) are focusable regions with a
   label, so a keyboard can scroll them. Its tab IDs come from `useId()`, so two
   replicas never share one.
5. **The Games section (ADR-020)** is new to the spine; the draft has none. It
   sits between About and Contact: a crossing heading (`Games | for a break`),
   one line hanging from the axis, and the tiles in a grid that starts at the
   hang and wraps (`repeat(auto-fill, minmax(…, 1fr))`), each the game's own
   icon (square, `alt=""`), its name as the one stretched link, and its line.
   The links are plain `<a>`s, so a game loads as its own page, as before.
6. **The legal pages** (not in the draft) get the masthead, the footer and the
   line: the title crosses the axis (split at its last space), the lede hangs
   from it, and each section is a pair, its heading on the reader's side and its
   text on the studio's. The legal text is unchanged.
7. **The masthead links** say `#services` on the home page and `/#services`
   elsewhere, and the wordmark says `#top` or `/`, so the same header works on
   every studio page.
8. **Spacing** maps each of the draft's clamps to the nearest step of the scale
   (DESIGN-RULES §6), so a gap may differ from the draft by a few pixels.
9. **No `theme-color` meta.** The draft sets one; on this site it would also
   tint the browser chrome on the game pages, which set their own look. Browsers
   that tint sample the page's ground, which is the same paper.
10. **The mark and the social image** (ADR-026, left to the port):
    `app/icon.svg` is the hero in miniature, a 2px-scaled ink line at 38% broken
    by one bar that crosses it, with a shorter bar hanging from it, on paper.
    `app/opengraph-image.tsx` (and `twitter-image.tsx`) draw the headline
    stepped across a 2px line on paper, with the wordmark and the city, in
    Hanken Grotesk (TTF files under `assets/og/`, OFL, because the image
    renderer reads no WOFF2). Image files cannot read CSS, so these two carry the
    palette's hexes literally, with a comment naming the token each one is.
    `public/angeronia-logo-*` are deleted once nothing refers to them.

---

### ADR-032 — After the port's review: no layout change on hydration, a fallback for a stalled script, and smaller fixes

**Recorded 2026-11-25, before the code.** Three reviews of the port (the look,
the gates, the code) found two faults that break ADR-025 and a list of smaller
ones. This entry records how each is fixed where the fix changes a rule or a
building block of ADR-031.

1. **The belief's held height is reserved by CSS, not by the script.** The held
   scene made the belief 1.8 screens tall only when `Spine` set `data-live`,
   after hydration and after the browser had already scrolled to a link's
   fragment, so everything below it moved about a screen down: `/#services`
   from the legal pages landed inside the belief, and a reload below it in
   WebKit landed a screen too far. Now the held geometry (the band's height,
   the sticky stage) applies from the first paint wherever the script will hold
   it: under `html.js`, at 900px and up, with motion allowed, the same three
   conditions `Spine` tests. `data-live` only marks the scene as running.
   **Deviation from ADR-025 condition 1:** if the script never comes on such a
   screen, the belief keeps its held height and its stage still sticks for 0.8
   of a screen, showing the finished, closed statement the whole time. Nothing
   is hidden or out of place; the band is only taller. Holding it back until the
   script arrives would move the page under the reader instead, which is the
   fault being fixed.
2. **The replica falls back to the no-script layout when the script stalls.**
   With `html.js` and before the tabs are live, CSS shows the tabs and the first
   panel only, so a bundle that fails to load left three panels out of reach
   behind tabs that did nothing. Now, if the tabs are not live after
   `--dur-script-wait` (the token ADR-031 item 3 introduced for the line), the
   replica takes the no-script layout: no tabs, every panel under its name, at
   its natural height. It is a CSS animation used only as a timer (a zero-length
   animation, delayed, that holds its end state), so it is not motion and it
   applies under reduced motion too. An element with `display: none` runs no
   animation, so before the tabs are live the panels they hide (and every
   panel's name) are taken out of the flow (`position: absolute`, clipped by
   the pane) and made `visibility: hidden` instead, which also keeps them out
   of the accessibility tree and the tab order; the timer puts them back in the
   flow and makes them visible. A browser that cannot
   animate `display` still shows every panel, with the dead tabs left above
   them. `data-ready` moves from the pane to the replica's root so one
   attribute governs both fragments.
3. **The replica's panels are tab panels only once there are tabs.** Without
   script, or before the tabs are live, a panel is a plain block under its
   visible name, with no `role="tabpanel"` pointing at a hidden tab.
4. **A reveal shows at once when it takes focus.** A block not yet revealed was
   fully transparent for a moment when Tab reached a link inside it, hiding the
   focus ring. A reveal that holds focus is shown immediately, with no
   transition, and `Spine` marks it revealed so it stays shown (WCAG 2.4.7).
5. **`Pair`'s `mine-first` order is the DOM order.** Under 900px the draft put
   the studio's side first with `column-reverse`, so the focus and reading
   order ran against the visual order (WCAG 1.3.2, 2.4.3): on a phone, Contact's
   focus went from the button at the bottom up to the address. Now a caller
   writes `Mine` before `Yours` for a `mine-first` pair; narrow, the sides stack
   in that order; wide, both sit on the pair's one row, `Yours` in the first
   column, so the desktop layout is unchanged. On desktop the sentence (hero) or
   the address (Contact) is read before the button beside it.
6. **Press feedback is motion.** The button's and the replica tab's press scale
   and the tab's underline sweep move only with motion allowed; under reduced
   motion they change state without moving.
7. **`Spine` follows a transition only if it can move a break.** It followed
   every `transitionrun` on the page (a link's hover colour included) with a
   second `requestAnimationFrame` chain. Now only transform transitions and
   animations on elements (not pseudo-elements) start a follow, and the follow
   runs inside the one loop (DESIGN-RULES §8).
8. **The two footer photographs are re-encoded** at about twice their largest
   size on the page (the statue 800px wide, the calendar 1200px), JPEG quality
   80: the same pictures, the same credits and licences, a fraction of the
   weight. The images stay unoptimised by Next (`next.config.mjs`), so their
   inert `sizes` attributes go.
9. **DESIGN-RULES §1** names the three `:global` hooks the modules use:
   `html.js`, `html.spine-live` and `html:not(.js)`. §8 lists
   `--dur-script-wait`. §12 says what each contrast gate covers: axe cannot
   judge most text on the studio pages, because the spine's `::before` line sits
   behind it, so `check:contrast` (the token pairs) is the gate for text
   contrast.
10. **The JSON-LD's remaining strings** (areas served, the address, the topics,
    the product's category) move into `site.structured` in `data/angeronia.ts`
    (DESIGN-RULES §13).

**Not changed here, left to the owner:** the pull's uneven opening on the
three third-person headings whose left halves are long, the Tutor chat's "Both
samples and all seven hidden tests pass.", and the legal pages' words (their
light/dark paragraph is no longer true, and they speak as "we").

### ADR-033 — The owner's review of the built spine

**Recorded 2026-11-25, before the code.** The owner looked through the built
site, settled the points ADR-032 left open, and changed four words.

1. **The button is "Email the studio"**, in the masthead, the hero and Contact,
   in place of "Email Pratik". Contact's heading, "Tell Pratik what you're
   building", stays.
2. **The showcase heading is "Code.Socratic, built alone"**, in place of
   "Pratik built Code.Socratic alone". It is set like the hero's: "Code.Socratic,"
   hangs from the axis and "built | alone" crosses it.
3. **The Tutor chat's turn is "Done. The tests pass."**, in place of "Done. Both
   samples and all seven hidden tests pass." The replica's words otherwise stay
   as the product shows them. The Results tab keeps its figures.
4. **The pull opens evenly.** A crossing statement moves both halves by the
   same distance: the smaller of the room on its left and the room on its right
   (ADR-031's engine moved each half by its own room). A long left half would
   leave little room, so two headings cross the axis earlier, with the same
   words: "What | the studio / takes on" and "Tell | Pratik what / you're
   building". They now open about as wide as the others.
5. **The privacy policy's three untrue sentences are corrected**, and its date
   moves to 25 November 2026. The legal "we" stays (ADR-028 covers the studio's
   marketing copy, not the legal documents).
   - What the browser stores: the studio's pages store nothing. The games keep
     progress and settings in local storage on the device. The light/dark
     switch's "theme" entry is gone with the switch (ADR-024).
   - The typefaces are Hanken Grotesk and IBM Plex Mono, served from this domain.
   - The outside links are LinkedIn, GitHub, Code.Socratic, and Wikimedia Commons
     and Creative Commons for the photographs' credits. There are no client sites.
   The terms are unchanged; nothing in them became untrue.
6. **"Right now Angeronia Labs is one person …" stays**, as written.

### ADR-034 — The fonts are files in the repo, not fetched from Google at build time

**Recorded 2026-11-25, before the code.** ADR-031 loaded both faces through
`next/font/google`, which downloads them from Google Fonts during `next build`.
On GitHub's runners Google answers with a font address that has no file
extension, and Next 15.5's loader crashes reading it
(`TypeError: Cannot read properties of null (reading '1')` at
`google/loader.js:122`). PR #11's "Types, tests, contrast and build" job failed
on it twice in a row. The same commit built locally and on Vercel, so the build
depended on what Google chose to send each machine.

* **`app/fonts.ts` loads the faces with `next/font/local`** from
  `assets/fonts/`, so `next build` makes no network request for type.
* **The files are the ones Google served and the site already used**,
  byte-for-byte (checked against the build's `/_next/static/media`):
  Hanken Grotesk's latin subset as one variable file (its `wght` axis runs
  100–900; declared `400 600`, the weights the site uses, as Google's
  stylesheet declared them), and IBM Plex Mono 400's latin subset. Each folder
  carries the font's SIL Open Font License.
* **Only the latin subset.** Every character the studio's pages render is in
  it. The other subsets (latin-ext, Vietnamese, Cyrillic; Plex Mono's box
  drawing) were declared but never used. A character outside latin falls back
  per glyph, as it did when no subset covered it (the replica's ⌘ ⇧ ⏎ already
  did).
* **What does not change:** the faces, weights, `--font-hanken` and
  `--font-plex-mono`, `display: swap`, Plex Mono's `preload: false`, the
  served files' names under `/_next/static/media`, and the privacy policy's
  sentence that the typefaces are served from this domain. Checked on the
  production build: the home page, privacy and terms at 1440 and 390 wide
  screenshot byte-for-byte the same, no text box moves, and the games' parity
  gate finds no difference inside any game.
* **What does change, invisibly:** the face's name in `font-family` is the
  variable's (`hanken`, `plexMono`) instead of "Hanken Grotesk" (the parity
  gate's only notes, on `<body>`, the page frame and the skip link); and the
  Arial fallback's metrics are computed from the file rather than from
  Google's metadata (Hanken's `size-adjust` 101.56% for 100.94%), which only
  shows for the moment before the font loads.
* **To update a face**, replace the file in `assets/fonts/` (and its licence if
  it changed), then check the pages and the games' parity gate.

### ADR-035 — After PR #11's code review: a still replica, paper, and the engine's transforms

**Recorded 2026-11-25, before the code.** A code review of PR #11 found twelve
faults, most confirmed in a browser. This entry records the fixes that change a
rule or a building block of ADR-031 and ADR-032; the rest are plain bugs fixed
in place (a chat that opened on its oldest turn after a slow load, a `<strong>`
at weight 700, game tiles wider than their list at 320px, a token of 0 read as
missing, games notes still naming Carbon).

1. **The replica's stalled-script fallback keeps the replica's size** (amends
   ADR-032 item 2). It took the no-script layout at its natural height, so on a
   slow load the replica grew by more than a screen at `--dur-script-wait` and
   shrank back when the tabs went live, moving everything below it twice
   (1280px: 560 → 1731 → 560px), against "no layout change when the script
   starts". Now, after the wait, the tabs hide and every panel shows under its
   name, stacked **inside the pane at the pane's own height, which scrolls**.
   Every panel is still in reach, and neither the timer nor a late script
   changes the page's height. Without script the replica keeps the no-script
   layout at natural height, as before. The stalled tabs are hidden as the
   panels are (out of the flow, `visibility: hidden`), never with an animated
   `display: none`: WebKit never undoes that one, so in Safari the tabs stayed
   hidden after a slow load even once they were live (found while checking
   this fix, and there before it).
2. **A late script keeps the line whole.** If the script arrives after
   `--dur-script-wait`, the page has already shown the whole line; the engine
   no longer hides it and draws it down again from the top. It knows by asking
   whether the band's hold-back animation is still running.
3. **The held belief's stage is at least a screen tall**, not exactly one:
   on a wide, short window (1920 × 400) the statement is taller than the
   screen, and the fixed height clipped words no scroll could reach.
4. **Paper gets the finished page.** Printing, or saving a PDF, left every block
   the reader had not scrolled to at opacity 0 and printed the line as the
   pieces placed for the screen. Reveals, the held scene's height and the
   drawn line now apply on screen only. Paper gets the no-script line with its
   word patches, and every statement, belief side and photograph rests in
   place. A reveal still fading in when printing starts finishes at once.
   Those print rules use `!important`, the one way a stylesheet outranks the
   transform the engine writes on the element.
5. **The engine may write `transform` and `will-change` inline** (a second
   carve-out beside ADR-005's). It writes them at runtime only, on the elements
   it moves (statement halves, the belief's sides, the line's pieces, the two
   photographs), and clears them when it stops. Nothing in markup and no other
   script does. A per-frame, scroll-linked position is data, and the direct
   write is what keeps the pull cheap; moving it through custom properties
   would rework the approved motion for no visible gain. **The owner kept this
   exception (2026-11-25)** over that stricter rework. So **Belief no longer
   sets `will-change` on Statement's and Pair's elements** (rule 2): the engine
   sets it on the belief's sides while the scene is live and clears it after.
6. **The legal pages share as themselves.** They inherited the home page's
   `og:url` and "Angeronia Labs" title, so a shared link to `/privacy` or
   `/terms` previewed as the home page. Each now sets its own Open Graph and
   Twitter title, description and URL (`legalMetadata` beside `LegalPage`).
   Setting them drops the root's file-made card, so `legalMetadata` names the
   same two images by route (`/opengraph-image`, `/twitter-image`), with the
   card's size moved into `shareImage` so the component need not import the
   card's renderer.

---

## 4. Plan closure

`docs/plans/slds2-redesign-plan.md` is **implemented**. Phases 0–6 of §8 all
landed; the deviations are ADR-001 … ADR-011 above. ADR-012 and ADR-013 are
later changes made on top of the closed plan, not part of it.

| Plan acceptance criterion | Outcome |
|---|---|
| Baseline commit + `pre-slds2` tag | Done, pushed |
| `CLAUDE.md`, `DESIGN-RULES.md`, `DECISIONS.md` | Done |
| Skills visible | Three `design-systems-*` skills under `.claude/skills/` |
| Strict build green, no `ignoreBuildErrors` | Done |
| Brand button Teal 60 + white text, both schemes | `#007d79` on `#fff`, 4.99:1 |
| Links Teal 70 light / Teal 40 dark | `#005d5d` / `#08bdba`, verified in the browser |
| IBM Plex, self-hosted, no `fonts.googleapis.com` | Served from `/_next/static/media` |
| `slds-linter` clean | Zero violations, every rule at `error` |
| `check:theme` clean | 30 hooks, 11 blue literals, 58 pairings at AA |
| No Salesforce artwork in the bundle | Eight dangling references stripped and asserted |
| Every Tier-1 component: docs, default, variants, dark | Done |
| `test:storybook` zero a11y violations | 185 tests, 50 files, green |
| Story ≡ `localhost:3000` | `Pages/Home` and `app/page.tsx` compose the same list |
| No `ang-*`, citron, roughjs, Space Grotesk, Geist, "Salesforce" in the HTML | Verified against the rendered page — true at plan closure; `roughjs` was reinstated afterwards by ADR-012 |
| CSS ≤ 150 KB gzip | ~47 KB total |
| Lighthouse mobile: perf ≥ 90, a11y 100, best practices ≥ 95 | 97 / 100 / 100, SEO 100, CLS 0 |
| CI: typecheck, lint, theme, stories | `.github/workflows/ci.yml` |
| README rewritten, PR template | Done |
| Tier-2 components | Accordion, Alert, Breadcrumbs, ButtonMenu, Checkbox, CheckboxToggle, EmptyState, ExpandableSection, Form Element, Input, Modal, PageHeader, Pill, Popover, RadioGroup, Select, Spinner, Tabs, Textarea, Toast, Tooltip |

**Still open at closure, since resolved:** O7 (licensing acceptance). The SLDS 2
Terms of Use were not accepted — ADR-015 removes `@salesforce-ux/*` entirely and
rebuilds the UI layer on IBM Carbon. Everything in the table above describes the
SLDS 2 implementation as it stood at plan closure on 2026-09-04; it is history,
not the current state.

Not in scope for this work, and unchanged: O5
(Next.js 16, deliberately deferred to its own PR), O6 (deploying Storybook as a
separate Vercel project), O8 (a density toggle — SLDS 2 exposes no supported
switch, so the site is comfy-only). O3 was still open at closure and has since
been settled by ADR-012.
