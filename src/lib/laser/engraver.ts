import { marks, paintSurface, type Material } from "@/lib/laser/textures"

// A laser engraving a mask into a material, drawn in a canvas the way the
// machine does it: a raster, line after line, the head sweeping one way and
// back. The fresh mark glows hot and cools, sparks fly where the beam fires
// and a thin smoke rises. The pointer can leave faint scorch marks too.
//
//   const laser = new Engraver(canvas, { material: "wood" })
//   laser.setMask((ctx) => ctx.fillText(...))   // in CSS pixels
//   await laser.engrave(2400)

type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  max: number
  size: number
}
type Row = { y: number; x0: number; x1: number; start: number }
export type MaskDraw = (ctx: CanvasRenderingContext2D) => void

const LOW = 4 // the mask is sampled at a quarter of the resolution

function layer(w: number, h: number) {
  const c = document.createElement("canvas")
  c.width = w
  c.height = h
  return c
}

function sprite(size: number, stops: [number, string][]) {
  const c = layer(size, size)
  const ctx = c.getContext("2d")!
  const g = ctx.createRadialGradient(
    size / 2,
    size / 2,
    0,
    size / 2,
    size / 2,
    size / 2
  )
  for (const [at, color] of stops) g.addColorStop(at, color)
  ctx.fillStyle = g
  ctx.fillRect(0, 0, size, size)
  return c
}

let glowCache: HTMLCanvasElement | null = null
function getGlow() {
  return (glowCache ??= sprite(128, [
    [0, "rgba(255,255,255,1)"],
    [0.12, "rgba(255,236,200,0.95)"],
    [0.3, "rgba(255,120,50,0.55)"],
    [1, "rgba(255,60,10,0)"],
  ]))
}

let smokeCache: HTMLCanvasElement | null = null
function getSmokePuff() {
  return (smokeCache ??= sprite(64, [
    [0, "rgba(90,80,72,0.22)"],
    [1, "rgba(90,80,72,0)"],
  ]))
}

export class Engraver {
  private ctx: CanvasRenderingContext2D
  private material: Material
  private surface: boolean
  private dpr = 1
  private w = 0
  private h = 0
  private base!: HTMLCanvasElement
  private burn!: HTMLCanvasElement
  private heat!: HTMLCanvasElement
  private trail!: HTMLCanvasElement
  private inked: HTMLCanvasElement | null = null
  private hot: HTMLCanvasElement | null = null
  private low: Uint8ClampedArray | null = null
  private lowW = 0
  private rows: Row[] = []
  private total = 0
  private pos = 0
  private drawMask: MaskDraw | null = null
  private sparks: Particle[] = []
  private smoke: Particle[] = []
  private head: { x: number; y: number; firing: boolean } | null = null
  private pointer: { x: number; y: number } | null = null
  private raf = 0
  private last = 0
  private idleSince = 0
  private run: { duration: number; done: () => void } | null = null
  private engraved = false
  private hotAt = 0

  constructor(
    private canvas: HTMLCanvasElement,
    opts: { material: Material; surface?: boolean }
  ) {
    this.ctx = canvas.getContext("2d")!
    this.material = opts.material
    this.surface = opts.surface ?? true
    this.resize()
  }

  get done() {
    return this.engraved
  }

  resize() {
    this.dpr = Math.min(window.devicePixelRatio || 1, 2)
    const w = Math.max(1, Math.round(this.canvas.clientWidth * this.dpr))
    const h = Math.max(1, Math.round(this.canvas.clientHeight * this.dpr))
    if (w === this.w && h === this.h) return
    this.w = this.canvas.width = w
    this.h = this.canvas.height = h
    this.base = layer(w, h)
    if (this.surface)
      paintSurface(this.base.getContext("2d")!, this.material, w, h)
    this.burn = layer(w, h)
    this.heat = layer(w, h)
    this.trail = layer(w, h)
    if (this.drawMask) {
      this.buildMask(this.drawMask)
      if (this.engraved) this.burnAll()
    }
    this.render()
  }

  setMaterial(material: Material) {
    this.material = material
    this.w = 0
    this.resize()
  }

  // The shape to engrave, drawn in CSS pixels in any opaque colour
  setMask(draw: MaskDraw) {
    if (this.run) {
      const prev = this.run
      this.run = null
      prev.done()
    }
    this.head = null
    this.drawMask = draw
    this.engraved = false
    this.pos = 0
    this.burn.getContext("2d")!.clearRect(0, 0, this.w, this.h)
    this.heat.getContext("2d")!.clearRect(0, 0, this.w, this.h)
    this.trail.getContext("2d")!.clearRect(0, 0, this.w, this.h)
    this.buildMask(draw)
    this.render()
  }

