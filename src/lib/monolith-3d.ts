// The home's 3D brushed stainless steel Lasercom plaque.
// Upgraded for Three.js r187 best practices:
// - THREE.Timer (connected to document) + renderer.setAnimationLoop()
// - Pixel ratio capped at 2, ACESFilmicToneMapping
// - Soft studio PMREM softbox environment (with full temp-resource disposal)
//   plus balanced Spot / Directional / Hemisphere lighting
// - Frame-rate-independent THREE.MathUtils.damp() for pointer & pose smoothing
// - Full geometry, material, texture, environment & context cleanup on destroy()
import * as THREE from "three"
import { ENGRAVE_ROWS } from "@/lib/showcase"

const STEEL = {
  faceTop: "#d4d9e0",
  faceBot: "#9ea5b0",
  roughness: 0.24,
  metalness: 0.96,
  clearcoat: 0.3,
  clearcoatRoughness: 0.18,
  anisotropy: 0.85,
  // Fibre-laser annealing: dark satin oxide
  mark: "#25272c",
  markRough: 0.55,
  markMetal: 0.55,
  depth: 1,
  occlusion: 0.55,
  edgeColor: 0x8d949e,
  edgeRoughness: 0.28,
  edgeMetalness: 1.0,
  boltColor: 0xe2e6ec,
}

// Studio softbox environment baked into a PMREM cubemap for brushed metal
function createStudioEnvironment(
  renderer: THREE.WebGLRenderer
): THREE.WebGLRenderTarget {
  const env = new THREE.Scene()
  const roomGeo = new THREE.BoxGeometry(26, 16, 26)
  const roomMat = new THREE.MeshBasicMaterial({
    color: 0x8f8a83,
    side: THREE.BackSide,
  })
  env.add(new THREE.Mesh(roomGeo, roomMat))

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

  const tempGeos: THREE.BufferGeometry[] = [roomGeo]
  const tempMats: THREE.Material[] = [roomMat]

  const addPanel = (
    w: number,
    h: number,
    power: number,
    tint: number,
    pos: [number, number, number],
    look: [number, number, number]
  ) => {
    const geo = new THREE.PlaneGeometry(w, h)
    const mat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(tint).multiplyScalar(power),
      map: falloff,
      side: THREE.DoubleSide,
    })
    tempGeos.push(geo)
    tempMats.push(mat)
    const mesh = new THREE.Mesh(geo, mat)
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
  tempGeos.forEach((g) => g.dispose())
  tempMats.forEach((m) => m.dispose())
  return rt
}

// Lasercom emblem (vertical bar + two wings) centred at (cx, cy)
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

export type PlaqueLabels = {
  subtitle: string
  laser: string
  laserValue: string
  cut: string
  since: string
}

const FW = 1024
const FH = 1280

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

