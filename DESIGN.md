# Design system: Lasercom

**North star: "Obsidian hardware & precision beam".** A serious, calm industrial-luxury atelier built on deep matte obsidian graphite (`#0B0C0E`), warm off-white ink (`#F3F2EE`), and a single warm amber-vermilion laser accent (`--laser`) reserved strictly for the beam, active optical dots, and surgical highlights.

## Colour

- Obsidian (default `:root`): background `oklch(0.145 0.006 255)`, elevated card `oklch(0.182 0.007 255)`, ink `oklch(0.955 0.006 80)`, muted `oklch(0.68 0.008 255)`, 1px hairline border `oklch(1 0 0 / 10%)`.
- Steel (`.steel`): recessed obsidian stage `oklch(0.12 0.006 255)` for closing panels and footer.
- Primary CTA: warm off-white pill (`--primary`) with obsidian ink (`--primary-foreground`) for authoritative contrast.
- Laser accent: `--laser` `oklch(0.68 0.2 38)` and `--laser-ink` `oklch(0.74 0.17 40)`.
- White-background workshop photos (`.cutout` via `work-photo.astro`) sit cleanly on a warm studio plinth (`--paper`).

## Type

- Display (`.display`): Archivo Variable at its expanded `125%` width, weight `700` (`800` on the home headline), tight `-0.035em` tracking, `1.02` line-height, no awkward word hyphenation on mobile. Same font file as the body, so it costs no extra download.
- Body: Archivo Variable at normal width and comfortable reading line-height.
- Readouts (`.readout`): JetBrains Mono, `0.7rem`, uppercase, wide `0.14em` tracking.
- Sentence case everywhere.

## 3D & Signature Moments

- **Plaque hero** (`plaque-hero.astro` + `src/lib/monolith-3d.ts`): a brushed steel plaque in Three.js that rises edge-on and turns to face the visitor as the page opens, then is engraved as the visitor scrolls, in three beats: the headline over the plaque, 56 raster passes engraved live with sparks and a moving gantry, then a slow tilt that rakes the light across the finished engraving, with the calls to action. Pinned on desktop, a sticky 240svh runway on phones, where the story chases the scroll at a capped pace so a hard swipe never skips a beat. The headline paints with the HTML; GSAP, Three.js and Lottie load after the first paint so they never hold back the LCP. Without a hardware GPU the 3D piece is skipped.
- **Home in five calm movements** (`home-content.astro`):
  1. Plaque hero
  2. Real work filmstrip (`work-showcase.astro`): pinned horizontal reel on desktop, swipe rail on phones
  3. Two audiences (`01 / Empresas e industria`, `02 / Particulares`)
  4. 4-step process + verified Google reviews + Riba-roja workshop strip
  5. Guides, FAQ & closing stage (`close-section.astro`)
- **Mobile-first ergonomics**: clean obsidian bottom action bar (`action-bar.astro`), refined full-height slide drawer (`header.astro`), native scrolling on touch screens, and matching dark `#0b0c0e` browser `theme-color`.
