import type { ServiceId } from "@/lib/services"

// Real jobs from the workshop. Copy lives in work.<slug>.* (messages/site.ts);
// photos are file names in src/assets/work, the first one leads; filters are
// the /trabajos/ tabs it shows under. New jobs: `pnpm trabajo` (scripts/new-work.mjs)
export type WorkFilter =
  "business" | "wood" | "acrylic_glass" | "metal" | "leather"

export const work = [
  {
    slug: "ktf",
    filters: ["business", "metal"],
    photos: ["ktf_1", "ktf_2"],
    service: "metal",
  },
  {
    slug: "torrejon",
    filters: ["business"],
    photos: ["torrejon_1", "torrejon_2"],
    service: "industrial",
  },
  {
    slug: "madring",
    filters: ["wood", "business"],
    photos: ["madring_1"],
    service: "madera",
  },
  {
    slug: "pawnees",
    filters: ["acrylic_glass"],
    photos: ["pawnees_1"],
    service: "metacrilato",
  },
  {
    slug: "fotograbado",
    filters: ["acrylic_glass"],
    photos: ["fotograbado_1"],
    service: "personalizado",
  },
  {
    slug: "barcelo",
    filters: ["wood", "business"],
    photos: [
      "peana_grabada",
      "corte_grabado_laser_decorar_2",
      "corte_grabado_laser_decorar_3",
      "corte_grabado_laser_decorar",
      "peana_grabada_a_laser",
    ],
    service: "decoracion",
  },
  {
    slug: "lv",
    filters: ["wood", "business"],
    photos: [
      "abanico_exclusivo_louis_vuitton-2",
      "abanico_exclusivo_louis_vuitton_4",
      "abanico_exclusivo_louis_vuitton_3",
    ],
    service: "decoracion",
  },
  {
    slug: "lv2",
    filters: ["wood", "business"],
    photos: ["abanico_amarillo_logotipo_varillas_1"],
    service: "empresas",
  },
  {
    slug: "maqueta",
    filters: ["acrylic_glass", "wood", "business"],
    photos: ["maqueta_escala_metacrilato_2", "maqueta_escala_metacrilato_1"],
    service: "decoracion",
  },
  {
    slug: "falla",
    filters: ["wood"],
    photos: ["falla_colonia_sin_fondo"],
    service: "madera",
  },
  {
    slug: "copa",
    filters: ["acrylic_glass"],
    photos: [
      "grabado_en_crista",
      "corte_laser_metacrilato_cristal_online_1",
      "grabado_laser_cristal_vidrio",
    ],
    service: "cristal",
  },
  {
    slug: "chapa",
    filters: ["metal", "business"],
    photos: ["chapa_5j_sin_fondo"],
    service: "empresas",
  },
  {
    slug: "casfid",
    filters: ["metal", "business"],
    photos: ["tarjeta_casfid", "tarjeta_grabado_laser_nobg"],
    service: "metal",
  },
  {
    slug: "piel",
    filters: ["leather"],
    photos: [
      "cortar_grabar_piel_laser_1",
      "cortar_grabar_piel_laser_3",
      "cortar_grabar_piel_laser_2-1",
      "cortar_grabar_piel_laser_4-1",
      "grabado_laser_piel_valencia",
    ],
    service: "piel",
  },
  {
    slug: "guitarra",
    filters: ["wood"],
    photos: [
      "grbrado_laser_pieza_madera_4",
      "grabado_laser_castaneulas",
      "grabrado_laser_pieza_madera_3",
    ],
    service: "madera",
  },
  {
    slug: "mandala",
    filters: ["wood"],
    photos: [
      "mandala_cortado_laser",
      "nombre_corte_laser",
      "nombre_madera_laser",
    ],
    service: "madera",
  },
  {
    slug: "placa",
    filters: ["metal", "business"],
    photos: [
      "grabado_laser_placa_hospital",
      "grabado_placa_laser",
      "logo_laser",
    ],
    service: "industrial",
  },
  {
    slug: "portatiles",
    filters: ["business"],
    photos: ["portatiles_1"],
    service: "plastico",
  },
  {
    slug: "boligrafo",
    filters: ["metal"],
    photos: ["boligrafo_1"],
    service: "personalizado",
  },
  {
    slug: "dedicatoria",
    filters: ["metal"],
    photos: ["dedicatoria_1"],
    service: "metal",
  },
  {
    slug: "nebrija",
    filters: ["business"],
    photos: ["nebrija_1", "nebrija_2"],
    service: "empresas",
  },
  {
    slug: "saab",
    filters: ["acrylic_glass", "business"],
    photos: ["saab_1", "saab_2"],
    service: "cristal",
  },
  {
    slug: "muestra",
    filters: ["wood", "acrylic_glass", "business"],
    photos: ["muestra_1", "muestra_2", "muestra_3"],
    service: "decoracion",
  },
  {
    slug: "boda",
    filters: ["wood"],
    photos: ["boda_1", "boda_2"],
    service: "bodas",
  },
  {
    slug: "mallorca",
    filters: ["wood"],
    photos: ["mallorca_1"],
    service: "madera",
  },
  {
    slug: "skate",
    filters: ["wood", "business"],
    photos: ["skate_1"],
    service: "madera",
  },
] as const satisfies readonly {
  slug: string
  filters: readonly WorkFilter[]
  photos: readonly string[]
  service: ServiceId
}[]

export type WorkSlug = (typeof work)[number]["slug"]
