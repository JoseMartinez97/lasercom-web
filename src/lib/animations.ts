import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { SplitText } from "gsap/SplitText"
import Lenis from "lenis"

gsap.registerPlugin(ScrollTrigger, SplitText)

// Under the 4rem sticky header
const STACK_TOP = "top 64px"
// Seconds scrubbed animations take to catch up with the scroll
const SCRUB = 1.1
// Plays once as it enters and stays put. Not `once: true`: a trigger that
// kills itself while ScrollTrigger refreshes breaks the triggers after it
const PLAY_ONCE = "play none none none"

// Display titles whose lines and words rise cleanly out of an ascender-safe
// mask (Dialed Coffee pattern), once
function animateCharTitles() {
  gsap.utils.toArray<HTMLElement>("[data-title-chars]").forEach((title) => {
    const split = SplitText.create(title, {
      type: "lines,words",
      mask: "lines",
      linesClass: "split-line",
      aria: "none",
    })
    split.masks?.forEach((m) => m.classList.add("split-line-mask"))
    gsap.from(split.words, {
      yPercent: 108,
      duration: 0.9,
      stagger: 0.035,
      ease: "expo.out",
      scrollTrigger: {
        trigger: title,
        start: "top 88%",
        toggleActions: PLAY_ONCE,
      },
    })
  })
}

// Editorial paragraphs and leads whose lines rise out of an ascender-safe mask, once
function animateLineBlocks() {
  gsap.utils.toArray<HTMLElement>("[data-lines]").forEach((el) => {
    const split = SplitText.create(el, {
      type: "lines",
      mask: "lines",
      linesClass: "split-line",
      aria: "none",
    })
    split.masks?.forEach((m) => m.classList.add("split-line-mask"))
    gsap.from(split.lines, {
      yPercent: 105,
      duration: 0.85,
      stagger: 0.07,
      ease: "expo.out",
      scrollTrigger: {
        trigger: el,
        start: "top 90%",
        toggleActions: PLAY_ONCE,
      },
    })
  })
}

// Telemetry scramble decode (Psychoactive pattern): decodes monospace readouts
// and numeric row indices from machine glyphs in lockstep with hairline rules
const TELEMETRY_GLYPHS = "0123456789·/×+—:"
function scrambleDecode(el: HTMLElement, duration = 0.75) {
  const original = el.dataset.scrambleText ?? el.textContent ?? ""
  if (!original.trim()) return
  el.dataset.scrambleText = original
  const chars = [...original]
  const state = { p: 0 }
  return gsap.to(state, {
    p: 1,
    duration,
    ease: "none",
    onUpdate: () => {
      if (state.p >= 0.995) {
        el.textContent = original
        return
      }
      const revealCount = Math.floor(state.p * chars.length)
      let out = ""
      for (let i = 0; i < chars.length; i++) {
        const ch = chars[i]
        if (i < revealCount || ch === " " || ch === "·" || ch === "/") {
          out += ch
        } else {
          const idx =
            (i * 7 + Math.floor(state.p * 24)) % TELEMETRY_GLYPHS.length
          out += TELEMETRY_GLYPHS[idx]
        }
      }
      el.textContent = out
    },
    onComplete: () => {
      el.textContent = original
    },
  })
}

// Telemetry decodes as it enters view: [data-scramble] tags and every
// machine readout (.readout) whose text sits in one element, so the decode
// never wipes markup. Skips live text (counters, opening hours) and anything
// the visitor types into
function animateTelemetry() {
  const leaves = gsap.utils
    .toArray<HTMLElement>("[data-scramble], .readout, .readout > span")
    .filter((el, i, all) => {
      if (all.indexOf(el) !== i || el.childElementCount > 0) return false
      const text = el.textContent?.trim() ?? ""
      if (text.length < 3 || text.length > 48) return false
      return !el.closest(
        "[aria-live], [aria-hidden='true'], [data-no-scramble], [data-open-status], .sr-only, form, header, .bench-stage, [data-engrave-status]"
      )
    })
  leaves.forEach((el) => {
    ScrollTrigger.create({
      trigger: el,
      start: "top 92%",
      toggleActions: PLAY_ONCE,
      onEnter: () => void scrambleDecode(el, 0.7),
    })
  })
}

