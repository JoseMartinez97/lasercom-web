import type { ServiceId } from "@/lib/services"

// Guides: plain answers to what people search before asking for a quote.
// Their titles and leads are in i18n/messages/guides.ts; the bodies are
// Markdown in src/content/guides/<lang>/<id>.md
export const guideIds = [
  "corte-o-grabado",
  "materiales",
  "preparar-archivo",
] as const
export type GuideId = (typeof guideIds)[number]

export const guides: Record<
  GuideId,
  { es: string; en: string; photo: string; services: ServiceId[] }
> = {
  "corte-o-grabado": {
    es: "/guias/corte-o-grabado-laser/",
    en: "/en/guides/laser-cutting-vs-engraving/",
    photo: "mandala_cortado_laser",
    services: ["madera", "personalizado", "industrial"],
  },
  materiales: {
    es: "/guias/materiales-corte-grabado-laser/",
    en: "/en/guides/laser-cutting-engraving-materials/",
    photo: "corte_laser_metacrilato_cristal_online_1",
    services: ["madera", "metacrilato", "piel", "metal"],
  },
  "preparar-archivo": {
    es: "/guias/preparar-archivo-corte-laser/",
    en: "/en/guides/prepare-file-laser-cutting/",
    photo: "logo_laser",
    services: ["personalizado", "empresas", "letras"],
  },
}

// When the guides were last revised, for readers and for the Article data
export const guidesUpdated = "2026-11-14"
