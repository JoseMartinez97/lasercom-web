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

// Display titles whose lines and words rise cleanly out of a mask, once
function animateCharTitles() {
  gsap.utils.toArray<HTMLElement>("[data-title-chars]").forEach((title) => {
    const split = SplitText.create(title, {
      type: "lines,words",
      mask: "lines",
      aria: "none",
    })
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

// Editorial paragraphs and leads whose lines rise out of a mask, once
function animateLineBlocks() {
  gsap.utils.toArray<HTMLElement>("[data-lines]").forEach((el) => {
    const split = SplitText.create(el, {
      type: "lines",
      mask: "lines",
      aria: "none",
    })
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

// Rows that draw their hairline and raise their cells, once each
function animateRows(track: HTMLElement) {
  gsap.utils.toArray<HTMLElement>("[data-row]", track).forEach((row) => {
    gsap
      .timeline({
        scrollTrigger: {
          trigger: row,
          start: "top 88%",
          toggleActions: PLAY_ONCE,
        },
      })
      .from(row.querySelector("[data-row-line]"), {
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
          clearProps: "transform",
        },
        0.2
      )
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

// Wide type that travels with the scroll, and the closing panel growing to
// fill the screen
function animateTravellingType() {
  gsap.utils.toArray<HTMLElement>("[data-marquee]").forEach((line) => {
    const dir = line.dataset.marquee === "right" ? 1 : -1
    const shift = () =>
      Math.min(window.innerWidth * 0.45, line.scrollWidth * 0.25)
    gsap.fromTo(
      line,
      { x: dir > 0 ? -shift() : 0 },
      {
        x: dir > 0 ? 0 : -shift(),
        ease: "none",
        scrollTrigger: {
          trigger: line.parentElement,
          start: "top bottom",
          end: "bottom top",
          scrub: SCRUB,
          invalidateOnRefresh: true,
        },
      }
    )
  })
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

// Decodes a section's images a screen ahead, so they never stall the
// scroll. An observer, not a once-trigger: a ScrollTrigger that kills itself
// while ScrollTrigger is refreshing breaks the refresh of the triggers after it
// Observers still waiting when the page is left, disconnected by the cleanup
const observers = new Set<IntersectionObserver>()
function preload(section: Element, images: Iterable<HTMLImageElement>) {
  const observer = new IntersectionObserver(
    ([entry]) => {
      if (!entry.isIntersecting) return
      observer.disconnect()
      observers.delete(observer)
      for (const image of images) {
        image.loading = "eager"
        image.decode().catch(() => {})
      }
    },
    { rootMargin: "100% 0px" }
  )
  observer.observe(section)
  observers.add(observer)
}

// The work index: the sticky photo follows the row being read, decoded ahead
// so changing rows never shows an empty frame. Colour means "this one, now":
// only the row in use is at full ink, the others step back. The scroll sets
// it (the row crossing the middle of the screen) and so does the pointer
function initWorkIndex() {
  document.querySelectorAll<HTMLElement>("[data-work]").forEach((work) => {
    const shots = work.querySelectorAll<HTMLImageElement>("[data-work-shot]")
    const rows = work.querySelectorAll<HTMLElement>("[data-work-row]")
    preload(work, shots)
    const show = (row: HTMLElement) => {
      rows.forEach((r) =>
        r.closest("li")?.toggleAttribute("data-on", r === row)
      )
      shots.forEach((shot) =>
        shot.toggleAttribute(
          "data-active",
          shot.dataset.workShot === row.dataset.workRow
        )
      )
    }
    rows.forEach((row) => {
      row.addEventListener("pointerenter", () => show(row))
      row.addEventListener("focusin", () => show(row))
      ScrollTrigger.create({
        trigger: row,
        start: "top 55%",
        end: "bottom 55%",
        onToggle: (self) => self.isActive && show(row),
      })
    })
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
function initPointer() {
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
    const xTo = gsap.quickTo(dot, "x", { duration: 0.3, ease: "power3" })
    const yTo = gsap.quickTo(dot, "y", { duration: 0.3, ease: "power3" })
    on(document, "pointermove", (e) => {
      dot.dataset.on = ""
      xTo(e.clientX)
      yTo(e.clientY)
    })
    on(document, "pointerover", (e) => {
      const target = (e.target as Element).closest<HTMLElement>("[data-cursor]")
      dot.toggleAttribute("data-big", !!target)
      if (target && label) label.textContent = target.dataset.cursor ?? ""
    })
    on(document, "pointerleave", () => delete dot.dataset.on)
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

  return () => offs.forEach((off) => off())
}

// The materials stack. Stacking is CSS sticky; this adds the motion: each
// panel's title rises out of a mask as it arrives, and the panel it covers
// shrinks back and darkens
function animateStack() {
  const panels = gsap.utils.toArray<HTMLElement>("[data-stack-panel]")
  panels.forEach((panel, i) => {
    preload(panel, panel.querySelectorAll("img"))
    const arrive = {
      trigger: panel,
      start: "top 85%",
      end: STACK_TOP,
      scrub: SCRUB,
    }
    const titleEl = panel.querySelector<HTMLElement>("[data-stack-title]")
    if (titleEl) {
      const split = SplitText.create(titleEl, {
        type: "lines",
        mask: "lines",
        aria: "none",
      })
      gsap.from(split.lines, {
        yPercent: 110,
        stagger: 0.12,
        ease: "power2.out",
        scrollTrigger: arrive,
      })
    }
    const photoEl = panel.querySelector<HTMLElement>("[data-stack-photo]")
    if (photoEl) {
      gsap.from(photoEl, {
        scale: 1.12,
        ease: "power2.out",
        scrollTrigger: arrive,
      })
    }

    const next = panels[i + 1]
    if (!next) return
    const inner =
      panel.querySelector<HTMLElement>("[data-stack-inner]") ?? panel
    const shade = panel.querySelector<HTMLElement>("[data-stack-shade]")
    const tl = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: {
        trigger: next,
        start: "top bottom",
        end: STACK_TOP,
        scrub: SCRUB,
      },
    })
    tl.to(inner, { scale: 0.93, transformOrigin: "50% 0%" }, 0)
    if (shade) {
      tl.to(shade, { opacity: 0.55 }, 0)
    }
  })
}

// Scroll animations, driven by the markup (the page entrance and the hero's
// engraving are CSS in src/styles/global.css):
//   .reveal          each block rises into place as it enters
//   [data-stagger]   its children rise one by one
//   [data-count-up]  "10+" counts up from 0
//   [data-cut]       a laser cut line drawn with the scroll
//   [data-work]      the work index, see initWorkIndex
//   [data-wipe]      a photo frame that opens like a cut
//   [data-parallax]  an image drifting inside its frame
//   [data-cursor]    the laser-dot cursor shows this label (initPointer)
//   [data-magnetic]  a button leaning toward the pointer
//   [data-stack-panel]  the materials stack, see animateStack
//   Lenis            eased wheel scrolling; touch keeps native scrolling
//   --scroll-progress  0..1 on <html>, the header's laser bar
// Everything is visible without JS; with reduced motion nothing animates.
export function initAnimations() {
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

    const pointerOff = initPointer()
    const timers: number[] = []
    const defer = (fn: () => void, ms: number) => {
      timers.push(window.setTimeout(fn, ms))
    }

    defer(() => {
      const blocks = gsap.utils.toArray<HTMLElement>(
        ".reveal > :not([data-stagger]), [data-stagger] > *"
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
    }, 220)

    defer(() => {
      animateCharTitles()
      animateLineBlocks()
    }, 280)

    defer(() => {
      animateStack()
      gsap.utils.toArray<HTMLElement>("[data-rows]").forEach(animateRows)
    }, 340)

    document.querySelectorAll<HTMLElement>("[data-count-up]").forEach((el) => {
      const match = el.textContent?.trim().match(/^(\d+)(.*)$/)
      if (!match) return
      const [whole, digits, suffix] = match
      el.style.display = "inline-block"
      el.style.minWidth = `${whole.length}ch`
      const start = Number(el.dataset.countFrom ?? 0)
      const counter = { value: start }
      el.textContent = `${start}${suffix}`
      gsap.to(counter, {
        value: Number(digits),
        duration: 1.6,
        delay: 1.6,
        ease: "power4.out",
        onUpdate: () =>
          void (el.textContent = `${Math.round(counter.value)}${suffix}`),
      })
    })

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

  initWorkIndex()

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
    observers.forEach((o) => o.disconnect())
    observers.clear()
    mm.revert()
    ScrollTrigger.getAll().forEach((t) => t.kill())
  }
}
