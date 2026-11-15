// SEO rules for every indexable page of the built site, so a change can't
// quietly undo them: one h1, titles and descriptions that fit in Google's
// results and are not repeated, alt text on images, and structured data
// with what Google needs for each type. Run after `pnpm build` (`pnpm test`)
import { readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"

const dist = new URL("../dist/", import.meta.url).pathname
const walk = (d) =>
  readdirSync(d, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(join(d, e.name)) : [join(d, e.name)]
  )
const decode = (s) =>
  s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
const pages = walk(dist)
  .filter((f) => f.endsWith("index.html"))
  .map((f) => ({
    url: "/" + f.slice(dist.length).replace(/index\.html$/, ""),
    html: readFileSync(f, "utf8"),
  }))
  .filter((p) => !p.html.includes('http-equiv="refresh"'))
  .filter((p) => !p.html.includes('name="robots" content="noindex"'))

// Google shows about 600px of a title (~60 characters) and ~155–160 of a
// description on mobile; a little slack before failing
const TITLE_MAX = 65
const DESC_MIN = 70
const DESC_MAX = 165

// What each structured data type must carry
const required = {
  LocalBusiness: ["name", "address", "telephone", "url"],
  Service: ["name", "provider", "areaServed"],
  FAQPage: ["mainEntity"],
  Article: ["headline", "image", "datePublished", "author"],
  BreadcrumbList: ["itemListElement"],
  WebSite: ["name", "url"],
}

const problems = []
const seen = { title: new Map(), description: new Map() }

for (const { url, html } of pages) {
  const title = decode(html.match(/<title>([^<]*)<\/title>/)?.[1] ?? "")
  const description = decode(
    html.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? ""
  )
  if (title.length > TITLE_MAX)
    problems.push(
      `${url}: title is ${title.length} characters (max ${TITLE_MAX}): ${title}`
    )
  if (description.length < DESC_MIN || description.length > DESC_MAX)
    problems.push(
      `${url}: description is ${description.length} characters (${DESC_MIN}–${DESC_MAX})`
    )
  for (const [kind, value] of [
    ["title", title],
    ["description", description],
  ]) {
    const other = seen[kind].get(value)
    if (other) problems.push(`${url}: same ${kind} as ${other}`)
    else seen[kind].set(value, url)
  }

  const h1s = html.match(/<h1[\s>]/g)?.length ?? 0
  if (h1s !== 1) problems.push(`${url}: ${h1s} h1 elements (needs exactly 1)`)

  for (const [img] of html.matchAll(/<img\b[^>]*>/g))
    if (!/\salt(=|[\s/>])/.test(img))
      problems.push(`${url}: image without alt: ${img.slice(0, 90)}`)

  const lang = html.match(/<html[^>]*\slang="([^"]+)"/)?.[1]
  if (!lang) problems.push(`${url}: no lang on <html>`)
  else if (url.startsWith("/en/") !== (lang === "en"))
    problems.push(`${url}: lang="${lang}" does not match the address`)

  for (const [, json] of html.matchAll(
    /application\/ld\+json">(.*?)<\/script>/gs
  )) {
    let data
    try {
      data = JSON.parse(json)
    } catch {
      problems.push(`${url}: structured data does not parse`)
      continue
    }
    for (const field of required[data["@type"]] ?? [])
      if (
        data[field] == null ||
        (Array.isArray(data[field]) && !data[field].length)
      )
        problems.push(`${url}: ${data["@type"]} without ${field}`)
    if (data["@type"] === "FAQPage")
      for (const q of data.mainEntity ?? [])
        if (!q.name || !q.acceptedAnswer?.text)
          problems.push(`${url}: FAQ question without text or answer`)
    if (data["@type"] === "BreadcrumbList")
      for (const item of data.itemListElement ?? []) {
        const path = String(item.item ?? "").replace(/^https?:\/\/[^/]+/, "")
        if (!pages.some((p) => p.url === path))
          problems.push(`${url}: breadcrumb points to ${item.item}, not a page`)
      }
  }
}

if (problems.length) {
  console.error(problems.join("\n"))
  console.error(`\n${problems.length} SEO problems`)
  process.exit(1)
}
console.log(`ok: SEO rules hold on ${pages.length} pages`)
