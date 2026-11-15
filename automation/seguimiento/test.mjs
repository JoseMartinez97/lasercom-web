// Checks the logic of Code.gs without Google: which requests come up in the
// digest and when, the messages and WhatsApp links, the email, and what
// doPost accepts. Run: node automation/seguimiento/test.mjs
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import vm from "node:vm"

const code = readFileSync(new URL("./Code.gs", import.meta.url), "utf8")
const sandbox = {}
vm.createContext(sandbox)
vm.runInContext(
  `${code}\nthis.api = { planDigest, digestEmail, cleanLead, waNumber, clientMessage, CONFIG }`,
  sandbox
)
const { planDigest, digestEmail, cleanLead, waNumber, CONFIG } = sandbox.api

const now = new Date("2026-11-20T08:00:00")
const ago = (days) => new Date(now.getTime() - days * 86400000)
const base = {
  ref: "L261115-4K7",
  name: "Lucía",
  channel: "WhatsApp",
  service: "Corte láser de madera",
  message:
    "Hola, soy Lucía. Quería pedir presupuesto:\n- Material: Madera\n- Cantidad: 2 a 10",
  lang: "es",
  reminders: 0,
  lastReminder: null,
}

// Phone numbers
assert.equal(waNumber("626 37 05 06"), "34626370506")
assert.equal(waNumber("+34 626370506"), "34626370506")
assert.equal(waNumber("0044 7700 900123"), "447700900123")
assert.equal(waNumber("+44 7700 900123"), "447700900123")
assert.equal(waNumber("12345"), "")
assert.equal(waNumber(""), "")

// Which rows come up
const rows = [
  { ...base, status: "Nueva", date: ago(0), statusDate: ago(0) }, // today: not yet
  { ...base, status: "Nueva", date: ago(1), statusDate: ago(1) }, // unanswered
  { ...base, status: "Presupuestada", statusDate: ago(2) }, // too soon
  { ...base, status: "Presupuestada", statusDate: ago(3), phone: "626370506" },
  {
    ...base,
    status: "Presupuestada",
    statusDate: ago(9),
    reminders: 1,
    lastReminder: ago(2),
  }, // reminded 2 days ago: wait
  {
    ...base,
    status: "Presupuestada",
    statusDate: ago(20),
    reminders: 2,
    lastReminder: ago(10),
  }, // reminded twice already: never again
  { ...base, status: "Entregada", statusDate: ago(2), lang: "en" },
  { ...base, status: "Aceptada", statusDate: ago(30) }, // nothing to do
  { ...base, status: "Perdida", statusDate: ago(30) },
  { ...base, status: "Reseña pedida", statusDate: ago(30) },
]
const plan = planDigest(rows, now, CONFIG)
assert.deepEqual([...plan.unanswered.map((i) => i.index)], [1])
assert.deepEqual([...plan.followUps.map((i) => i.index)], [3])
assert.deepEqual([...plan.reviews.map((i) => i.index)], [6])

// The follow-up has the WhatsApp link with the message, in Spanish
const follow = plan.followUps[0]
assert.match(follow.text, /^Hola Lucía, te escribimos de Lasercom/)
assert.match(follow.text, /de corte láser de madera\?/)
assert.match(follow.text, /Ref\. L261115-4K7/)
assert.ok(follow.whatsapp.startsWith("https://wa.me/34626370506?text=Hola"))
// No phone: no link, the email says how to add it
assert.equal(plan.unanswered[0].whatsapp, "")
// The review request in the client's language, without link until it's set
assert.match(plan.reviews[0].text, /^Hi Lucía, thank you for trusting Lasercom/)
assert.ok(plan.reviews[0].text.endsWith("two minutes:"))
const withLink = planDigest(rows, now, {
  ...CONFIG,
  REVIEW_URL: "https://g.page/r/test/review",
})
assert.ok(withLink.reviews[0].text.endsWith("https://g.page/r/test/review"))

// The email
const mail = digestEmail(plan, "https://docs.google.com/x", CONFIG)
assert.equal(
  mail.subject,
  "Lasercom · 1 sin contestar, 1 por seguir, 1 reseñas"
)
assert.match(mail.html, /Sin contestar \(1\)/)
assert.match(mail.html, /Abrir WhatsApp con el mensaje/)
assert.match(mail.html, /Añade su teléfono/)
assert.match(mail.html, /Falta el enlace de reseñas/)
assert.match(mail.html, /Material: Madera · Cantidad: 2 a 10/)
assert.equal(
  digestEmail({ unanswered: [], followUps: [], reviews: [] }, "", CONFIG),
  null
)
// Names are escaped in the email
const evil = planDigest(
  [
    {
      ...base,
      name: "<img src=x onerror=alert(1)>",
      status: "Nueva",
      statusDate: ago(1),
    },
  ],
  now,
  CONFIG
)
assert.ok(!digestEmail(evil, "", CONFIG).html.includes("<img src=x"))

// What doPost accepts
const lead = {
  ref: "L261115-4K7",
  name: "Lucía",
  channel: "whatsapp",
  service: "Corte láser de madera",
  message: "Hola",
  lang: "es",
  page: "/contacto/",
}
assert.equal(cleanLead(JSON.stringify(lead)).channel, "WhatsApp")
assert.equal(
  cleanLead(JSON.stringify({ ...lead, channel: "email" })).channel,
  "Email"
)
assert.equal(cleanLead(JSON.stringify({ ...lead, ref: "hack" })), null)
assert.equal(
  cleanLead(JSON.stringify({ ...lead, website: "spam.example" })),
  null
)
assert.equal(cleanLead("not json"), null)
assert.equal(
  cleanLead(JSON.stringify({ ...lead, name: "x".repeat(500) })).name.length,
  80
)

console.log("ok: follow-up logic holds")