function drawArtwork(ctx: CanvasRenderingContext2D, labels: PlaqueLabels) {
  const W = FW
  const H = FH
  const DEEP = "rgba(255,255,255,1)"
  const FINE = "rgba(255,255,255,0.6)"
  ctx.save()

  // Outer engraved border
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

  // Calibration dial around the emblem
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

  // Bottom spec table
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

const pause = () => {
  const s = (globalThis as { scheduler?: { yield?: () => Promise<void> } })
    .scheduler
  return s?.yield
    ? s.yield()
    : new Promise<void>((resolve) => setTimeout(resolve, 0))
}

async function bakeRelief(labels: PlaqueLabels, res: Res) {
  const { hi: HI, rs: RS, rw: RW, rh: RH } = res
  const ink = canvasOf(FW * HI, FH * HI)
  ink.ctx.scale(HI, HI)
  drawArtwork(ink.ctx, labels)

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

  const grad = ctx.createLinearGradient(0, 0, W * 0.4, H)
  grad.addColorStop(0, p.faceTop)
  grad.addColorStop(0.55, p.faceTop)
  grad.addColorStop(1, p.faceBot)
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, W, H)

  ctx.setTransform(1, 0, 0, 1, 0, 0)
  const cw = canvas.width
  const ch = canvas.height

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

  const blank = canvasOf(cw, ch)
  blank.ctx.drawImage(canvas, 0, 0)
  const bare = new THREE.CanvasTexture(blank.c)
  bare.colorSpace = THREE.SRGBColorSpace

  await pause()
  ctx.drawImage(tinted(ink, p.mark, 0.5 * HI), 0, 0)

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

export type StagePose = {
  cx: number
  cy: number
  height: number
  rotZ: number
  rotY: number
  rotX?: number
  /** Optional camera Z distance for cinematic dolly push-in/pull-out (default 7.5). */
  camZ?: number
  /** Extra studio light (0 → 1) that rakes across the finished engraving. */
  glint?: number
  engrave: number
}

export type PlaqueStage3D = {
  setPose: (pose: StagePose) => void
  setPointer: (nx: number, ny: number) => void
  resize: () => void
  destroy: () => void
  beam: () => { x: number; y: number } | null
}

const ROWS = ENGRAVE_ROWS
const W = 1.88
const H = 2.35
const R = 0.16
const D = 0.16
const B = 0.032

export async function createPlaqueStage3D(
  canvas: HTMLCanvasElement,
  labels: PlaqueLabels,
  {
    light = false,
    reducedMotion = false,
  }: { light?: boolean; reducedMotion?: boolean } = {}
): Promise<PlaqueStage3D | null> {
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

  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.15
  renderer.setClearColor(0x000000, 0)

  const scene = new THREE.Scene()
  const envTarget = createStudioEnvironment(renderer)
  scene.environment = envTarget.texture
  scene.environmentIntensity = 1.05

  const camera = new THREE.PerspectiveCamera(27, 1, 0.5, 40)
  const CAMERA_Z = 7.5
  camera.position.set(0, 0, CAMERA_Z)

  // Soft studio 3-point + hemisphere rig
  const keyLight = new THREE.SpotLight(0xfff7ed, 115, 28, 0.58, 0.85, 1.7)
  keyLight.position.set(-4.0, 5.5, 6.2)
  scene.add(keyLight)

  const fillLight = new THREE.DirectionalLight(0xfff3e6, 0.9)
  fillLight.position.set(3.5, 1.5, 5)
  scene.add(fillLight)

  const rimLight = new THREE.DirectionalLight(0xdce8ff, 1.15)
  rimLight.position.set(5.2, 2.2, -3.5)
  scene.add(rimLight)

  const hemiLight = new THREE.HemisphereLight(0xf3f5f8, 0x16181f, 0.28)
  scene.add(hemiLight)

  const aniso = Math.min(8, renderer.capabilities.getMaxAnisotropy())
  for (const tex of [relief.normal, relief.mask, maps.albedo, maps.bare]) {
    tex.anisotropy = aniso
  }

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

  const capFaces = plaqueGeo.groups[0]
  const normals = plaqueGeo.getAttribute("normal")
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

  // Corner hex bolts + washers
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

  const laserDotGeo = new THREE.SphereGeometry(0.024, 16, 16)
  const laserDotMat = new THREE.MeshBasicMaterial({ color: 0xfff3d4 })
  const laserDot = new THREE.Mesh(laserDotGeo, laserDotMat)
  const laserGlow = new THREE.PointLight(0xff7a3a, 0, 1.35, 2)
  const beamVec = new THREE.Vector3()
  let beamAt: { x: number; y: number } | null = null
  plaqueGroup.add(laserDot, laserGlow)

  // Real 3D incandescent sparks spraying from the moving laser focal point
  const sparkCanvas = document.createElement("canvas")
  sparkCanvas.width = sparkCanvas.height = 64
  const sCtx = sparkCanvas.getContext("2d")
  if (sCtx) {
    const sg = sCtx.createRadialGradient(32, 32, 0, 32, 32, 32)
    sg.addColorStop(0, "rgba(255,255,255,1)")
    sg.addColorStop(0.25, "rgba(255,220,150,0.95)")
    sg.addColorStop(0.6, "rgba(255,104,32,0.5)")
    sg.addColorStop(1, "rgba(255,60,10,0)")
    sCtx.fillStyle = sg
    sCtx.fillRect(0, 0, 64, 64)
  }
  const sparkTex = new THREE.CanvasTexture(sparkCanvas)
  sparkTex.colorSpace = THREE.SRGBColorSpace

  const SPARK_COUNT = light ? 14 : 26
  const sparkPos = new Float32Array(SPARK_COUNT * 3)
  const sparkVel = new Float32Array(SPARK_COUNT * 3)
  const sparkLife = new Float32Array(SPARK_COUNT)
  for (let i = 0; i < SPARK_COUNT; i++) {
    sparkLife[i] = Math.random() * 0.6
    sparkPos[i * 3 + 1] = -99
  }
  const sparkGeo = new THREE.BufferGeometry()
  sparkGeo.setAttribute("position", new THREE.BufferAttribute(sparkPos, 3))
  const sparkMat = new THREE.PointsMaterial({
    map: sparkTex,
    color: 0xffb366,
    size: 0.055,
    transparent: true,
    opacity: 0.95,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })
  const sparks = new THREE.Points(sparkGeo, sparkMat)
  plaqueGroup.add(sparks)

  let pose: StagePose = {
    cx: 0,
    cy: 0,
    height: 0,
    rotZ: 0,
    rotY: -0.18,
    engrave: reducedMotion ? 1 : 0.05,
  }
  let pointerX = 0
  let pointerY = 0
  let smoothPX = 0
  let smoothPY = 0
  let width = 1
  let height = 1
  let visible = true
  // Entrance: the plaque rises edge-on and turns to face the visitor, the
  // studio light sweeping its brushed face as it arrives (seconds on screen)
  const INTRO_SECONDS = 1.9
  let introClock = reducedMotion ? INTRO_SECONDS : 0
  let disposed = false

  const resize = () => {
    if (disposed) return
    width = canvas.clientWidth || 1
    height = canvas.clientHeight || 1
    renderer.setPixelRatio(
      Math.min(window.devicePixelRatio || 1, light ? 1.75 : 2)
    )
    renderer.setSize(width, height, false)
    camera.aspect = width / Math.max(height, 1)
    camera.updateProjectionMatrix()
  }

  // THREE.Timer (r186+ replacement for deprecated Clock)
  const timer = new THREE.Timer()
  timer.connect(document)

  const animate = () => {
    if (disposed) return
    timer.update()
    if (!visible) return

    const dt = Math.min(timer.getDelta(), 0.1)
    const t = reducedMotion ? 0 : timer.getElapsed()

    introClock = Math.min(INTRO_SECONDS, introClock + dt)
    const intro = introClock / INTRO_SECONDS
    const rise = 1 - Math.pow(1 - intro, 4)
    const turn = 1 - Math.pow(1 - intro, 3)

    smoothPX = THREE.MathUtils.damp(smoothPX, pointerX, 3.6, dt)
    smoothPY = THREE.MathUtils.damp(smoothPY, pointerY, 3.6, dt)

    // Smooth camera Z dolly
    const targetCamZ = pose.camZ ?? CAMERA_Z
    camera.position.z = THREE.MathUtils.damp(
      camera.position.z,
      targetCamZ,
      5.2,
      dt
    )
    const liveHalfH =
      camera.position.z * Math.tan(THREE.MathUtils.degToRad(27 / 2))

    const unit = (2 * liveHalfH) / Math.max(height, 1)
    const scale = (pose.height * unit) / H
    const px = (pose.cx - width / 2) * unit
    const py = (height / 2 - pose.cy) * unit

    plaqueGroup.position.set(
      px + smoothPX * 0.09,
      py +
        Math.sin(t * 0.85) * 0.028 -
        smoothPY * 0.055 -
        (1 - rise) * liveHalfH * 0.45,
      0
    )
    plaqueGroup.scale.setScalar(Math.max(0.001, scale * (0.9 + rise * 0.1)))
    plaqueGroup.rotation.set(
      (pose.rotX ?? 0.05) -
        smoothPY * 0.13 +
        Math.cos(t * 0.45) * 0.018 +
        (1 - rise) * 0.3,
      pose.rotY +
        smoothPX * 0.22 +
        Math.sin(t * 0.5) * 0.032 -
        (1 - turn) * 1.2,
      pose.rotZ + smoothPX * 0.025
    )
    // Light swells as the face sweeps past the key light, then settles
    scene.environmentIntensity =
      1.05 + Math.sin(intro * Math.PI) * 0.7 + (pose.glint ?? 0) * 0.75

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
        D / 2 + B + 0.014
      )
      laserGlow.position.copy(laserDot.position)
      laserGlow.position.z += 0.09
    }

    const facing = Math.cos(plaqueGroup.rotation.y) > 0.2
    const activeBeam = burning && facing
    const flicker = reducedMotion
      ? 1
      : 0.82 + Math.sin(t * 58) * 0.18 + Math.cos(t * 113) * 0.1
    laserDot.visible = activeBeam
    laserGlow.intensity = activeBeam ? 1.65 * flicker : 0

    // Animate 3D sparks bursting off the focal point
    sparks.visible = activeBeam && !reducedMotion
    if (sparks.visible) {
      const attr = sparkGeo.attributes.position as THREE.BufferAttribute
      for (let i = 0; i < SPARK_COUNT; i++) {
        sparkLife[i] -= dt * (2.6 + (i % 4) * 0.55)
        if (sparkLife[i] <= 0) {
          sparkLife[i] = 0.2 + Math.random() * 0.35
          const ang = Math.random() * Math.PI * 2
          const spd = 0.35 + Math.random() * 0.95
          sparkPos[i * 3] = laserDot.position.x
          sparkPos[i * 3 + 1] = laserDot.position.y
          sparkPos[i * 3 + 2] = laserDot.position.z + 0.01
          sparkVel[i * 3] = Math.cos(ang) * spd
          sparkVel[i * 3 + 1] = Math.sin(ang) * spd * 0.7 + 0.25
          sparkVel[i * 3 + 2] = 0.45 + Math.random() * 0.85
        } else {
          sparkVel[i * 3 + 1] -= 2.9 * dt
          sparkPos[i * 3] += sparkVel[i * 3] * dt
          sparkPos[i * 3 + 1] += sparkVel[i * 3 + 1] * dt
          sparkPos[i * 3 + 2] += sparkVel[i * 3 + 2] * dt
        }
      }
      attr.needsUpdate = true
    }

    if (activeBeam) {
      plaqueGroup.updateMatrixWorld()
      const v = laserDot.getWorldPosition(beamVec).project(camera)
      beamAt = { x: ((v.x + 1) / 2) * width, y: ((1 - v.y) / 2) * height }
    } else {
      beamAt = null
    }

    renderer.render(scene, camera)
  }

  const io = new IntersectionObserver(
    ([entry]) => {
      visible = Boolean(entry?.isIntersecting)
    },
    { rootMargin: "120px 0px" }
  )
  io.observe(canvas)

  resize()
  renderer.setAnimationLoop(animate)

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
      if (disposed) return
      disposed = true
      renderer.setAnimationLoop(null)
      timer.dispose()
      io.disconnect()
      plaqueGeo.dispose()
      boltHeadGeo.dispose()
      boltWasherGeo.dispose()
      laserDotGeo.dispose()
      sparkGeo.dispose()
      ;[faceMat, backMat, edgeMat, boltMat, laserDotMat, sparkMat].forEach(
        (m) => m.dispose()
      )
      ;[relief.normal, relief.mask, maps.albedo, maps.bare, sparkTex].forEach(
        (tex) => tex.dispose()
      )
      scene.environment = null
      envTarget.dispose()
      renderer.dispose()
      renderer.forceContextLoss()
    },
  }
}
