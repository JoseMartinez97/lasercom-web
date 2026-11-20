// Moving between pages (after Moiséz's toned Barba curtain): columns of the
// destination's material close over the page from below, one after another,
// the new page is swapped in behind them and they lift away. Service pages
// take their material's ground (the same as the home's stage); the rest the
// workshop's dark. The curtain lives in the layout, persisted across swaps.
// With reduced motion the router swaps pages as usual
const DURATION = 420
const STAGGER = 28

export function initPageCurtain() {
  const curtain = () =>
    document.querySelector<HTMLElement>("[data-page-curtain]")
  const still = () => matchMedia("(prefers-reduced-motion: reduce)").matches
  let covered = false

  const run = (el: HTMLElement, closing: boolean) => {
    const cols = [...el.children] as HTMLElement[]
    return Promise.all(
      cols.map(
        (col, i) =>
          col.animate(
            closing
              ? [{ transform: "scaleY(0)" }, { transform: "scaleY(1)" }]
              : [{ transform: "scaleY(1)" }, { transform: "scaleY(0)" }],
            {
              duration: DURATION,
              delay: i * STAGGER,
              easing: "cubic-bezier(0.76, 0, 0.24, 1)",
              fill: "forwards",
            }
          ).finished
      )
    )
  }

  document.addEventListener("astro:before-preparation", (e) => {
    const el = curtain()
    if (!el || still()) return
    const tones = JSON.parse(el.dataset.tones ?? "{}") as Record<string, string>
    el.style.setProperty(
      "--curtain",
      tones[e.to.pathname] ?? el.dataset.toneDefault ?? "#1c1917"
    )
    el.dataset.state = "closing"
    el.style.transformOrigin = ""
    ;[...el.children].forEach(
      (c) => ((c as HTMLElement).style.transformOrigin = "50% 100%")
    )
    covered = true
    const load = e.loader
    e.loader = async () => {
      await Promise.all([load(), run(el, true)])
    }
  })

  document.addEventListener("astro:after-swap", () => {
    const el = curtain()
    if (!el || !covered) return
    covered = false
    ;[...el.children].forEach(
      (c) => ((c as HTMLElement).style.transformOrigin = "50% 0%")
    )
    void run(el, false).then(() => {
      el.dataset.state = ""
      ;[...el.children].forEach((c) =>
        (c as HTMLElement).getAnimations().forEach((a) => a.cancel())
      )
    })
  })
}
