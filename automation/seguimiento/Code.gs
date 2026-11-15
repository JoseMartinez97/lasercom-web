// Lasercom: follow-up of the quote requests from the website.
//
// Lives in a Google Sheet of the workshop's account (Extensions > Apps
// Script). It does three things, and never writes to a client by itself:
//   1. doPost: the website's quote form saves each request as a row
//   2. dailyDigest: every morning, one email to the workshop with what needs
//      doing (requests without an answer, quotes to follow up, reviews to
//      ask for), each with the WhatsApp message already written
//   3. stampStatus: when the "Estado" of a row changes, notes the date, so the
//      digest knows how long it has been
// Setup in README.md, next to this file

const CONFIG = {
  // Who gets the digest; empty = the owner of the sheet
  EMAIL: "",
  // TODO: the Google link that opens "write a review" (Business Profile >
  // Ask for reviews > copy the g.page/r/… link). Until then, the digest
  // reminds to ask for the review but without the link
  REVIEW_URL: "",
  // Days before each reminder
  UNANSWERED_DAYS: 1,
  FOLLOW_UP_DAYS: 3,
  REVIEW_DAYS: 2,
  // A row comes up in at most this many digests, this many days apart
  MAX_REMINDERS: 2,
  REMIND_EVERY_DAYS: 4,
  SHEET: "Peticiones",
}

const COLS = [
  "Fecha",
  "Ref",
  "Nombre",
  "Canal",
  "Servicio",
  "Mensaje",
  "Idioma",
  "Página",
  "Estado",
  "Fecha estado",
  "Teléfono",
  "Notas",
  "Avisos",
  "Último aviso",
]
const COL = Object.fromEntries(COLS.map((c, i) => [c, i]))
const STATES = [
  "Nueva",
  "Contestada",
  "Presupuestada",
  "Aceptada",
  "Entregada",
  "Reseña pedida",
  "Perdida",
]

// ---------------------------------------------------------------------------
// Pure logic (no Google services): tested in node, see test.mjs

const DAY = 24 * 60 * 60 * 1000
const daysBetween = (from, to) =>
  Math.floor((startOfDay(to) - startOfDay(from)) / DAY)
function startOfDay(d) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x.getTime()
}

// A Spanish mobile or landline as WhatsApp wants it (34 and the digits), or ""
function waNumber(phone) {
  const digits = String(phone || "").replace(/\D/g, "")
  if (/^[6789]\d{8}$/.test(digits)) return "34" + digits
  if (/^34[6789]\d{8}$/.test(digits)) return digits
  if (/^00\d{8,15}$/.test(digits)) return digits.slice(2)
  return digits.length >= 10 && String(phone).trim().startsWith("+")
    ? digits
    : ""
}

// What the workshop would write to the client, in the client's language
function clientMessage(kind, row, config) {
  const en = row.lang === "en"
  const name = row.name ? ` ${row.name}` : ""
  const about = row.service ? (en ? ` for ${row.service}` : ` de ${row.service.toLowerCase()}`) : ""
  if (kind === "followUp")
    return en
      ? `Hi${name}, this is Lasercom. Did you get a chance to look at the quote we sent you${about}? If you'd like to change anything or have any questions, just tell us and we'll adjust it. (Ref. ${row.ref})`
      : `Hola${name}, te escribimos de Lasercom. ¿Pudiste ver el presupuesto que te enviamos${about}? Si quieres cambiar algo o tienes alguna duda, dínoslo y lo ajustamos. (Ref. ${row.ref})`
  const link = config.REVIEW_URL ? ` ${config.REVIEW_URL}` : ""
  return en
    ? `Hi${name}, thank you for trusting Lasercom. If you're happy with the job, a Google review would help us a lot, it takes two minutes:${link}`
    : `Hola${name}, gracias por confiar en Lasercom. Si te ha gustado el trabajo, nos ayudaría mucho una reseña en Google, son dos minutos:${link}`
}

// Which rows go in today's digest, and why
function planDigest(rows, now, config) {
  const plan = { unanswered: [], followUps: [], reviews: [] }
  rows.forEach((row, index) => {
    const since = row.statusDate || row.date
    if (!since) return
    const age = daysBetween(since, now)
    const due =
      (row.reminders || 0) < config.MAX_REMINDERS &&
      (!row.lastReminder ||
        daysBetween(row.lastReminder, now) >= config.REMIND_EVERY_DAYS)
    if (!due) return
    const phone = waNumber(row.phone)
    const item = (kind) => {
      const text = kind === "unanswered" ? "" : clientMessage(kind, row, config)
      return {
        index,
        row,
        age,
        text,
        whatsapp:
          phone && text
            ? `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
            : phone
              ? `https://wa.me/${phone}`
              : "",
      }
    }
    if (row.status === "Nueva" && age >= config.UNANSWERED_DAYS)
      plan.unanswered.push(item("unanswered"))
    else if (row.status === "Presupuestada" && age >= config.FOLLOW_UP_DAYS)
      plan.followUps.push(item("followUp"))
    else if (row.status === "Entregada" && age >= config.REVIEW_DAYS)
      plan.reviews.push(item("review"))
  })
  return plan
}

