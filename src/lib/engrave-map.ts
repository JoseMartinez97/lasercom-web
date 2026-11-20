// The file the laser burns, as a height map on a 2D canvas in the piece's
// own pixels: red is the groove (soft at its walls), green a wider halo
// (scorch, heat tint). Text is stretched to the DOM text's box; a logo is
// fitted into an area. Shared by the bed's renderer (engrave-3d.ts)

export const MATERIALS = [
  "acero",
  "aluminio",
  "laton",
  "plastico",
  "madera",
  "piel",
  "metacrilato",
  "cristal",
] as const
export type GlMaterial = (typeof MATERIALS)[number]

export type Box = { x: number; y: number; w: number; h: number }

// How soft the walls of the groove are (CSS px of blur) per material: a
// fibre laser on metal is crisp, a CO2 laser on wood chars a wider edge
const SOFT: Record<GlMaterial, number> = {
  acero: 0.45,
  aluminio: 0.45,
  laton: 0.5,
  plastico: 0.4,
  madera: 0.7,
  piel: 0.6,
  metacrilato: 0.45,
  cristal: 0.5,
}

// A logo as a burn mask: transparent PNGs and SVGs burn where they are
// opaque; flat images burn where they are darker than their background
const logoMask = (img: HTMLImageElement, w: number, h: number) => {
  const mc = document.createElement("canvas")
  mc.width = w
  mc.height = h
  const m = mc.getContext("2d", { willReadFrequently: true })
  if (!m) return mc
  m.drawImage(img, 0, 0, w, h)
  const data = m.getImageData(0, 0, w, h)
  const a = data.data
  const luma = (i: number) =>
    (0.299 * a[i] + 0.587 * a[i + 1] + 0.114 * a[i + 2]) / 255
  let clear = 0
  let seen = 0
  for (let i = 3; i < a.length; i += 4 * 5) {
    seen++
    if (a[i] < 128) clear++
  }
  const alphaMode = clear > seen * 0.02
  let edge = 0
  let edges = 0
  for (let x = 0; x < w; x += 2) {
    edge += luma(x * 4) + luma(((h - 1) * w + x) * 4)
    edges += 2
  }
  const invert = !alphaMode && edge / Math.max(edges, 1) < 0.5
  const smooth = (e0: number, e1: number, v: number) => {
    const t = Math.min(1, Math.max(0, (v - e0) / (e1 - e0)))
    return t * t * (3 - 2 * t)
  }
  for (let i = 0; i < a.length; i += 4) {
    const v = alphaMode
      ? a[i + 3] / 255
      : smooth(0.22, 0.62, invert ? luma(i) : 1 - luma(i))
    a[i] = a[i + 1] = a[i + 2] = 255
    a[i + 3] = Math.round(v * 255)
  }
  m.putImageData(data, 0, 0)
  return mc
}

export type HeightMap = {
  canvas: HTMLCanvasElement
  /** Bumps whenever the canvas is redrawn */
  version: () => number
  setSize: (w: number, h: number, dpr: number) => void
  setMaterial: (m: GlMaterial) => void
  setText: (text: string, box: Box, font: string) => void
  setImage: (img: HTMLImageElement, area: Box) => void
  ink: () => Box | null
  inkAt: (x: number, y: number) => number
}

