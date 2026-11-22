// Runs decorative work (WebGL, Lottie) after the first paint (see below) and
// once the browser is idle, so it never competes with the headline
export const afterLoad = (callback: () => void, timeout = 1500) => {
  void afterFirstPaint().then(() => {
    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(callback, { timeout })
    } else {
      setTimeout(callback, 200)
    }
  })
}

// Resolves once the first screen has painted: shortly after the page loads,
// or at the visitor's first scroll, touch or key if sooner. Same rule the
// layout uses for its animations, so scroll scripts never hold back the LCP
let painted: Promise<void> | undefined
export const afterFirstPaint = () =>
  (painted ??= new Promise<void>((resolve) => {
    const events = ["scroll", "wheel", "pointerdown", "keydown", "touchstart"]
    const go = () => {
      events.forEach((e) => removeEventListener(e, go))
      resolve()
    }
    events.forEach((e) =>
      addEventListener(e, go, { once: true, passive: true })
    )
    const later = () => setTimeout(go, 800)
    if (document.readyState === "complete") later()
    else addEventListener("load", later, { once: true })
  }))

// GSAP with ScrollTrigger and SplitText, fetched after the first paint
export const loadScrollKit = () =>
  afterFirstPaint().then(async () => {
    const [{ gsap }, { ScrollTrigger }, { SplitText }] = await Promise.all([
      import("gsap"),
      import("gsap/ScrollTrigger"),
      import("gsap/SplitText"),
    ])
    gsap.registerPlugin(ScrollTrigger, SplitText)
    return { gsap, ScrollTrigger, SplitText }
  })

export type ScrollKit = Awaited<ReturnType<typeof loadScrollKit>>
