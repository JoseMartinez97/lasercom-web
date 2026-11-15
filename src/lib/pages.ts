import type { UiKey } from "@/i18n/ui"
import { services, serviceIds, type ServiceId } from "@/lib/services"
import { guides, guideIds, type GuideId } from "@/lib/guides"

// Every page of the site, keyed by its Spanish path. Spanish lives at the
// root, English under /en/ with its own slugs; legal pages are Spanish-only
export type Page = {
  en: string | null
  title: UiKey
  description: UiKey
  kind: "home" | "service" | "work" | "contact" | "legal" | "guides" | "guide"
  service?: ServiceId
  guide?: GuideId
  legal?: string
}

export const pages: Record<string, Page> = {
  "/": {
    en: "/en/",
    title: "home.title",
    description: "home.description",
    kind: "home",
  },
  ...Object.fromEntries(
    serviceIds.map((id) => [
      services[id].es,
      {
        en: services[id].en,
        title: `svc.${id}.title` satisfies UiKey,
        description: `svc.${id}.description` satisfies UiKey,
        kind: "service",
        service: id,
      } satisfies Page,
    ])
  ),
  "/trabajos/": {
    en: "/en/work/",
    title: "work.title",
    description: "work.description",
    kind: "work",
  },
  "/guias/": {
    en: "/en/guides/",
    title: "guides.title",
    description: "guides.description",
    kind: "guides",
  },
  ...Object.fromEntries(
    guideIds.map((id) => [
      guides[id].es,
      {
        en: guides[id].en,
        title: `guide.${id}.title` satisfies UiKey,
        description: `guide.${id}.description` satisfies UiKey,
        kind: "guide",
        guide: id,
      } satisfies Page,
    ])
  ),
  "/contacto/": {
    en: "/en/contact/",
    title: "contact.title",
    description: "contact.description",
    kind: "contact",
  },
  ...Object.fromEntries(
    ["aviso-legal", "politica-de-privacidad", "politica-de-cookies"].map(
      (legal) => [
        `/${legal}/`,
        {
          en: null,
          title: `legal.${legal}` as UiKey,
          description: `legal.description.${legal}` as UiKey,
          kind: "legal",
          legal,
        } satisfies Page,
      ]
    )
  ),
}
