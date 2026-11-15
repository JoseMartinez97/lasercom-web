import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { Engraver, maskFromText } from "@/lib/laser/engraver"
import { textureReady, type Material } from "@/lib/laser/textures"

gsap.registerPlugin(ScrollTrigger)

// Wires the prototype page (components/custom/laser-lab.astro). Returns the
// cleanup for the page swap
export function initLab() {
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches
  const offs: (() => void)[] = []
  let disposed = false
  // Each part starts once its textures are ready, and the lower two only
  // when they come near the screen: nothing heavy runs before it is needed
  const later = (selector: string, start: () => () => void) => {
    const el = document.querySelector(selector)
    if (!el) return
    const near = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        near.disconnect()
        textureReady("wood").then(() => !disposed && offs.push(start()))
      },
      { rootMargin: "100% 0px" }
    )
    near.observe(el)
    offs.push(() => near.disconnect())
  }
  textureReady("wood").then(() => !disposed && offs.push(initHero(still)))
  later("[data-lab-cut]", () => initCut(still))
  later("[data-lab-try]", () => initTry(still))
  return () => {
    disposed = true
    offs.forEach((off) => off())
  }
}

function initHero(still: boolean) {
  const hero = document.querySelector<HTMLElement>("[data-lab-hero]")
  const canvas = hero?.querySelector<HTMLCanvasElement>("[data-lab-canvas]")
  const title = hero?.querySelector<HTMLElement>("[data-lab-title]")
  if (!hero || !canvas || !title) return () => {}

  const laser = new Engraver(canvas, { material: "wood" })
  canvas.style.opacity = "1"
  const coords = hero.querySelector<HTMLElement>("[data-lab-coords]")
  let disposed = false

  const play = () => {
    laser.setMask(maskFromText(canvas, title))
    hero.toggleAttribute("data-live", true)
    if (still) laser.burnAll()
    else laser.engrave(2800)
  }
  document.fonts.ready.then(() => {
    if (!disposed) setTimeout(() => !disposed && play(), still ? 0 : 350)
  })

  const resize = new ResizeObserver(() => laser.resize())
  resize.observe(hero)

  const fine = matchMedia("(pointer: fine)").matches
  const move = (e: PointerEvent) => {
    const box = canvas.getBoundingClientRect()
    const x = e.clientX - box.left
    const y = e.clientY - box.top
    if (fine && !still) laser.touch(x, y)
    if (coords)
      coords.textContent = `X ${(gsap.utils.clamp(0, 1, x / box.width) * 600).toFixed(1).padStart(5, "0")} · Y ${(gsap.utils.clamp(0, 1, y / box.height) * 400).toFixed(1).padStart(5, "0")}`
  }
  const leave = () => laser.untouch()
  hero.addEventListener("pointermove", move)
  hero.addEventListener("pointerleave", leave)

  const replay = hero.querySelector("[data-lab-replay]")
  replay?.addEventListener("click", play)

  return () => {
    disposed = true
    resize.disconnect()
    hero.removeEventListener("pointermove", move)
    hero.removeEventListener("pointerleave", leave)
    replay?.removeEventListener("click", play)
    laser.destroy()
  }
}

// Sparks for the cut, in a canvas over the SVG
function sparkField(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d")!
  type P = {
    x: number
    y: number
    vx: number
    vy: number
    life: number
    max: number
  }
  let parts: P[] = []
  let raf = 0
  const dpr = Math.min(devicePixelRatio || 1, 2)
  const size = () => {
    canvas.width = canvas.clientWidth * dpr
    canvas.height = canvas.clientHeight * dpr
  }
  size()
  const tick = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.globalCompositeOperation = "lighter"
    for (const p of parts) {
      p.x += p.vx
      p.y += p.vy
      p.vy += 0.22 * dpr
      p.life--
      const t = p.life / p.max
      ctx.strokeStyle = `rgba(255,${Math.round(140 + 115 * t)},${Math.round(50 + 170 * t)},${t})`
      ctx.lineWidth = 1.4 * dpr
      ctx.beginPath()
      ctx.moveTo(p.x, p.y)
      ctx.lineTo(p.x - p.vx * 1.8, p.y - p.vy * 1.8)
      ctx.stroke()
    }
    parts = parts.filter((p) => p.life > 0)
    raf = parts.length ? requestAnimationFrame(tick) : 0
  }
  return {
    size,
    // x, y as fractions of the canvas
    emit(fx: number, fy: number, n: number) {
      const x = fx * canvas.width
      const y = fy * canvas.height
      for (let i = 0; i < n; i++) {
        const a = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.7
        const s = (2 + Math.random() * 6) * dpr
        const max = 16 + Math.random() * 22
        parts.push({
          x,
          y,
          vx: Math.cos(a) * s,
          vy: Math.sin(a) * s,
          life: max,
          max,
        })
      }
      if (!raf) raf = requestAnimationFrame(tick)
    },
    stop: () => cancelAnimationFrame(raf),
  }
}