const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")

// The digest email: subject and HTML body, or null when there is nothing
function digestEmail(plan, sheetUrl, config) {
  const total =
    plan.unanswered.length + plan.followUps.length + plan.reviews.length
  if (!total) return null
  const card = (it, hint) => {
    const r = it.row
    const summary = String(r.message || "")
      .split("\n")
      .filter((l) => l.startsWith("- "))
      .slice(0, 4)
      .map((l) => esc(l.slice(2)))
      .join(" · ")
    const button = it.whatsapp
      ? `<a href="${esc(it.whatsapp)}" style="display:inline-block;background:#1f8f4e;color:#fff;padding:10px 16px;border-radius:999px;text-decoration:none;font-weight:600">Abrir WhatsApp${it.text ? " con el mensaje" : ""}</a>`
      : `<span style="color:#8a5a00">Añade su teléfono en la hoja para tener aquí el botón de WhatsApp (busca la ref. ${esc(r.ref)} en tus chats).</span>`
    const text = it.text
      ? `<p style="margin:10px 0;padding:10px 12px;background:#f3f6f4;border-radius:10px;white-space:pre-line">${esc(it.text)}</p>`
      : ""
    return `<div style="border:1px solid #e2e2e2;border-radius:14px;padding:14px 16px;margin:0 0 12px">
<p style="margin:0 0 4px"><strong>${esc(r.name || "Sin nombre")}</strong> · ref. ${esc(r.ref)} · ${esc(r.channel)} · hace ${it.age} ${it.age === 1 ? "día" : "días"}</p>
<p style="margin:0 0 8px;color:#555">${esc(r.service || "")}${r.service && summary ? " · " : ""}${summary}</p>
<p style="margin:0 0 8px;color:#555">${hint}</p>${text}${button}</div>`
  }
  const section = (title, items, hint) =>
    items.length
      ? `<h2 style="font-size:17px;margin:22px 0 10px">${title} (${items.length})</h2>${items.map((it) => card(it, hint)).join("")}`
      : ""
  const reviewHint = config.REVIEW_URL
    ? "Cuando se la pidas, cambia su estado a «Reseña pedida»."
    : "Falta el enlace de reseñas de Google en el script (REVIEW_URL): pégalo al final del mensaje. Cuando se la pidas, cambia su estado a «Reseña pedida»."
  const html = `<div style="font-family:system-ui,sans-serif;font-size:15px;line-height:1.45;color:#1b1b1b;max-width:640px">
<p>Buenos días. Esto es lo que tienes pendiente de la web:</p>
${section("Sin contestar", plan.unanswered, "Llegó desde la web y sigue como «Nueva». Si ya le contestaste, cambia su estado a «Contestada».")}
${section("Presupuestos por seguir", plan.followUps, "Le enviaste presupuesto y no ha dicho nada. Si ya respondió, cambia su estado.")}
${section("Pedir reseña", plan.reviews, reviewHint)}
<p style="margin-top:22px"><a href="${esc(sheetUrl)}">Abrir la hoja de peticiones</a></p>
<p style="color:#888;font-size:13px">Cada petición sale como mucho ${config.MAX_REMINDERS} veces en este resumen. Nada de esto se ha enviado a los clientes: los mensajes salen solo si tú pulsas el botón.</p></div>`
  const parts = []
  if (plan.unanswered.length) parts.push(`${plan.unanswered.length} sin contestar`)
  if (plan.followUps.length) parts.push(`${plan.followUps.length} por seguir`)
  if (plan.reviews.length) parts.push(`${plan.reviews.length} reseñas`)
  return { subject: `Lasercom · ${parts.join(", ")}`, html }
}

// A request from the website, checked and trimmed, or null if it isn't one
function cleanLead(body) {
  let data
  try {
    data = JSON.parse(body)
  } catch (e) {
    return null
  }
  if (!data || !/^L\d{6}-[A-Z0-9]{3}$/.test(String(data.ref || ""))) return null
  if (data.website) return null // honeypot field, filled only by bots
  const cut = (v, n) => String(v || "").replace(/\s+$/g, "").slice(0, n)
  return {
    ref: data.ref,
    name: cut(data.name, 80),
    channel: data.channel === "email" ? "Email" : "WhatsApp",
    service: cut(data.service, 120),
    message: cut(data.message, 3000),
    lang: data.lang === "en" ? "en" : "es",
    page: cut(data.page, 200),
  }
}

// ---------------------------------------------------------------------------
// Google services

