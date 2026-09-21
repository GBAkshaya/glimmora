import { useEffect, useRef, type ReactNode } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

/**
 * Treats its content as a plane in 3D space whose tilt is tied to scroll
 * position: it rises out of the page tipped back, lies flat while it is being
 * read, then tips away as it leaves the top of the screen. Everything is
 * scrubbed, so scrolling back up plays it in reverse.
 *
 * Pass `watch` (an item count, say) when the content's height depends on data
 * that loads after mount, so the scroll positions are re-measured.
 */
export default function Depth({
  children,
  className,
  exit = true,
  watch,
}: {
  children: ReactNode
  className?: string
  exit?: boolean
  watch?: unknown
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    // Gentler on phones, where a steep tilt eats most of a narrow screen.
    const k = window.innerWidth < 768 ? 0.55 : 1

    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { rotateX: 30 * k, y: 160 * k, scale: 1 - 0.12 * k, opacity: 0.15, transformPerspective: 1400, transformOrigin: '50% 100%' },
        {
          rotateX: 0,
          y: 0,
          scale: 1,
          opacity: 1,
          ease: 'power1.out',
          scrollTrigger: { trigger: el, start: 'top bottom', end: 'top 45%', scrub: true },
        },
      )
      if (exit) {
        gsap.fromTo(
          el,
          { rotateX: 0, y: 0, scale: 1, opacity: 1, transformOrigin: '50% 0%' },
          {
            rotateX: -22 * k,
            y: -90 * k,
            scale: 1 - 0.08 * k,
            opacity: 0.2,
            ease: 'power1.in',
            immediateRender: false,
            scrollTrigger: { trigger: el, start: 'bottom 55%', end: 'bottom top', scrub: true },
          },
        )
      }
    }, el)

    return () => ctx.revert()
  }, [exit, watch])

  return (
    <div ref={ref} className={`will-change-transform ${className ?? ''}`}>
      {children}
    </div>
  )
}
