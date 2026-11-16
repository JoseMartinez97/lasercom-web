// A finished job, from photos to the /trabajos/ page: `pnpm trabajo`
//
//   pnpm trabajo foto1.jpg foto2.jpg --nota "Placas para el hospital La Fe, acero, 40 uds"
//
// 1. Prepares the photos: upright, at most 1600 px, webp, and without their
//    metadata (a phone photo carries the GPS position of where it was taken)
// 2. Claude looks at them with the note and drafts, in Spanish and English,
//    the name, type and text of the job and the alt text of each photo,
//    following the rules below; what it can't tell from the photos it asks,
//    it never makes up
// 3. Writes the job into the site (photos, src/lib/work.ts, the texts) for
//    review with `pnpm dev`; nothing is published until it's committed
//
// Options:
//   --nota "…"        what the photos can't say: client, material, quantity…
//   --servicio <id>   the service page it belongs to (else Claude picks one)
//   --dry-run         only the draft, the site isn't touched
//   --borrador <f>    use a saved draft (.work-drafts/<slug>.json) instead of
//                     asking Claude again, e.g. after correcting it by hand
//
// Usual way, with no API key: send the photos in a Claude Code session, which
// writes the draft (shape: Draft below, rules: SYSTEM) and applies it with
// --borrador. Without --borrador it calls the Claude API itself, which needs
// ANTHROPIC_API_KEY and is billed (a few cents per job)
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { basename, join } from "node:path"
import { execFileSync } from "node:child_process"
import sharp from "sharp"
import { z } from "zod"

const root = new URL("../", import.meta.url).pathname
const file = (p) => join(root, p)
const read = (p) => readFileSync(file(p), "utf8")

// --- Arguments -------------------------------------------------------------

const args = process.argv.slice(2)
const flag = (name) => {
  const i = args.indexOf(name)
  if (i === -1) return undefined
  const value = args[i + 1]
  args.splice(i, 2)
  return value
}
const note = flag("--nota") ?? ""
const forcedService = flag("--servicio")
const draftFile = flag("--borrador")
const dryRun = args.includes("--dry-run")
const inputs = args.filter((a) => !a.startsWith("--"))

function fail(message) {
  console.error(`trabajo: ${message}`)
  process.exit(1)
}

if (!inputs.length && !draftFile)
  fail('usage: pnpm trabajo <photos…> [--nota "…"] [--servicio id] [--dry-run]')
if (inputs.length > 8) fail("at most 8 photos per job")
for (const p of inputs) {
  if (!existsSync(p)) fail(`no file ${p}`)
  if (!/\.(jpe?g|png|webp)$/i.test(p))
    fail(
      `${basename(p)}: use JPG, PNG or WebP photos (WhatsApp and Telegram send JPG)`
    )
}

// --- What the site already has --------------------------------------------

const serviceIds = [
  ...read("src/lib/services.ts")
    .match(/export const serviceIds = \[([\s\S]*?)\]/)[1]
    .matchAll(/"([\w-]+)"/g),
].map(([, id]) => id)
const site = read("src/i18n/messages/site.ts")
const serviceNames = Object.fromEntries(
  serviceIds.map((id) => [
    id,
    [...site.matchAll(new RegExp(`"svc\\.${id}\\.name":\\s*"([^"]+)"`, "g"))]
      .map(([, n]) => n)
      .join(" / "),
  ])
)
const workTs = read("src/lib/work.ts")
const slugs = [...workTs.matchAll(/slug: "([\w-]+)"/g)].map(([, s]) => s)
const filters = ["business", "wood", "acrylic_glass", "metal", "leather"]

// A few published jobs, as examples of the tone and length
const examples = ["lv2", "copa", "placa"]
  .map((slug) => {
    const pick = (lang) => {
      const block =
        lang === "en"
          ? site
          : site.slice(site.indexOf(`"work.${slug}.name"`) + 1)
      const get = (k) =>
        block.match(new RegExp(`"work\\.${slug}\\.${k}":\\s*"([^"]+)"`))?.[1]
      return { name: get("name"), type: get("type"), text: get("text") }
    }
    return { slug, en: pick("en"), es: pick("es") }
  })
  .filter((e) => e.en.name && e.es.name)

// --- The draft -------------------------------------------------------------

const Copy = z.object({
  name: z.string(),
  type: z.string(),
  text: z.string(),
})
const Draft = z.object({
  slug: z.string(),
  service: z.enum(serviceIds),
  filters: z.array(z.enum(filters)),
  es: Copy,
  en: Copy,
  photos: z.array(
    z.object({ cutout: z.boolean(), alt_es: z.string(), alt_en: z.string() })
  ),
  doubts: z.array(z.string()),
})

