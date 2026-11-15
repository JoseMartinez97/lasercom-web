// @ts-check

import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from "astro/config"
import react from "@astrojs/react"
import sitemap from "@astrojs/sitemap"
import { readFile, readdir, writeFile } from "node:fs/promises"
import { pages } from "./src/lib/pages"

const site = "https://lasercom.es"
// The site lives at the root of lasercom.es. A preview build can live in a
// folder of another host instead, like GitHub Pages without a domain:
// SITE_URL=https://josemartinez97.github.io BASE_PATH=/lasercom-web
const base = (process.env.BASE_PATH || "").replace(/\/$/, "")
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
// The site is served by GitHub Pages, which has no real redirects: Astro
// writes a refresh page for each address (below), and the .htm addresses,
// which Astro would turn into folders, get a refresh page with that very
// file name (GitHub Pages serves .htm as a web page). The same list also
// goes to a _redirects file, as real 301s, in case the site moves to a host
// that reads one (Netlify, Cloudflare Pages)
/** @param {string} from @param {string} to */
const refreshPage = (from, to) =>
  `<!doctype html><title>Redirecting to: ${to}</title><meta http-equiv="refresh" content="0;url=${to}"><meta name="robots" content="noindex"><link rel="canonical" href="${site}${to}"><body><a href="${to}">Redirecting from <code>${from}</code> to <code>${to}</code></a></body>\n`
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
      for (const [from, to] of Object.entries(redirects))
        if (from.endsWith(".htm"))
          await writeFile(new URL(from.slice(1), dir), refreshPage(from, to))
      if (base) await prefixBase(dir)
    },
  },
}

// Addresses in the code are written from the root ("/contacto/"). In a build
// for a folder, every root address in the HTML gets the folder in front;
// Astro's own assets already carry it
/** @param {URL} dir */
async function prefixBase(dir) {
  /** @param {string} url */
  const fix = (url) =>
    url.startsWith("/") &&
    !url.startsWith("//") &&
    url !== base &&
    !url.startsWith(`${base}/`)
      ? base + url
      : url
  const files = (await readdir(dir, { recursive: true })).filter((f) =>
    /\.html?$/.test(f)
  )
  for (const file of files) {
    const path = new URL(file, dir)
    const html = (await readFile(path, "utf8"))
      .replace(
        /(\s(?:href|src|poster|action|data-[\w-]+)=")(\/[^"]*)"/g,
        (_, attr, url) => `${attr}${fix(url)}"`
      )
      .replace(
        /(\ssrcset=")([^"]*)"/g,
        (_, attr, set) =>
          `${attr}${set.replace(/(^|,\s*)(\/[^\s,]+)/g, (/** @type {string} */ _, /** @type {string} */ sep, /** @type {string} */ url) => sep + fix(url))}"`
      )
      .replace(
        /(content="\d+;url=)(\/[^"]*)"/g,
        (_, attr, url) => `${attr}${fix(url)}"`
      )
    await writeFile(path, html)
  }
}

// https://astro.build/config
export default defineConfig({
  site: process.env.SITE_URL || site,
  base: base || "/",
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