function sheet_() {
  const book = SpreadsheetApp.getActiveSpreadsheet()
  return book.getSheetByName(CONFIG.SHEET) || book.insertSheet(CONFIG.SHEET)
}

// Run once from the editor: header, status menu and the two triggers
function setup() {
  const sh = sheet_()
  sh.getRange(1, 1, 1, COLS.length).setValues([COLS]).setFontWeight("bold")
  sh.setFrozenRows(1)
  sh.getRange(2, COL["Estado"] + 1, sh.getMaxRows() - 1, 1).setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(STATES, true).build()
  )
  sh.setColumnWidth(COL["Mensaje"] + 1, 420)
  ScriptApp.getProjectTriggers().forEach((t) => ScriptApp.deleteTrigger(t))
  ScriptApp.newTrigger("dailyDigest")
    .timeBased()
    .everyDays(1)
    .atHour(8)
    .inTimezone("Europe/Madrid")
    .create()
  ScriptApp.newTrigger("stampStatus")
    .forSpreadsheet(SpreadsheetApp.getActiveSpreadsheet())
    .onEdit()
    .create()
}

// The website posts each request here (Deploy > Web app)
function doPost(e) {
  const lead = cleanLead(e && e.postData ? e.postData.contents : "")
  if (!lead) return ContentService.createTextOutput("ignored")
  const lock = LockService.getScriptLock()
  lock.waitLock(10000)
  try {
    const sh = sheet_()
    const last = sh.getLastRow()
    const refs =
      last > 1 ? sh.getRange(2, COL["Ref"] + 1, last - 1, 1).getValues().flat() : []
    // The same request sent twice (WhatsApp, then email): one row
    if (refs.indexOf(lead.ref) !== -1) return ContentService.createTextOutput("ok")
    const now = new Date()
    const row = COLS.map(() => "")
    row[COL["Fecha"]] = now
    row[COL["Ref"]] = lead.ref
    // A leading = + - @ would run as a formula in the sheet
    const safe = (v) => (/^[=+\-@]/.test(v) ? "'" + v : v)
    row[COL["Nombre"]] = safe(lead.name)
    row[COL["Canal"]] = lead.channel
    row[COL["Servicio"]] = safe(lead.service)
    row[COL["Mensaje"]] = safe(lead.message)
    row[COL["Idioma"]] = lead.lang
    row[COL["Página"]] = safe(lead.page)
    row[COL["Estado"]] = "Nueva"
    row[COL["Fecha estado"]] = now
    row[COL["Avisos"]] = 0
    sh.appendRow(row)
    return ContentService.createTextOutput("ok")
  } finally {
    lock.releaseLock()
  }
}

// Notes when a row's "Estado" changes, and starts its reminders afresh
function stampStatus(e) {
  const range = e && e.range
  if (!range || range.getSheet().getName() !== CONFIG.SHEET) return
  if (range.getColumn() !== COL["Estado"] + 1 || range.getRow() < 2) return
  const sh = range.getSheet()
  for (let r = range.getRow(); r < range.getRow() + range.getNumRows(); r++) {
    sh.getRange(r, COL["Fecha estado"] + 1).setValue(new Date())
    sh.getRange(r, COL["Avisos"] + 1).setValue(0)
    sh.getRange(r, COL["Último aviso"] + 1).setValue("")
  }
}

function dailyDigest() {
  const sh = sheet_()
  const last = sh.getLastRow()
  if (last < 2) return
  const values = sh.getRange(2, 1, last - 1, COLS.length).getValues()
  const rows = values.map((v) => ({
    date: v[COL["Fecha"]] || null,
    ref: v[COL["Ref"]],
    name: v[COL["Nombre"]],
    channel: v[COL["Canal"]],
    service: v[COL["Servicio"]],
    message: v[COL["Mensaje"]],
    lang: v[COL["Idioma"]],
    status: v[COL["Estado"]],
    statusDate: v[COL["Fecha estado"]] || null,
    phone: v[COL["Teléfono"]],
    reminders: Number(v[COL["Avisos"]]) || 0,
    lastReminder: v[COL["Último aviso"]] || null,
  }))
  const now = new Date()
  const plan = planDigest(rows, now, CONFIG)
  const mail = digestEmail(plan, SpreadsheetApp.getActiveSpreadsheet().getUrl(), CONFIG)
  if (!mail) return
  MailApp.sendEmail({
    to: CONFIG.EMAIL || Session.getEffectiveUser().getEmail(),
    subject: mail.subject,
    htmlBody: mail.html,
  })
  ;[...plan.unanswered, ...plan.followUps, ...plan.reviews].forEach((it) => {
    sh.getRange(it.index + 2, COL["Avisos"] + 1).setValue(it.row.reminders + 1)
    sh.getRange(it.index + 2, COL["Último aviso"] + 1).setValue(now)
  })
}