const SYSTEM = `You write the entries of the "work" page of Lasercom, a laser cutting and engraving workshop in Riba-roja de Túria (Valencia), founded in 2007. Each entry is one real job, shown with its photos.

You get the photos of one finished job and, sometimes, a note from the owner. Write the entry in Spanish and in English.

Rules, in order of importance:
1. Only what the photos show or the note says. Never invent clients, brands, events, quantities, sizes, depths, prices, delivery times, machines or processes. If the note names a client or brand, you may use it; if a brand is only visible in the photo, describe the piece without naming it as a client and add a doubt asking whether it can be named.
2. The workshop has a fibre laser (engraves and marks metals and plastics, cuts sheet metal up to 4 mm) and CO2 lasers (cut and engrave wood, leather, acrylic and other materials). Say a metal piece was cut only when the photos or the note make it clear; otherwise say marked or engraved.
3. When you can't tell something that matters (material, whether it was cut or engraved, what the piece is for), choose the most cautious wording and add a short question for the owner to "doubts", in Spanish. Keep "doubts" empty when everything is clear.
4. Sentence case everywhere: only the first word and proper nouns capitalized.
5. "name": the piece, 2 to 6 words. "type": material · technique, like the examples ("Wood · Engraving", "Madera · Grabado"; techniques: cutting, engraving, marking, or cutting and engraving). "text": one or two plain sentences, 15 to 40 words, saying what was made and how; no superlatives, no sales talk, no "we are proud".
6. Alt text, one per photo in the order given: what the photo shows, 6 to 16 words, without "photo of" or "image of".
7. "cutout": true when the photo is the object on a plain white background, so the page can blend it in.
8. "slug": one short lowercase word in Spanish without accents (letters and digits, a hyphen only if needed) that is not in the list of existing slugs.
9. "service": the page of the site where this job fits best. "filters": every tab of the work page it belongs to: business (made for a company or brand), wood, acrylic_glass, metal, leather.

Spanish copy is the original; English follows it closely, natural British-neutral English.`