// A laser line runs down a list of steps as it scrolls past ([data-beam-
// track] > [data-beam]): the burnt line grows behind a hot head, and each
// step it reaches lights up ([data-lit])
function animateBeams() {
  gsap.utils.toArray<HTMLElement>("[data-beam-track]").forEach((track) => {
    const fill = track.querySelector<HTMLElement>("[data-beam-fill]")
    const head = track.querySelector<HTMLElement>("[data-beam-head]")
    const steps = [...track.querySelectorAll<HTMLElement>("[data-beam-step]")]
    ScrollTrigger.create({
      trigger: track,
      start: "top 72%",
      end: "bottom 60%",
      scrub: true,
      onUpdate: ({ progress: p }) => {
        const h = track.clientHeight
        if (fill) fill.style.transform = `scaleY(${p.toFixed(4)})`
        if (head) {
          head.style.transform = `translate3d(-50%, ${(p * h).toFixed(1)}px, 0)`
          head.style.opacity = p > 0.002 && p < 0.998 ? "1" : "0"
        }
        steps.forEach((step) =>
          step.toggleAttribute(
            "data-lit",
            p * h >= step.offsetTop + Math.min(28, step.offsetHeight / 3)
          )
        )
      },
    })
  })
}

// Rows that draw their hairline, decode their telemetry index, and raise their cells
function animateRows(track: HTMLElement) {
  gsap.utils.toArray<HTMLElement>("[data-row]", track).forEach((row) => {
    // Rows that only want the hover dimming of [data-rows] (the work index)
    // have no hairline or cells to animate
    const line = row.querySelector("[data-row-line]")
    if (!line) return
    const tl = gsap
      .timeline({
        scrollTrigger: {
          trigger: row,
          start: "top 88%",
          toggleActions: PLAY_ONCE,
        },
      })
      .from(line, {
        scaleX: 0,
        duration: 1.1,
        ease: "power3.inOut",
      })
      .from(
        row.querySelectorAll("[data-row-cell]"),
        {
          y: 28,
          opacity: 0,
          duration: 0.8,
          stagger: 0.08,
          ease: "power3.out",
          // Opacity too: the steps' resting state is the CSS's (lit or not)
          clearProps: "transform,opacity",
        },
        0.2
      )
    const numCell = row.querySelector<HTMLElement>(
      ".font-mono[data-row-cell], .readout[data-row-cell]"
    )
    if (numCell) {
      tl.add(() => void scrambleDecode(numCell, 0.75), 0.15)
    }
  })
}

// Laser cut lines: each [data-cut] path is drawn as its section scrolls by,
// with the beam's dot ([data-cut-dot], optional) riding on the cutting edge
function animateCuts() {
  gsap.utils.toArray<SVGPathElement>("[data-cut]").forEach((path) => {
    const length = path.getTotalLength()
    const svg = path.ownerSVGElement
    const dot = svg?.querySelector<SVGCircleElement>("[data-cut-dot]")
    gsap.set(path, { strokeDasharray: length, strokeDashoffset: length })
    const state = { p: 0 }
    gsap.to(state, {
      p: 1,
      ease: "none",
      scrollTrigger: {
        trigger: svg?.parentElement ?? path,
        start: "top 85%",
        end: "bottom 40%",
        scrub: SCRUB,
      },
      onUpdate: () => {
        path.style.strokeDashoffset = String(length * (1 - state.p))
        if (dot) {
          const { x, y } = path.getPointAtLength(length * state.p)
          dot.setAttribute("cx", String(x))
          dot.setAttribute("cy", String(y))
          dot.style.opacity = state.p > 0.002 && state.p < 0.998 ? "1" : "0"
        }
      },
    })
  })
}

// The closing panel growing to fill the screen
function animateTravellingType() {
  gsap.utils.toArray<HTMLElement>("[data-close]").forEach((panel) => {
    gsap.fromTo(
      panel,
      { scale: 0.9 },
      {
        scale: 1,
        ease: "none",
        scrollTrigger: {
          trigger: panel.parentElement,
          start: "top bottom",
          end: STACK_TOP,
          scrub: SCRUB,
        },
      }
    )
  })
  // The statement's words light up, burnt in one after the other
  gsap.utils.toArray<HTMLElement>("[data-burn]").forEach((el) => {
    const words = SplitText.create(el, { type: "words", aria: "none" }).words
    gsap.fromTo(
      words,
      { opacity: 0.58 },
      {
        opacity: 1,
        stagger: 0.1,
        ease: "none",
        scrollTrigger: {
          trigger: el,
          start: "top 80%",
          end: "bottom 45%",
          scrub: SCRUB,
        },
      }
    )
  })
}

