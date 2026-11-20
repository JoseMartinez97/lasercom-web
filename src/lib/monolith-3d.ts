// The home's 3D piece (everywhere WebGL runs; reduced motion and browsers
// without WebGL get the CSS plaque in home-content.astro). After Dialed
// Coffee's can: one object that sits in front of the hero headline and, as
// the visitor scrolls, opens into the engraving scene, where the beam
// engraves it line by line.
// The engraving is carved like the bed's (engrave-3d.ts): one height map of
// the artwork gives a normal map (walls that catch the light), the occlusion
// at the bottom of each groove, and a mask that swaps the steel's colour,
// roughness and metalness for the fibre laser's dark annealing. `engrave`
// (0..1) rasters it in, row by row, with the fresh cut glowing behind the
// beam.
// The page decides where the piece goes (setPose, in CSS pixels of the
// canvas), so the same choreography drives this and the CSS plaque; this
// module only renders it, adds the idle float and follows the pointer.
import * as THREE from "three"
import { ENGRAVE_ROWS } from "@/lib/showcase"

// Stainless steel, brushed, and the fibre laser's mark on it
const STEEL = {
  faceTop: "#d4d9e0",
  faceBot: "#9ea5b0",
  roughness: 0.24,
  metalness: 0.96,
  clearcoat: 0.3,
  clearcoatRoughness: 0.18,
  anisotropy: 0.85,
  // Fibre-laser annealing: a dark, satin oxide
  mark: "#25272c",
  markRough: 0.55,
  markMetal: 0.55,
  // How deep the groove reads, and how much the bottom of a narrow groove
  // is shadowed
  depth: 1,
  occlusion: 0.55,
  // The machined perimeter and the screws
  edgeColor: 0x8d949e,
  edgeRoughness: 0.28,
  edgeMetalness: 1.0,
  boltColor: 0xe2e6ec,
}

// Studio softbox environment for the brushed metal's reflections
function createStudioEnvironment(renderer: THREE.WebGLRenderer): THREE.Texture {
  const env = new THREE.Scene()
  const room = new THREE.Mesh(
    new THREE.BoxGeometry(26, 16, 26),
    new THREE.MeshBasicMaterial({ color: 0x8f8a83, side: THREE.BackSide })
  )
  env.add(room)

  const c = document.createElement("canvas")
  c.width = c.height = 64
  const ctx = c.getContext("2d")
  if (ctx) {
    const g = ctx.createRadialGradient(32, 32, 2, 32, 32, 32)
    g.addColorStop(0, "#ffffff")
    g.addColorStop(0.6, "#d4d4d8")
    g.addColorStop(1, "#18181b")
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 64, 64)
  }
  const falloff = new THREE.CanvasTexture(c)

  const addPanel = (
    w: number,
    h: number,
    power: number,
    tint: number,
    pos: [number, number, number],
    look: [number, number, number]
  ) => {
    const mat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(tint).multiplyScalar(power),
      map: falloff,
      side: THREE.DoubleSide,
    })
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat)
    mesh.position.set(...pos)
    mesh.lookAt(...look)
    env.add(mesh)
  }

  addPanel(5.0, 9.0, 3.2, 0xfff8f0, [-5.0, 2.5, 5.5], [0, 0, 0])
  addPanel(3.5, 8.5, 2.5, 0xffffff, [5.5, 1.5, 4.5], [0, 0, 0])
  addPanel(7.5, 4.0, 2.4, 0xfff2e0, [0, 8.0, 3.0], [0, 0, 0])
  addPanel(2.0, 8.0, 1.8, 0xffdfc2, [-7.0, 0, -3.0], [0, 0, 0])
  addPanel(8.0, 2.2, 1.5, 0xd8e8ff, [0, 3.5, -9.0], [0, 0, 0])

  const pmrem = new THREE.PMREMGenerator(renderer)
  const rt = pmrem.fromScene(env, 0.03)
  pmrem.dispose()
  falloff.dispose()
  return rt.texture
}

