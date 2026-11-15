import * as React from "react"
import {
  ArrowRight,
  ArrowUpRight,
  Download,
  RotateCcw,
  Upload,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Lang } from "@/i18n/ui"
import { localizePath, useTranslations } from "@/i18n/utils"
import { whatsappHref } from "@/lib/business"
import { Engraver, type MaskDraw } from "@/lib/laser/engraver"
import type { Material } from "@/lib/laser/textures"
import { cn } from "@/lib/utils"

interface Props {
  lang: Lang
}

type FontPresetId = "geometric" | "classic" | "mono" | "italic"
type FrameId = "none" | "border" | "tag" | "seal"
type ChipId = "wedding" | "industrial" | "company" | "gift"

const previewMaterials: {
  id: Material
  serviceId: string
  key: "wood" | "metal" | "acrylic" | "leather"
  swatch: string
  plateBg: string
}[] = [
  {
    id: "wood",
    serviceId: "madera",
    key: "wood",
    swatch: "bg-[#d8b88a] border-[#9c7849]/50",
    plateBg: "bg-[#e9d5b0]",
  },
  {
    id: "metal",
    serviceId: "metal",
    key: "metal",
    swatch: "bg-[#bcc3ca] border-[#6a727c]/60",
    plateBg: "bg-[#c6ccd2]",
  },
  {
    id: "acrylic",
    serviceId: "metacrilato",
    key: "acrylic",
    swatch: "bg-[#191d24] border-white/25",
    plateBg: "bg-[#15181d]",
  },
  {
    id: "leather",
    serviceId: "piel",
    key: "leather",
    swatch: "bg-[#6c4830] border-[#3d2618]/70",
    plateBg: "bg-[#6a4730]",
  },
]

const fontPresets: {
  id: FontPresetId
  family: string
  weight: string
  style: "normal" | "italic"
  stretch: string
  spacing: string
}[] = [
  {
    id: "geometric",
    family: '"Archivo Variable", system-ui, sans-serif',
    weight: "800",
    style: "normal",
    stretch: "expanded",
    spacing: "-0.02em",
  },
  {
    id: "classic",
    family: 'Georgia, "Times New Roman", serif',
    weight: "700",
    style: "normal",
    stretch: "normal",
    spacing: "0.02em",
  },
  {
    id: "mono",
    family: '"JetBrains Mono", ui-monospace, monospace',
    weight: "700",
    style: "normal",
    stretch: "normal",
    spacing: "0.04em",
  },
  {
    id: "italic",
    family: 'Georgia, "Times New Roman", serif',
    weight: "600",
    style: "italic",
    stretch: "normal",
    spacing: "0.01em",
  },
]

const frames: FrameId[] = ["border", "tag", "seal", "none"]

const chips: {
  id: ChipId
  material: Material
  font: FontPresetId
  frame: FrameId
}[] = [
  { id: "wedding", material: "wood", font: "italic", frame: "border" },
  { id: "industrial", material: "metal", font: "mono", frame: "tag" },
  { id: "company", material: "acrylic", font: "geometric", frame: "seal" },
  { id: "gift", material: "leather", font: "classic", frame: "border" },
]

