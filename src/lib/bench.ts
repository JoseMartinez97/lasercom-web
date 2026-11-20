import type { ServiceId } from "@/lib/services"

// The laser bed on its own page (engrave-bench.astro): the visitor types a
// text and picks a material, and the beam engraves it. Only what the two
// machines really do (PRODUCT.md): the fibre laser marks every metal and
// plastic, the CO2 lasers cut and engrave organic materials. The surface and
// mark colours live in the component's CSS, by id
export const benchMaterials = [
  { id: "acero", laser: "fibre", service: "metal" },
  { id: "aluminio", laser: "fibre", service: "metal" },
  { id: "laton", laser: "fibre", service: "metal" },
  { id: "plastico", laser: "fibre", service: "plastico" },
  { id: "madera", laser: "co2", service: "madera" },
  { id: "piel", laser: "co2", service: "piel" },
  { id: "metacrilato", laser: "co2", service: "metacrilato" },
  { id: "cristal", laser: "co2", service: "cristal" },
] as const satisfies readonly {
  id: string
  laser: "fibre" | "co2"
  service: ServiceId
}[]

export type BenchMaterialId = (typeof benchMaterials)[number]["id"]

// Longest text the bed takes: it still fits one line on a phone
export const benchMaxLength = 26

// Lettering for the bench: the brand's sans, an engraver's serif and a script
// for gifts. Only the sans ships with the page; the others load with the bench
export const benchFonts = [
  { id: "sans", family: '"Archivo Variable", sans-serif', weight: 650 },
  { id: "serif", family: '"Cormorant Garamond Variable", serif', weight: 650 },
  { id: "script", family: '"Great Vibes", cursive', weight: 400 },
] as const
export type BenchFontId = (typeof benchFonts)[number]["id"]