// Cinematic scroll depth: sections subtly scale & lift into frame like film
// curtains, and [data-cinema-drift] elements glide at different scroll speeds
function animateCinemaFlow() {
  gsap.utils
    .toArray<HTMLElement>("[data-cinema-section]")
    .forEach((section) => {
      gsap.fromTo(
        section,
        { y: 48, scale: 0.965 },
        {
          y: 0,
          scale: 1,
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top 96%",
            end: "top 34%",
            scrub: SCRUB,
          },
        }
      )
    })

  gsap.utils.toArray<HTMLElement>("[data-cinema-drift]").forEach((el) => {
    const amount = Number(el.dataset.cinemaDrift) || 32
    gsap.fromTo(
      el,
      { y: amount },
      {
        y: -amount,
        ease: "none",
        scrollTrigger: {
          trigger: el.closest("section") ?? el.parentElement ?? el,
          start: "top bottom",
          end: "bottom top",
          scrub: SCRUB,
        },
      }
    )
  })

  // Dual opposing kinetic typography marquees scrubbed directly by scroll
  gsap.utils.toArray<HTMLElement>("[data-marquee-track]").forEach((track) => {
    const dir = Number(track.dataset.marqueeTrack) || -1
    gsap.fromTo(
      track,
      { xPercent: dir > 0 ? -14 : 4 },
      {
        xPercent: dir > 0 ? 4 : -14,
        ease: "none",
        scrollTrigger: {
          trigger: track.parentElement ?? track,
          start: "top bottom",
          end: "bottom top",
          scrub: 1.1,
        },
      }
    )
  })
}

// Photos that open like a cut: a clip wipes up while the picture settles
function animateWipes() {
  gsap.utils.toArray<HTMLElement>("[data-wipe]").forEach((frame) => {
    gsap
      .timeline({
        scrollTrigger: {
          trigger: frame,
          start: "top 92%",
          toggleActions: PLAY_ONCE,
        },
      })
      .fromTo(
        frame,
        { clipPath: "inset(100% 0 0 0)" },
        { clipPath: "inset(0% 0 0 0)", duration: 1.1, ease: "expo.out" }
      )
      .from(
        frame.querySelector("img"),
        { scale: 1.35, duration: 1.4, ease: "expo.out" },
        0
      )
  })
  gsap.utils.toArray<HTMLElement>("[data-parallax]").forEach((img) => {
    gsap.fromTo(
      img,
      { yPercent: -5, scale: 1.12 },
      {
        yPercent: 5,
        ease: "none",
        scrollTrigger: {
          trigger: img.parentElement,
          start: "top bottom",
          end: "bottom top",
          scrub: SCRUB,
        },
      }
    )
  })
}

