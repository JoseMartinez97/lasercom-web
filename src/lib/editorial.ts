import type { ImageMetadata } from "astro"

import heroLaserCutting from "@/assets/editorial/hero-laser-cutting.jpg"
import materialAcrylic from "@/assets/editorial/material-acrylic.jpg"
import materialGlass from "@/assets/editorial/material-glass.jpg"
import materialLeather from "@/assets/editorial/material-leather.jpg"
import materialMetal from "@/assets/editorial/material-metal.jpg"
import materialWood from "@/assets/editorial/material-wood.jpg"
import techniqueFiberMark from "@/assets/editorial/technique-fiber-mark.jpg"
import techniqueWoodBeam from "@/assets/editorial/technique-wood-beam.jpg"

export const editorialPhotos = {
  "hero-laser-cutting": heroLaserCutting,
  "technique-wood-beam": techniqueWoodBeam,
  "technique-fiber-mark": techniqueFiberMark,
  "material-wood": materialWood,
  "material-acrylic": materialAcrylic,
  "material-metal": materialMetal,
  "material-leather": materialLeather,
  "material-glass": materialGlass,
} as const satisfies Record<string, ImageMetadata>

export type EditorialPhotoId = keyof typeof editorialPhotos
