import * as React from "react"
import { ArrowUpRight, Check, Copy, Mail, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ui, defaultLang, type Lang, type UiKey } from "@/i18n/ui"
import { mailHref, whatsappHref } from "@/lib/business"
import { leadsUrl, newRef, saveLead } from "@/lib/leads"
import { cn } from "@/lib/utils"

// The quote form without a server: the visitor picks a few options and the
// message is written for them, ready to send by WhatsApp or email, where they
// can attach photos and files. A service page links here with ?servicio=<id>,
// which names the service in the message and picks its material
const what = ["cut", "engrave", "both", "unsure"] as const
const materials = [
  "wood",
  "acrylic",
  "glass",
  "leather",
  "metal",
  "other",
] as const
const quantities = ["1", "2", "3", "4"] as const
const designs = ["file", "idea", "none"] as const
const noSubscribe = () => () => {}
// One reference per visit to the form, the same on every render
let visitRef = ""
const getRef = () => (visitRef ||= newRef())

// The material a service page implies, picked for the visitor
const serviceMaterial: Record<string, (typeof materials)[number]> = {
  madera: "wood",
  metacrilato: "acrylic",
  cristal: "glass",
  piel: "leather",
  metal: "metal",
}

const presets: {
  id: "gift" | "wedding" | "company" | "sign"
  job: (typeof what)[number][]
  mats: (typeof materials)[number][]
  qty: (typeof quantities)[number][]
  design: (typeof designs)[number][]
}[] = [
  {
    id: "gift",
    job: ["engrave"],
    mats: ["wood"],
    qty: ["1"],
    design: ["idea"],
  },
  {
    id: "wedding",
    job: ["both"],
    mats: ["wood", "glass"],
    qty: ["3"],
    design: ["idea"],
  },
  {
    id: "company",
    job: ["engrave"],
    mats: ["metal"],
    qty: ["3"],
    design: ["file"],
  },
  { id: "sign", job: ["cut"], mats: ["acrylic"], qty: ["1"], design: ["file"] },
]

