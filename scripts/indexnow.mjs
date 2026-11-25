// Tells search engines (Bing, Yandex, Seznam, Naver… through IndexNow) which
// pages changed in a publish, so they recrawl them in hours instead of weeks.
// Google doesn't use IndexNow: it reads the sitemap.
//
//   node scripts/indexnow.mjs hashes   after `astro build` (`pnpm build`): writes
//                                      dist/indexnow.json, a fingerprint of the
//                                      content of every page in the sitemap,
//                                      and dates each page in the sitemap
//                                      (<lastmod>) by when that content changed
//   node scripts/indexnow.mjs diff     compares it with the one on the live
//                                      site and writes indexnow-changed.json
//   node scripts/indexnow.mjs submit   once published: checks the new version
//                                      and the key are live, then sends the
//                                      changed addresses (--dry-run: only shows
//                                      them)
//
// The key is public by design: search engines check it at /<key>.txt to know
// the notice comes from the site's owner
import { createHash } from "node:crypto"
import { existsSync, readFileSync, writeFileSync } from "node:fs"

const KEY = "4948176e21c2c28a02f00c548236a813"
const SITE = "https://lasercom.es"
const ENDPOINT = "https://api.indexnow.org/indexnow"
const dist = new URL("../dist/", import.meta.url).pathname
const changedFile = new URL("../indexnow-changed.json", import.meta.url)
  .pathname

const [mode, ...flags] = process.argv.slice(2)
const dryRun = flags.includes("--dry-run")

// What a visitor or a search engine reads on a page: title, description,
// structured data and the main content. Scripts, styles and the hashed names
// of assets are left out, so a CSS or JS change doesn't mark every page
function fingerprint(html) {
  const pick = (re) => html.match(re)?.[0] ?? ""
  const content = [
    pick(/<title>[^<]*<\/title>/),
    pick(/<meta name="description"[^>]*>/),
    pick(/<link rel="canonical"[^>]*>/),
    ...[...html.matchAll(/application\/ld\+json">.*?<\/script>/gs)].map(
      ([m]) => m
    ),
    pick(/<main[\s>].*<\/main>/s),
  ]
    .join("\n")
    .replace(/<script\b(?![^>]*ld\+json).*?<\/script>/gs, "")
    .replace(/<style\b.*?<\/style>/gs, "")
    .replace(/(\/_astro\/[\w-]+)\.[\w-]+(\.\w+)/g, "$1$2")
    .replace(/\s(data-astro-cid-\w+|data-astro-transition-\w+="[^"]*")/g, "")
  return createHash("sha256").update(content).digest("hex").slice(0, 16)
}

async function hashes() {
  // A preview build (PUBLIC_PREVIEW=1) is never announced to search engines
  if (process.env.PUBLIC_PREVIEW === "1")
    return console.log("indexnow: preview build, no fingerprints")
  if (readFileSync(`${dist}${KEY}.txt`, "utf8").trim() !== KEY)
    throw new Error(`public/${KEY}.txt must hold the key`)
  const sitemap = readFileSync(`${dist}sitemap-0.xml`, "utf8")
  const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, u]) => u)
  const pages = {}
  for (const url of urls) {
    const path = url.slice(SITE.length)
    const file = `${dist}${path.slice(1)}${path.endsWith("/") ? "index.html" : ""}`
    if (!existsSync(file))
      throw new Error(`${url} is in the sitemap, not in dist`)
    pages[url] = fingerprint(readFileSync(file, "utf8"))
  }
  writeFileSync(`${dist}indexnow.json`, JSON.stringify(pages, null, 1) + "\n")
  console.log(`indexnow: fingerprinted ${urls.length} pages`)

  // <lastmod>: Google trusts it only while it stays accurate, so a page
  // keeps the date the live sitemap gives it as long as its content is the
  // same, and takes today's date when it is new or changed. A redesign that
  // leaves the text alone doesn't redate every page
  const [before, dates] = await Promise.all([live(), liveDates()])
  const today = new Date().toISOString().slice(0, 10)
  const lastmod = (url) =>
    before?.[url] === pages[url] && dates[url] ? dates[url] : today
  writeFileSync(
    `${dist}sitemap-0.xml`,
    sitemap.replace(
      /<loc>([^<]+)<\/loc>/g,
      (loc, url) => `${loc}<lastmod>${lastmod(url)}</lastmod>`
    )
  )
  const kept = urls.filter((u) => lastmod(u) !== today).length
  console.log(
    `sitemap: ${kept} pages keep their date, ${urls.length - kept} dated ${today}`
  )
}

