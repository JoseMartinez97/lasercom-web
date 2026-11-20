// The laser bed as a real 3D render (Three.js), for engrave-bench.astro. A
// piece with thickness and rounded edges sits on an aluminium honeycomb bed
// under a studio spot; its materials are physical (brushed metal reflects a
// studio environment, acrylic refracts the bed beneath it, leather has a
// sheen), its hardware is geometry (screws, a punched hole, stitching). The
// file (engrave-map.ts) is carved into the top face as the beam rasters it:
// a mask pass per frame drives the bump, colour, roughness and the glow of
// the fresh cut. The camera orbits a few degrees with the pointer
import * as THREE from "three"
import {
  createHeightMap,
  type Box,
  type GlMaterial,
  MATERIALS,
} from "@/lib/engrave-map"

export type PieceShape = {
  /** Piece size and corner radius in CSS px, and the bed's 1cqw in px */
  w: number
  h: number
  r: number
  cq: number
}

export type Engrave3D = {
  canvas: HTMLCanvasElement
  setPiece: (m: GlMaterial, shape: PieceShape, animate: boolean) => void
  setText: (text: string, box: Box, font: string) => void
  setImage: (img: HTMLImageElement, area: Box) => void
  ink: () => Box | null
  inkAt: (x: number, y: number) => number
  resize: () => void
  render: (s: {
    scan: number
    rows: number
    heat: number
    /** Pointer over the bed, 0..1 from the top-left, or null */
    pointer: [number, number] | null
    /** Laser spot on the piece, in piece px */
    spot: [number, number]
    spotOn: number
    time: number
  }) => void
  /** A point on the piece's top face (piece px) in the bed's CSS px */
  project: (x: number, y: number) => [number, number]
  destroy: () => void
}

// One world unit is 100 CSS px of the piece
const S = 0.01

type Spec = {
  thick: number // px
  bevel: number // px
  bump: number
  micro: number
  mark: [number, number, number]
  markRough: number
  markMetal: number
  halo: number
  tint: number
  side: [number, number, number]
  sideRough: number
  sideMetal: number
}
const SPEC: Record<GlMaterial, Spec> = {
  acero: {
    thick: 6,
    bevel: 1.4,
    bump: 1.6,
    micro: 0.25,
    mark: [0.2, 0.2, 0.21],
    markRough: 0.55,
    markMetal: 0.7,
    halo: 0,
    tint: 1,
    side: [0.78, 0.79, 0.8],
    sideRough: 0.28,
    sideMetal: 1,
  },
  aluminio: {
    thick: 4,
    bevel: 1.3,
    bump: 1.6,
    micro: 0.25,
    mark: [0.84, 0.85, 0.87],
    markRough: 0.38,
    markMetal: 1,
    halo: 0,
    tint: 0,
    side: [0.42, 0.43, 0.46],
    sideRough: 0.35,
    sideMetal: 1,
  },
  laton: {
    thick: 4,
    bevel: 1.2,
    bump: 1.6,
    micro: 0.25,
    mark: [0.3, 0.2, 0.08],
    markRough: 0.6,
    markMetal: 0.5,
    halo: 0,
    tint: 0,
    side: [0.93, 0.74, 0.42],
    sideRough: 0.3,
    sideMetal: 1,
  },
  plastico: {
    thick: 8,
    bevel: 1.6,
    bump: 1.2,
    micro: 0.3,
    mark: [0.78, 0.79, 0.8],
    markRough: 0.85,
    markMetal: 0,
    halo: 0,
    tint: 0,
    side: [0.13, 0.13, 0.14],
    sideRough: 0.5,
    sideMetal: 0,
  },
  madera: {
    thick: 18,
    bevel: 2,
    bump: 3,
    micro: 0.5,
    mark: [0.2, 0.09, 0.035],
    markRough: 0.95,
    markMetal: 0,
    halo: 0.35,
    tint: 0,
    side: [0.2, 0.1, 0.045],
    sideRough: 0.9,
    sideMetal: 0,
  },
  piel: {
    thick: 8,
    bevel: 3.5,
    bump: 2.5,
    micro: 0.9,
    mark: [0.11, 0.055, 0.03],
    markRough: 0.9,
    markMetal: 0,
    halo: 0.15,
    tint: 0,
    side: [0.16, 0.08, 0.04],
    sideRough: 0.5,
    sideMetal: 0,
  },
  metacrilato: {
    thick: 14,
    bevel: 1,
    bump: 1.6,
    micro: 0,
    mark: [0.95, 0.97, 0.98],
    markRough: 0.85,
    markMetal: 0,
    halo: 0,
    tint: 0,
    side: [1, 1, 1],
    sideRough: 0.04,
    sideMetal: 0,
  },
  cristal: {
    thick: 8,
    bevel: 1,
    bump: 1.6,
    micro: 0,
    mark: [0.93, 0.96, 0.94],
    markRough: 0.9,
    markMetal: 0,
    halo: 0,
    tint: 0,
    side: [0.82, 0.93, 0.87],
    sideRough: 0.04,
    sideMetal: 0,
  },
}

const NOISE = `
float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p *= 2.03;
    a *= 0.5;
  }
  return v;
}
`