function Choice({
  legend,
  options,
  value,
  onChange,
  multiple = false,
}: {
  legend: string
  options: { value: string; label: string }[]
  value: string[]
  onChange: (value: string[]) => void
  multiple?: boolean
}) {
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-3 text-lg font-semibold">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const checked = value.includes(option.value)
          return (
            <label
              key={option.value}
              className={cn(
                "relative inline-flex min-h-11 cursor-pointer items-center rounded-full border px-4 py-2 text-sm font-medium transition-colors has-focus-visible:ring-3 has-focus-visible:ring-ring/50 sm:text-base",
                checked
                  ? "border-foreground bg-foreground text-background"
                  : "border-input hover:border-foreground/50"
              )}
            >
              <input
                type={multiple ? "checkbox" : "radio"}
                name={legend}
                value={option.value}
                checked={checked}
                onChange={() =>
                  onChange(
                    multiple
                      ? checked
                        ? value.filter((v) => v !== option.value)
                        : [...value, option.value]
                      : [option.value]
                  )
                }
                className="sr-only"
              />
              {option.label}
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}

export function QuoteBuilder({
  lang = defaultLang,
  serviceNames = {},
}: {
  lang?: Lang
  // Service id to its name, for ?servicio=<id>
  serviceNames?: Record<string, string>
}) {
  const t = (key: UiKey) => ui[lang]?.[key] ?? ui[defaultLang][key]
  // The service the visitor came from (?servicio=<id>), read after hydration:
  // the server renders the form without it
  const param = React.useSyncExternalStore(
    noSubscribe,
    () => new URLSearchParams(location.search).get("servicio") ?? "",
    () => ""
  )
  const [dismissed, setDismissed] = React.useState(false)
  const service = !dismissed && serviceNames[param] ? param : ""
  const [activePreset, setActivePreset] = React.useState<string>("")
  const [job, setJob] = React.useState<string[]>([])
  // null until the visitor picks: then the service's material stands in
  const [pickedMats, setMats] = React.useState<string[] | null>(null)
  const implied = serviceMaterial[service]
  const mats = pickedMats ?? (implied ? [implied] : [])
  const [qty, setQty] = React.useState<string[]>([])
  const [design, setDesign] = React.useState<string[]>([])
  const [when, setWhen] = React.useState("")
  const [details, setDetails] = React.useState("")
  const [name, setName] = React.useState("")
  const [copied, setCopied] = React.useState(false)
  // Only when requests are saved: it links the chat with the sheet's row
  const ref = React.useSyncExternalStore(
    noSubscribe,
    () => (leadsUrl ? getRef() : ""),
    () => ""
  )

  const label = (prefix: string, v: string) => t(`${prefix}.${v}` as UiKey)
  const message = [
    name.trim()
      ? `${t("quote.msg.hello")} ${name.trim()}. ${t("quote.msg.intro")}`
      : t("quote.msg.intro"),
    service && `- ${t("quote.msg.service")}: ${serviceNames[service]}`,
    job.length > 0 &&
      `- ${t("quote.msg.what")}: ${label("quote.what", job[0])}`,
    mats.length > 0 &&
      `- ${t("quote.msg.material")}: ${mats.map((m) => label("quote.mat", m)).join(", ")}`,
    qty.length > 0 && `- ${t("quote.msg.qty")}: ${label("quote.qty", qty[0])}`,
    design.length > 0 &&
      `- ${t("quote.msg.design")}: ${label("quote.design", design[0])}`,
    when.trim() && `- ${t("quote.msg.when")}: ${when.trim()}`,
    details.trim() && `- ${t("quote.msg.details")}: ${details.trim()}`,
    ref && `(${t("quote.msg.ref")} ${ref})`,
  ]
    .filter(Boolean)
    .join("\n")

  // Nothing picked or written yet: sending would only say "I'd like a quote"
  const empty =
    !service &&
    [job, mats, qty, design].every((v) => v.length === 0) &&
    !when.trim() &&
    !details.trim()
  const [warned, setWarned] = React.useState(false)

  const save = (channel: "whatsapp" | "email") =>
    ref &&
    saveLead({
      ref,
      name: name.trim(),
      channel,
      service: service ? serviceNames[service] : "",
      message,
      lang,
      page: location.pathname,
    })

  const applyPreset = (preset: (typeof presets)[number]) => {
    setActivePreset(preset.id)
    setJob([...preset.job])
    setMats([...preset.mats])
    setQty([...preset.qty])
    setDesign([...preset.design])
    setWarned(false)
  }

  const copyMessage = async () => {
    if (empty) {
      setWarned(true)
      return
    }
    try {
      await navigator.clipboard.writeText(message)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2500)
    } catch {
      // Fallback ignored cleanly when clipboard permissions are unavailable
    }
  }

  const field =
    "min-h-12 w-full rounded-xl border border-input bg-background/50 px-4 py-3 text-base outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40"

  return (
    <form
      className="grid gap-10 lg:grid-cols-12 lg:items-start"
      onSubmit={(e) => {
        e.preventDefault()
        if (empty) return setWarned(true)
        save("whatsapp")
        window.open(whatsappHref(message), "_blank", "noopener")
      }}
    >
      <div className="flex flex-col gap-9 lg:col-span-7">
        {service && (
          <p className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-secondary/75 px-4 py-3">
            <span className="text-muted-foreground">{t("quote.about")}</span>{" "}
            <span className="font-semibold">{serviceNames[service]}</span>
            <button
              type="button"
              onClick={() => setDismissed(true)}
              className="ml-auto inline-flex size-11 items-center justify-center rounded-full hover:bg-background"
              aria-label={t("quote.about.remove")}
            >
              <X className="size-4" />
            </button>
          </p>
        )}

        <div className="flex flex-col gap-3 rounded-2xl border border-border/80 bg-background/60 p-4 sm:p-5">
          <p className="readout text-laser-ink">{t("quote.presets.label")}</p>
          <p className="text-sm text-muted-foreground">
            {t("quote.presets.hint")}
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            {presets.map((preset) => (
              <button
                key={preset.id}
                type="button"
                aria-pressed={activePreset === preset.id}
                onClick={() => applyPreset(preset)}
                className={cn(
                  "min-h-11 rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
                  activePreset === preset.id
                    ? "border-laser bg-laser/10 text-laser-ink"
                    : "border-input bg-card hover:border-foreground/50"
                )}
              >
                {t(`quote.preset.${preset.id}`)}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-7 border-t border-border pt-7">
          <p className="readout text-laser-ink">{t("quote.step.1")}</p>
          <Choice
            legend={t("quote.what")}
            options={what.map((v) => ({
              value: v,
              label: label("quote.what", v),
            }))}
            value={job}
            onChange={(next) => {
              setActivePreset("")
              setJob(next)
            }}
          />
          <Choice
            legend={t("quote.material")}
            options={materials.map((v) => ({
              value: v,
              label: label("quote.mat", v),
            }))}
            value={mats}
            onChange={(next) => {
              setActivePreset("")
              setMats(next)
            }}
            multiple
          />
        </div>

        <div className="flex flex-col gap-7 border-t border-border pt-7">
          <p className="readout text-laser-ink">{t("quote.step.2")}</p>
          <Choice
            legend={t("quote.qty")}
            options={quantities.map((v) => ({
              value: v,
              label: label("quote.qty", v),
            }))}
            value={qty}
            onChange={(next) => {
              setActivePreset("")
              setQty(next)
            }}
          />
          <Choice
            legend={t("quote.design")}
            options={designs.map((v) => ({
              value: v,
              label: label("quote.design", v),
            }))}
            value={design}
            onChange={(next) => {
              setActivePreset("")
              setDesign(next)
            }}
          />
        </div>

        <div className="flex flex-col gap-6 border-t border-border pt-7">
          <p className="readout text-laser-ink">{t("quote.step.3")}</p>
          <div className="grid gap-6 md:grid-cols-2">
            <label className="flex flex-col gap-3">
              <span className="text-lg font-semibold">{t("quote.when")}</span>
              <input
                className={field}
                value={when}
                onChange={(e) => setWhen(e.target.value)}
                placeholder={t("quote.when.placeholder")}
              />
            </label>
            <label className="flex flex-col gap-3">
              <span className="text-lg font-semibold">{t("quote.name")}</span>
              <input
                className={field}
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
              />
            </label>
          </div>
          <label className="flex flex-col gap-3">
            <span className="text-lg font-semibold">{t("quote.details")}</span>
            <textarea
              className={cn(field, "min-h-32 resize-y")}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder={t("quote.details.placeholder")}
              rows={4}
            />
          </label>
        </div>
      </div>

      {/* Sticky conversion column: message updates live while the visitor selects */}
      <div className="flex flex-col gap-5 rounded-2xl border border-border bg-background/75 p-5 sm:p-6 lg:sticky lg:top-24 lg:col-span-5">
        <div className="flex items-center justify-between gap-2">
          <p className="readout text-muted-foreground">{t("quote.preview")}</p>
          <button
            type="button"
            onClick={copyMessage}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-border px-3.5 text-xs font-semibold text-foreground transition-colors hover:border-foreground"
          >
            {copied ? (
              <>
                <Check className="size-3.5 text-laser-ink" aria-hidden />
                {t("quote.copied")}
              </>
            ) : (
              <>
                <Copy className="size-3.5" aria-hidden />
                {t("quote.copy")}
              </>
            )}
          </button>
        </div>

        {/* The message as it will arrive, in a chat bubble */}
        <div className="rounded-2xl bg-[#e7f6dc] p-4 dark:bg-[#1f3a2a]">
          <p
            aria-live="polite"
            className="rounded-xl rounded-tr-sm bg-[#d9fdd3] px-4 py-3 text-[0.95rem] leading-relaxed whitespace-pre-line text-[#111b21] shadow-sm"
          >
            {message}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Button
            type="submit"
            size="lg"
            className="h-13 rounded-full px-6 text-base"
          >
            {t("quote.send.wa")}
            <ArrowUpRight className="size-5" />
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="h-13 rounded-full bg-transparent px-6 text-base"
          >
            <a
              href={`${mailHref(t("quote.subject"))}&body=${encodeURIComponent(message)}`}
              onClick={(e) => {
                if (!empty) return save("email")
                e.preventDefault()
                setWarned(true)
              }}
            >
              <Mail className="size-4" />
              {t("quote.send.mail")}
            </a>
          </Button>
        </div>

        <p
          role="status"
          className="text-sm font-semibold text-laser-ink empty:hidden"
        >
          {warned && empty
            ? t("quote.empty")
            : copied
              ? t("quote.copied")
              : null}
        </p>
        <p className="text-sm text-muted-foreground">
          {t("quote.note")}
          {ref && <> {t("quote.note.saved")}</>}
        </p>
      </div>
    </form>
  )
}
