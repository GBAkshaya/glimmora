import { useEffect, useRef, type ReactNode } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

/**
 * Tilts content up out of the page with perspective depth as it scrolls into
 * view. With `stagger`, animates each `[data-reveal-item]` descendant in turn
 * instead of the wrapper; pass `watch` (e.g. an item count) so items that
 * arrive after an async load are picked up.
 */
export default function Reveal({
  children,
  className,
  stagger = false,
  watch,
}: {
  children: ReactNode
  className?: string
  stagger?: boolean
  watch?: unknown
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const ctx = gsap.context(() => {
      const targets = stagger ? gsap.utils.toArray<HTMLElement>('[data-reveal-item]', el) : [el]
      if (targets.length === 0) return
      gsap.fromTo(
        targets,
        { opacity: 0, y: 80, rotateX: 18, transformPerspective: 1200, transformOrigin: '50% 100%' },
        {
          opacity: 1,
          y: 0,
          rotateX: 0,
          duration: 1.2,
          ease: 'power3.out',
          stagger: 0.09,
          clearProps: 'transform',
          scrollTrigger: { trigger: el, start: 'top 85%', once: true },
        },
      )
    }, el)

    return () => ctx.revert()
  }, [stagger, watch])

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  )
}