// The Lasercom mark (vertical bar and the two wings) centred at (cx, cy)
function drawLasercomEmblem(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number
) {
  ctx.save()
  const s = size / 385
  ctx.translate(cx - 224 * s, cy - 217.5 * s)
  ctx.fillRect(48 * s, 25 * s, 97 * s, 313 * s)
  ctx.beginPath()
  ctx.moveTo(145 * s, 338 * s)
  ctx.lineTo(222 * s, 265 * s)
  ctx.lineTo(400 * s, 265 * s)
  ctx.lineTo(323 * s, 338 * s)
  ctx.closePath()
  ctx.fill()
  // The lower wing is a shallower pass, so it reads as a second depth
  ctx.globalAlpha = 0.7
  ctx.beginPath()
  ctx.moveTo(145 * s, 338 * s)
  ctx.lineTo(323 * s, 338 * s)
  ctx.lineTo(400 * s, 410 * s)
  ctx.lineTo(222 * s, 410 * s)
  ctx.closePath()
  ctx.fill()
  ctx.restore()
}

// The words carved into the plaque. Only facts from PRODUCT.md: the town,
// the year, the two lasers and the 4 mm metal cut
export type PlaqueLabels = {
  subtitle: string
  laser: string
  laserValue: string
  cut: string
  since: string
}

// The face is laid out in 1024×1280 units
const FW = 1024
const FH = 1280
// The colour maps are baked at 2× so the fine print and the dial's ticks
// stay crisp on retina screens; the relief maps at 1.5×, enough for clean
// groove walls without a long bake
// (phones bake lighter maps, 1.25× and 1×, to spare their memory)
type Res = { hi: number; rs: number; rw: number; rh: number }
const resOf = (light: boolean): Res => {
  const hi = light ? 1.25 : 2
  const rs = light ? 1 : 1.5
  return { hi, rs, rw: FW * rs, rh: FH * rs }
}

const canvasOf = (w: number, h: number) => {
  const c = document.createElement("canvas")
  c.width = w
  c.height = h
  const ctx = c.getContext("2d", { willReadFrequently: true })!
  return { c, ctx }
}

// The file the laser burns: white where it burns, by its alpha (a deep pass
// for the mark and the lettering, a shallower one for rules and fine print)
function drawArtwork(ctx: CanvasRenderingContext2D, labels: PlaqueLabels) {
  const W = FW
  const H = FH
  const DEEP = "rgba(255,255,255,1)"
  const FINE = "rgba(255,255,255,0.6)"
  ctx.save()
  // Outer frame
  ctx.strokeStyle = FINE
  ctx.lineWidth = 3.5
  ctx.strokeRect(58, 58, W - 116, H - 116)

  ctx.fillStyle = FINE
  ctx.font = '600 22px "JetBrains Mono Variable", monospace'
  ctx.textAlign = "left"
  ctx.fillText("RIBA-ROJA DE TÚRIA · VALENCIA", 128, 122)
  ctx.textAlign = "right"
  ctx.fillText("2007", W - 128, 122)

  ctx.strokeStyle = FINE
  ctx.lineWidth = 2.5
  ctx.beginPath()
  ctx.moveTo(128, 148)
  ctx.lineTo(W - 128, 148)
  ctx.stroke()

  // The dial around the mark
  const cx = W * 0.5
  const cy = 505
  const outerR = 255
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.arc(cx, cy, outerR, 0, Math.PI * 2)
  ctx.stroke()
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(cx, cy, outerR - 22, 0, Math.PI * 2)
  ctx.stroke()
  for (let i = 0; i < 48; i++) {
    const ang = (i * Math.PI * 2) / 48
    const r0 = outerR - 22
    const r1 = outerR - (i % 4 === 0 ? 4 : 12)
    ctx.beginPath()
    ctx.moveTo(cx + Math.cos(ang) * r0, cy + Math.sin(ang) * r0)
    ctx.lineTo(cx + Math.cos(ang) * r1, cy + Math.sin(ang) * r1)
    ctx.stroke()
  }
  for (let i = 0; i < 4; i++) {
    const ang = (i * Math.PI) / 2
    ctx.beginPath()
    ctx.moveTo(
      cx + Math.cos(ang) * (outerR - 36),
      cy + Math.sin(ang) * (outerR - 36)
    )
    ctx.lineTo(
      cx + Math.cos(ang) * (outerR + 14),
      cy + Math.sin(ang) * (outerR + 14)
    )
    ctx.stroke()
  }

  ctx.fillStyle = DEEP
  drawLasercomEmblem(ctx, cx + 10, cy + 8, 295)

  ctx.textAlign = "center"
  ctx.font = '800 112px "Archivo Variable", system-ui, sans-serif'
  ctx.letterSpacing = "2px"
  ctx.fillText("LASERCOM", cx, 925)

  ctx.fillStyle = FINE
  ctx.font = '700 27px "JetBrains Mono Variable", monospace'
  ctx.letterSpacing = "4px"
  ctx.fillText(labels.subtitle.toLocaleUpperCase(), cx, 982)

  // The spec box: laser, metal cut, year
  const boxY = 1045
  const boxH = 120
  ctx.strokeStyle = FINE
  ctx.lineWidth = 2.5
  ctx.strokeRect(96, boxY, W - 192, boxH)
  ctx.beginPath()
  ctx.moveTo(W * 0.38, boxY)
  ctx.lineTo(W * 0.38, boxY + boxH)
  ctx.moveTo(W * 0.7, boxY)
  ctx.lineTo(W * 0.7, boxY + boxH)
  ctx.stroke()

  ctx.textAlign = "left"
  ctx.letterSpacing = "1px"
  ctx.font = '500 19px "JetBrains Mono Variable", monospace'
  ctx.fillText(labels.laser.toLocaleUpperCase(), 122, boxY + 42)
  ctx.fillText(labels.cut.toLocaleUpperCase(), W * 0.38 + 26, boxY + 42)
  ctx.fillText(labels.since.toLocaleUpperCase(), W * 0.7 + 26, boxY + 42)

  ctx.font = '700 25px "JetBrains Mono Variable", monospace'
  ctx.fillStyle = DEEP
  ctx.fillText(labels.laserValue.toLocaleUpperCase(), 122, boxY + 86)
  ctx.fillText("4 MM", W * 0.38 + 26, boxY + 86)
  ctx.fillText("2007", W * 0.7 + 26, boxY + 86)
  ctx.restore()
}

