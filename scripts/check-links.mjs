// Every internal link, image and anchor in the built site must lead somewhere:
// the file exists in dist/, and a #fragment exists on the page it points to.
// Also checks that every redirect in dist/_redirects lands on a real page.
// Run after `pnpm build` (part of `pnpm test`)
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs"
import { join } from "node:path"

const dist = new URL("../dist/", import.meta.url).pathname
const walk = (d) =>
  readdirSync(d, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(join(d, e.name)) : [join(d, e.name)]
  )
const htmlFiles = walk(dist).filter((f) => f.endsWith(".html"))
const html = new Map(htmlFiles.map((f) => [f, readFileSync(f, "utf8")]))

// The file a site path is served from, or null
function fileFor(path) {
  const clean = decodeURIComponent(path.split(/[?#]/)[0])
  const base = join(dist, clean)
  if (clean.endsWith("/"))
    return existsSync(join(base, "index.html"))
      ? join(base, "index.html")
      : null
  if (existsSync(base) && statSync(base).isFile()) return base
  if (existsSync(join(base, "index.html"))) return join(base, "index.html")
  return null
}
const ids = (page) =>
  new Set([...page.matchAll(/\sid="([^"]+)"/g)].map(([, id]) => id))

const external = /^(https?:|mailto:|tel:|data:|javascript:|blob:|\/\/)/
const problems = []

for (const [file, page] of html) {
  const url = "/" + file.slice(dist.length).replace(/index\.html$/, "")
  if (page.includes('http-equiv="refresh"')) continue
  const refs = [
    ...[...page.matchAll(/\s(?:href|src|poster)="([^"]+)"/g)].map(([, v]) => v),
    ...[...page.matchAll(/\ssrcset="([^"]+)"/g)].flatMap(([, v]) =>
      v.split(",").map((part) => part.trim().split(/\s+/)[0])
    ),
  ]
  for (const raw of refs) {
    const ref = raw.replace(/&amp;/g, "&")
    if (!ref || external.test(ref)) continue
    // Same-page anchor
    if (ref.startsWith("#")) {
      if (ref.length > 1 && !ids(page).has(decodeURIComponent(ref.slice(1))))
        problems.push(`${url}: no #${ref.slice(1)} on the page`)
      continue
    }
    const path = ref.startsWith("/")
      ? ref
      : new URL(ref, `https://x${url}`).pathname
    const target = fileFor(path)
    if (!target) {
      problems.push(`${url}: broken link ${ref}`)
      continue
    }
    const hash = ref.split("#")[1]
    if (hash && target.endsWith(".html")) {
      const targetHtml = html.get(target) ?? readFileSync(target, "utf8")
      if (!ids(targetHtml).has(decodeURIComponent(hash)))
        problems.push(`${url}: ${ref} has no #${hash} to land on`)
    }
  }
}

const redirects = join(dist, "_redirects")
if (existsSync(redirects)) {
  for (const line of readFileSync(redirects, "utf8").split("\n")) {
    const [from, to] = line.trim().split(/\s+/)
    if (!from || !to) continue
    if (!fileFor(to)) problems.push(`_redirects: ${from} goes to missing ${to}`)
    if (fileFor(from) && !from.endsWith(".htm"))
      if (!readFileSync(fileFor(from), "utf8").includes('http-equiv="refresh"'))
        problems.push(`_redirects: ${from} is also a real page`)
  }
}

if (problems.length) {
  console.error([...new Set(problems)].join("\n"))
  console.error(`\n${problems.length} link problems`)
  process.exit(1)
}
console.log(`ok: links in ${html.size} pages lead somewhere`)