// The <lastmod> of every page in the live sitemap, by address
async function liveDates() {
  try {
    const res = await fetch(`${SITE}/sitemap-0.xml`, {
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    })
    if (!res.ok) return {}
    const xml = await res.text()
    return Object.fromEntries(
      [
        ...xml.matchAll(
          /<loc>([^<]+)<\/loc>(?:(?!<\/url>).)*?<lastmod>([^<]+)<\/lastmod>/gs
        ),
      ].map(([, url, date]) => [url, date])
    )
  } catch {
    return {}
  }
}

// The fingerprints on the live site, or null if it has none yet (first
// publish, or the old site is still there)
async function live() {
  try {
    const res = await fetch(`${SITE}/indexnow.json`, {
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

async function diff() {
  const next = JSON.parse(readFileSync(`${dist}indexnow.json`, "utf8"))
  const before = await live()
  const urls = before
    ? [
        // New or changed pages, and removed ones (now a 404 or a redirect)
        ...Object.keys(next).filter((u) => next[u] !== before[u]),
        ...Object.keys(before).filter((u) => !(u in next)),
      ]
    : Object.keys(next)
  writeFileSync(changedFile, JSON.stringify({ expect: next, urls }, null, 1))
  console.log(
    before
      ? `indexnow: ${urls.length} pages changed since the live version`
      : `indexnow: no fingerprints on ${SITE} yet, all ${urls.length} pages count as new`
  )
  for (const u of urls) console.log(`  ${u}`)
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms))

async function submit() {
  if (!existsSync(changedFile)) throw new Error("run `diff` first")
  const { expect, urls } = JSON.parse(readFileSync(changedFile, "utf8"))
  if (!urls.length) return console.log("indexnow: nothing changed, no notice")

  if (dryRun) {
    console.log(`indexnow (dry run): would send ${urls.length} addresses`)
    for (const u of urls) console.log(`  ${u}`)
    return
  }

  // Wait for the new version to be live (the host may take a minute), or a
  // search engine would recrawl the old pages
  const same = (a) => a && Object.keys(expect).every((u) => a[u] === expect[u])
  let ok = false
  for (let i = 0; i < 12 && !ok; i++) {
    ok = same(await live())
    if (!ok) await wait(15_000)
  }
  if (!ok)
    return console.log(
      `indexnow: ${SITE} doesn't serve this version yet (still the old site?), no notice`
    )

  const keyRes = await fetch(`${SITE}/${KEY}.txt`, { cache: "no-store" })
  if (!keyRes.ok || (await keyRes.text()).trim() !== KEY)
    return console.log(`indexnow: ${SITE}/${KEY}.txt is not live, no notice`)

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      host: new URL(SITE).host,
      key: KEY,
      keyLocation: `${SITE}/${KEY}.txt`,
      urlList: urls,
    }),
  })
  // 200 and 202 mean received; anything else is reported, never retried
  // in a loop (IndexNow throttles repeated notices)
  if (res.status === 200 || res.status === 202)
    console.log(`indexnow: sent ${urls.length} addresses (${res.status})`)
  else {
    console.error(`indexnow: refused with ${res.status}: ${await res.text()}`)
    process.exit(1)
  }
}

const modes = { hashes, diff, submit }
if (!modes[mode]) {
  console.error(
    "usage: node scripts/indexnow.mjs hashes | diff | submit [--dry-run]"
  )
  process.exit(1)
}
await modes[mode]()