// The pointer as the beam: a laser dot that grows into a label over anything
// with data-cursor, and a button that leans toward it ([data-magnetic]).
// Fine pointers only; returns its cleanup
function initPointer(lenis?: Lenis) {
  if (!matchMedia("(hover: hover) and (pointer: fine)").matches) return
  const offs: (() => void)[] = []
  const on = <K extends keyof DocumentEventMap>(
    target: Document | HTMLElement,
    type: K,
    fn: (e: DocumentEventMap[K]) => void
  ) => {
    target.addEventListener(type, fn as EventListener)
    offs.push(() => target.removeEventListener(type, fn as EventListener))
  }

  const dot = document.querySelector<HTMLElement>("[data-cursor-dot]")
  if (dot) {
    const label = dot.querySelector("span")
    const ticks = Array.from(
      dot.querySelectorAll<HTMLElement>("[data-cursor-vernier] i")
    )
    on(document, "pointermove", (e) => {
      dot.dataset.on = ""
      dot.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`
    })
    on(document, "pointerover", (e) => {
      const target = (e.target as Element).closest<HTMLElement>("[data-cursor]")
      dot.toggleAttribute("data-big", !!target)
      if (target && label) label.textContent = target.dataset.cursor ?? ""
    })
    on(document, "pointerleave", () => delete dot.dataset.on)

    // Vernier scroll-velocity ruler (Immersive Garden HomeScrollCursor pattern):
    // during fast scroll, micro-ticks fan out symmetrically along the travel
    // axis and settle cleanly back into the 10px laser dot on stop
    if (ticks.length) {
      let targetVel = 0
      let smoothVel = 0
      let lastY = window.scrollY
      let settled = true

      const onLenisScroll = (e: { velocity: number }) => {
        targetVel = Math.max(-1, Math.min(1, e.velocity / 28))
      }
      const onNativeScroll = () => {
        const y = window.scrollY
        targetVel = Math.max(-1, Math.min(1, (y - lastY) / 48))
        lastY = y
      }

      if (lenis) {
        lenis.on("scroll", onLenisScroll)
        offs.push(() => lenis.off("scroll", onLenisScroll))
      } else {
        window.addEventListener("scroll", onNativeScroll, { passive: true })
        offs.push(() => window.removeEventListener("scroll", onNativeScroll))
      }

      const tickVernier = (_t: number, dtMs: number) => {
        const dt = Math.min(dtMs || 16.6, 50) / 16.6
        const decay = 1 - Math.exp(-0.18 * dt)
        smoothVel += (targetVel - smoothVel) * decay
        targetVel *= Math.pow(0.84, dt)

        const mag = Math.abs(smoothVel)
        if (mag < 0.008) {
          if (!settled) {
            settled = true
            for (let i = 0; i < ticks.length; i++) {
              ticks[i].style.opacity = "0"
              ticks[i].style.transform = "translate3d(0,0,0)"
            }
          }
          return
        }

        settled = false
        const spread = mag * 4.2
        const lag = -smoothVel * 14
        for (let i = 0; i < ticks.length; i++) {
          const pair = Math.floor(i / 2) + 1
          const sign = i % 2 === 0 ? 1 : -1
          const y = sign * spread * pair + lag
          const falloff = 1 - pair / (ticks.length / 2 + 1)
          const alpha = Math.min(0.85, mag * 1.4) * falloff
          const sx = (0.45 + 0.55 * falloff).toFixed(3)
          ticks[i].style.opacity = alpha.toFixed(3)
          ticks[i].style.transform =
            `translate3d(0,${y.toFixed(1)}px,0) scaleX(${sx})`
        }
      }
      gsap.ticker.add(tickVernier)
      offs.push(() => {
        gsap.ticker.remove(tickVernier)
        for (let i = 0; i < ticks.length; i++) {
          ticks[i].style.opacity = "0"
          ticks[i].style.transform = ""
        }
      })
    }

    offs.push(() => {
      delete dot.dataset.on
      dot.removeAttribute("data-big")
    })
  }

  document.querySelectorAll<HTMLElement>("[data-magnetic]").forEach((btn) => {
    const area = btn.parentElement ?? btn
    const xTo = gsap.quickTo(btn, "x", { duration: 0.6, ease: "power3" })
    const yTo = gsap.quickTo(btn, "y", { duration: 0.6, ease: "power3" })
    on(area, "pointermove", (e) => {
      const box = btn.getBoundingClientRect()
      xTo((e.clientX - (box.left + box.width / 2)) * 0.3)
      yTo((e.clientY - (box.top + box.height / 2)) * 0.4)
    })
    on(area, "pointerleave", () => {
      xTo(0)
      yTo(0)
    })
  })

  // Directional ambient laser glow tracking (NK Studio --info-card-glow pattern)
  document.querySelectorAll<HTMLElement>(".laser-glow-card").forEach((card) => {
    on(card, "pointermove", (e) => {
      const r = card.getBoundingClientRect()
      if (!r.width || !r.height) return
      const x = (((e.clientX - r.left) / r.width) * 100).toFixed(1)
      const y = (((e.clientY - r.top) / r.height) * 100).toFixed(1)
      card.style.setProperty("--glow-x", `${x}%`)
      card.style.setProperty("--glow-y", `${y}%`)
    })
  })

  return () => offs.forEach((off) => off())
}

// Scroll animations, driven by the markup (the page entrance and the hero's
// engraving are CSS in src/styles/global.css):
//   .reveal          each block rises into place as it enters
//   [data-stagger]   its children rise one by one
//   [data-cut]       a laser cut line drawn with the scroll
//   [data-wipe]      a photo frame that opens like a cut
//   [data-parallax]  an image drifting inside its frame
//   [data-cursor]    the laser-dot cursor shows this label (initPointer)
//   [data-magnetic]  a button leaning toward the pointer
//   Lenis            eased wheel scrolling; touch keeps native scrolling
//   --scroll-progress  0..1 on <html>, the header's laser bar
// Everything is visible without JS; with reduced motion nothing animates.
export function initAnimations() {
  // The failsafe in layouts/main.astro already showed everything (the module
  // came late, on a slow connection): blocks that are on screen stay put
  // instead of dropping and rising again
  const shownByFailsafe = !document.documentElement.classList.contains("js")
  // Tells the failsafe in layouts/main.astro that the reveals are running
  document.documentElement.dataset.reveal = "on"
  const mm = gsap.matchMedia()

  mm.add("(prefers-reduced-motion: no-preference)", () => {
    // Eased wheel scrolling only where there is a wheel: touch screens keep
    // their native scrolling, and skip the work on every frame
    const lenis = matchMedia("(pointer: fine)").matches
      ? new Lenis({
          autoRaf: false,
          allowNestedScroll: true,
          lerp: 0.08,
          wheelMultiplier: 0.95,
        })
      : undefined
    lenis?.on("scroll", ScrollTrigger.update)
    const tick = (time: number) => lenis?.raf(time * 1000)
    if (lenis) {
      gsap.ticker.add(tick)
      gsap.ticker.lagSmoothing(0)
    }

    const pointerOff = initPointer(lenis)
    const timers: number[] = []
    const defer = (fn: () => void, ms: number) => {
      timers.push(window.setTimeout(fn, ms))
    }

    defer(() => {
      const blocks = gsap.utils
        .toArray<HTMLElement>(
          ".reveal > :not([data-stagger]), [data-stagger] > *"
        )
        .filter(
          (el) =>
            !shownByFailsafe || el.getBoundingClientRect().top > innerHeight
        )
      const loadedAt = performance.now()
      gsap.set(blocks, { y: 40, transition: "none" })
      ScrollTrigger.batch(blocks, {
        start: "top bottom-=60",
        onEnter: (batch) => {
          const fresh = batch.filter((el) => !(el as HTMLElement).dataset.shown)
          fresh.forEach((el) => ((el as HTMLElement).dataset.shown = ""))
          gsap.to(fresh, {
            opacity: 1,
            y: 0,
            duration: 0.9,
            ease: "power3.out",
            stagger: 0.08,
            delay: performance.now() - loadedAt < 500 ? 0.4 : 0,
            clearProps: "transition,transform",
          })
        },
      })
      animateTravellingType()
      animateCuts()
      animateWipes()
      animateCinemaFlow()
    }, 220)

    defer(() => {
      animateCharTitles()
      animateLineBlocks()
    }, 280)

    defer(() => {
      animateTelemetry()
      gsap.utils.toArray<HTMLElement>("[data-rows]").forEach(animateRows)
      animateBeams()
    }, 340)

    return () => {
      timers.forEach((id) => window.clearTimeout(id))
      pointerOff?.()
      if (lenis) {
        gsap.ticker.remove(tick)
        gsap.ticker.lagSmoothing(500, 33)
        lenis.destroy()
      }
    }
  })

  gsap.fromTo(
    document.documentElement,
    { "--scroll-progress": 0 },
    {
      "--scroll-progress": 1,
      ease: "none",
      scrollTrigger: { start: 0, end: "max", scrub: true },
    }
  )

  // Webfonts change heights after first layout
  let active = true
  document.fonts.ready.then(() => {
    if (!active) return
    ScrollTrigger.refresh()
    if (location.hash) document.querySelector(location.hash)?.scrollIntoView()
  })

  const onRefresh = () => {
    if (active) ScrollTrigger.refresh()
  }
  const onRevealEl = (e: Event) => {
    if (!active) return
    const container = (e as CustomEvent<HTMLElement>).detail
    if (!container) return
    const targets = [
      ...container.children,
      ...container.querySelectorAll("[data-wipe]"),
    ]
    gsap.killTweensOf(targets)
    gsap.set([...container.children], {
      opacity: 1,
      y: 0,
      clearProps: "transform",
    })
    gsap.set([...container.querySelectorAll("[data-wipe]")], {
      clipPath: "inset(0% 0% 0% 0%)",
      opacity: 1,
    })
  }
  window.addEventListener("lasercom:refresh", onRefresh)
  window.addEventListener("lasercom:reveal-item", onRevealEl)

  return () => {
    active = false
    window.removeEventListener("lasercom:refresh", onRefresh)
    window.removeEventListener("lasercom:reveal-item", onRevealEl)
    mm.revert()
    ScrollTrigger.getAll().forEach((t) => t.kill())
  }
}