// The bakes run in slices, handing the main thread back between them, so
// the page never stutters while the plaque is prepared (about 0.35 s of
// work in all on a recent laptop, several times that on a modest one)
const pause = () => {
  const s = (globalThis as { scheduler?: { yield?: () => Promise<void> } })
    .scheduler
  return s?.yield
    ? s.yield()
    : new Promise<void>((resolve) => setTimeout(resolve, 0))
}

// The relief: the file at 2× for the colour map, and at 1.5× its normal
// map, the occlusion at the bottom of the grooves and a mask (g: where it is
// burnt)
async function bakeRelief(labels: PlaqueLabels, res: Res) {
  const { hi: HI, rs: RS, rw: RW, rh: RH } = res
  const ink = canvasOf(FW * HI, FH * HI)
  ink.ctx.scale(HI, HI)
  drawArtwork(ink.ctx, labels)

  // Heights: the groove's walls are a little soft, and a wide blur tells
  // how much of the neighbourhood is burnt (narrow grooves are darker at
  // the bottom than wide fills)
  const at = (blur: number) => {
    const { ctx } = canvasOf(RW, RH)
    ctx.filter = `blur(${blur}px)`
    ctx.drawImage(ink.c, 0, 0, RW, RH)
    return ctx.getImageData(0, 0, RW, RH).data
  }
  await pause()
  const narrow = at(0.9 * RS)
  await pause()
  const wide = at(7 * RS)
  await pause()

  const n = canvasOf(RW, RH)
  const o = canvasOf(RW, RH)
  const m = canvasOf(RW, RH)
  const nImg = n.ctx.createImageData(RW, RH)
  const oImg = o.ctx.createImageData(RW, RH)
  const mImg = m.ctx.createImageData(RW, RH)
  const nd = nImg.data
  const od = oImg.data
  const md = mImg.data
  const h = new Float32Array(RW * RH)
  for (let i = 0; i < RW * RH; i++) h[i] = narrow[i * 4 + 3] / 255
  // Steepness of the walls (in face units the groove is ~3 px deep)
  const K = 3.2 * RS
  for (let y = 0; y < RH; y++) {
    if (y % 240 === 239) await pause()
    const up = (y > 0 ? y - 1 : y) * RW
    const dn = (y < RH - 1 ? y + 1 : y) * RW
    const row = y * RW
    for (let x = 0; x < RW; x++) {
      const i = row + x
      const l = x > 0 ? i - 1 : i
      const r = x < RW - 1 ? i + 1 : i
      // The surface is -h deep: its normal tilts toward the groove's floor
      const nx = K * (h[r] - h[l])
      const ny = K * (h[up + x] - h[dn + x])
      const inv = 1 / Math.sqrt(nx * nx + ny * ny + 1)
      const p = i * 4
      nd[p] = (nx * inv * 0.5 + 0.5) * 255
      nd[p + 1] = (ny * inv * 0.5 + 0.5) * 255
      nd[p + 2] = (inv * 0.5 + 0.5) * 255
      nd[p + 3] = 255
      const v = h[i]
      const open = wide[p + 3] / 255
      const occ = 1 - v * Math.pow(1 - open, 0.7)
      od[p] = od[p + 1] = od[p + 2] = occ * 255
      od[p + 3] = 255
      md[p] = (1 - v) * 255
      md[p + 1] = v * 255
      md[p + 2] = 0
      md[p + 3] = 255
    }
  }
  await pause()
  n.ctx.putImageData(nImg, 0, 0)
  o.ctx.putImageData(oImg, 0, 0)
  m.ctx.putImageData(mImg, 0, 0)
  const normal = new THREE.CanvasTexture(n.c)
  const mask = new THREE.CanvasTexture(m.c)
  return { ink: ink.c, occlusion: o.c, normal, mask }
}

