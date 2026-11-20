// The materials named under the home's engraving scene (#materiales), each
// linking to its service page. From PRODUCT.md; ids match the bench's names
// (bench.m.*)
import type { ServiceId } from "@/lib/services"

type ShowcaseMaterialId =
  | "acero"
  | "madera"
  | "laton"
  | "cristal"
  | "piel"
  | "aluminio"
  | "metacrilato"
  | "plastico"

export const showcaseMaterials: {
  id: ShowcaseMaterialId
  service: ServiceId
}[] = [
  { id: "acero", service: "metal" },
  { id: "madera", service: "madera" },
  { id: "laton", service: "metal" },
  { id: "cristal", service: "cristal" },
  { id: "piel", service: "piel" },
  { id: "aluminio", service: "metal" },
  { id: "metacrilato", service: "metacrilato" },
  { id: "plastico", service: "plastico" },
]

// Rows the beam rasters over the plaque: the 3D shader and the job sheet's
// pass count read the same number
export const ENGRAVE_ROWS = 56