// Converts any uploaded SVG/PNG/JPG into a monochrome alpha mask in browser memory
async function buildLogoStencil(file: File): Promise<HTMLCanvasElement> {
  const url = URL.createObjectURL(file)
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image()
      el.onload = () => resolve(el)
      el.onerror = () => reject(new Error("decode"))
      el.src = url
    })
    const maxDim = 320
    const scale = Math.min(
      1,
      maxDim / Math.max(1, img.naturalWidth || 320, img.naturalHeight || 320)
    )
    const w = Math.max(1, Math.round((img.naturalWidth || 320) * scale))
    const h = Math.max(1, Math.round((img.naturalHeight || 320) * scale))

    const out = document.createElement("canvas")
    out.width = w
    out.height = h
    const ctx = out.getContext("2d")!
    ctx.drawImage(img, 0, 0, w, h)

    const imgData = ctx.getImageData(0, 0, w, h)
    const d = imgData.data

    let transparentCount = 0
    for (let i = 3; i < d.length; i += 4) {
      if (d[i] < 235) transparentCount++
    }
    const hasAlpha = transparentCount > w * h * 0.04

    // Detect background luminance from four corners for opaque bitmaps
    const sampleLum = (x: number, y: number) => {
      const idx = (y * w + x) * 4
      return 0.299 * d[idx] + 0.587 * d[idx + 1] + 0.114 * d[idx + 2]
    }
    const bgLum =
      (sampleLum(0, 0) +
        sampleLum(w - 1, 0) +
        sampleLum(0, h - 1) +
        sampleLum(w - 1, h - 1)) /
      4
    const lightBg = bgLum >= 128

    for (let i = 0; i < d.length; i += 4) {
      const a = d[i + 3]
      const lum = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]
      let inkAlpha = 0
      if (hasAlpha) {
        inkAlpha = a > 36 ? Math.min(255, Math.round(a * 1.15)) : 0
      } else if (lightBg) {
        inkAlpha = lum < 210 ? Math.min(255, Math.round((215 - lum) * 1.6)) : 0
      } else {
        inkAlpha = lum > 55 ? Math.min(255, Math.round((lum - 45) * 1.6)) : 0
      }
      d[i] = 0
      d[i + 1] = 0
      d[i + 2] = 0
      d[i + 3] = inkAlpha
    }
    ctx.putImageData(imgData, 0, 0)
    return out
  } finally {
    URL.revokeObjectURL(url)
  }
}