function initCut(still: boolean) {
  const section = document.querySelector<HTMLElement>("[data-lab-cut]")
  const board = section?.querySelector<SVGImageElement>("[data-lab-board]")
  const kerf = section?.querySelector<SVGPathElement>("[data-lab-kerf]")
  const piece = section?.querySelector<SVGGElement>("[data-lab-piece]")
  const head = section?.querySelector<SVGGElement>("[data-lab-head]")
  const sparksCanvas =
    section?.querySelector<HTMLCanvasElement>("[data-lab-sparks]")
  const pct = section?.querySelector<HTMLElement>("[data-lab-cut-pct]")
  const holed = section?.querySelector<SVGRectElement>("[data-lab-holed]")
  if (!section || !board || !kerf || !piece || !head || !sparksCanvas)
    return () => {}

  textureReady("wood").then((wood) =>
    board.setAttribute("href", wood.toDataURL("image/jpeg", 0.85))
  )
  const svg = kerf.ownerSVGElement!
  const length = kerf.getTotalLength()
  kerf.style.strokeDasharray = `${length}`

  if (still) {
    kerf.style.strokeDashoffset = "0"
    piece.style.opacity = "0"
    holed?.setAttribute("mask", "url(#lab-hole)")
    return () => {}
  }

  const sparks = sparkField(sparksCanvas)
  const toScreen = (x: number, y: number) => {
    const m = svg.getScreenCTM()
    const box = sparksCanvas.getBoundingClientRect()
    if (!m) return null
    const p = new DOMPoint(x, y).matrixTransform(m)
    return {
      fx: (p.x - box.left) / box.width,
      fy: (p.y - box.top) / box.height,
    }
  }

  // Cut 0–70% of the scroll, lift the piece, then let it fall out
  const CUT = 0.7
  let lastCut = 0
  const update = (p: number) => {
    const cut = Math.min(1, p / CUT)
    kerf.style.strokeDashoffset = `${length * (1 - cut)}`
    const cutting = cut > 0 && cut < 1
    head.setAttribute("opacity", cutting ? "1" : "0")
    if (cutting) {
      const pt = kerf.getPointAtLength(length * cut)
      head.setAttribute("transform", `translate(${pt.x} ${pt.y})`)
      if (cut > lastCut) {
        const s = toScreen(pt.x, pt.y)
        if (s) sparks.emit(s.fx, s.fy, 3 + Math.round(Math.random() * 3))
      }
    }
    lastCut = cut
    const fall = gsap.utils.clamp(0, 1, (p - CUT - 0.08) / (1 - CUT - 0.08))
    const lift = gsap.utils.clamp(0, 1, (p - CUT) / 0.08)
    // The shadow only once the piece is free, or it would give the shape away
    // The hole opens only when the piece comes loose: before, the seam
    // between board and piece would trace the shape ahead of the beam
    if (lift > 0) {
      piece.setAttribute("filter", "url(#lab-lift)")
      holed?.setAttribute("mask", "url(#lab-hole)")
    } else {
      piece.removeAttribute("filter")
      holed?.removeAttribute("mask")
    }
    piece.style.transformOrigin = "385px 540px"
    piece.style.transform = `translate(${fall * 60}px, ${-8 * lift + fall * fall * 1100}px) rotate(${fall * 22}deg) scale(${1 + 0.02 * lift})`
    if (pct)
      pct.textContent = `${String(Math.round(cut * 100)).padStart(3, "0")}%`
  }
  update(0)

  const mobile = matchMedia("(max-width: 1023px)").matches
  const trigger = ScrollTrigger.create({
    trigger: section,
    start: mobile ? "top 70%" : "top top",
    end: mobile ? "bottom 20%" : "bottom bottom",
    scrub: true,
    onUpdate: (self) => update(self.progress),
  })
  const resize = () => sparks.size()
  window.addEventListener("resize", resize)

  return () => {
    trigger.kill()
    sparks.stop()
    window.removeEventListener("resize", resize)
  }
}