  private buildMask(draw: MaskDraw) {
    const { w, h, dpr } = this
    const mask = layer(w, h)
    const m = mask.getContext("2d")!
    m.scale(dpr, dpr)
    m.fillStyle = "#000"
    m.strokeStyle = "#000"
    draw(m)

    const mark = marks[this.material]
    const tint = (color: string, halo: string, blur: number) => {
      const colored = layer(w, h)
      const c = colored.getContext("2d")!
      c.drawImage(mask, 0, 0)
      c.globalCompositeOperation = "source-in"
      c.fillStyle = color
      c.fillRect(0, 0, w, h)
      const out = layer(w, h)
      const o = out.getContext("2d")!
      o.shadowColor = halo
      o.shadowBlur = blur * dpr
      o.drawImage(colored, 0, 0)
      o.shadowBlur = 0
      o.drawImage(colored, 0, 0)
      return out
    }
    this.inked = tint(mark.ink, mark.halo, mark.haloBlur)
    // The material shows through the burn: grain, pores, brushing
    if (this.surface && this.material !== "acrylic") {
      const i = this.inked.getContext("2d")!
      i.globalCompositeOperation = "source-atop"
      i.globalAlpha = 0.12
      i.drawImage(this.base, 0, 0)
      i.globalAlpha = 1
      i.globalCompositeOperation = "source-over"
    }
    this.hot = tint("rgba(255,190,110,1)", "rgba(255,90,20,0.9)", 6)

    // Where there is something to engrave, row by row (a low-res sample)
    const lw = (this.lowW = Math.ceil(w / LOW))
    const lh = Math.ceil(h / LOW)
    const small = layer(lw, lh)
    const s = small.getContext("2d")!
    s.drawImage(mask, 0, 0, lw, lh)
    this.low = s.getImageData(0, 0, lw, lh).data
    const band = Math.max(2, Math.round(1.6 * dpr))
    const pad = Math.ceil(mark.haloBlur * dpr * 2)
    this.rows = []
    let total = 0
    for (let y = 0; y < h; y += band) {
      const ly = Math.min(lh - 1, Math.floor(y / LOW))
      let x0 = -1
      let x1 = -1
      for (let lx = 0; lx < lw; lx++) {
        if (this.low[(ly * lw + lx) * 4 + 3] > 20) {
          if (x0 < 0) x0 = lx
          x1 = lx
        }
      }
      if (x0 < 0) continue
      const row = {
        y,
        x0: Math.max(0, x0 * LOW - pad),
        x1: Math.min(w, (x1 + 1) * LOW + pad),
        start: total,
      }
      total += row.x1 - row.x0
      this.rows.push(row)
    }
    this.total = total
    this.band = band
  }
  private band = 2

  private firingAt(x: number, y: number) {
    if (!this.low) return false
    const lx = Math.floor(x / LOW)
    const ly = Math.floor(y / LOW)
    return (this.low[(ly * this.lowW + lx) * 4 + 3] ?? 0) > 60
  }

  // Engraves the whole mask in about `duration` ms
  engrave(duration = 2400) {
    if (this.run) {
      const prev = this.run
      this.run = null
      prev.done()
    }
    this.pos = 0
    this.engraved = false
    this.head = null
    this.burn.getContext("2d")!.clearRect(0, 0, this.w, this.h)
    this.heat.getContext("2d")!.clearRect(0, 0, this.w, this.h)
    this.trail.getContext("2d")!.clearRect(0, 0, this.w, this.h)
    return new Promise<void>((done) => {
      this.run = { duration, done }
      this.wake()
    })
  }

  // The finished piece at once (resizes, reduced motion)
  burnAll() {
    if (this.run) {
      const prev = this.run
      this.run = null
      prev.done()
    }
    this.head = null
    this.sparks = []
    this.smoke = []
    if (!this.inked) return
    const b = this.burn.getContext("2d")!
    b.clearRect(0, 0, this.w, this.h)
    b.drawImage(this.inked, 0, 0)
    this.pos = this.total
    this.engraved = true
    this.render()
  }

