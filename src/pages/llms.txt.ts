import type { APIRoute } from "astro"
import { business } from "@/lib/business"
import { guideIds, guides } from "@/lib/guides"
import { serviceIds, services } from "@/lib/services"
import { ui } from "@/i18n/ui"

// A plain summary for AI search tools (llmstxt.org), built from the same
// business data as the rest of the site so the details never drift
export const GET: APIRoute = ({ site }) => {
  const origin = site?.origin ?? "https://lasercom.es"
  const hours = business.hours
    .map((h) => `${h.days.join(", ")} ${h.opens}–${h.closes}`)
    .join("; ")
  const body = `# ${business.name}

> ${ui.en["home.description"]} Working since ${business.founded}.

- Address: ${business.street}, ${business.postalCode} ${business.locality}, ${business.region}, Spain
- Phone and WhatsApp: ${business.phone} · Landline: ${business.landline}
- Email: ${business.email}
- Hours: ${hours}
- Google Business Profile: ${business.mapsUrl}

## Pages

- [Home](${origin}/) ([English](${origin}/en/)): services, materials, recent work, reviews and FAQ
- [Work](${origin}/trabajos/) ([English](${origin}/en/work/)): real jobs from the workshop
- [Guides](${origin}/guias/) ([English](${origin}/en/guides/))
- [Contact and quote](${origin}/contacto/) ([English](${origin}/en/contact/))

## Services

${serviceIds.map((id) => `- [${ui.en[`svc.${id}.h1`]}](${origin}${services[id].es}) ([English](${origin}${services[id].en})): ${ui.en[`svc.${id}.description`]}`).join("\n")}

## Guides

${guideIds.map((id) => `- [${ui.en[`guide.${id}.h1`]}](${origin}${guides[id].es}) ([English](${origin}${guides[id].en})): ${ui.en[`guide.${id}.description`]}`).join("\n")}

The Spanish pages are the main site; every link above has its English page.
`
  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  })
}
