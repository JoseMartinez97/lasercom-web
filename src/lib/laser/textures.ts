// Material surfaces for the laser prototype, drawn once in a canvas and cached.
// Procedural (value noise), so they cost no download and tile to any size

export type Material = "wood" | "acrylic" | "leather" | "metal"

// Hash-based value noise, smooth enough for grain and pores
function hash(x: number, y: number) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453
  return s - Math.floor(s)
}
function noise(x: number, y: number) {
  const xi = Math.floor(x)
  const yi = Math.floor(y)
  const xf = x - xi
  const yf = y - yi
  const u = xf * xf * (3 - 2 * xf)
  const v = yf * yf * (3 - 2 * yf)
  const a = hash(xi, yi)
  const b = hash(xi + 1, yi)
  const c = hash(xi, yi + 1)
  const d = hash(xi + 1, yi + 1)
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v
}
function fbm(x: number, y: number, octaves = 4) {
  let sum = 0
  let amp = 0.5
  let f = 1
  for (let i = 0; i < octaves; i++) {
    sum += amp * noise(x * f, y * f)
    f *= 2
    amp *= 0.5
  }
  return sum
}
const mix = (a: number, b: number, t: number) => a + (b - a) * t
const clamp = (v: number) => Math.min(1, Math.max(0, v))

type Rgb = [number, number, number]
const lerpRgb = (a: Rgb, b: Rgb, t: number): Rgb => [
  mix(a[0], b[0], t),
  mix(a[1], b[1], t),
  mix(a[2], b[2], t),
]

// Each material: colour of a pixel at (x, y) in a 1024×640 tile
const shaders: Record<Material, (x: number, y: number) => Rgb> = {
  // Birch plywood face: pale, long fine streaks and a few soft growth lines
  // that wander along the board
  wood: (x, y) => {
    const wander = fbm(x * 0.0016, y * 0.005, 3) * 110
    const ring = Math.pow(Math.sin((y + wander) * 0.085) * 0.5 + 0.5, 14)
    const fibre = fbm(x * 0.003, y * 0.32, 3)
    const cloud = fbm(x * 0.0012, y * 0.004, 2)
    const fleck = noise(x * 0.7, y * 0.7) * 0.05
    const t = clamp(ring * 0.32 + fibre * 0.42 + cloud * 0.22 + fleck - 0.12)
    return lerpRgb([244, 229, 202], [212, 180, 134], t)
  },
  // Clear acrylic over a dark bed: almost black, a faint sheen
  acrylic: (x, y) => {
    const sheen = fbm(x * 0.002, y * 0.002, 2)
    const t = clamp(sheen * 0.5 + (y / 640) * 0.25)
    return lerpRgb([16, 21, 27], [34, 42, 52], t)
  },
  // Tanned leather: pebbled grain, darker in the creases
  leather: (x, y) => {
    const pebble = fbm(x * 0.07, y * 0.07, 3)
    const crease = Math.pow(
      1 - Math.abs(fbm(x * 0.012, y * 0.012, 3) - 0.5) * 2,
      18
    )
    const t = clamp(pebble * 0.75 + crease * 0.35)
    return lerpRgb([142, 88, 52], [94, 54, 30], t)
  },
  // Brushed stainless steel: fine horizontal streaks
  metal: (x, y) => {
    const streak = fbm(x * 0.0012, y * 1.4, 3)
    const grain = noise(x * 0.25, y * 2.1) * 0.12
    const t = clamp(streak * 0.8 + grain)
    return lerpRgb([150, 156, 163], [198, 203, 209], t)
  },
}

const cache = new Map<Material, HTMLCanvasElement>()
// Drawn at half the size the shaders are written for (1024×640) and scaled
// up when painted: four times cheaper, and grain survives the scaling
const STEP = 2
const W = 1024 / STEP
const H = 640 / STEP

function shadeRows(
  image: ImageData,
  material: Material,
  from: number,
  to: number
) {
  const shade = shaders[material]
  for (let y = from; y < to; y++) {
    for (let x = 0; x < W; x++) {
      const [r, g, b] = shade(x * STEP, y * STEP)
      const i = (y * W + x) * 4
      image.data[i] = r
      image.data[i + 1] = g
      image.data[i + 2] = b
      image.data[i + 3] = 255
    }
  }
}

function finish(material: Material, image: ImageData) {
  const canvas = document.createElement("canvas")
  canvas.width = W
  canvas.height = H
  canvas.getContext("2d")!.putImageData(image, 0, 0)
  cache.set(material, canvas)
  return canvas
}

// The material at once (cached after the first time)
export function texture(material: Material): HTMLCanvasElement {
  const hit = cache.get(material)
  if (hit) return hit
  const image = new ImageData(W, H)
  shadeRows(image, material, 0, H)
  return finish(material, image)
}

// The material without blocking the page: a few rows at a time, yielding to
// the browser in between, so input and painting never wait for it
const pending = new Map<Material, Promise<HTMLCanvasElement>>()
export function textureReady(material: Material): Promise<HTMLCanvasElement> {
  const hit = cache.get(material)
  if (hit) return Promise.resolve(hit)
  const running = pending.get(material)
  if (running) return running
  const job = (async () => {
    const image = new ImageData(W, H)
    const ROWS = 24
    for (let y = 0; y < H; y += ROWS) {
      shadeRows(image, material, y, Math.min(H, y + ROWS))
      await new Promise((r) => setTimeout(r, 0))
    }
    return cache.get(material) ?? finish(material, image)
  })()
  pending.set(material, job)
  return job
}

// Fills a canvas with the material, scaled to cover it
export function paintSurface(
  ctx: CanvasRenderingContext2D,
  material: Material,
  width: number,
  height: number
) {
  const tile = texture(material)
  const scale = Math.max(width / tile.width, height / tile.height)
  const w = tile.width * scale
  const h = tile.height * scale
  ctx.drawImage(tile, (width - w) / 2, (height - h) / 2, w, h)
}

// How the beam leaves its mark on each material
export const marks: Record<
  Material,
  { ink: string; halo: string; haloBlur: number; glow: boolean }
> = {
  wood: {
    ink: "rgba(40, 19, 8, 0.97)",
    halo: "rgba(96, 52, 20, 0.55)",
    haloBlur: 3,
    glow: false,
  },
  acrylic: {
    ink: "rgba(236, 244, 255, 0.92)",
    halo: "rgba(170, 210, 255, 0.55)",
    haloBlur: 10,
    glow: true,
  },
  leather: {
    ink: "rgba(38, 18, 8, 0.9)",
    halo: "rgba(60, 28, 12, 0.5)",
    haloBlur: 2,
    glow: false,
  },
  metal: {
    ink: "rgba(28, 30, 36, 0.92)",
    halo: "rgba(70, 60, 90, 0.35)",
    haloBlur: 1.5,
    glow: false,
  },
}