const QUAD_VERT = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}`

// The surfaces, baked once per piece: albedo (linear) and, in the second
// target, micro height (r), roughness (g) and metalness (b)
const BAKE_FRAG = `
varying vec2 vUv;
uniform vec2 uSize;
uniform float uMat;
uniform float uOut;
${NOISE}
vec2 cells(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  float d1 = 8.0;
  float d2 = 8.0;
  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      vec2 g = vec2(float(x), float(y));
      vec2 o = vec2(hash(i + g), hash(i + g + 17.3)) * 0.85 + 0.075;
      vec2 r = g + o - f;
      float d = dot(r, r);
      if (d < d1) { d2 = d1; d1 = d; }
      else if (d < d2) { d2 = d; }
    }
  }
  return sqrt(vec2(d1, d2));
}
float pebble(vec2 px) {
  vec2 p = px * 0.3 + vec2(fbm(px * 0.03), fbm(px * 0.03 + 5.2)) * 1.6;
  vec2 v = cells(p);
  return smoothstep(0.0, 0.6, v.y - v.x);
}
float scratches(vec2 px) {
  float s = 0.0;
  for (int i = 0; i < 3; i++) {
    float fi = float(i);
    float a = hash(vec2(fi, 7.1)) * 3.1416;
    vec2 q = mat2(cos(a), -sin(a), sin(a), cos(a)) * px;
    float line = smoothstep(0.9, 0.95, noise(vec2(q.x * 0.005, q.y * 0.5) + fi * 17.0));
    s += line * smoothstep(0.62, 0.85, noise(q * 0.003 + fi * 5.0));
  }
  return clamp(s, 0.0, 1.0);
}
// Aluminium honeycomb of the machine's bed
vec4 hexCell(vec2 p) {
  vec2 r = vec2(1.0, 1.7320508);
  vec2 hh = r * 0.5;
  vec2 a = mod(p, r) - hh;
  vec2 b = mod(p - hh, r) - hh;
  vec2 g = dot(a, a) < dot(b, b) ? a : b;
  return vec4(g, p - g);
}
vec3 lin(vec3 c) { return pow(c, vec3(2.2)); }
void main() {
  vec2 px = vUv * uSize;
  int m = int(uMat + 0.5);
  vec3 alb = vec3(1.0);
  float h = 0.5;
  float rough = 0.5;
  float metal = 0.0;
  float brushed = 0.6 * fbm(vec2(px.x * 0.004, px.y * 0.9)) + 0.4 * noise(vec2(px.x * 0.02, px.y * 2.6));
  float fine = noise(vec2(px.x * 0.03, px.y * 3.2));
  if (m <= 2) {
    float scr = scratches(px);
    vec3 base = m == 0 ? vec3(0.8, 0.81, 0.82) : m == 1 ? vec3(0.13, 0.135, 0.15) : vec3(0.93, 0.74, 0.42);
    alb = lin(base) * (0.93 + 0.1 * brushed);
    h = 0.5 + (fine - 0.5) * 0.6 + scr * 0.08;
    rough = (m == 1 ? 0.36 : m == 2 ? 0.27 : 0.29) + 0.1 * brushed - 0.03 * scr;
    metal = m == 1 ? 0.0 : 1.0;
    if (m == 1) alb = lin(vec3(0.055, 0.056, 0.062)) * (0.93 + 0.1 * brushed);
  } else if (m == 3) {
    float g = noise(px * 1.1);
    alb = lin(vec3(0.12, 0.122, 0.13)) * (0.9 + 0.2 * g);
    h = noise(px * 0.8);
    rough = 0.5 + 0.12 * g;
  } else if (m == 4) {
    float wW = fbm(vec2(px.x * 0.0025, px.y * 0.018));
    float wT = px.y * 0.034 + wW * 9.0 + 1.6 * sin(px.x * 0.004 + wW * 5.0);
    float ring = fract(wT);
    float late = smoothstep(0.55, 0.9, ring) * (1.0 - smoothstep(0.92, 1.0, ring));
    float tone = fbm(vec2(px.x * 0.0012, px.y * 0.005));
    vec3 early = mix(vec3(0.84, 0.66, 0.46), vec3(0.74, 0.55, 0.35), tone);
    vec3 lateC = vec3(0.6, 0.4, 0.22);
    float pores = noise(vec2(px.x * 0.06, px.y * 1.8));
    float fibre = noise(vec2(px.x * 0.008, px.y * 0.9)) * 0.6 + noise(vec2(px.x * 0.02, px.y * 2.4)) * 0.4;
    float fleck = smoothstep(0.6, 0.85, noise(vec2(px.x * 0.012, px.y * 0.7)));
    vec3 wood = mix(early, lateC, late * 0.45);
    wood *= 0.9 + 0.12 * fibre + 0.05 * pores - 0.06 * fleck;
    alb = lin(wood);
    h = 0.5 + late * 0.25 + (pores - 0.5) * 0.3;
    rough = 0.62 + 0.12 * late;
  } else if (m == 5) {
    float peb = pebble(px);
    float tone = fbm(px * 0.008);
    vec3 hide = mix(vec3(0.42, 0.23, 0.12), vec3(0.34, 0.18, 0.09), tone);
    alb = lin(hide * (0.9 + 0.1 * peb));
    h = peb;
    rough = 0.42 + 0.35 * (1.0 - peb);
  } else if (m == 6 || m == 7) {
    alb = vec3(1.0);
    h = 0.5;
    rough = m == 7 ? 0.03 : 0.04;
  } else {
    // uSize is 16 cells across; a cell is 1 unit wide
    vec4 hc = hexCell(vUv * vec2(16.0, 16.0 * 1.7320508));
    vec2 q = abs(hc.xy);
    float d = max(dot(q, vec2(0.5, 0.8660254)), q.x);
    float wall = smoothstep(0.4, 0.45, d);
    float grime = fbm(px * 0.05 + hc.zw * 3.1);
    // Soot in some cells, the walls' tops worn bright
    float soot = smoothstep(0.55, 0.8, hash(floor(hc.zw * 2.0 + 0.5)));
    alb = mix(vec3(0.012) * (1.0 - 0.5 * soot), lin(vec3(0.36, 0.37, 0.39)) * (0.55 + 0.45 * grime) * (1.0 - 0.35 * soot), wall);
    h = wall;
    rough = mix(1.0, 0.5 + 0.2 * grime, wall);
    metal = wall * 0.6;
  }
  gl_FragColor = uOut < 0.5 ? vec4(alb, 1.0) : vec4(h, rough, metal, 1.0);
}`

// Per frame: the cut so far, as bump height (r), coverage (g), halo (b) and
// glow (a: the fresh cut, and the outline of what is still to burn)
const MASK_FRAG = `
varying vec2 vUv;
uniform sampler2D uH;
uniform sampler2D uSurf;
uniform vec2 uTexel;
uniform float uScan;
uniform vec4 uBox;
uniform float uRows;
uniform float uHeat;
uniform float uMicro;
uniform float uPreview;
float scanned(vec2 uv) {
  float ty = clamp((uBox.w - uv.y) / max(uBox.w - uBox.y, 1e-4), 0.0, 0.9999);
  float tx = clamp((uv.x - uBox.x) / max(uBox.z - uBox.x, 1e-4), 0.0, 1.0);
  float row = floor(ty * uRows);
  return row + mix(tx, 1.0 - tx, mod(row, 2.0));
}
float done(vec2 uv) {
  if (uScan >= 1.0) return 1.0;
  return step(scanned(uv), uScan * uRows);
}
void main() {
  vec4 t = texture2D(uH, vUv);
  float dn = done(vUv);
  float cut = t.r * dn;
  float halo = t.g * dn;
  float micro = texture2D(uSurf, vUv).r;
  float h = 0.5 + (micro - 0.5) * uMicro * (1.0 - cut) - cut * 0.45;
  float behind = uScan >= 1.0 ? 1e3 : uScan * uRows - scanned(vUv);
  float hot = cut * uHeat * exp(-max(behind, 0.0) * 1.1);
  float e = abs(texture2D(uH, vUv + vec2(uTexel.x, 0.0)).r - texture2D(uH, vUv - vec2(uTexel.x, 0.0)).r)
          + abs(texture2D(uH, vUv + vec2(0.0, uTexel.y)).r - texture2D(uH, vUv - vec2(0.0, uTexel.y)).r);
  float preview = (1.0 - dn) * clamp(e * 2.5, 0.0, 1.0) * uPreview;
  gl_FragColor = vec4(h, cut, halo, max(hot, preview * 0.035));
}`

const srgb = (c: [number, number, number]) =>
  new THREE.Color().setRGB(c[0], c[1], c[2], THREE.SRGBColorSpace)

// A rounded rectangle path (centred, y up, world units)
const roundedRect = (
  path: THREE.Shape | THREE.Path,
  w: number,
  h: number,
  r: number
) => {
  const x = -w / 2
  const y = -h / 2
  r = Math.max(0.0001, Math.min(r, w / 2, h / 2))
  path.moveTo(x + r, y)
  path.lineTo(x + w - r, y)
  path.absarc(x + w - r, y + r, r, -Math.PI / 2, 0, false)
  path.lineTo(x + w, y + h - r)
  path.absarc(x + w - r, y + h - r, r, 0, Math.PI / 2, false)
  path.lineTo(x + r, y + h)
  path.absarc(x + r, y + h - r, r, Math.PI / 2, Math.PI, false)
  path.lineTo(x, y + r)
  path.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5, false)
}

// Points along a centred rounded rectangle, every `step`, with the tangent
const alongRoundedRect = (w: number, h: number, r: number, step: number) => {
  r = Math.min(r, w / 2, h / 2)
  const a = w - 2 * r
  const b = h - 2 * r
  const arc = (Math.PI / 2) * r
  const per = 2 * a + 2 * b + 4 * arc
  const out: { x: number; y: number; ang: number }[] = []
  for (let s = 0; s < per; s += step) {
    let t = s
    // bottom edge (y = -h/2), left to right, then each corner and edge
    const segs: [
      number,
      (u: number) => { x: number; y: number; ang: number },
    ][] = [
      [a, (u) => ({ x: -a / 2 + u, y: -h / 2, ang: 0 })],
      [
        arc,
        (u) => {
          const th = -Math.PI / 2 + u / r
          return {
            x: a / 2 + r * Math.cos(th),
            y: -b / 2 + r * Math.sin(th),
            ang: th + Math.PI / 2,
          }
        },
      ],
      [b, (u) => ({ x: w / 2, y: -b / 2 + u, ang: Math.PI / 2 })],
      [
        arc,
        (u) => {
          const th = u / r
          return {
            x: a / 2 + r * Math.cos(th),
            y: b / 2 + r * Math.sin(th),
            ang: th + Math.PI / 2,
          }
        },
      ],
      [a, (u) => ({ x: a / 2 - u, y: h / 2, ang: Math.PI })],
      [
        arc,
        (u) => {
          const th = Math.PI / 2 + u / r
          return {
            x: -a / 2 + r * Math.cos(th),
            y: b / 2 + r * Math.sin(th),
            ang: th + Math.PI / 2,
          }
        },
      ],
      [b, (u) => ({ x: -w / 2, y: b / 2 - u, ang: -Math.PI / 2 })],
      [
        arc,
        (u) => {
          const th = Math.PI + u / r
          return {
            x: -a / 2 + r * Math.cos(th),
            y: -b / 2 + r * Math.sin(th),
            ang: th + Math.PI / 2,
          }
        },
      ],
    ]
    for (const [len, at] of segs) {
      if (t <= len) {
        out.push(at(t))
        break
      }
      t -= len
    }
  }
  return out
}

// A photo studio for the reflections: a dark room, a large softbox above,
// two strip lights at the sides. Metal shows them as gradients and bright
// bands, which is most of what makes it read as photographed metal
const studio = () => {
  const env = new THREE.Scene()
  const room = new THREE.Mesh(
    new THREE.BoxGeometry(24, 12, 24),
    new THREE.MeshBasicMaterial({ color: 0x0d0d0f, side: THREE.BackSide })
  )
  room.position.y = 4
  env.add(room)
  // Softboxes are brightest in the middle and fall off to the edges
  const c = document.createElement("canvas")
  c.width = c.height = 64
  const x = c.getContext("2d")
  if (x) {
    const g = x.createRadialGradient(32, 32, 2, 32, 32, 34)
    g.addColorStop(0, "#fff")
    g.addColorStop(0.6, "#bbb")
    g.addColorStop(1, "#222")
    x.fillStyle = g
    x.fillRect(0, 0, 64, 64)
  }
  const falloff = new THREE.CanvasTexture(c)
  const panel = (
    w: number,
    h: number,
    power: number,
    tint: number,
    at: [number, number, number],
    look: [number, number, number]
  ) => {
    const m = new THREE.MeshBasicMaterial({
      color: new THREE.Color(tint).multiplyScalar(power),
      map: falloff,
      side: THREE.DoubleSide,
    })
    const box = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m)
    box.position.set(...at)
    box.lookAt(...look)
    env.add(box)
  }
  // Where the camera sees the top face reflected: the band that slides
  // across the metal as the camera drifts
  panel(3.4, 2.2, 2.2, 0xfff6ec, [-1.6, 6.8, -4.4], [0, 0, 0])
  panel(6, 3, 2.5, 0xfff4e8, [-1, 7, 2.5], [0, 0, 0])
  panel(1.2, 6, 3.5, 0xffffff, [-8, 3, -2], [0, 1, 0])
  panel(1.2, 6, 2.2, 0xffe2c4, [8, 3, 2], [0, 1, 0])
  panel(10, 1, 1.2, 0xd8e6ff, [0, 2.5, -10], [0, 1, 0])
  return env
}

export function createEngrave3D(canvas: HTMLCanvasElement): Engrave3D | null {
  let renderer: THREE.WebGLRenderer
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
    })
  } catch {
    return null
  }
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.05
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFShadowMap
  renderer.setClearColor(0x0b0b0c, 1)

  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0x0b0b0c)
  const pmrem = new THREE.PMREMGenerator(renderer)
  const envRT = pmrem.fromScene(studio(), 0.03)
  scene.environment = envRT.texture
  scene.environmentIntensity = 0.8
  pmrem.dispose()

  const camera = new THREE.PerspectiveCamera(18, 1, 2, 80)

  // A warm studio spot from above-left makes the pool of light and the
  // shadow; a cool fill keeps the far side from going black
  const key = new THREE.SpotLight(0xfff0dc, 200, 0, 0.34, 1, 2)
  key.position.set(-2.4, 7.5, 3.2)
  key.castShadow = true
  key.shadow.mapSize.set(2048, 2048)
  key.shadow.radius = 6
  key.shadow.bias = -0.0002
  key.shadow.normalBias = 0.01
  key.shadow.camera.near = 4
  key.shadow.camera.far = 14
  scene.add(key, key.target)
  const fill = new THREE.DirectionalLight(0xcfe0ff, 0.12)
  fill.position.set(4, 3, -2)
  scene.add(fill)
  // The beam lights what it burns
  const laser = new THREE.PointLight(0xff5a1e, 0, 1.6, 2)
  scene.add(laser)

  // The bed
  const quad = new THREE.PlaneGeometry(2, 2)
  const ortho = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
  const bakeMat = new THREE.ShaderMaterial({
    vertexShader: QUAD_VERT,
    fragmentShader: BAKE_FRAG,
    uniforms: {
      uSize: { value: new THREE.Vector2(1, 1) },
      uMat: { value: 0 },
      uOut: { value: 0 },
    },
  })
  const bakeScene = new THREE.Scene()
  bakeScene.add(new THREE.Mesh(quad, bakeMat))
  const bake = (mat: number, w: number, h: number, size: [number, number]) => {
    const make = () =>
      new THREE.WebGLRenderTarget(size[0], size[1], {
        generateMipmaps: true,
        minFilter: THREE.LinearMipmapLinearFilter,
        magFilter: THREE.LinearFilter,
        wrapS: THREE.RepeatWrapping,
        wrapT: THREE.RepeatWrapping,
      })
    const albedo = make()
    const rmh = make()
    bakeMat.uniforms.uSize.value.set(w, h)
    bakeMat.uniforms.uMat.value = mat
    for (const [rt, out] of [
      [albedo, 0],
      [rmh, 1],
    ] as const) {
      bakeMat.uniforms.uOut.value = out
      renderer.setRenderTarget(rt)
      renderer.render(bakeScene, ortho)
    }
    renderer.setRenderTarget(null)
    albedo.texture.anisotropy = renderer.capabilities.getMaxAnisotropy()
    rmh.texture.anisotropy = albedo.texture.anisotropy
    return { albedo, rmh }
  }

  const CELL = 13 // px per honeycomb cell
  // The bed is the shader's last branch (any index past the materials)
  const bedTex = bake(9, CELL * 16, CELL * 16 * 1.7320508, [1024, 1774])
  const BED = 30
  for (const t of [bedTex.albedo.texture, bedTex.rmh.texture])
    t.repeat.set(BED / S / (CELL * 16), BED / S / (CELL * 16 * 1.7320508))
  const bed = new THREE.Mesh(
    new THREE.PlaneGeometry(BED, BED),
    new THREE.MeshStandardMaterial({
      map: bedTex.albedo.texture,
      roughnessMap: bedTex.rmh.texture,
      metalnessMap: bedTex.rmh.texture,
      bumpMap: bedTex.rmh.texture,
      bumpScale: 0.6,
      roughness: 1,
      metalness: 1,
      envMap: envRT.texture,
      envMapIntensity: 0.3,
    })
  )
  bed.rotation.x = -Math.PI / 2
  bed.receiveShadow = true
  scene.add(bed)

  // The file and the mask of what has been burnt so far
  const hm = createHeightMap()
  const makeHTex = () => {
    const t = new THREE.CanvasTexture(hm.canvas)
    t.minFilter = THREE.LinearFilter
    t.generateMipmaps = false
    return t
  }
  let hTex = makeHTex()
  let hSize = ""
  let hVersion = -1
  let maskRT = new THREE.WebGLRenderTarget(2, 2)
  const maskMat = new THREE.ShaderMaterial({
    vertexShader: QUAD_VERT,
    fragmentShader: MASK_FRAG,
    uniforms: {
      uH: { value: hTex },
      uSurf: { value: null as THREE.Texture | null },
      uTexel: { value: new THREE.Vector2() },
      uScan: { value: 1 },
      uBox: { value: new THREE.Vector4(0, 0, 1, 1) },
      uRows: { value: 20 },
      uHeat: { value: 0 },
      uMicro: { value: 0.3 },
      uPreview: { value: 0 },
    },
  })
  const maskScene = new THREE.Scene()
  maskScene.add(new THREE.Mesh(quad, maskMat))

  // The piece
  type Piece = {
    group: THREE.Group
    material: GlMaterial
    shape: PieceShape
    thick: number
    dispose: () => void
  }
  let piece: Piece | null = null
  let leaving: { p: Piece; t0: number } | null = null
  let arriving = 0

  const buildPiece = (m: GlMaterial, sh: PieceShape): Piece => {
    const sp = SPEC[m]
    const W = sh.w * S
    const H = sh.h * S
    const bev = sp.bevel * S
    const thick = sp.thick * S
    const shape = new THREE.Shape()
    roundedRect(
      shape,
      W - 2 * bev,
      H - 2 * bev,
      Math.max(sh.r * S - bev, 0.0001)
    )
    if (m === "laton") {
      const hole = new THREE.Path()
      const hr = 1.6 * sh.cq * S + bev
      hole.absarc(-W / 2 + 0.09 * W, 0, hr, 0, Math.PI * 2, true)
      shape.holes.push(hole)
    }
    const uvGen = {
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
    }
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: Math.max(thick - 2 * bev, 0.001),
      bevelEnabled: true,
      bevelThickness: bev,
      bevelSize: bev,
      bevelSegments: m === "madera" || m === "piel" ? 6 : 4,
      curveSegments: 32,
      UVGenerator: uvGen as unknown as THREE.UVGenerator,
    })
    geo.rotateX(-Math.PI / 2)
    geo.translate(0, bev, 0)
    geo.computeVertexNormals()

    const dpr = Math.min(devicePixelRatio || 1, 2)
    const tw = Math.min(2048, Math.round(sh.w * dpr))
    const th = Math.max(2, Math.round((tw * sh.h) / sh.w))
    const surf = bake(MATERIALS.indexOf(m), sh.w, sh.h, [tw, th])
    for (const t of [surf.albedo.texture, surf.rmh.texture]) {
      t.wrapS = THREE.ClampToEdgeWrapping
      t.wrapT = THREE.ClampToEdgeWrapping
    }

    const top = new THREE.MeshPhysicalMaterial({
      map: surf.albedo.texture,
      roughnessMap: surf.rmh.texture,
      metalnessMap: surf.rmh.texture,
      bumpMap: maskRT.texture,
      bumpScale: sp.bump,
      roughness: 1,
      metalness: 1,
    })
    const side = new THREE.MeshPhysicalMaterial({
      color: srgb(sp.side),
      roughness: sp.sideRough,
      metalness: sp.sideMetal,
    })
    if (m === "acero" || m === "aluminio" || m === "laton") {
      top.anisotropy = m === "aluminio" ? 0.45 : 0.7
    }
    if (m === "piel") {
      top.sheen = 0.6
      top.sheenRoughness = 0.5
      top.sheenColor = new THREE.Color(0.5, 0.32, 0.22)
    }
    if (m === "plastico") {
      top.specularIntensity = 0.7
      top.clearcoat = 0.25
      top.clearcoatRoughness = 0.5
    }
    if (m === "aluminio") {
      top.clearcoat = 0.5
      top.clearcoatRoughness = 0.35
    }
    if (m === "metacrilato") {
      top.transmission = 1
      top.thickness = thick
      top.ior = 1.49
      top.attenuationColor = new THREE.Color(0.8, 0.95, 0.97)
      top.attenuationDistance = 0.35
      top.specularIntensity = 1
      top.color = new THREE.Color(1, 1, 1)
      // Laser-cut acrylic has a flame-polished edge that pipes the light:
      // it reads as a bright, faintly green-blue rim
      side.color = new THREE.Color(0.75, 0.88, 0.9)
      side.roughness = 0.06
      side.clearcoat = 1
      side.emissive = new THREE.Color(0.05, 0.085, 0.09)
    }
    // Glass: thinner and harder than acrylic, with the green of soda-lime
    // glass in its body and, above all, at its edge
    if (m === "cristal") {
      top.transmission = 1
      top.thickness = thick
      top.ior = 1.52
      top.attenuationColor = new THREE.Color(0.72, 0.9, 0.8)
      top.attenuationDistance = 0.25
      top.specularIntensity = 1
      top.clearcoat = 1
      top.clearcoatRoughness = 0.02
      top.color = new THREE.Color(1, 1, 1)
      side.color = new THREE.Color(0.55, 0.8, 0.66)
      side.roughness = 0.04
      side.clearcoat = 1
      side.emissive = new THREE.Color(0.03, 0.08, 0.05)
    }
    const mark = srgb(sp.mark)
    top.onBeforeCompile = (shader) => {
      shader.uniforms.uMask = { value: maskRT.texture }
      shader.uniforms.uMarkColor = { value: mark }
      shader.uniforms.uMarkRough = { value: sp.markRough }
      shader.uniforms.uMarkMetal = { value: sp.markMetal }
      shader.uniforms.uHaloDark = { value: sp.halo }
      shader.uniforms.uTint = { value: sp.tint }
      maskUniforms.add(shader.uniforms.uMask)
      shader.fragmentShader =
        `uniform sampler2D uMask;
