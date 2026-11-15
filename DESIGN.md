# Design system: Lasercom

**North star: "Plywood and beam".** The page is a warm birch board; the type is burnt into it. Dark "steel" sections are the machine's bed, where the laser glows. One saturated laser red-orange is the only hue, used for the beam, the calls to action and small markers.

Inherits structure and motion vocabulary from the Kaizencode site (edge-to-edge sections, hairline rows, sticky stacked panels, work index, GSAP + ScrollTrigger + Lenis, CSS entrance) but not its palette or typeface.

## Colour
- Plywood (light, default): background `oklch(0.955 0.014 78)`, ink `oklch(0.2 0.012 55)`, muted `oklch(0.45 0.02 60)`, secondary surface `oklch(0.91 0.018 76)`.
- Steel (`.steel` class switches the tokens): background `oklch(0.175 0.006 255)`, text `oklch(0.965 0.008 80)`.
- Laser: `--laser` `oklch(0.64 0.23 33)` for glow and marks; `--laser-ink` for text and filled buttons (4.5:1 under white text).
- Photos shot on white get `mix-blend-mode: multiply` on plywood (`.cutout`) so only the object remains. On steel they sit on a white tile.

## Type
- Display: Archivo Variable, width 125%, weight 800, tight tracking (`display` utility). Mirrors the wide geometric wordmark. Hyphenates rather than breaking words.
- Body: Archivo Variable at normal width.
- Readouts: JetBrains Mono, 12px, uppercase, wide tracking (`readout` utility) — the only uppercase on the site.
- Sentence case everywhere.

## Signature moments
- **Engraving** (`.engrave` in `global.css`): a beam crosses each title line and leaves the letters glowing hot, cooling to ink. Hero lines run one after another.
- **Cut mark**: after the hero title, the beam traces the Lasercom "L" and its faces fill in.
- **Cut lines** (`[data-cut]`): SVG paths drawn with the scroll with a glowing dot on the cutting edge (the gear in the statement, the line at the top of the closing panel).
- **Materials stack**: four full-height panels alternating plywood and steel, sticky on desktop only.
- **Statement burn**: words light up as you scroll.
- Everything is visible without JavaScript; `prefers-reduced-motion` removes all motion. Never use `once: true` on ScrollTriggers (see `PLAY_ONCE` in `animations.ts`).

## Components
- Buttons: fully round, 56px in heroes, laser fill for the primary action, outline for secondary.
- Closing panel (`close-section.astro`) ends every page: steel, display headline, WhatsApp, phone, email, address and hours.
- Floating WhatsApp button on every page.