function initTry(still: boolean) {
  const root = document.querySelector<HTMLElement>("[data-lab-try]")
  const canvas = root?.querySelector<HTMLCanvasElement>("[data-lab-plate]")
  const wrap = root?.querySelector<HTMLElement>("[data-lab-plate-wrap]")
  const input = root?.querySelector<HTMLInputElement>("[data-lab-text]")
  const cta = root?.querySelector<HTMLAnchorElement>("[data-lab-cta]")
  const sheen = root?.querySelector<HTMLElement>("[data-lab-sheen]")
  if (!root || !canvas || !wrap || !input || !cta) return () => {}

  const radios = [
    ...root.querySelectorAll<HTMLInputElement>('input[name="lab-material"]'),
  ]
  const current = () => radios.find((r) => r.checked) ?? radios[0]
  let material = current().value as Material
  const laser = new Engraver(canvas, { material })
  wrap.dataset.material = material

  // The text, as large as fits, with a thin engraved frame round the plate
  const plateMask = (ctx: CanvasRenderingContext2D) => {
    const w = canvas.clientWidth
    const h = canvas.clientHeight
    const text = input.value.trim() || input.placeholder || " "
    const inset = Math.min(w, h) * 0.07
    ctx.lineWidth = Math.max(1.5, w * 0.004)
    ctx.beginPath()
    ctx.roundRect(inset, inset, w - inset * 2, h - inset * 2, inset * 0.6)
    ctx.stroke()
    let size = h * 0.3
    const font = (px: number) =>
      `800 expanded ${px}px "Archivo Variable", system-ui, sans-serif`
    ctx.font = font(size)
    ctx.letterSpacing = "-0.02em"
    const max = w - inset * 4
    const width = ctx.measureText(text).width
    if (width > max) size *= max / width
    ctx.font = font(size)
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillText(text, w / 2, h / 2 + size * 0.04)
  }

  const engrave = () => {
    laser.setMask(plateMask)
    if (still) laser.burnAll()
    else laser.engrave(1900)
    const text = input.value.trim()
    const url = new URL(cta.href, location.href)
    url.searchParams.set("servicio", current().dataset.service ?? "madera")
    if (text) url.searchParams.set("texto", text)
    else url.searchParams.delete("texto")
    cta.href = url.pathname + url.search + url.hash
  }

  let typing = 0
  const onInput = () => {
    clearTimeout(typing)
    typing = window.setTimeout(engrave, 450)
  }
  const onMaterial = async () => {
    const next = current().value as Material
    await textureReady(next)
    if (next !== current().value) return
    material = next
    wrap.dataset.material = material
    laser.setMaterial(material)
    engrave()
  }
  const move = (e: PointerEvent) => {
    const box = wrap.getBoundingClientRect()
    sheen?.style.setProperty(
      "--lx",
      `${((e.clientX - box.left) / box.width) * 100}%`
    )
    sheen?.style.setProperty(
      "--ly",
      `${((e.clientY - box.top) / box.height) * 100}%`
    )
  }

  // Engraves the first time the plate comes into view
  const seen = new IntersectionObserver(
    ([entry]) => {
      if (!entry.isIntersecting) return
      seen.disconnect()
      document.fonts.ready.then(engrave)
    },
    { threshold: 0.35 }
  )
  seen.observe(wrap)
  // Until then, the bare material
  laser.resize()

  const resize = new ResizeObserver(() => laser.resize())
  resize.observe(wrap)
  const again = root.querySelector("[data-lab-again]")
  input.addEventListener("input", onInput)
  radios.forEach((r) => r.addEventListener("change", onMaterial))
  wrap.addEventListener("pointermove", move)
  again?.addEventListener("click", engrave)

  return () => {
    clearTimeout(typing)
    seen.disconnect()
    resize.disconnect()
    input.removeEventListener("input", onInput)
    radios.forEach((r) => r.removeEventListener("change", onMaterial))
    wrap.removeEventListener("pointermove", move)
    again?.removeEventListener("click", engrave)
    laser.destroy()
  }
}
