// Google Analytics 4, the same property as the old WordPress site, so the
// visit history carries on. Consent Mode v2: until the visitor accepts in the
// cookie notice (cookie-consent.astro) GA sets no cookie and only receives
// anonymous pings Google uses to estimate visits; accepting turns cookies on.
//
// In GA4 (Admin → Data streams → Enhanced measurement) turn off "Page changes
// based on browser history events": the site moves between pages without a
// reload and sends its own page_view below, so leaving it on counts every
// page twice. See docs/migracion.md
export const gaId = "G-2ZTCCNRYYP"

// Off in a preview build (it must not mix with lasercom.es) and in `pnpm dev`
// (there it only logs to the console)
const preview = import.meta.env.PUBLIC_PREVIEW === "1"
export const analyticsOn = !preview
const live = analyticsOn && import.meta.env.PROD

export type Consent = "granted" | "denied"
const storageKey = "lasercom-consent"
// The choice is asked again after 13 months, as the Spanish data protection
// agency (AEPD) recommends for consent that is not renewed
const maxAge = 13 * 30 * 24 * 60 * 60 * 1000

export function storedConsent(): Consent | null {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) ?? "null") as {
      value: Consent
      at: number
    } | null
    if (!saved || Date.now() - saved.at > maxAge) return null
    return saved.value === "granted" ? "granted" : "denied"
  } catch {
    return null
  }
}

declare global {
  interface Window {
    dataLayer: unknown[]
    gtag: (...args: unknown[]) => void
  }
}

function gtag(...args: unknown[]) {
  if (!live) {
    if (analyticsOn) console.debug("[analytics]", ...args)
    return
  }
  // gtag.js reads the arguments object itself, not an array
  // eslint-disable-next-line prefer-rest-params
  window.dataLayer.push(arguments)
}

let started = false

// Sets the defaults (everything denied unless already accepted) and loads
// gtag.js. Called once the first screen has painted, so it never competes
// with the hero
export function startAnalytics() {
  if (!analyticsOn || started) return
  started = true
  window.dataLayer = window.dataLayer || []
  window.gtag = gtag
  const consent = storedConsent() ?? "denied"
  gtag("consent", "default", {
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    analytics_storage: consent,
    wait_for_update: 500,
  })
  gtag("set", "ads_data_redaction", true)
  gtag("js", new Date())
  gtag("config", gaId, { send_page_view: false })
  pageView()
  if (live) {
    const script = document.createElement("script")
    script.async = true
    script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`
    document.head.append(script)
  }
}

export function setConsent(value: Consent) {
  try {
    localStorage.setItem(storageKey, JSON.stringify({ value, at: Date.now() }))
  } catch {
    // Private mode: the choice lasts this visit only
  }
  if (started) gtag("consent", "update", { analytics_storage: value })
  // Declining after accepting: the cookies GA already set go too
  if (value === "denied") {
    for (const name of document.cookie
      .split(";")
      .map((c) => c.split("=")[0].trim()))
      if (name === "_ga" || name.startsWith("_ga_"))
        for (const domain of [
          "",
          location.hostname,
          `.${location.hostname.replace(/^www\./, "")}`,
        ])
          document.cookie = `${name}=; Max-Age=0; path=/${domain ? `; domain=${domain}` : ""}`
  }
}

let lastPath = ""

// One per page. The site swaps pages without a reload (Astro's view
// transitions), so this runs on every astro:page-load, not just the first
export function pageView() {
  if (!started || location.pathname === lastPath) return
  lastPath = location.pathname
  gtag("event", "page_view", {
    page_location: location.href,
    page_title: document.title,
  })
}

// Events GA marks as key events (the "conversions"): see docs/migracion.md
export function track(event: string, params: Record<string, string> = {}) {
  if (started) gtag("event", event, params)
}

// A tap on any phone, WhatsApp or email link anywhere on the site
export function trackContactClicks() {
  const onClick = (e: MouseEvent) => {
    const link = (e.target as Element | null)?.closest?.("a[href]")
    if (!(link instanceof HTMLAnchorElement)) return
    const href = link.href
    const method = href.startsWith("tel:")
      ? "phone"
      : href.startsWith("mailto:")
        ? "email"
        : /^https:\/\/(wa\.me|api\.whatsapp\.com)\//.test(href)
          ? "whatsapp"
          : null
    // The quote form's own buttons send generate_lead instead
    if (!method || link.closest("[data-quote-form]")) return
    track("contact", { method, link_location: placeOf(link) })
  }
  document.addEventListener("click", onClick, { capture: true })
}

function placeOf(link: Element) {
  if (link.closest("[data-action-bar]")) return "action_bar"
  if (link.closest("[data-whatsapp-button]")) return "whatsapp_button"
  if (link.closest("header")) return "header"
  if (link.closest("footer")) return "footer"
  return "page"
}
