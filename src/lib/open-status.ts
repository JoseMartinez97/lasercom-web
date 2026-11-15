import { business } from "@/lib/business"

// "Open now · closes at 13:30" from the published hours, in the workshop's
// time zone whatever the visitor's. Bank holidays are not known here, so the
// line speaks of the usual hours (see the strings in i18n/messages/site.ts)
const ZONE = "Europe/Madrid"
const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const

type Strings = {
  open: string
  closes: string
  closed: string
  today: string
  tomorrow: string
  day: string
}

const minutes = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number)
  return h * 60 + m
}
const shortTime = (hhmm: string) => hhmm.replace(/^0/, "")

// Opening slots of a weekday (0 = Sunday), in minutes since midnight
const slots = (day: number) =>
  business.hours
    .filter((h) => (h.days as readonly string[]).includes(DAYS[day]))
    .map((h) => ({ opens: h.opens, closes: h.closes }))
    .sort((a, b) => minutes(a.opens) - minutes(b.opens))

function madridNow() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: ZONE,
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date())
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? ""
  return {
    day: DAYS.indexOf(get("weekday") as (typeof DAYS)[number]),
    now: Number(get("hour")) * 60 + Number(get("minute")),
  }
}

const dayName = (lang: string, day: number) =>
  new Intl.DateTimeFormat(lang, { weekday: "long", timeZone: "UTC" }).format(
    // 7 January 2024 was a Sunday
    new Date(Date.UTC(2024, 0, 7 + day))
  )

export function openStatus(lang: string, s: Strings) {
  const { day, now } = madridNow()
  const current = slots(day).find(
    (slot) => minutes(slot.opens) <= now && now < minutes(slot.closes)
  )
  if (current)
    return {
      open: true,
      text: `${s.open} · ${s.closes.replace("{time}", shortTime(current.closes))}`,
    }
  for (let ahead = 0; ahead < 8; ahead++) {
    const d = (day + ahead) % 7
    const next = slots(d).find((slot) => ahead > 0 || minutes(slot.opens) > now)
    if (!next) continue
    const when = ahead === 0 ? s.today : ahead === 1 ? s.tomorrow : s.day
    return {
      open: false,
      text: `${s.closed} · ${when
        .replace("{day}", dayName(lang, d))
        .replace("{time}", shortTime(next.opens))}`,
    }
  }
  return { open: false, text: s.closed }
}

// Fills every [data-open-status] on the page (components/custom/open-status)
// and keeps it right while the page stays open. Returns the cleanup
export function mountOpenStatus() {
  const els = document.querySelectorAll<HTMLElement>("[data-open-status]")
  if (!els.length) return () => {}
  const update = () =>
    els.forEach((el) => {
      const strings = JSON.parse(el.dataset.openStatus ?? "{}") as Strings
      const { open, text } = openStatus(document.documentElement.lang, strings)
      const label = el.querySelector("[data-open-text]")
      if (label) label.textContent = text
      el.toggleAttribute("data-open", open)
      el.toggleAttribute("data-ready", true)
    })
  update()
  const timer = window.setInterval(update, 60_000)
  return () => window.clearInterval(timer)
}