async function askClaude(images) {
  const { default: Anthropic } = await import("@anthropic-ai/sdk")
  const { betaZodOutputFormat } =
    await import("@anthropic-ai/sdk/helpers/beta/zod")
  const client = new Anthropic()
  const context = {
    services: serviceNames,
    existingSlugs: slugs,
    examples,
  }
  const response = await client.beta.messages.parse({
    model: "claude-opus-5-5",
    max_tokens: 16000,
    betas: ["server-side-fallback-2026-07-01"],
    // If a safety check declines the request, the API retries it on another
    // model in the same call
    fallbacks: "default",
    output_config: { effort: "medium", format: betaZodOutputFormat(Draft) },
    system: SYSTEM,
    messages: [
      {
        role: "user",
        content: [
          ...images.flatMap((img, i) => [
            { type: "text", text: `Photo ${i + 1}:` },
            {
              type: "image",
              source: { type: "base64", media_type: "image/jpeg", data: img },
            },
          ]),
          {
            type: "text",
            text: `Site context:\n${JSON.stringify(context, null, 1)}\n\n${
              note ? `Owner's note: ${note}` : "No note from the owner."
            }${forcedService ? `\nThe service is "${forcedService}".` : ""}\n\nWrite the entry.`,
          },
        ],
      },
    ],
  })
  if (response.stop_reason === "refusal")
    fail("Claude declined to write this one; write the texts by hand")
  if (response.stop_reason === "max_tokens") fail("the draft came back cut off")
  if (!response.parsed_output)
    fail("the draft didn't come back in the expected shape")
  return response.parsed_output
}

// Upright, at most 1600 px, webp, no metadata
const prepare = (path) =>
  sharp(path)
    .rotate()
    .resize({
      width: 1600,
      height: 1600,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 80 })
    .toBuffer()
// A smaller copy for Claude to look at
const preview = (path) =>
  sharp(path)
    .rotate()
    .resize({
      width: 1024,
      height: 1024,
      fit: "inside",
      withoutEnlargement: true,
    })
    .jpeg({ quality: 80 })
    .toBuffer()

let draft
if (draftFile) {
  draft = Draft.parse(JSON.parse(readFileSync(draftFile, "utf8")))
} else {
  console.log(`trabajo: Claude is looking at ${inputs.length} photos…`)
  const images = await Promise.all(
    inputs.map(async (p) => (await preview(p)).toString("base64"))
  )
  draft = await askClaude(images)
}
if (forcedService) draft.service = Draft.shape.service.parse(forcedService)

// --- Checks that don't depend on Claude being right ------------------------

if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(draft.slug))
  fail(`slug "${draft.slug}" must be lowercase letters and digits`)
if (slugs.includes(draft.slug)) fail(`there is already a job "${draft.slug}"`)
if (inputs.length && draft.photos.length !== inputs.length)
  fail(
    `${inputs.length} photos but ${draft.photos.length} alt texts in the draft`
  )
if (!draft.filters.length) fail("the job needs at least one filter")
const all = [draft.es, draft.en].flatMap((c) => [c.name, c.type, c.text])
for (const p of draft.photos) all.push(p.alt_es, p.alt_en)
if (all.some((t) => !t.trim())) fail("the draft has empty texts")

mkdirSync(file(".work-drafts"), { recursive: true })
const saved = file(`.work-drafts/${draft.slug}.json`)
writeFileSync(saved, JSON.stringify(draft, null, 2) + "\n")

console.log(`
  ${draft.es.name}  (${draft.slug} · ${draft.service} · ${draft.filters.join(", ")})
  ${draft.es.type}
  ${draft.es.text}

  EN  ${draft.en.name} · ${draft.en.type}
      ${draft.en.text}
${draft.photos.map((p, i) => `  foto ${i + 1}${p.cutout ? " (fondo blanco)" : ""}: ${p.alt_es}`).join("\n")}
`)
if (draft.doubts.length)
  console.log(
    `  Dudas para revisar:\n${draft.doubts.map((d) => `  · ${d}`).join("\n")}\n`
  )
console.log(`  Borrador guardado en ${saved.slice(root.length)}`)

if (dryRun) process.exit(0)
if (!inputs.length) fail("give the photos again to write the job into the site")

// --- Write it into the site -------------------------------------------------

const names = inputs.map((_, i) => `${draft.slug}_${i + 1}`)
for (const n of names)
  if (existsSync(file(`src/assets/work/${n}.webp`)))
    fail(`src/assets/work/${n}.webp already exists`)

// Inserts text after an anchor that must appear exactly `count` times
function insert(source, anchor, text, count = 1) {
  const parts = source.split(anchor)
  if (parts.length - 1 !== count)
    fail(
      `expected ${count} × ${JSON.stringify(anchor)} in the code, found ${parts.length - 1}`
    )
  return parts.map((p, i) => (i === 0 ? p : anchor + text(i - 1) + p)).join("")
}
const str = (s) => JSON.stringify(s.trim())

// Photos
await Promise.all(
  inputs.map(async (p, i) =>
    writeFileSync(file(`src/assets/work/${names[i]}.webp`), await prepare(p))
  )
)

// The job, first in the list
writeFileSync(
  file("src/lib/work.ts"),
  insert(
    workTs,
    "export const work = [\n",
    () =>
      `  {\n    slug: ${str(draft.slug)},\n    filters: ${JSON.stringify(draft.filters)},\n    photos: ${JSON.stringify(names)},\n    service: ${str(draft.service)},\n  },\n`
  )
)

// Its texts, before the current first job's, in English and in Spanish
const first = slugs[0]
const copy = (c) =>
  `    "work.${draft.slug}.name": ${str(c.name)},\n    "work.${draft.slug}.type": ${str(c.type)},\n    "work.${draft.slug}.text": ${str(c.text)},\n`
const anchor = `    "work.${first}.name"`
const at = [
  ...site.matchAll(new RegExp(anchor.replace(/\./g, "\\."), "g")),
].map((m) => m.index)
if (at.length !== 2 || !(site.lastIndexOf("  es: {", at[1]) > at[0]))
  fail(`couldn't find the English and Spanish texts of "${first}" in site.ts`)
writeFileSync(
  file("src/i18n/messages/site.ts"),
  site.slice(0, at[0]) +
    copy(draft.en) +
    site.slice(at[0], at[1]) +
    copy(draft.es) +
    site.slice(at[1])
)

// Alt text of each photo
const alts = (lang) =>
  draft.photos
    .map(
      (p, i) =>
        `    "photo.${names[i]}": ${str(lang === "en" ? p.alt_en : p.alt_es)},\n`
    )
    .join("")
let photosTs = read("src/i18n/messages/photos.ts")
photosTs = insert(photosTs, "  en: {\n", () => alts("en"))
photosTs = insert(photosTs, "  es: {\n", () => alts("es"))
writeFileSync(file("src/i18n/messages/photos.ts"), photosTs)

// Photos on a white background
const cut = names.filter((_, i) => draft.photos[i].cutout)
if (cut.length)
  writeFileSync(
    file("src/lib/services.ts"),
    insert(
      read("src/lib/services.ts"),
      "export const cutouts = new Set([\n",
      () => cut.map((n) => `  ${str(n)},\n`).join("")
    )
  )

execFileSync(
  "pnpm",
  [
    "exec",
    "prettier",
    "--write",
    "src/lib/work.ts",
    "src/lib/services.ts",
    "src/i18n/messages/site.ts",
    "src/i18n/messages/photos.ts",
  ],
  { cwd: root, stdio: "ignore" }
)

console.log(`
  Escrito en la web: ${names.length} fotos en src/assets/work y los textos en es y en.
  Revísalo con \`pnpm dev\` en /trabajos/#${draft.slug}, y \`pnpm test\` antes de publicar.
  Cambiados: src/lib/work.ts, src/i18n/messages/site.ts y photos.ts${cut.length ? ", src/lib/services.ts" : ""}
`)