export function createHeightMap(): HeightMap {
  const hm = document.createElement("canvas")
  hm.width = 2
  hm.height = 2
  const hctx = hm.getContext("2d", { willReadFrequently: true })
  let material: GlMaterial = "acero"
  type File =
    | { kind: "text"; text: string; box: Box; font: string }
    | { kind: "image"; img: HTMLImageElement; area: Box }
  let last: File | null = null
  let dpr = 1
  let inkBox: Box | null = null
  let version = 0
  // The red channel, coarse, so the beam knows when it is over the file
  const STEP = 3
  let inkMap = new Uint8Array(0)
  let inkW = 0

  const draw = () => {
    if (!hctx) return
    hctx.setTransform(1, 0, 0, 1, 0, 0)
    hctx.globalCompositeOperation = "source-over"
    hctx.filter = "none"
    hctx.fillStyle = "#000"
    hctx.fillRect(0, 0, hm.width, hm.height)
    inkBox = null
    const soft = SOFT[material]
    hctx.globalCompositeOperation = "lighter"
    if (last?.kind === "text") {
      const { text, box, font } = last
      hctx.font = font
      // Measured against the same baseline the text is drawn on
      hctx.textBaseline = "middle"
      const mt = hctx.measureText(text)
      const w = mt.width || 1
      const sx = (box.w * dpr) / w
      const cy = box.y + box.h / 2
      const asc = (mt.actualBoundingBoxAscent || box.h * 0.36 * dpr) / dpr
      const desc = (mt.actualBoundingBoxDescent || box.h * 0.12 * dpr) / dpr
      inkBox = { x: box.x, y: cy - asc - 1, w: box.w, h: asc + desc + 2 }
      const paint = (blur: number, color: string) => {
        hctx.save()
        hctx.filter = blur > 0 ? `blur(${blur}px)` : "none"
        hctx.font = font
        hctx.textBaseline = "middle"
        hctx.textAlign = "left"
        hctx.fillStyle = color
        // Match the width of the DOM text exactly, whatever the canvas
        // does with font-stretch
        hctx.translate(box.x * dpr, cy * dpr)
        hctx.scale(sx, 1)
        hctx.fillText(text, 0, 0)
        hctx.restore()
      }
      paint(soft * 5 * dpr, "rgb(0,255,0)")
      paint(soft * dpr, "rgb(255,0,0)")
    } else if (last?.kind === "image") {
      const { img, area } = last
      const iw = img.naturalWidth || img.width || 300
      const ih = img.naturalHeight || img.height || 150
      const k = Math.min(area.w / iw, area.h / ih)
      const fit = {
        x: area.x + (area.w - iw * k) / 2,
        y: area.y + (area.h - ih * k) / 2,
        w: iw * k,
        h: ih * k,
      }
      inkBox = fit
      const w = Math.max(1, Math.round(fit.w * dpr))
      const h = Math.max(1, Math.round(fit.h * dpr))
      const mask = logoMask(img, w, h)
      const tint = (color: string) => {
        const c = document.createElement("canvas")
        c.width = w
        c.height = h
        const x = c.getContext("2d")
        if (!x) return c
        x.drawImage(mask, 0, 0)
        x.globalCompositeOperation = "source-in"
        x.fillStyle = color
        x.fillRect(0, 0, w, h)
        return c
      }
      const put = (blur: number, color: string) => {
        hctx.filter = blur > 0 ? `blur(${blur}px)` : "none"
        hctx.drawImage(tint(color), fit.x * dpr, fit.y * dpr)
      }
      put(soft * 5 * dpr, "rgb(0,255,0)")
      put(soft * dpr, "rgb(255,0,0)")
      hctx.filter = "none"
    }
    hctx.globalCompositeOperation = "source-over"
    // Remember where the ink is
    inkW = Math.ceil(hm.width / STEP)
    const inkH = Math.ceil(hm.height / STEP)
    inkMap = new Uint8Array(inkW * inkH)
    if (inkBox) {
      const px = hctx.getImageData(0, 0, hm.width, hm.height).data
      for (let y = 0; y < inkH; y++)
        for (let x = 0; x < inkW; x++)
          inkMap[y * inkW + x] = px[(y * STEP * hm.width + x * STEP) * 4]
    }
    version++
  }

  return {
    canvas: hm,
    version: () => version,
    setSize(w, h, d) {
      const W = Math.max(2, Math.round(w * d))
      const H = Math.max(2, Math.round(h * d))
      if (W === hm.width && H === hm.height && d === dpr) return
      dpr = d
      hm.width = W
      hm.height = H
      draw()
    },
    setMaterial(m) {
      material = m
      draw()
    },
    setText(text, box, font) {
      last = { kind: "text", text, box, font }
      draw()
    },
    setImage(img, area) {
      last = { kind: "image", img, area }
      draw()
    },
    ink: () => inkBox,
    inkAt(x, y) {
      // The beam's line sits a hair off the glyph rows: look around it
      let v = 0
      for (const dy of [-2, 0, 2]) {
        const ix = Math.floor((x * dpr) / STEP)
        const iy = Math.floor(((y + dy) * dpr) / STEP)
        if (ix < 0 || iy < 0 || ix >= inkW) continue
        v = Math.max(v, inkMap[iy * inkW + ix] ?? 0)
      }
      return v / 255
    },
  }
}