  // Copies the raster from path position a to b into the burn and heat layers
  private sweep(a: number, b: number) {
    if (!this.inked || !this.hot || b <= a) return
    const burn = this.burn.getContext("2d")!
    const heat = this.heat.getContext("2d")!
    const band = this.band
    for (const [i, row] of this.rows.entries()) {
      const len = row.x1 - row.x0
      const from = Math.max(a, row.start) - row.start
      const to = Math.min(b, row.start + len) - row.start
      if (to <= from) continue
      // Even rows run left to right, odd rows back
      const x = i % 2 === 0 ? row.x0 + from : row.x1 - to
      const sw = to - from
      burn.drawImage(this.inked, x, row.y, sw, band, x, row.y, sw, band)
      heat.drawImage(this.hot, x, row.y, sw, band, x, row.y, sw, band)
    }
  }

  private headAt(pos: number) {
    let lo = 0
    let hi = this.rows.length - 1
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1
      if (this.rows[mid].start <= pos) lo = mid
      else hi = mid - 1
    }
    const row = this.rows[lo]
    if (!row) return null
    const into = Math.min(pos - row.start, row.x1 - row.x0)
    const x = lo % 2 === 0 ? row.x0 + into : row.x1 - into
    const y = row.y + this.band / 2
    return { x, y, firing: this.firingAt(x, y) }
  }

  // The pointer as a low-power beam: faint scorch, a little heat (CSS px)
  touch(x: number, y: number) {
    const px = x * this.dpr
    const py = y * this.dpr
    const t = this.trail.getContext("2d")!
    const from = this.pointer ?? { x: px, y: py }
    const steps = Math.max(
      1,
      Math.ceil(Math.hypot(px - from.x, py - from.y) / (2 * this.dpr))
    )
    t.fillStyle =
      this.material === "acrylic"
        ? "rgba(200,225,255,0.07)"
        : "rgba(60,30,12,0.06)"
    for (let i = 1; i <= steps; i++) {
      const sx = from.x + ((px - from.x) * i) / steps
      const sy = from.y + ((py - from.y) * i) / steps
      t.beginPath()
      t.arc(sx, sy, 2.2 * this.dpr, 0, Math.PI * 2)
      t.fill()
    }
    this.pointer = { x: px, y: py }
    if (Math.random() < 0.35) this.spark(px, py, 1, 0.6)
    this.wake()
  }
  untouch() {
    this.pointer = null
  }

  private spark(x: number, y: number, count: number, power = 1) {
    const d = this.dpr
    for (let i = 0; i < count; i++) {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.6
      const speed = (1.5 + Math.random() * 4.5) * d * power
      const max = 18 + Math.random() * 26
      this.sparks.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: max,
        max,
        size: (0.6 + Math.random() * 0.9) * d,
      })
    }
  }

  private puff(x: number, y: number) {
    const d = this.dpr
    const max = 70 + Math.random() * 50
    this.smoke.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 0.4 * d,
      vy: -(0.5 + Math.random() * 0.7) * d,
      life: max,
      max,
      size: (10 + Math.random() * 8) * d,
    })
  }

  private wake() {
    this.idleSince = performance.now()
    if (this.raf) return
    this.last = performance.now()
    this.raf = requestAnimationFrame(this.frame)
  }

  stop() {
    cancelAnimationFrame(this.raf)
    this.raf = 0
  }

  private frame = (now: number) => {
    const dt = Math.min(50, now - this.last)
    this.last = now
    const k = dt / 16.7

    if (this.run && this.total > 0) {
      const next = Math.min(
        this.total,
        this.pos + (this.total * dt) / this.run.duration
      )
      this.sweep(this.pos, next)
      this.pos = next
      this.head = this.headAt(next)
      if (this.head?.firing) {
        this.spark(this.head.x, this.head.y, 2 + Math.round(Math.random() * 2))
        if (Math.random() < 0.5) this.puff(this.head.x, this.head.y)
      }
      if (next >= this.total) {
        this.engraved = true
        this.head = null
        const { done } = this.run
        this.run = null
        done()
      }
      this.idleSince = now
    } else if (this.run) {
      this.run.done()
      this.run = null
    }

    // Heat cools, pointer scorch fades
    const fade = (c: HTMLCanvasElement, a: number) => {
      const x = c.getContext("2d")!
      x.globalCompositeOperation = "destination-out"
      x.fillStyle = `rgba(0,0,0,${a})`
      x.fillRect(0, 0, this.w, this.h)
      x.globalCompositeOperation = "source-over"
    }
    fade(this.heat, 0.07 * k)
    fade(this.trail, 0.012 * k)
    // Fading never quite reaches zero in 8-bit alpha: once cool, clear it
    if (this.run) this.hotAt = now
    if (now - this.hotAt > 1600)
      this.heat.getContext("2d")!.clearRect(0, 0, this.w, this.h)
    if (!this.pointer && now - this.idleSince > 2800)
      this.trail.getContext("2d")!.clearRect(0, 0, this.w, this.h)

    for (const p of this.sparks) {
      p.x += p.vx * k
      p.y += p.vy * k
      p.vy += 0.18 * this.dpr * k
      p.vx *= 0.985
      p.life -= k
    }
    this.sparks = this.sparks.filter((p) => p.life > 0)
    for (const p of this.smoke) {
      p.x += p.vx * k
      p.y += p.vy * k
      p.size += 0.35 * this.dpr * k
      p.life -= k
    }
    this.smoke = this.smoke.filter((p) => p.life > 0)

    this.render()

    const busy = this.run || this.sparks.length || this.smoke.length
    if (busy || now - this.idleSince < 3000) {
      this.raf = requestAnimationFrame(this.frame)
    } else {
      this.raf = 0
    }
  }

  private render() {
    const { ctx, w, h, dpr } = this
    ctx.globalCompositeOperation = "source-over"
    ctx.clearRect(0, 0, w, h)
    if (this.surface) ctx.drawImage(this.base, 0, 0)
    ctx.drawImage(this.trail, 0, 0)
    ctx.drawImage(this.burn, 0, 0)

    for (const p of this.smoke) {
      ctx.globalAlpha = Math.max(0, p.life / p.max) * 0.9
      ctx.drawImage(
        getSmokePuff(),
        p.x - p.size,
        p.y - p.size,
        p.size * 2,
        p.size * 2
      )
    }
    ctx.globalAlpha = 1

    ctx.globalCompositeOperation = "lighter"
    ctx.drawImage(this.heat, 0, 0)
    for (const p of this.sparks) {
      const t = p.life / p.max
      ctx.strokeStyle = `rgba(255,${Math.round(150 + 105 * t)},${Math.round(60 + 160 * t)},${t})`
      ctx.lineWidth = p.size
      ctx.beginPath()
      ctx.moveTo(p.x, p.y)
      ctx.lineTo(p.x - p.vx * 1.6, p.y - p.vy * 1.6)
      ctx.stroke()
    }
    const head = this.head
    if (head) {
      const r = (head.firing ? 34 : 14) * dpr
      ctx.drawImage(getGlow(), head.x - r, head.y - r, r * 2, r * 2)
    }
    if (this.pointer) {
      const r = 18 * dpr
      ctx.globalAlpha = 0.55
      ctx.drawImage(
        getGlow(),
        this.pointer.x - r,
        this.pointer.y - r,
        r * 2,
        r * 2
      )
      ctx.globalAlpha = 1
    }
    ctx.globalCompositeOperation = "source-over"
  }

  destroy() {
    this.stop()
    this.sparks = []
    this.smoke = []
  }
}

