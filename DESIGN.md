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
- **Home in five movements** ("from beam to piece", after the design library's Cepa, Moahu and United Carriers): the scrubbed film; the laser bed; the pieces; proof (reviews, two audiences, workshop and steps); the way in (guides, FAQ, closing panel).
- **Laser bed** (`engrave-bench.astro`, its own page `/prueba-tu-grabado/` · `/en/try-your-engraving/`, where its title is the h1; on the home, `bench-teaser.astro` keeps `#materiales` with three stills rendered by the bed in `assets/bench/` and a button to the page, so the home never loads WebGL): a dark machine bed (dot grid, rulers, gantry) with one real piece per material (`lib/bench.ts`): a screwed steel plate, a black anodised card, a brass tag, a plastic part, a wooden coaster, a stitched leather patch, a clear acrylic block. Choosing a material morphs the piece's shape. The piece is a real-time 3D render (Three.js, `lib/engrave-3d.ts`, loaded only as the bed nears the screen): an extruded piece with thickness and bevelled edges on an aluminium honeycomb, lit by a warm studio spot with soft shadows and a contact shadow; physical materials (brushed anisotropic metal reflecting a studio environment, acrylic that refracts the bed beneath it, leather with sheen, a charred laser-cut edge on wood); the camera drifts a few degrees with the pointer. The visitor's text is a height map (`lib/engrave-map.ts`) carved into the top face per frame (bump, colour, roughness, metalness): dark annealing on steel, bright metal under anodising, charred wood, frosted acrylic; the fresh cut glows and cools behind the beam, and the beam lights the surface it burns. Changing material lifts the old piece off and sets the new one down. The beam fills the file like the machine does, raster line after raster line, firing (sparks, spot glow) only over the ink; sparks on the fibre laser, smoke on the CO2. Three letterings (the brand's sans, Cormorant Garamond, Great Vibes for gifts; the last two load only with the bench). Visitors can drop their own logo (PNG, SVG, JPG): it becomes the burn mask in the browser and is never uploaded, and the quote button asks to send it on WhatsApp. When a piece is done, a glint crosses the quote button. Hardware is geometry: domed screws on the steel plate, a real hole through the brass tag, saddle stitching on the leather; faint scratches only in the reflection and a heat tint around marks on steel. "Save the preview" turns the render into a 1600×1200 image with a caption (on phones it opens the share sheet, so it can go to WhatsApp with the photo). Without WebGL or with reduced motion, CSS layers draw it flat. It waits until it is in view and engraves on its own time (Moahu's action, arrival, pause). The quote button carries the text, the material and the lettering to WhatsApp.
- **Pieces as cuts** (`work-curtains.astro`): five real jobs open with a rounded `clip-path: inset(... round 22px)` scrubbed by the scroll, across on even rows and down on odd rows and phones, the photo settling from 1.12 to 1, with one burnt typographic pause between them.
- **Header takes the ground**: a 1px band under the bar watches `main .steel` sections and switches the header to steel over them.
- **Statement burn**: words light up as you scroll.
- Everything is visible without JavaScript; `prefers-reduced-motion` removes all motion. Never use `once: true` on ScrollTriggers (see `PLAY_ONCE` in `animations.ts`).

## Components
- Buttons: fully round, 56px in heroes, laser fill for the primary action, outline for secondary.
- Closing panel (`close-section.astro`) ends every page: steel, display headline, WhatsApp, phone, email, address and hours.
- Floating WhatsApp button on every page.
