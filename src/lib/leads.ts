// Quote requests from the website, saved to the workshop's Google Sheet so
// none is forgotten (automation/seguimiento: the sheet, the morning digest
// and how to set it up). Empty until the sheet's web app is deployed: then
// nothing is saved and the form works as before
// TODO: paste the web app address (https://script.google.com/macros/s/…/exec)
export const leadsUrl = ""

export type Lead = {
  ref: string
  name: string
  channel: "whatsapp" | "email"
  service: string
  message: string
  lang: string
  page: string
}

// A short reference for the request, in the message and in the sheet, to
// match the WhatsApp chat with its row: L + yymmdd + 3 characters
export function newRef(now = new Date()) {
  const ymd = [now.getFullYear() % 100, now.getMonth() + 1, now.getDate()]
    .map((n) => String(n).padStart(2, "0"))
    .join("")
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  const bytes = crypto.getRandomValues(new Uint8Array(3))
  return `L${ymd}-${[...bytes].map((b) => alphabet[b % alphabet.length]).join("")}`
}

// Sent as the visitor leaves for WhatsApp or the email app: a beacon
// survives the page going to the background, and plain text needs no
// permission round trip with Google
export function saveLead(lead: Lead) {
  if (!leadsUrl) return
  const body = JSON.stringify(lead)
  try {
    if (
      navigator.sendBeacon?.(leadsUrl, new Blob([body], { type: "text/plain" }))
    )
      return
  } catch {
    // Falls through to fetch
  }
  fetch(leadsUrl, {
    method: "POST",
    body,
    mode: "no-cors",
    keepalive: true,
  }).catch(() => {})
}