// Paints `src` in one colour, keeping its alpha, optionally blurred
const tinted = (src: HTMLCanvasElement, color: string, blur = 0) => {
  const { c, ctx } = canvasOf(src.width, src.height)
  if (blur) ctx.filter = `blur(${blur}px)`
  ctx.drawImage(src, 0, 0)
  ctx.filter = "none"
  ctx.globalCompositeOperation = "source-in"
  ctx.fillStyle = color
  ctx.fillRect(0, 0, c.width, c.height)
  return c
}

// The colour map: the brushed surface, the mark and the shadow at the
// bottom of the grooves; and the same surface blank, before the beam
async function bakeAlbedo(
  ink: HTMLCanvasElement,
  occlusion: HTMLCanvasElement,
  { hi: HI }: Res
): Promise<{ albedo: THREE.CanvasTexture; bare: THREE.CanvasTexture }> {
  const W = FW
  const H = FH
  const p = STEEL
  const { c: canvas, ctx } = canvasOf(W * HI, H * HI)
  ctx.scale(HI, HI)

  // 1. The bare surface
  const grad = ctx.createLinearGradient(0, 0, W * 0.4, H)
  grad.addColorStop(0, p.faceTop)
  grad.addColorStop(0.55, p.faceTop)
  grad.addColorStop(1, p.faceBot)
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, W, H)

  // The rest is drawn in the map's own pixels
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  const cw = canvas.width
  const ch = canvas.height

  // 2. Brushed: one hairline per pixel of the map, each row a slightly
  // different tone, crossed by longer streaks where the abrasive bit
  for (let y = 0; y < ch; y++) {
    if (y % 640 === 639) await pause()
    const a = 0.015 + Math.random() * 0.035
    ctx.fillStyle =
      Math.random() > 0.5 ? `rgba(255,255,255,${a})` : `rgba(0,0,0,${a})`
    ctx.fillRect(0, y, cw, 1)
    for (let j = 0; j < 2; j++) {
      const len = cw * (0.08 + Math.random() * 0.5)
      const sa = 0.03 + Math.random() * 0.06
      ctx.fillStyle =
        Math.random() > 0.5 ? `rgba(255,255,255,${sa})` : `rgba(0,0,0,${sa})`
      ctx.fillRect(Math.random() * cw - len * 0.3, y, len, 1)
    }
  }

  // The blank piece, before the beam: the same surface, grain and all
  const blank = canvasOf(cw, ch)
  blank.ctx.drawImage(canvas, 0, 0)
  const bare = new THREE.CanvasTexture(blank.c)
  bare.colorSpace = THREE.SRGBColorSpace

  // 3. The mark
  await pause()
  ctx.drawImage(tinted(ink, p.mark, 0.5 * HI), 0, 0)

  // 4. The bottom of narrow grooves sits in shadow
  await pause()
  ctx.globalCompositeOperation = "multiply"
  ctx.globalAlpha = p.occlusion
  ctx.drawImage(occlusion, 0, 0, cw, ch)
  ctx.globalAlpha = 1
  ctx.globalCompositeOperation = "source-over"

  const albedo = new THREE.CanvasTexture(canvas)
  albedo.colorSpace = THREE.SRGBColorSpace
  return { albedo, bare }
}

