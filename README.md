# angeronia.com

Marketing / landing site for **Angeronia Labs LLC** — a boutique software
engineering studio in Philadelphia, and the maker of
[Code Socratic](https://code-socratic.com).

Built on the same citron-on-paper editorial design system as
[pratik-kubal.com](https://pratik-kubal.com), adapted for a consultancy, with two
signature devices that set it apart from that portfolio:

1. **The Möbius band** — the studio's brand mark ("one continuous surface"),
   rendered once as a hand-drawn (rough.js) 3D band in the hero: auto-rotating and
   drag-scrubbable.
2. **Scroll-scrubbed animations** — everything below the hero is scroll-linked,
   with prose kept terse in favour of visuals:
   - the Philosophy **continuity line** — a single unbroken stroke that draws
     itself as you scroll, a pen dot riding the tip (`use-continuity-scrub`)
   - the Process timeline rail that fills and lights each step (`use-process-scrub`)
   - the Proof **meter graph** — bars that fill and numbers that count with scroll
     (`use-metrics-meters`)

Copy is deliberately terse: long paragraphs are replaced by the continuity line,
the meter graph, and the About coverage strip. Layout is editorial (stacked rows /
meters), not grids; no ordinal numbering.

## Stack

- Next.js 15 (App Router) + React 19, TypeScript
- Tailwind CSS v4 (design tokens in `app/globals.css`, scoped under `.ang-root`)
- `next-themes` — three themes (Light / Dark / Noir) via `data-theme` on `<html>`
- `roughjs` (lazy-loaded) for the Möbius; `animejs` available for future motion
- No backend — statically prerendered.

## Develop

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build (fully static)
```

## Layout

```
app/
  layout.tsx        fonts, metadata, JSON-LD, theme provider, motion gate
  page.tsx          section composition
  globals.css       the whole design system + component styles
data/
  angeronia.ts      single source of truth for all copy + structured data
components/angeronia/
  brand-mark.tsx    theme-aware SVG recreation of the Angeronia Labs cursor mark
  mobius-figure.tsx rough.js Möbius (hero)
  continuity-line.tsx  the scroll-drawn single-stroke SVG (philosophy)
  hero, philosophy, services, process, product-spotlight, metrics,
  about, contact, site-footer, nav, theme-toggle, scroll-spine, reveals
lib/angeronia/
  scroll.ts             clamp / rAF scroll binding / reduced-motion helpers
  use-continuity-scrub  scroll-drawn continuity line + pen + beats
  use-process-scrub     scroll-scrubbed timeline rail + step activation
  use-metrics-meters    scroll-scrubbed meter graph (count + bar fill)
  use-section-reveals   enter-only fade/rise reveals
public/
  angeronia-logo-light.png / -dark.png   raster logos (OG / social)
```

Accessibility: everything degrades to a static final state with no JS and honors
`prefers-reduced-motion` (no scrubbing, all content visible). The Möbius is not
loaded on the philosophy section when reduced motion is set.

© 2026 Angeronia Labs LLC.
