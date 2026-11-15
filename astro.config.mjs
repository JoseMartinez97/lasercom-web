// @ts-check

import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from "astro/config"
import react from "@astrojs/react"
import sitemap from "@astrojs/sitemap"
import { writeFile } from "node:fs/promises"
import { pages } from "./src/lib/pages"

const site = "https://lasercom.es"
// Each page and its translation, both ways, for the sitemap's hreflang links.
// Slugs differ between languages, so the sitemap's own i18n option (which
// pairs identical paths) cannot match them
const pairs = new Map(
  Object.entries(pages).flatMap(([es, { en }]) =>
    en
      ? [
          [`${site}${es}`, { es, en }],
          [`${site}${en}`, { es, en }],
        ]
      : []
  )
)

// Addresses of the previous sites (WordPress, and the .htm site before it)
// that have no page of their own any more, found in the old sitemap and the
// Wayback Machine. Every service page keeps its old address, so it keeps
// its rank; these send the rest to the closest page instead of a 404
const redirects = {
  "/inicio": "/",
  "/index.htm": "/",
  "/grabadolaser.htm": "/",
  "/grabado-laser": "/",
  "/blog": "/guias/",
  "/blog-2": "/guias/",
  "/lasercom-estrena-nueva-web": "/",
  "/2015/07/03/hola-mundo": "/",
  "/2015/08/07/entrada-2": "/",
  "/author/moon": "/",
  "/category/sin-categoria": "/",
  "/contacto.htm": "/contacto/",
  "/decoracion": "/corte-laser-decoracion/",
  "/decoracion.htm": "/corte-laser-decoracion/",
  "/madera": "/impresion-corte-grabado-laser-madera/",
  "/cristal-y-metacrilato": "/corte-grabado-laser-cristal-metacrilato/",
  "/piel": "/corte-grabado-laser-piel-cuero/",
  "/grabado-laser-para-piel": "/corte-grabado-laser-piel-cuero/",
  "/metal": "/corte-grabado-laser-metal-acero/",
}
// The same list as real 301s for hosts that read a _redirects file (Netlify,
// Cloudflare Pages). Astro alone can only write refresh pages, and those
// cannot answer for an address like /contacto.htm
/** @type {import("astro").AstroIntegration} */
const redirectsFile = {
  name: "redirects-file",
  hooks: {
    "astro:build:done": async ({ dir }) => {
      const lines = Object.entries(redirects).flatMap(([from, to]) =>
        from.endsWith(".htm")
          ? [`${from} ${to} 301`]
          : [`${from} ${to} 301`, `${from}/ ${to} 301`]
      )
      await writeFile(new URL("_redirects", dir), lines.join("\n") + "\n")
    },
  },
}

// https://astro.build/config
export default defineConfig({
  site,
  // Every page ships its CSS in the HTML: no render-blocking request
  build: {
    inlineStylesheets: "always",
  },
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [
    react(),
    redirectsFile,
    sitemap({
      // The 404 and the design prototype stay out of search engines
      filter: (page) => !/\/(404|prototipo|prototype)\/?$/.test(page),
      serialize(item) {
        const pair = pairs.get(item.url)
        if (!pair) return item
        return {
          ...item,
          links: [
            { lang: "es", url: `${site}${pair.es}` },
            { lang: "en", url: `${site}${pair.en}` },
            { lang: "x-default", url: `${site}${pair.es}` },
          ],
        }
      },
    }),
  ],
  // Refresh pages for hosts without a _redirects file. Not for the .htm
  // addresses, which would only become folders
  redirects: Object.fromEntries(
    Object.entries(redirects).filter(([from]) => !from.endsWith(".htm"))
  ),

  i18n: {
    locales: ["en", "es"],
    defaultLocale: "es",
    routing: {
      prefixDefaultLocale: false,
    },
  },
})
