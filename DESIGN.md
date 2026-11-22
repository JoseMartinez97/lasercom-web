# Design system: Lasercom

**North star: "Obsidian hardware & precision beam".** A serious, calm industrial-luxury atelier built on deep matte obsidian graphite (`#0B0C0E`), warm off-white ink (`#F3F2EE`), and a single warm amber-vermilion laser accent (`--laser`) reserved strictly for the beam, active optical dots, and surgical highlights.

## Colour

- Obsidian (default `:root`): background `oklch(0.145 0.006 255)`, elevated card `oklch(0.182 0.007 255)`, ink `oklch(0.955 0.006 80)`, muted `oklch(0.68 0.008 255)`, 1px hairline border `oklch(1 0 0 / 10%)`.
- Steel (`.steel`): recessed obsidian stage `oklch(0.12 0.006 255)` for closing panels and footer.
- Primary CTA: warm off-white pill (`--primary`) with obsidian ink (`--primary-foreground`) for authoritative contrast.
- Laser accent: `--laser` `oklch(0.68 0.2 38)` and `--laser-ink` `oklch(0.74 0.17 40)`.
- White-background workshop photos (`.cutout` via `work-photo.astro`) sit cleanly on a warm studio plinth (`--paper`).

## Type

- Display (`.display`): Archivo Variable at natural `100%` width, weight `600`, tight `-0.032em` tracking, `1.04` line-height, no awkward word hyphenation on mobile.
- Body: Archivo Variable at normal width and comfortable reading line-height.
- Readouts (`.readout`): JetBrains Mono, `0.7rem`, uppercase, wide `0.14em` tracking.
- Sentence case everywhere.

## 3D & Signature Moments

- **Blender → Three.js Hero Stage** (`scripts/blender/build_laser_hero.py` → `public/models/laser-hero.glb` + `src/assets/hero-laser-poster.png`, rendered by `src/lib/hero-laser-3d.ts`): a precision CNC machined optical laser head with copper nozzle hovering over a brushed dark stainless steel plate on machine bed slats. An instant Cycles-rendered WebP poster guarantees 0ms LCP before Three.js (`GLTFLoader` + `RoomEnvironment`) crossfades in and animates the laser head tracing a live molten amber-orange kerf with micro-sparks, dynamic focal lighting, and live `X / Y mm` bed coordinates. Zero scroll-hijacking on desktop or mobile.
- **Home in five calm movements** (`home-content.astro`):
  1. Hero & 3D Laser Stage
  2. Two Audiences (`01 / Empresas e industria`, `02 / Particulares`) + 6-material grid + link to the interactive 3D bench
  3. Curated Real Work gallery (`work-photo.astro`)
  4. 4-step process + verified Google reviews (`4.5/5`) + Riba-roja workshop strip
  5. Guides, FAQ & Closing Stage (`close-section.astro`)
- **Mobile-first ergonomics**: clean obsidian bottom action bar (`action-bar.astro`), refined full-height slide drawer (`header.astro`), native smooth scrolling without pinned ScrollTrigger traps, and matching dark `#0b0c0e` browser `theme-color`.
- **Interactive 3D Bench** (`engrave-bench.astro`, `/prueba-tu-grabado/` · `/en/try-your-engraving/`): real-time 3D engraving previewer where visitors test text or logos on workshop materials and send a quote via WhatsApp.