uniform vec3 uMarkColor;
uniform float uMarkRough;
uniform float uMarkMetal;
uniform float uHaloDark;
uniform float uTint;
` +
        shader.fragmentShader
          .replace(
            "#include <map_fragment>",
            `#include <map_fragment>
  vec4 mk = texture2D(uMask, vMapUv);
  float mkK = smoothstep(0.28, 0.72, mk.g);
  float mkHalo = clamp(mk.b - mk.g * 1.2, 0.0, 1.0);
  diffuseColor.rgb *= mix(vec3(1.0), vec3(1.1, 0.88, 0.62), mkHalo * uTint);
  diffuseColor.rgb *= 1.0 - mkHalo * uHaloDark;
  diffuseColor.rgb = mix(diffuseColor.rgb, uMarkColor, mkK);`
          )
          .replace(
            "#include <roughnessmap_fragment>",
            `#include <roughnessmap_fragment>
  roughnessFactor = mix(roughnessFactor, uMarkRough, mkK);`
          )
          .replace(
            "#include <metalnessmap_fragment>",
            `#include <metalnessmap_fragment>
  metalnessFactor = mix(metalnessFactor, uMarkMetal, mkK);`
          )
          .replace(
            "#include <emissivemap_fragment>",
            `#include <emissivemap_fragment>
  totalEmissiveRadiance += mk.a * mix(vec3(1.0, 0.22, 0.05), vec3(1.0, 0.7, 0.4), mk.a * mk.a) * 3.0;`
          )
          .replace(
            "#include <transmission_fragment>",
            THREE.ShaderChunk.transmission_fragment.replace(
              "material.transmission = transmission;",
              "material.transmission = transmission * (1.0 - 0.94 * mkK);"
            )
          )
    }
    top.customProgramCacheKey = () => `engrave-top-${m}`

    const mesh = new THREE.Mesh(geo, [top, side])
    mesh.castShadow = true
    mesh.receiveShadow = true
    const group = new THREE.Group()
    group.add(mesh)
    const extra: THREE.BufferGeometry[] = []
    const extraMats: THREE.Material[] = []

    // Steel: four domed screws with a cross slot
    if (m === "acero") {
      const r = 0.74 * sh.cq * S
      const dome = new THREE.SphereGeometry(
        r,
        32,
        12,
        0,
        Math.PI * 2,
        0,
        Math.PI / 2
      )
      dome.scale(1, 0.38, 1)
      const slotGeo = new THREE.BoxGeometry(r * 1.25, r * 0.12, r * 0.2)
      const steel = new THREE.MeshPhysicalMaterial({
        color: srgb([0.72, 0.73, 0.75]),
        metalness: 1,
        roughness: 0.22,
      })
      const dark = new THREE.MeshStandardMaterial({
        color: 0x050505,
        roughness: 0.9,
      })
      extra.push(dome, slotGeo)
      extraMats.push(steel, dark)
      for (const [fx, fy] of [
        [0.045, 0.12],
        [0.955, 0.12],
        [0.045, 0.88],
        [0.955, 0.88],
      ]) {
        const g = new THREE.Group()
        const head = new THREE.Mesh(dome, steel)
        head.castShadow = true
        g.add(head)
        const a = new THREE.Mesh(slotGeo, dark)
        a.position.y = r * 0.36
        const b = a.clone()
        b.rotation.y = Math.PI / 2
        g.add(a, b)
        g.rotation.y = fx * 7 + fy * 3
        g.position.set((fx - 0.5) * W, thick, (fy - 0.5) * H)
        group.add(g)
      }
    }
    // Leather: saddle stitching in a pressed line
    if (m === "piel") {
      const inset = 1.5 * sh.cq * S
      const pts = alongRoundedRect(
        W - 2 * inset,
        H - 2 * inset,
        Math.max(sh.r * S - inset, 0.6 * sh.cq * S),
        7 * S
      )
      const stitch = new THREE.CapsuleGeometry(0.8 * S, 3.2 * S, 4, 8)
      stitch.rotateZ(Math.PI / 2)
      const thread = new THREE.MeshPhysicalMaterial({
        color: srgb([0.82, 0.71, 0.52]),
        roughness: 0.75,
        sheen: 0.5,
        sheenColor: new THREE.Color(1, 0.95, 0.85),
      })
      extra.push(stitch)
      extraMats.push(thread)
      const inst = new THREE.InstancedMesh(stitch, thread, pts.length)
      const mtx = new THREE.Matrix4()
      const q = new THREE.Quaternion()
      const up = new THREE.Vector3(0, 1, 0)
      pts.forEach((p, i) => {
        q.setFromAxisAngle(up, p.ang)
        mtx.compose(
          new THREE.Vector3(p.x, thick + 0.15 * S, -p.y),
          q,
          new THREE.Vector3(1, 1, 1)
        )
        inst.setMatrixAt(i, mtx)
      })
      inst.castShadow = true
      group.add(inst)
    }

    return {
      group,
      material: m,
      shape: sh,
      thick,
      dispose: () => {
        geo.dispose()
        top.dispose()
        side.dispose()
        surf.albedo.dispose()
        surf.rmh.dispose()
        extra.forEach((g) => g.dispose())
        extraMats.forEach((x) => x.dispose())
      },
    }
  }
  // Every compiled top material samples the current mask target
  const maskUniforms = new Set<{ value: THREE.Texture | null }>()

  // A soft contact shadow right under the piece, as product renders have
  const contactCanvas = document.createElement("canvas")
  let contactTex = new THREE.CanvasTexture(contactCanvas)
  const contact = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({
      map: contactTex,
      transparent: true,
      depthWrite: false,
    })
  )
  contact.rotation.x = -Math.PI / 2
  contact.position.y = 0.006
  scene.add(contact)
  const drawContact = (sh: PieceShape, m: GlMaterial) => {
    const pad = 70
    const k = 0.5
    contactCanvas.width = Math.round((sh.w + pad * 2) * k)
    contactCanvas.height = Math.round((sh.h + pad * 2) * k)
    const x = contactCanvas.getContext("2d")
    if (!x) return
    x.clearRect(0, 0, contactCanvas.width, contactCanvas.height)
    x.filter = `blur(${(12 + SPEC[m].thick * 0.9) * k}px)`
    x.fillStyle = `rgba(0,0,0,${m === "metacrilato" || m === "cristal" ? 0.5 : 0.95})`
    x.beginPath()
    x.roundRect(
      pad * k,
      pad * k,
      sh.w * k,
      sh.h * k,
      Math.min(sh.r, sh.h / 2, sh.w / 2) * k
    )
    x.fill()
    // A canvas that changes size needs a new texture
    contactTex.dispose()
    contactTex = new THREE.CanvasTexture(contactCanvas)
    ;(contact.material as THREE.MeshBasicMaterial).map = contactTex
    contact.scale.set((sh.w + pad * 2) * S, (sh.h + pad * 2) * S, 1)
    // The key light is up-left and in front: the shadow falls right and back
    const off = SPEC[m].thick * S * 0.5
    contact.position.set(off, 0.006, -off)
  }

  const setMaskSize = (w: number, h: number) => {
    const dpr = Math.min(devicePixelRatio || 1, 2)
    const tw = Math.min(2048, Math.max(2, Math.round(w * dpr)))
    const th = Math.max(2, Math.round((tw * h) / w))
    if (maskRT.width === tw && maskRT.height === th) return
    maskRT.dispose()
    maskRT = new THREE.WebGLRenderTarget(tw, th, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      generateMipmaps: false,
    })
    maskMat.uniforms.uTexel.value.set(1.2 / tw, 1.2 / th)
    maskUniforms.forEach((u) => (u.value = maskRT.texture))
  }

  const place = (p: Piece) => {
    const top = (p.group.children[0] as THREE.Mesh).material as THREE.Material[]
    const tm = top[0] as THREE.MeshPhysicalMaterial
    tm.bumpMap = maskRT.texture
    maskMat.uniforms.uSurf.value = tm.roughnessMap
    maskMat.uniforms.uMicro.value = SPEC[p.material].micro
    scene.add(p.group)
  }

  // Camera and orbit
  const orbit = { x: 0, y: 0 }
  let stageW = 1
  let stageH = 1
  const frame = () => {
    const az = orbit.x * 0.2
    const el = 0.98 + orbit.y * 0.07
    // Frame the bed's width at the piece's depth, like the flat layout did
    const fovX =
      2 *
      Math.atan(
        Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2) * camera.aspect
      )
    const d = (1.1 * stageW * S) / (2 * Math.tan(fovX / 2))
    camera.position.set(
      d * Math.cos(el) * Math.sin(az),
      d * Math.sin(el),
      d * Math.cos(el) * Math.cos(az)
    )
    camera.lookAt(0, 0, 0.04)
    camera.updateMatrixWorld()
  }

  const resize = () => {
    const w = canvas.clientWidth || 1
    const h = canvas.clientHeight || 1
    stageW = w
    stageH = h
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2))
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
    frame()
  }
  resize()

  const v3 = new THREE.Vector3()
  const toWorld = (x: number, y: number) => {
    if (!piece) return v3.set(0, 0, 0)
    v3.set(
      (x - piece.shape.w / 2) * S,
      piece.thick,
      (y - piece.shape.h / 2) * S
    )
    return piece.group.localToWorld(v3)
  }

  const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)
  const easeBack = (t: number) => {
    const c = 1.4
    return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2)
  }

  return {
    canvas,
    setPiece(m, sh, animate) {
      hm.setMaterial(m)
      hm.setSize(sh.w, sh.h, Math.min(devicePixelRatio || 1, 2))
      setMaskSize(sh.w, sh.h)
      const next = buildPiece(m, sh)
      drawContact(sh, m)
      if (piece && animate) {
        if (leaving) {
          scene.remove(leaving.p.group)
          leaving.p.dispose()
        }
        leaving = { p: piece, t0: performance.now() }
        arriving = performance.now() + 300
        next.group.position.y = 2
      } else if (piece) {
        scene.remove(piece.group)
        piece.dispose()
      }
      piece = next
      place(next)
      if (!animate) next.group.position.y = 0
    },
    setText: (text, box, font) => hm.setText(text, box, font),
    setImage: (img, area) => hm.setImage(img, area),
    ink: () => hm.ink(),
    inkAt: (x, y) => hm.inkAt(x, y),
    resize,
    render(s) {
      const now = performance.now()
      const t = s.time
      const target = s.pointer
        ? [s.pointer[0] - 0.5, 0.5 - s.pointer[1]]
        : [0.22 * Math.sin(t * 0.35), 0.12 * Math.cos(t * 0.27)]
      orbit.x += (target[0] - orbit.x) * 0.05
      orbit.y += (target[1] - orbit.y) * 0.05
      frame()
      key.position.set(-2.4 + orbit.x * 2.2, 7.5, 3.2 - orbit.y * 2)

      // Swapping pieces: the old one is lifted off, the new one set down
      if (leaving) {
        const k = Math.min(1, (now - leaving.t0) / 300)
        leaving.p.group.position.y = easeOut(k) * 2.4
        leaving.p.group.rotation.x = -k * 0.25
        if (k >= 1) {
          scene.remove(leaving.p.group)
          leaving.p.dispose()
          leaving = null
        }
      }
      if (piece) {
        const k = Math.min(1, Math.max(0, (now - arriving) / 480))
        piece.group.position.y = (1 - easeBack(k)) * 2
        piece.group.visible = now >= arriving || !leaving
        contact.visible = k > 0.6
        ;(contact.material as THREE.MeshBasicMaterial).opacity = Math.min(
          1,
          (k - 0.6) / 0.4
        )
      }

      // The cut so far
      const ink = hm.ink()
      if (hm.version() !== hVersion) {
        hVersion = hm.version()
        // Textures keep their size: a resized canvas needs a new one
        const size = `${hm.canvas.width}x${hm.canvas.height}`
        if (size !== hSize) {
          hSize = size
          hTex.dispose()
          hTex = makeHTex()
          maskMat.uniforms.uH.value = hTex
        } else hTex.needsUpdate = true
      }
      if (piece) {
        const { w, h } = piece.shape
        const b = ink ?? { x: 0, y: 0, w, h }
        maskMat.uniforms.uBox.value.set(
          b.x / w,
          1 - (b.y + b.h) / h,
          (b.x + b.w) / w,
          1 - b.y / h
        )
      }
      maskMat.uniforms.uScan.value = s.scan
      maskMat.uniforms.uRows.value = s.rows
      maskMat.uniforms.uHeat.value = s.heat
      maskMat.uniforms.uPreview.value = s.scan < 1 ? 1 : 0
      renderer.setRenderTarget(maskRT)
      renderer.render(maskScene, ortho)
      renderer.setRenderTarget(null)

      // The beam lights the surface it burns
      const p = toWorld(s.spot[0], s.spot[1])
      laser.position.set(p.x, p.y + 0.04, p.z)
      laser.intensity = s.spotOn * (0.05 + Math.random() * 0.02)

      renderer.render(scene, camera)
    },
    project(x, y) {
      const p = toWorld(x, y).project(camera)
      return [((p.x + 1) / 2) * stageW, ((1 - p.y) / 2) * stageH]
    },
    destroy() {
      piece?.dispose()
      leaving?.p.dispose()
      maskRT.dispose()
      hTex.dispose()
      contactTex.dispose()
      bedTex.albedo.dispose()
      bedTex.rmh.dispose()
      envRT.dispose()
      renderer.dispose()
      renderer.forceContextLoss()
    },
  }
}
