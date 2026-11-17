import type { ImageMetadata } from "astro"

const photos = import.meta.glob<{ default: ImageMetadata }>(
  "../assets/work/*.{webp,jpg,png}",
  { eager: true }
)

// A photo of the workshop's own jobs, by file name without extension
export function photo(name: string): ImageMetadata {
  const entry = Object.entries(photos).find(
    ([path]) => path.replace(/^.*\/|\.\w+$/g, "") === name
  )
  if (!entry) throw new Error(`No photo named ${name} in src/assets/work`)
  return entry[1].default
}

// Photos shot on a white background: on the plywood page they are multiplied
// in, so the white disappears and only the object remains
export const cutouts = new Set([
  "abanico",
  "chapa_5j_sin_fondo",
  "collar_perro_laser",
  "falla_colonia_sin_fondo",
  "grabado_en_crista",
  "grabado_placa_laser",
  "logo_laser",
  "mandala_cortado_laser",
  "nombre_corte_laser",
  "nombre_madera_laser",
  "peana_grabada",
  "tarjeta_casfid",
  "tarjeta_grabado_laser_nobg",
  "grabado_laser_castaneulas",
  "grabado_laser_placa_hospital",
])

// Workshop clips: public/video/metal/<name>.{webm,mp4}, poster in
// src/assets/film/<name>.jpg, caption in film.<name>. Phone footage from the
// workshop, upscaled with Real-ESRGAN and sped up into short timelapses
export const films = {
  "rotulo-disco": { folder: "metal", shape: "portrait" },
  "dibujo-chapa": { folder: "metal", shape: "landscape" },
} as const
export type FilmName = keyof typeof films

export const serviceFaqIndices = [1, 2, 3, 4, 5] as const

export const serviceIds = [
  "madera",
  "metacrilato",
  "cristal",
  "piel",
  "metal",
  "plastico",
  "industrial",
  "empresas",
  "bodas",
  "joyeria",
  "letras",
  "decoracion",
  "personalizado",
] as const
export type ServiceId = (typeof serviceIds)[number]

export type Service = {
  // Spanish path (the previous site's, where there was one) and English path
  es: string
  en: string
  kind: "material" | "client"
  // Photo names in src/assets/work, the first one leads the page. Empty
  // until the workshop has real photos of that kind of job: never stock or
  // generated images
  photos: string[]
  // Real footage from the workshop's own machines (see filmNames)
  films?: FilmName[]
  related: ServiceId[]
}