export function LaserPreview({ lang }: Props) {
  const t = useTranslations(lang)

  const [material, setMaterial] = React.useState<Material>("wood")
  const [fontId, setFontId] = React.useState<FontPresetId>("italic")
  const [frameId, setFrameId] = React.useState<FrameId>("border")
  const [line1, setLine1] = React.useState(() =>
    t("preview.chip.wedding.line1")
  )
  const [line2, setLine2] = React.useState(() =>
    t("preview.chip.wedding.line2")
  )
  const [logoName, setLogoName] = React.useState("")
  const [logoError, setLogoError] = React.useState(false)
  const [engraving, setEngraving] = React.useState(false)
  const [activeChip, setActiveChip] = React.useState<ChipId>("wedding")

  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const wrapRef = React.useRef<HTMLDivElement>(null)
  const sheenRef = React.useRef<HTMLDivElement>(null)
  const coordsRef = React.useRef<HTMLSpanElement>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const logoCanvasRef = React.useRef<HTMLCanvasElement | null>(null)
  const engraverRef = React.useRef<Engraver | null>(null)
  const mountedRef = React.useRef(false)
  const runIdRef = React.useRef(0)

  const currentMat =
    previewMaterials.find((m) => m.id === material) ?? previewMaterials[0]
  const currentFont = fontPresets.find((f) => f.id === fontId) ?? fontPresets[0]

  const buildMask = React.useCallback((): MaskDraw => {
    const l1 = line1.trim()
    const l2 = line2.trim()
    const logo = logoCanvasRef.current

    return (ctx: CanvasRenderingContext2D) => {
      const canvas = canvasRef.current
      if (!canvas) return
      const w = canvas.clientWidth
      const h = canvas.clientHeight
      if (w < 10 || h < 10) return

      const minDim = Math.min(w, h)
      const inset = minDim * 0.08
      const strokeW = Math.max(1.5, w * 0.0038)
      ctx.lineWidth = strokeW

      // Draw optional perimeter frame
      if (frameId === "border") {
        ctx.beginPath()
        ctx.roundRect(inset, inset, w - inset * 2, h - inset * 2, inset * 0.45)
        ctx.stroke()
      } else if (frameId === "tag") {
        ctx.beginPath()
        ctx.roundRect(inset, inset, w - inset * 2, h - inset * 2, inset * 0.35)
        ctx.stroke()
        const holeOffset = inset + minDim * 0.055
        const holeR = Math.max(3, minDim * 0.018)
        for (const [hx, hy] of [
          [holeOffset, holeOffset],
          [w - holeOffset, holeOffset],
          [holeOffset, h - holeOffset],
          [w - holeOffset, h - holeOffset],
        ]) {
          ctx.beginPath()
          ctx.arc(hx, hy, holeR, 0, Math.PI * 2)
          ctx.stroke()
        }
      } else if (frameId === "seal") {
        const radius = (minDim - inset * 2) * 0.48
        ctx.beginPath()
        ctx.arc(w / 2, h / 2, radius, 0, Math.PI * 2)
        ctx.stroke()
        ctx.lineWidth = Math.max(1, strokeW * 0.65)
        ctx.beginPath()
        ctx.arc(w / 2, h / 2, radius * 0.92, 0, Math.PI * 2)
        ctx.stroke()
      }

      const safeW = frameId === "seal" ? minDim * 0.64 : w - inset * 3.4
      const safeTop = inset * 1.4
      const safeH = h - safeTop * 2

      // Layout: logo (if present) + line1 + optional line2
      const hasText = Boolean(l1 || l2)
      let contentY = h / 2

      if (logo) {
        const maxLogoW = hasText ? safeW * 0.42 : safeW * 0.62
        const maxLogoH = hasText ? safeH * 0.34 : safeH * 0.62
        const scale = Math.min(maxLogoW / logo.width, maxLogoH / logo.height)
        const lw = logo.width * scale
        const lh = logo.height * scale
        const ly = hasText
          ? h / 2 - (l2 ? safeH * 0.24 : safeH * 0.16) - lh / 2
          : h / 2 - lh / 2
        ctx.drawImage(logo, (w - lw) / 2, ly, lw, lh)
        if (hasText) {
          contentY = ly + lh + safeH * (l2 ? 0.22 : 0.24)
        }
      }

      const fitFont = (text: string, maxPx: number, widthCap: number) => {
        let px = maxPx
        const make = (s: number) =>
          `${currentFont.style} ${currentFont.weight} ${currentFont.stretch} ${s}px ${currentFont.family}`
        ctx.font = make(px)
        ctx.letterSpacing = currentFont.spacing
        const measured = ctx.measureText(text).width
        if (measured > widthCap && measured > 0) {
          px *= widthCap / measured
        }
        ctx.font = make(px)
        return px
      }

      ctx.textAlign = "center"
      ctx.textBaseline = "middle"

      const mainText = l1 || (!logo ? t("preview.line1.placeholder") : "")
      if (mainText) {
        const maxPrimary = logo ? h * 0.16 : h * (l2 ? 0.21 : 0.27)
        const primarySize = fitFont(mainText, maxPrimary, safeW)
        const y1 = l2
          ? contentY - primarySize * 0.46
          : contentY + primarySize * 0.04
        ctx.fillText(mainText, w / 2, y1)

        if (l2) {
          const secondaryMax = Math.min(primarySize * 0.56, h * 0.095)
          const subSize = fitFont(l2, secondaryMax, safeW * 0.9)
          ctx.fillText(l2, w / 2, y1 + primarySize * 0.78 + subSize * 0.45)
        }
      } else if (l2) {
        const subSize = fitFont(l2, h * 0.13, safeW)
        ctx.fillText(l2, w / 2, contentY + subSize * 0.04)
      }
    }
  }, [currentFont, frameId, line1, line2, t])

  const triggerEngrave = React.useCallback(
    (duration = 1650) => {
      const engraver = engraverRef.current
      if (!engraver) return
      const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches
      engraver.setMask(buildMask())
      if (reduced) {
        setEngraving(false)
        engraver.burnAll()
        return
      }
      const id = ++runIdRef.current
      setEngraving(true)
      void engraver.engrave(duration).then(() => {
        if (mountedRef.current && runIdRef.current === id) {
          setEngraving(false)
        }
      })
    },
    [buildMask]
  )

  // Initialize Engraver on mount and clean up completely on unmount / View Transitions
  React.useEffect(() => {
    const canvas = canvasRef.current
    const wrap = wrapRef.current
    if (!canvas || !wrap) return

    mountedRef.current = true
    const engraver = new Engraver(canvas, { material })
    engraverRef.current = engraver

    const ro = new ResizeObserver(() => engraver.resize())
    ro.observe(wrap)

    let cancelled = false
    document.fonts.ready.then(() => {
      if (cancelled || !engraverRef.current) return
      triggerEngrave(1800)
    })

    return () => {
      cancelled = true
      mountedRef.current = false
      ro.disconnect()
      engraver.destroy()
      engraverRef.current = null
    }
    // Init once on mount; state sync effects below drive subsequent passes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Update substrate material without recreating Engraver
  const prevMaterialRef = React.useRef<Material>(material)
  React.useEffect(() => {
    const engraver = engraverRef.current
    if (!engraver || prevMaterialRef.current === material) return
    prevMaterialRef.current = material
    engraver.setMaterial(material)
    triggerEngrave(1500)
  }, [material, triggerEngrave])

  // Debounce text/font/frame changes so typing feels crisp and passes trigger smoothly
  const firstStylePassRef = React.useRef(true)
  React.useEffect(() => {
    if (firstStylePassRef.current) {
      firstStylePassRef.current = false
      return
    }
    const timer = window.setTimeout(() => {
      triggerEngrave(1350)
    }, 320)
    return () => window.clearTimeout(timer)
  }, [line1, line2, fontId, frameId, triggerEngrave])

  const onChipSelect = (chip: (typeof chips)[number]) => {
    setActiveChip(chip.id)
    setMaterial(chip.material)
    setFontId(chip.font)
    setFrameId(chip.frame)
    setLine1(t(`preview.chip.${chip.id}.line1`))
    setLine2(t(`preview.chip.${chip.id}.line2`))
  }

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoError(false)
    try {
      const stencil = await buildLogoStencil(file)
      logoCanvasRef.current = stencil
      setLogoName(file.name)
      triggerEngrave(1600)
    } catch {
      setLogoError(true)
    } finally {
      e.target.value = ""
    }
  }

  const clearLogo = () => {
    logoCanvasRef.current = null
    setLogoName("")
    setLogoError(false)
    triggerEngrave(1450)
  }

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const wrap = wrapRef.current
    if (!wrap) return
    const box = wrap.getBoundingClientRect()
    const rx = (e.clientX - box.left) / Math.max(1, box.width)
    const ry = (e.clientY - box.top) / Math.max(1, box.height)
    sheenRef.current?.style.setProperty("--lx", `${(rx * 100).toFixed(1)}%`)
    sheenRef.current?.style.setProperty("--ly", `${(ry * 100).toFixed(1)}%`)
    if (coordsRef.current) {
      coordsRef.current.textContent = `X ${(rx * 300).toFixed(1).padStart(5, "0")} · Y ${(ry * 180).toFixed(1).padStart(5, "0")}`
    }
    if (
      e.pointerType === "mouse" &&
      !matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      engraverRef.current?.touch(e.clientX - box.left, e.clientY - box.top)
    }
  }

  const onPointerLeave = () => {
    engraverRef.current?.untouch()
  }

  const downloadPng = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const link = document.createElement("a")
    link.download = `lasercom-${currentMat.serviceId}.png`
    link.href = canvas.toDataURL("image/png")
    link.click()
  }

  const combinedText = [line1.trim(), line2.trim()]
    .filter(Boolean)
    .join(" · ")
    .slice(0, 60)

  // Built in the browser, so the folder of a preview build goes in by hand
  const quoteHref = `${import.meta.env.BASE_URL.replace(/\/$/, "")}${localizePath(lang, "/contacto/")}?servicio=${currentMat.serviceId}${
    combinedText ? `&texto=${encodeURIComponent(combinedText)}` : ""
  }#presupuesto`

  const waHref = whatsappHref(
    [
      t("preview.wa.intro"),
      `- ${t("preview.material.label")}: ${t(`preview.material.${currentMat.key}`)}`,
      combinedText ? `- ${t("preview.line1.label")}: "${combinedText}"` : "",
      logoName ? `- ${t("preview.logo.label")}: ${logoName}` : "",
    ]
      .filter(Boolean)
      .join("\n")
  )

  return (
    <div
      data-laser-preview
      className="mx-auto grid max-w-[1440px] gap-8 lg:grid-cols-12 lg:items-start lg:gap-x-10 lg:gap-y-6"
    >
      {/* Heading block */}
      <div className="flex min-w-0 flex-col gap-4 lg:col-span-5 lg:col-start-1 lg:row-start-1">
        <p className="flex items-center gap-3 readout text-laser-ink">
          <span className="h-px w-8 shrink-0 bg-current" aria-hidden />
          {t("preview.eyebrow")}
        </p>
        <h2 className="display text-[clamp(2.1rem,4.6vw,4.25rem)] leading-[0.95]">
          {t("preview.title")}
        </h2>
        <p className="text-base leading-relaxed text-muted-foreground md:text-lg">
          {t("preview.lead")}
        </p>
      </div>

      {/* Canvas & Conversion column — appears right under heading on mobile, right column on desktop */}
      <div className="flex min-w-0 flex-col gap-5 lg:sticky lg:top-24 lg:col-span-7 lg:col-start-6 lg:row-span-2 lg:row-start-1">
        {/* Workshop machine bed housing */}
        <div className="min-w-0 rounded-[1.75rem] border border-white/10 bg-[#12100f] p-3 text-[#f6f3ed] shadow-[0_32px_90px_-30px_rgb(0_0_0/0.55)] md:rounded-[2rem] md:p-5">
          {/* Status bar */}
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 px-2">
            <span className="flex items-center gap-2 readout text-white/75">
              <span
                className={cn(
                  "size-2 shrink-0 rounded-full transition-colors",
                  engraving
                    ? "bg-laser shadow-[0_0_10px_#ff5a2a]"
                    : "bg-emerald-400"
                )}
                aria-hidden
              />
              {engraving
                ? t("preview.status.engraving")
                : t("preview.status.ready")}
            </span>
            <span
              ref={coordsRef}
              aria-hidden="true"
              className="readout text-white/55 tabular-nums"
            >
              X 000.0 · Y 000.0
            </span>
          </div>

          {/* Interactive canvas plate */}
          <div
            ref={wrapRef}
            data-preview-plate-wrap
            data-material={material}
            onPointerMove={onPointerMove}
            onPointerLeave={onPointerLeave}
            className={cn(
              "relative aspect-[16/10] w-full overflow-hidden rounded-[1.15rem] border border-white/10 transition-colors md:rounded-[1.25rem]",
              currentMat.plateBg
            )}
          >
            <canvas
              ref={canvasRef}
              data-preview-canvas
              role="img"
              aria-label={t("preview.canvas.label").replace(
                "{material}",
                t(`preview.material.${currentMat.key}`)
              )}
              className="absolute inset-0 size-full cursor-crosshair"
            />
            <div
              ref={sheenRef}
              aria-hidden="true"
              className={cn(
                "pointer-events-none absolute inset-0",
                material === "metal" || material === "acrylic"
                  ? "opacity-55 mix-blend-screen"
                  : "mix-blend-soft-light"
              )}
              style={{
                background:
                  "radial-gradient(circle at var(--lx, 70%) var(--ly, 30%), rgb(255 255 255 / 0.55), transparent 46%)",
              }}
            />
          </div>

          {/* Machine readout footer & utility buttons */}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 px-1">
            <p className="readout text-white/65">
              {t(`preview.material.${currentMat.key}`)} ·{" "}
              {t(`preview.font.${fontId}`)} · {t(`preview.frame.${frameId}`)}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                data-preview-replay
                onClick={() => triggerEngrave(1750)}
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/20 px-4 text-xs font-semibold text-white transition-colors hover:border-white/50 hover:bg-white/10"
              >
                <RotateCcw className="size-3.5 shrink-0" aria-hidden />
                {t("preview.action.replay")}
              </button>
              <button
                type="button"
                data-preview-download
                onClick={downloadPng}
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/20 px-4 text-xs font-semibold text-white transition-colors hover:border-white/50 hover:bg-white/10"
              >
                <Download className="size-3.5 shrink-0" aria-hidden />
                {t("preview.action.download")}
              </button>
            </div>
          </div>
        </div>

        {/* Conversion CTA bar */}
        <div className="flex min-w-0 flex-col gap-3 rounded-2xl border border-border bg-card/70 p-4 sm:p-5">
          <div className="flex flex-wrap gap-3">
            <Button
              asChild
              size="lg"
              className="h-auto min-h-13 max-w-full rounded-full px-6 py-3 text-center text-base whitespace-normal"
            >
              <a data-preview-quote href={quoteHref}>
                {t("preview.action.quote")}
                <ArrowRight className="size-5 shrink-0" aria-hidden />
              </a>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="h-auto min-h-13 max-w-full rounded-full bg-transparent px-6 py-3 text-center text-base whitespace-normal"
            >
              <a
                data-preview-wa
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
              >
                {t("preview.action.wa")}
                <ArrowUpRight className="size-4 shrink-0" aria-hidden />
              </a>
            </Button>
          </div>
        </div>

        <p className="text-sm text-muted-foreground">{t("preview.note")}</p>
      </div>

      {/* Controls column */}
      <div className="flex min-w-0 flex-col gap-6 lg:col-span-5 lg:col-start-1 lg:row-start-2">
        {/* Quick examples */}
        <div className="flex min-w-0 flex-col gap-2.5">
          <p className="readout text-muted-foreground">
            {t("preview.chips.label")}
          </p>
          <div className="flex flex-wrap gap-2">
            {chips.map((chip) => {
              const selected = activeChip === chip.id
              return (
                <button
                  key={chip.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => onChipSelect(chip)}
                  className={cn(
                    "min-h-11 rounded-full border px-4 text-sm font-semibold transition-colors",
                    selected
                      ? "border-foreground bg-foreground text-background"
                      : "border-input bg-card/60 text-foreground hover:border-foreground"
                  )}
                >
                  {t(`preview.chip.${chip.id}.name`)}
                </button>
              )
            })}
          </div>
        </div>

        {/* Text inputs */}
        <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          <label className="flex min-w-0 flex-col gap-2">
            <span className="readout text-muted-foreground">
              {t("preview.line1.label")}
            </span>
            <input
              type="text"
              data-preview-line1
              value={line1}
              maxLength={42}
              autoComplete="off"
              placeholder={t("preview.line1.placeholder")}
              onChange={(e) => setLine1(e.target.value)}
              className="min-h-12 w-full rounded-xl border border-input bg-card px-4 text-base font-semibold outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40"
            />
          </label>
          <label className="flex min-w-0 flex-col gap-2">
            <span className="readout text-muted-foreground">
              {t("preview.line2.label")}
            </span>
            <input
              type="text"
              data-preview-line2
              value={line2}
              maxLength={42}
              autoComplete="off"
              placeholder={t("preview.line2.placeholder")}
              onChange={(e) => setLine2(e.target.value)}
              className="min-h-12 w-full rounded-xl border border-input bg-card px-4 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40"
            />
          </label>
        </div>

        {/* Material selector */}
        <fieldset className="flex min-w-0 flex-col gap-2.5">
          <legend className="mb-2 readout text-muted-foreground">
            {t("preview.material.label")}
          </legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
            {previewMaterials.map((m) => {
              const selected = m.id === material
              return (
                <button
                  key={m.id}
                  type="button"
                  data-preview-material={m.id}
                  aria-pressed={selected}
                  onClick={() => setMaterial(m.id)}
                  className={cn(
                    "inline-flex min-h-11 min-w-0 items-center justify-center gap-2 rounded-full border px-2.5 text-sm font-semibold transition-colors",
                    selected
                      ? "border-foreground bg-foreground text-background"
                      : "border-input bg-card/60 text-foreground hover:border-foreground"
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(
                      "size-3.5 shrink-0 rounded-full border",
                      m.swatch
                    )}
                  />
                  <span className="truncate">
                    {t(`preview.material.${m.key}`)}
                  </span>
                </button>
              )
            })}
          </div>
        </fieldset>

        {/* Typography & Frame */}
        <div className="grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          <fieldset className="flex min-w-0 flex-col gap-2">
            <legend className="mb-2 readout text-muted-foreground">
              {t("preview.font.label")}
            </legend>
            <div className="grid grid-cols-2 gap-2">
              {fontPresets.map((f) => {
                const selected = f.id === fontId
                return (
                  <button
                    key={f.id}
                    type="button"
                    data-preview-font={f.id}
                    aria-pressed={selected}
                    onClick={() => setFontId(f.id)}
                    className={cn(
                      "min-h-11 min-w-0 rounded-xl border px-2.5 text-xs font-semibold transition-colors sm:text-sm",
                      selected
                        ? "border-foreground bg-foreground text-background"
                        : "border-input bg-card/60 text-foreground hover:border-foreground"
                    )}
                  >
                    {t(`preview.font.${f.id}`)}
                  </button>
                )
              })}
            </div>
          </fieldset>

          <fieldset className="flex min-w-0 flex-col gap-2">
            <legend className="mb-2 readout text-muted-foreground">
              {t("preview.frame.label")}
            </legend>
            <div className="grid grid-cols-2 gap-2">
              {frames.map((frame) => {
                const selected = frame === frameId
                return (
                  <button
                    key={frame}
                    type="button"
                    data-preview-frame={frame}
                    aria-pressed={selected}
                    onClick={() => setFrameId(frame)}
                    className={cn(
                      "min-h-11 min-w-0 rounded-xl border px-2.5 text-xs font-semibold transition-colors sm:text-sm",
                      selected
                        ? "border-foreground bg-foreground text-background"
                        : "border-input bg-card/60 text-foreground hover:border-foreground"
                    )}
                  >
                    {t(`preview.frame.${frame}`)}
                  </button>
                )
              })}
            </div>
          </fieldset>
        </div>

        {/* Optional local SVG/image logo upload */}
        <div className="flex min-w-0 flex-col gap-2 rounded-2xl border border-border/80 bg-card/50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="readout text-muted-foreground">
              {t("preview.logo.label")}
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".svg,image/png,image/jpeg,image/webp"
                onChange={onFileChange}
                className="sr-only"
                aria-label={t("preview.logo.add")}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-input bg-background px-4 text-xs font-semibold transition-colors hover:border-foreground sm:text-sm"
              >
                <Upload className="size-3.5 shrink-0" aria-hidden />
                {t("preview.logo.add")}
              </button>
              {logoName && (
                <button
                  type="button"
                  onClick={clearLogo}
                  aria-label={t("preview.logo.clear")}
                  className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-input px-3 text-xs font-semibold text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
                >
                  <X className="size-3.5 shrink-0" aria-hidden />
                  {t("preview.logo.clear")}
                </button>
              )}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            {logoError
              ? t("preview.logo.error")
              : logoName
                ? `${logoName} · ${t("preview.logo.hint")}`
                : t("preview.logo.hint")}
          </p>
        </div>
      </div>
    </div>
  )
}
