import { site, legal } from "./messages/site"
import { materials } from "./messages/materials"
import { clients } from "./messages/clients"
import { photos } from "./messages/photos"
import { guides } from "./messages/guides"
import { home } from "./messages/home"

export const languages = {
  es: "Español",
  en: "English",
} as const

export type Lang = keyof typeof languages

export const defaultLang: Lang = "es"

// Messages live in ./messages, one file per area of the site
export const ui = {
  en: {
    ...site.en,
    ...legal.en,
    ...materials.en,
    ...clients.en,
    ...photos.en,
    ...guides.en,
    ...home.en,
  },
  es: {
    ...site.es,
    ...legal.es,
    ...materials.es,
    ...clients.es,
    ...photos.es,
    ...guides.es,
    ...home.es,
  },
} as const

export type UiKey = keyof (typeof ui)[typeof defaultLang]

// Compile-time parity: English must define every key Spanish does
ui.en satisfies Record<UiKey, string>