// Where the page wants the piece, in CSS pixels of the canvas
export type StagePose = {
  // Centre of the plaque
  cx: number
  cy: number
  // On-screen height of the plaque's face
  height: number
  // Radians: lean in the screen plane, and turn about the vertical axis
  rotZ: number
  rotY: number
  // 0..1: how much of the face the beam has engraved (rows, top down)
  engrave: number
}

export type DialedStage3D = {
  setPose: (pose: StagePose) => void
  setPointer: (nx: number, ny: number) => void
  resize: () => void
  destroy: () => void
  // Where the beam's spot is on screen (CSS px in the canvas), or null
  // while it is off
  beam: () => { x: number; y: number } | null
}

// Rows the beam rasters over the face (shared with the page's job sheet)
const ROWS = ENGRAVE_ROWS

// The plaque's face, in world units
const W = 1.88
const H = 2.35
const R = 0.16
const D = 0.16
const B = 0.032

// Resolves once the maps are baked (in slices) and the scene is ready.
// `light`: phones, with lighter maps and a lower pixel ratio
export async function createDialedStage3D(
  canvas: HTMLCanvasElement,
  labels: PlaqueLabels,
  { light = false }: { light?: boolean } = {}
): Promise<DialedStage3D | null> {
  const res = resOf(light)
  const relief = await bakeRelief(labels, res)
  const maps = await bakeAlbedo(relief.ink, relief.occlusion, res)
  await pause()
  let renderer: THREE.WebGLRenderer
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    })
  } catch {
    ;[relief.normal, relief.mask, maps.albedo, maps.bare].forEach((tex) =>
      tex.dispose()
    )
    return null
  }
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.15
  renderer.setClearColor(0x000000, 0)

  const scene = new THREE.Scene()
  const envTex = createStudioEnvironment(renderer)
  scene.environment = envTex

  const camera = new THREE.PerspectiveCamera(27, 1, 0.5, 40)
  const CAMERA_Z = 7.5
  camera.position.set(0, 0, CAMERA_Z)
  // Half the visible height at the plaque's depth
  const halfHeight = CAMERA_Z * Math.tan(THREE.MathUtils.degToRad(27 / 2))

  const keyLight = new THREE.SpotLight(0xfff7ed, 115, 28, 0.58, 0.85, 1.7)
  keyLight.position.set(-4.0, 5.5, 6.2)
  scene.add(keyLight)
  const fillLight = new THREE.DirectionalLight(0xfff3e6, 0.9)
  fillLight.position.set(3.5, 1.5, 5)
  scene.add(fillLight)
  const rimLight = new THREE.DirectionalLight(0xffffff, 1.1)
  rimLight.position.set(5.2, 2.2, -3.5)
  scene.add(rimLight)

  const aniso = renderer.capabilities.getMaxAnisotropy()
  for (const tex of [relief.normal, relief.mask, maps.albedo, maps.bare])
    tex.anisotropy = aniso

  // The plaque
  const plaqueGroup = new THREE.Group()
  scene.add(plaqueGroup)

  const plaqueShape = new THREE.Shape()
  const x0 = -W / 2
  const y0 = -H / 2
  plaqueShape.moveTo(x0 + R, y0)
  plaqueShape.lineTo(x0 + W - R, y0)
  plaqueShape.absarc(x0 + W - R, y0 + R, R, -Math.PI / 2, 0, false)
  plaqueShape.lineTo(x0 + W, y0 + H - R)
  plaqueShape.absarc(x0 + W - R, y0 + H - R, R, 0, Math.PI / 2, false)
  plaqueShape.lineTo(x0 + R, y0 + H)
  plaqueShape.absarc(x0 + R, y0 + H - R, R, Math.PI / 2, Math.PI, false)
  plaqueShape.lineTo(x0, y0 + R)
  plaqueShape.absarc(x0 + R, y0 + R, R, Math.PI, Math.PI * 1.5, false)

  const plaqueGeo = new THREE.ExtrudeGeometry(plaqueShape, {
    depth: D,
    bevelEnabled: true,
    bevelThickness: B,
    bevelSize: B,
    bevelSegments: 5,
    curveSegments: 28,
    UVGenerator: {
      generateTopUV: (
        _g: THREE.ExtrudeGeometry,
        v: number[],
        a: number,
        b: number,
        c: number
      ) =>
        [a, b, c].map(
          (i) =>
            new THREE.Vector2(
              (v[i * 3] + W / 2) / W,
              (v[i * 3 + 1] + H / 2) / H
            )
        ),
      generateSideWallUV: () => [
        new THREE.Vector2(0, 0),
        new THREE.Vector2(1, 0),
        new THREE.Vector2(1, 1),
        new THREE.Vector2(0, 1),
      ],
    } as unknown as THREE.UVGenerator,
  })
  plaqueGeo.center()

  // The engraved front face. The back gets the bare steel: the caps share
  // UVs, so the artwork there would read mirrored. The mask swaps the
  // surface's roughness and metalness for the mark's
  const markUniforms = {
    uMarkMask: { value: relief.mask as THREE.Texture },
    uMarkRough: { value: STEEL.markRough },
    uMarkMetal: { value: STEEL.markMetal },
    uBare: { value: maps.bare as THREE.Texture },
    uEngrave: { value: 1 },
    uRows: { value: ROWS },
  }
  const surface = {
    roughness: STEEL.roughness,
    metalness: STEEL.metalness,
    clearcoat: STEEL.clearcoat,
    clearcoatRoughness: STEEL.clearcoatRoughness,
    anisotropy: STEEL.anisotropy,
  }
  const faceMat = new THREE.MeshPhysicalMaterial({
    ...surface,
    map: maps.albedo,
    normalMap: relief.normal,
    normalScale: new THREE.Vector2(STEEL.depth, STEEL.depth),
  })
  faceMat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, markUniforms)
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
uniform sampler2D uMarkMask;
uniform sampler2D uBare;
uniform float uMarkRough;
uniform float uMarkMetal;
uniform float uEngrave;
uniform float uRows;
// Where the beam passes over uv, in rows: it rasters the face from the top,
// alternating direction on each row like the machine
float engraveAt(vec2 uv) {
  float ty = clamp(1.0 - uv.y, 0.0, 0.9999);
  float row = floor(ty * uRows);
  return row + mix(uv.x, 1.0 - uv.x, mod(row, 2.0));
}
float engraved(vec2 uv) {
  if (uEngrave >= 0.9999) return 1.0;
  return step(engraveAt(uv), uEngrave * uRows);
}`
      )
      .replace(
        "#include <map_fragment>",
        `#include <map_fragment>
