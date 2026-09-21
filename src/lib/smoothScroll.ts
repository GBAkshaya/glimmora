import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import 'lenis/dist/lenis.css'

gsap.registerPlugin(ScrollTrigger)

// Inertial wheel scrolling for the storefront. Lenis moves the real window
// scroll position, so ScrollTrigger pins and scrubs keep working unchanged; it
// only needs to hear about every smoothed frame. Touch keeps native momentum
// scrolling (syncTouch off), which is what phones already do well.
let lenis: Lenis | null = null

function tick(time: number) {
  lenis?.raf(time * 1000)
}

export function startSmoothScroll() {
  if (lenis || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  lenis = new Lenis({
    // A fixed-length glide, not lerp. Lerp chases its target until the rounded
    // values match, and at the bottom of a page whose real maximum scroll is
    // fractional it never does, so Lenis stays "scrolling" forever and overrides
    // the scrollbar, keyboard and find-in-page. A duration always completes.
    duration: 1.1,
    easing: (t) => 1 - Math.pow(1 - t, 4),
    smoothWheel: true,
    syncTouch: false,
    anchors: true,
    allowNestedScroll: true,
    stopInertiaOnNavigate: true,
  })
  lenis.on('scroll', ScrollTrigger.update)
  gsap.ticker.add(tick)
  gsap.ticker.lagSmoothing(0)
}

export function stopSmoothScroll() {
  if (!lenis) return
  gsap.ticker.remove(tick)
  lenis.destroy()
  lenis = null
}

/** Scroll the page to `y`, through Lenis when it is running so the two never fight. */
export function scrollToY(y: number, { immediate = false }: { immediate?: boolean } = {}) {
  if (lenis) {
    lenis.scrollTo(y, { immediate, force: true })
  } else {
    window.scrollTo({ top: y, behavior: immediate ? 'auto' : 'smooth' })
  }
}