export const services: Record<ServiceId, Service> = {
  madera: {
    es: "/impresion-corte-grabado-laser-madera/",
    en: "/en/laser-cutting-engraving-wood/",
    kind: "material",
    photos: [
      "nombre_madera_laser",
      "mandala_cortado_laser",
      "madring_1",
      "grabado_laser_pieza_madera",
      "nombre_corte_laser",
      "grabado_laser_castaneulas",
      "grbrado_laser_pieza_madera_4",
    ],
    related: ["bodas", "decoracion", "personalizado"],
  },
  metacrilato: {
    es: "/corte-grabado-laser-cristal-metacrilato/",
    en: "/en/laser-cutting-engraving-acrylic-glass/",
    kind: "material",
    photos: [
      "tarjeta_grabado_laser_nobg",
      "pawnees_1",
      "fotograbado_1",
      "grabado_en_crista",
      "maqueta_escala_metacrilato_2",
      "corte_laser_metacrilato_cristal_online_1",
      "grabado_laser_cristal_vidrio",
      "grabado_laser_metacrilato_com",
    ],
    related: ["cristal", "letras", "empresas"],
  },
  cristal: {
    es: "/grabado-laser-cristal-copas/",
    en: "/en/laser-engraving-glass/",
    kind: "material",
    photos: [
      "grabado_en_crista",
      "grabado_laser_cristal_vidrio",
      "corte_laser_metacrilato_cristal_online_1",
    ],
    related: ["bodas", "empresas", "metacrilato"],
  },
  piel: {
    es: "/corte-grabado-laser-piel-cuero/",
    en: "/en/laser-engraving-leather/",
    kind: "material",
    photos: [
      "cortar_grabar_piel_laser_1",
      "cortar_grabar_piel_laser_3",
      "cortar_grabar_piel_laser_2-1",
      "cortar_grabar_piel_laser_4-1",
    ],
    related: ["empresas", "personalizado", "metal"],
  },
  metal: {
    es: "/corte-grabado-laser-metal-acero/",
    en: "/en/laser-engraving-metal-stainless-steel/",
    kind: "material",
    photos: [
      "chapa_5j_sin_fondo",
      "tarjeta_casfid",
      "collar_perro_laser",
      "grabado_laser_marcas_material",
      "grabado_laser_placa_hospital",
      "logo_laser",
    ],
    films: ["rotulo-disco", "dibujo-chapa"],
    related: ["industrial", "plastico", "joyeria"],
  },
  plastico: {
    es: "/grabado-laser-plastico/",
    en: "/en/laser-engraving-plastic/",
    kind: "material",
    photos: [],
    related: ["industrial", "metal", "empresas"],
  },
  industrial: {
    es: "/marcado-laser-industrial/",
    en: "/en/industrial-laser-marking/",
    kind: "client",
    photos: [
      "grabado_laser_placa_hospital",
      "torrejon_1",
      "torrejon_2",
      "grabado_laser_marcas_material",
      "grabado_placa_laser",
      "logo_laser",
    ],
    related: ["metal", "plastico", "empresas"],
  },
  empresas: {
    es: "/merchandising-grabado-laser-empresas/",
    en: "/en/laser-engraved-corporate-gifts/",
    kind: "client",
    photos: [
      "peana_grabada",
      "tarjeta_casfid",
      "chapa_5j_sin_fondo",
      "madring_1",
      "cortar_grabar_piel_laser_4-1",
      "abanico_exclusivo_louis_vuitton_4",
    ],
    related: ["industrial", "letras", "piel"],
  },
  bodas: {
    es: "/regalos-personalizados-bodas-eventos/",
    en: "/en/personalised-wedding-event-gifts/",
    kind: "client",
    photos: [
      "grabado_en_crista",
      "nombre_madera_laser",
      "abanico",
      "mandala_cortado_laser",
      "nombre_corte_laser",
    ],
    related: ["cristal", "madera", "joyeria"],
  },
  joyeria: {
    es: "/grabado-laser-joyeria/",
    en: "/en/jewellery-laser-engraving/",
    kind: "client",
    photos: ["collar_perro_laser", "chapa_5j_sin_fondo", "tarjeta_casfid"],
    related: ["metal", "bodas", "personalizado"],
  },
  letras: {
    es: "/letras-corporativas-corte-laser/",
    en: "/en/laser-cut-letters-signs/",
    kind: "client",
    photos: [
      "logo_laser",
      "nombre_corte_laser",
      "falla_colonia_sin_fondo",
      "fachada_lasercom",
    ],
    related: ["metacrilato", "madera", "empresas"],
  },
  decoracion: {
    es: "/corte-laser-decoracion/",
    en: "/en/laser-cutting-decoration/",
    kind: "client",
    photos: [
      "abanico_exclusivo_louis_vuitton-2",
      "corte_grabado_laser_decorar_2",
      "abanico_amarillo_logotipo_varillas_1",
      "maqueta_escala_metacrilato_1",
      "falla_colonia_sin_fondo",
      "mandala_cortado_laser",
    ],
    related: ["madera", "metacrilato", "bodas"],
  },
  personalizado: {
    es: "/corte-grabado-laser-personalizado/",
    en: "/en/custom-laser-cutting-engraving/",
    kind: "client",
    photos: [
      "nombre_corte_laser",
      "fotograbado_1",
      "grabado_laser_castaneulas",
      "tarjeta_grabado_laser_nobg",
      "collar_perro_laser",
      "cortar_grabar_piel_laser_3",
    ],
    related: ["madera", "metal", "bodas"],
  },
}