float doneK = engraved(vMapUv);
diffuseColor.rgb = mix(texture2D(uBare, vMapUv).rgb, diffuseColor.rgb, doneK);`
      )
      .replace(
        "#include <normal_fragment_maps>",
        THREE.ShaderChunk.normal_fragment_maps.replace(
          "mapN.xy *= normalScale;",
          "mapN.xy *= normalScale * engraved(vNormalMapUv);"
        )
      )
      .replace(
        "#include <metalnessmap_fragment>",
        `#include <metalnessmap_fragment>
float markK = texture2D(uMarkMask, vMapUv).g * doneK;
roughnessFactor = mix(roughnessFactor, uMarkRough, markK);
metalnessFactor = mix(metalnessFactor, uMarkMetal, markK);`
      )
      .replace(
        "#include <emissivemap_fragment>",
        `#include <emissivemap_fragment>
// The fresh cut glows behind the beam and cools over a few rows
if (uEngrave > 0.0001 && uEngrave < 0.9999) {
  float behind = uEngrave * uRows - engraveAt(vMapUv);
  float hot = texture2D(uMarkMask, vMapUv).g * step(0.0, behind) * exp(-behind * 0.55);
  totalEmissiveRadiance += hot * mix(vec3(1.0, 0.25, 0.05), vec3(1.0, 0.75, 0.45), hot * hot) * 2.6;
}`
      )
  }
  const backMat = new THREE.MeshPhysicalMaterial({
    ...surface,
    color: STEEL.faceBot,
  })
  const edgeMat = new THREE.MeshPhysicalMaterial({
    clearcoat: 0.25,
    color: STEEL.edgeColor,
    roughness: STEEL.edgeRoughness,
    metalness: STEEL.edgeMetalness,
  })

  // ExtrudeGeometry: group 0 = both caps, group 1 = bevels and the cut edge.
  // Split the caps so the back one gets its own material
  const capFaces = plaqueGeo.groups[0]
  const normals = plaqueGeo.getAttribute("normal")
  // ExtrudeGeometry comes unindexed: index it 1:1 to regroup the triangles
  if (!plaqueGeo.getIndex()) {
    plaqueGeo.setIndex([...Array(normals.count).keys()])
  }
  const index = plaqueGeo.getIndex()
  if (capFaces && index) {
    const front: number[] = []
    const back: number[] = []
    for (let i = capFaces.start; i < capFaces.start + capFaces.count; i += 3) {
      const tri = [index.getX(i), index.getX(i + 1), index.getX(i + 2)]
      ;(normals.getZ(tri[0]) > 0 ? front : back).push(...tri)
    }
    const rest: number[] = []
    for (const g of plaqueGeo.groups.slice(1)) {
      for (let i = g.start; i < g.start + g.count; i++) rest.push(index.getX(i))
    }
    plaqueGeo.setIndex([...front, ...back, ...rest])
    plaqueGeo.clearGroups()
    plaqueGeo.addGroup(0, front.length, 0)
    plaqueGeo.addGroup(front.length, back.length, 1)
    plaqueGeo.addGroup(front.length + back.length, rest.length, 2)
  }
  const plaqueMesh = new THREE.Mesh(plaqueGeo, [faceMat, backMat, edgeMat])
  plaqueGroup.add(plaqueMesh)

  // Domed screws in the corners
  const boltsGroup = new THREE.Group()
  plaqueGroup.add(boltsGroup)
  const boltMat = new THREE.MeshPhysicalMaterial({
    color: STEEL.boltColor,
    roughness: 0.18,
    metalness: 0.98,
    clearcoat: 0.4,
  })
  const boltHeadGeo = new THREE.CylinderGeometry(0.048, 0.052, 0.035, 6)
  boltHeadGeo.rotateX(Math.PI / 2)
  const boltWasherGeo = new THREE.CylinderGeometry(0.068, 0.068, 0.014, 24)
  boltWasherGeo.rotateX(Math.PI / 2)
  for (const [bx, by] of [
    [-W / 2 + 0.105, H / 2 - 0.105],
    [W / 2 - 0.105, H / 2 - 0.105],
    [-W / 2 + 0.105, -H / 2 + 0.105],
    [W / 2 - 0.105, -H / 2 + 0.105],
  ]) {
    for (const side of [1, -1]) {
      const head = new THREE.Mesh(boltHeadGeo, boltMat)
      head.position.set(bx, by, side * (D / 2 + B + 0.015))
      const washer = new THREE.Mesh(boltWasherGeo, boltMat)
      washer.position.set(bx, by, side * (D / 2 + B + 0.004))
      boltsGroup.add(head, washer)
    }
  }

  const laserDotGeo = new THREE.SphereGeometry(0.02, 16, 16)
  const laserDotMat = new THREE.MeshBasicMaterial({ color: 0xfff0cc })
  const laserDot = new THREE.Mesh(laserDotGeo, laserDotMat)
  const laserGlow = new THREE.PointLight(0xff7a3a, 0, 0.9, 2)
  const beamVec = new THREE.Vector3()
  let beamAt: { x: number; y: number } | null = null
  plaqueGroup.add(laserDot, laserGlow)

  let pose: StagePose = {
    cx: 0,
    cy: 0,
    height: 0,
    rotZ: 0,
    rotY: 0,
    engrave: 1,
  }
  let pointerX = 0
  let pointerY = 0
  let smoothPX = 0
  let smoothPY = 0
  let width = 1
  let height = 1

  const resize = () => {
    width = canvas.clientWidth || 1
    height = canvas.clientHeight || 1
    renderer.setPixelRatio(
      Math.min(window.devicePixelRatio || 1, light ? 1.75 : 2)
    )
    renderer.setSize(width, height, false)
    camera.aspect = width / height
    camera.updateProjectionMatrix()
  }

  let raf = 0
  let visible = true
  let last = 0
  const animate = (now: number) => {
    if (!visible) {
      raf = 0
      last = 0
      return
    }
    const t = now * 0.001
    // Frame-rate independent easing: the same feel at 60 and 120 Hz
    const dt = last ? Math.min(0.1, (now - last) / 1000) : 0.016
    last = now
    const follow = (rate: number) => 1 - Math.exp(-rate * dt)
    smoothPX += (pointerX - smoothPX) * follow(3.2)
    smoothPY += (pointerY - smoothPY) * follow(3.2)

    // CSS pixels to world units at the plaque's depth
    const unit = (2 * halfHeight) / height
    const scale = (pose.height * unit) / H
    const px = (pose.cx - width / 2) * unit
    const py = (height / 2 - pose.cy) * unit

    plaqueGroup.position.set(
      px + smoothPX * 0.08,
      py + Math.sin(t * 0.85) * 0.03 - smoothPY * 0.06,
      0
    )
    plaqueGroup.scale.setScalar(scale)
    plaqueGroup.rotation.set(
      0.06 - smoothPY * 0.14 + Math.cos(t * 0.45) * 0.02,
      pose.rotY + smoothPX * 0.22 + Math.sin(t * 0.5) * 0.035,
      pose.rotZ + smoothPX * 0.03
    )

    // The beam's spot rides the raster while it engraves, lighting the
    // metal around it
    markUniforms.uEngrave.value = pose.engrave
    const burning = pose.engrave > 0.0005 && pose.engrave < 0.9995
    if (burning) {
      const s = pose.engrave * ROWS
      const row = Math.min(ROWS - 1, Math.floor(s))
      const along = s - row
      const u = row % 2 ? 1 - along : along
      laserDot.position.set(
        (u - 0.5) * W,
        (0.5 - (row + 0.5) / ROWS) * H,
        D / 2 + B + 0.012
      )
      laserGlow.position.copy(laserDot.position)
      laserGlow.position.z += 0.08
    }
    // The beam's spot hides when the face turns away or the job is done
    const facing = Math.cos(plaqueGroup.rotation.y) > 0.2
    laserDot.visible = burning && facing
    laserGlow.intensity = burning && facing ? 1.0 : 0
    if (burning && facing) {
      plaqueGroup.updateMatrixWorld()
      const v = laserDot.getWorldPosition(beamVec).project(camera)
      beamAt = { x: ((v.x + 1) / 2) * width, y: ((1 - v.y) / 2) * height }
    } else beamAt = null

    renderer.render(scene, camera)
    raf = requestAnimationFrame(animate)
  }

  const io = new IntersectionObserver(([entry]) => {
    visible = Boolean(entry?.isIntersecting)
    if (visible && !raf) raf = requestAnimationFrame(animate)
  })
  io.observe(canvas)
  resize()
  raf = requestAnimationFrame(animate)

  return {
    beam: () => beamAt,
    setPose: (next) => {
      pose = next
    },
    setPointer: (nx, ny) => {
      pointerX = nx
      pointerY = ny
    },
    resize,
    destroy: () => {
      cancelAnimationFrame(raf)
      io.disconnect()
      plaqueGeo.dispose()
      boltHeadGeo.dispose()
      boltWasherGeo.dispose()
      laserDotGeo.dispose()
      ;[faceMat, backMat, edgeMat, boltMat, laserDotMat].forEach((m) =>
        m.dispose()
      )
      ;[relief.normal, relief.mask, maps.albedo, maps.bare].forEach((tex) =>
        tex.dispose()
      )
      envTex.dispose()
      renderer.dispose()
    },
  }
}
