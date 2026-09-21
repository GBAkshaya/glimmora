import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

/**
 * Two rows of oversized type that slide in opposite directions as the page
 * scrolls, tied to scroll position rather than a timer.
 */
export default function MarqueeBand({ lines }: { lines: [string[], string[]] }) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const ctx = gsap.context(() => {
      const trigger = { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true }
      gsap.fromTo('[data-row="a"]', { xPercent: 0 }, { xPercent: -30, ease: 'none', scrollTrigger: trigger })
      gsap.fromTo('[data-row="b"]', { xPercent: -30 }, { xPercent: 0, ease: 'none', scrollTrigger: trigger })
    }, el)
    return () => ctx.revert()
  }, [])

  // Repeat each row so it still overflows the screen after sliding 30%.
  const row = (words: string[]) => Array.from({ length: 4 }, () => words).flat()

  return (
    <section ref={ref} aria-label="The Aura of Elegance" className="relative overflow-hidden py-16 md:py-24">
      <div
        data-row="a"
        aria-hidden
        className="flex w-max items-center gap-8 whitespace-nowrap font-logo text-6xl leading-none text-charcoal md:gap-12 md:text-[9rem]"
      >
        {row(lines[0]).map((w, i) => (
          <span key={i} className="flex items-center gap-8 md:gap-12">
            {w}
            <span className="text-2xl text-gold md:text-5xl">✦</span>
          </span>
        ))}
      </div>
      <div
        data-row="b"
        aria-hidden
        className="mt-2 flex w-max items-center gap-8 whitespace-nowrap font-logo text-6xl italic leading-none text-transparent [-webkit-text-stroke:1px_var(--color-gold)] md:mt-4 md:gap-12 md:text-[9rem]"
      >
        {row(lines[1]).map((w, i) => (
          <span key={i} className="flex items-center gap-8 md:gap-12">
            {w}
            <span className="text-2xl not-italic text-gold [-webkit-text-stroke:0] md:text-5xl">✦</span>
          </span>
        ))}
      </div>
      <p className="sr-only">The Aura of Elegance</p>
    </section>
  )
}