// Draws the words of an element into a mask exactly where the browser laid
// them out, in the element's own font, relative to the canvas
export function maskFromText(
  canvas: HTMLCanvasElement,
  el: HTMLElement
): MaskDraw {
  return (ctx) => {
    const box = canvas.getBoundingClientRect()
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
    const range = document.createRange()
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const text = node.textContent ?? ""
      const parent = node.parentElement
      if (!parent || !text.trim()) continue
      const style = getComputedStyle(parent)
      ctx.font = `${style.fontStyle} ${style.fontWeight} ${stretch(style.fontStretch)} ${style.fontSize} ${style.fontFamily}`
      ctx.letterSpacing =
        style.letterSpacing === "normal" ? "0px" : style.letterSpacing
      ctx.textBaseline = "alphabetic"
      const ascent = ctx.measureText("Hg").fontBoundingBoxAscent
      // Word by word: each word's box comes from the layout, wraps included
      const words = text.split(/(\s+)/)
      let offset = 0
      for (const word of words) {
        if (word.trim()) {
          range.setStart(node, offset)
          range.setEnd(node, offset + word.length)
          const rect = range.getClientRects()[0]
          if (rect) {
            ctx.fillText(
              word,
              rect.left - box.left,
              rect.top - box.top + ascent
            )
          }
        }
        offset += word.length
      }
    }
  }
}

function stretch(value: string) {
  const pct = parseFloat(value)
  if (!Number.isFinite(pct)) return value || "normal"
  if (pct >= 150) return "extra-expanded"
  if (pct >= 125) return "expanded"
  if (pct >= 112.5) return "semi-expanded"
  if (pct <= 75) return "condensed"
  return "normal"
}
