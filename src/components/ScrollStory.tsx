import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import logo from '../assets/logo.png.png'

gsap.registerPlugin(ScrollTrigger)
// Mobile address bars resize the viewport while scrolling; refreshing on every
// one of those would make the pinned section jump.
ScrollTrigger.config({ ignoreMobileResize: true })

type Chapter = {
  key: string
  eyebrow: string
  title: [string, string] // plain lead-in, then the italic gold phrase
  body: string
  alt: string
}

// One chapter per step of a piece's life, told the way the reference tells
// bean -> cup. Images live in public/story as 960w and 1920w WebP.
const CHAPTERS: Chapter[] = [
  {
    key: 'metal',
    eyebrow: '01 — The Metal',
    title: ['It begins with', 'gold.'],
    body: 'Warm, luminous, and made to last a lifetime.',
    alt: 'Molten gold swirling in light',
  },
  {
    key: 'craft',
    eyebrow: '02 — The Craft',
    title: ['Shaped with', 'patience.'],
    body: 'Every curve considered, every edge refined.',
    alt: 'A jeweller working on a piece under a loupe',
  },
  {
    key: 'stone',
    eyebrow: '03 — The Stone',
    title: ['Set to hold', 'the light.'],
    body: 'Each stone placed to catch the light from every angle.',
    alt: 'Cut diamonds of different shapes on a dark surface',
  },
  {
    key: 'finish',
    eyebrow: '04 — The Finish',
    title: ['Polished to', 'a glow.'],
    body: 'Finished until it feels as good as it looks.',
    alt: 'A gold necklace and matching earrings on black',
  },
  {
    key: 'moment',
    eyebrow: '05 — The Moment',
    title: ['Made to be', 'worn.'],
    body: "From everyday elegance to the occasions you'll remember.",
    alt: 'A woman wearing a fine gold necklace',
  },
]

const TOTAL = CHAPTERS.length + 1 // chapters plus the finale

function srcSet(key: string) {
  return `/story/${key}-960.webp 960w, /story/${key}-1920.webp 1920w`
}

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** Drifting gold motes over the stage. Paused whenever the stage is off screen. */
function GoldDust() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    let w = 0
    let h = 0
    let raf = 0
    let last = 0

    type Mote = { x: number; y: number; r: number; vy: number; vx: number; a: number; tw: number }
    const spawn = (anywhere: boolean): Mote => ({
      x: Math.random(),
      y: anywhere ? Math.random() : 1.05,
      r: 0.5 + Math.random() * 1.8,
      vy: 0.012 + Math.random() * 0.035, // fraction of height per second
      vx: (Math.random() - 0.5) * 0.012,
      a: 0.2 + Math.random() * 0.55,
      tw: Math.random() * Math.PI * 2,
    })
    const motes = Array.from({ length: window.innerWidth < 768 ? 36 : 72 }, () => spawn(true))

    const resize = () => {
      w = canvas.clientWidth
      h = canvas.clientHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const frame = (t: number) => {
      const dt = last ? Math.min((t - last) / 1000, 0.05) : 0
      last = t
      ctx.clearRect(0, 0, w, h)
      for (let i = 0; i < motes.length; i++) {
        const m = motes[i]
        m.y -= m.vy * dt
        m.x += m.vx * dt
        if (m.y < -0.05) motes[i] = spawn(false)
        const alpha = m.a * (0.55 + 0.45 * Math.sin(t * 0.0018 + m.tw))
        const x = m.x * w
        const y = m.y * h
        ctx.fillStyle = `rgba(232, 196, 128, ${alpha * 0.18})`
        ctx.beginPath()
        ctx.arc(x, y, m.r * 3.2, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = `rgba(250, 226, 170, ${alpha})`
        ctx.beginPath()
        ctx.arc(x, y, m.r, 0, Math.PI * 2)
        ctx.fill()
      }
      raf = requestAnimationFrame(frame)
    }

    const io = new IntersectionObserver(([entry]) => {
      cancelAnimationFrame(raf)
      last = 0
      if (entry.isIntersecting) raf = requestAnimationFrame(frame)
    })

    resize()
    window.addEventListener('resize', resize)
    io.observe(canvas)
    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
      window.removeEventListener('resize', resize)
    }
  }, [])

  return <canvas ref={ref} aria-hidden className="pointer-events-none absolute inset-0 h-full w-full mix-blend-screen" />
}

function ChapterText({ chapter, headingLevel = 'h2' }: { chapter: Chapter; headingLevel?: 'h2' | 'p' }) {
  const Heading = headingLevel
  return (
    <>
      <p className="mb-5 text-[11px] uppercase tracking-[0.4em] text-gold [text-shadow:0_1px_12px_rgba(0,0,0,0.9)]">
        {chapter.eyebrow}
      </p>
      <Heading className="font-logo text-5xl leading-[1.05] text-ivory [text-shadow:0_4px_40px_rgba(0,0,0,0.85),0_1px_3px_rgba(0,0,0,0.6)] sm:text-6xl md:text-7xl lg:text-8xl">
        {chapter.title[0]} <span className="italic text-[#e3c587]">{chapter.title[1]}</span>
      </Heading>
      <p className="mx-auto mt-6 max-w-md text-sm text-ivory/85 [text-shadow:0_1px_14px_rgba(0,0,0,0.95)] md:text-base">
        {chapter.body}
      </p>
    </>
  )
}

function Finale() {
  return (
    <div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-10 px-6 md:grid-cols-2 md:gap-16">
      <div className="text-center md:text-left">
        <p className="mb-5 text-[11px] uppercase tracking-[0.4em] text-gold/90">The Aura of Elegance</p>
        <h1 className="font-logo text-5xl leading-[1.08] text-ivory md:text-6xl lg:text-7xl">
          Jewellery that <span className="italic text-gold">tells your story.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-md text-ivory/70 md:mx-0">
          Fine craftsmanship, ethically sourced materials, and timeless design for every moment — welcome to
          Glimmora.
        </p>
        <div className="mt-9 flex items-center justify-center gap-6 md:justify-start">
          <Link
            to="/collections"
            className="rounded-lg bg-gold px-6 py-3 text-sm tracking-wide text-charcoal shadow-[0_0_40px_rgba(198,161,91,0.35)] transition-all hover:bg-ivory hover:shadow-[0_0_50px_rgba(198,161,91,0.5)]"
          >
            Explore Collections
          </Link>
          <Link
            to="/best-sellers"
            className="border-b border-ivory/30 pb-0.5 text-sm tracking-wide text-ivory transition-colors hover:border-gold hover:text-gold"
          >
            Best Sellers
          </Link>
        </div>
      </div>
      <div className="hidden justify-center md:flex">
        <div className="flex origin-top animate-swing-3d flex-col items-center">
          <div className="h-20 w-0.5 bg-gradient-to-b from-transparent via-gold/40 to-gold/80" />
          <img
            src={logo}
            alt="Glimmora logo"
            className="-mt-4 w-full max-w-[380px] object-contain drop-shadow-[0_20px_60px_rgba(198,161,91,0.35)]"
          />
        </div>
      </div>
    </div>
  )
}

/**
 * Pinned, scroll-scrubbed hero: each chapter's image slowly pushes in and
 * crossfades to the next while its headline dissolves in and out, ending on
 * the brand finale with the shop CTAs.
 */
export default function ScrollStory() {
  const rootRef = useRef<HTMLElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<ScrollTrigger | null>(null)
  const durationRef = useRef(1)
  const activeRef = useRef(0)
  const [active, setActive] = useState(0)
  const [reduced] = useState(prefersReducedMotion)

  useEffect(() => {
    if (reduced || !stageRef.current) return
    const stage = stageRef.current

    const ctx = gsap.context(() => {
      const layers = gsap.utils.toArray<HTMLElement>('[data-layer]', stage)
      const images = gsap.utils.toArray<HTMLElement>('[data-img]', stage)
      const texts = gsap.utils.toArray<HTMLElement>('[data-text]', stage)

      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: stage,
          start: 'top top',
          end: `+=${TOTAL * 85}%`,
          pin: true,
          scrub: 1,
          anticipatePin: 1,
          onUpdate: (self) => {
            // Chapter i owns timeline time [i - 0.2, i + 0.8).
            const idx = Math.min(TOTAL - 1, Math.max(0, Math.floor(self.progress * durationRef.current + 0.2)))
            if (idx !== activeRef.current) {
              activeRef.current = idx
              setActive(idx)
            }
          },
        },
      })

      // Slow, continuous push-in on every image, overlapping the crossfades.
      images.forEach((img, i) => {
        tl.fromTo(img, { scale: 1.2 }, { scale: 1.02, duration: 1.6 }, Math.max(0, i - 0.3))
      })

      for (let i = 0; i < TOTAL; i++) {
        if (i > 0) {
          tl.fromTo(layers[i], { opacity: 0 }, { opacity: 1, duration: 0.4 }, i - 0.2)
          tl.to(layers[i - 1], { opacity: 0, duration: 0.4 }, i - 0.2)
          tl.fromTo(
            texts[i],
            { opacity: 0, y: 60, filter: 'blur(14px)' },
            { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.32, ease: 'power2.out' },
            i - 0.05,
          )
        }
        if (i < TOTAL - 1) {
          tl.to(texts[i], { opacity: 0, y: -60, filter: 'blur(10px)', duration: 0.3, ease: 'power2.in' }, i + 0.55)
        }
      }

      tl.to('[data-hint]', { opacity: 0, duration: 0.2 }, 0.1)
      tl.to({}, { duration: 0.5 }) // let the finale sit before the pin releases

      durationRef.current = tl.duration()
      triggerRef.current = tl.scrollTrigger ?? null
    }, stage)

    // Images and web fonts change layout after mount; re-measure once they land.
    const refresh = () => ScrollTrigger.refresh()
    window.addEventListener('load', refresh)
    document.fonts?.ready.then(refresh)

    return () => {
      window.removeEventListener('load', refresh)
      triggerRef.current = null
      ctx.revert()
    }
  }, [reduced])

  function jumpTo(i: number) {
    const st = triggerRef.current
    if (!st) return
    const time = i === 0 ? 0 : i + 0.35
    const progress = Math.min(1, time / durationRef.current)
    window.scrollTo({ top: st.start + (st.end - st.start) * progress, behavior: 'smooth' })
  }

  // Reduced motion: no pinning or scrubbing, just the chapters as still panels.
  if (reduced) {
    return (
      <section aria-label="The Glimmora story" className="bg-[#0b0908] text-ivory">
        {CHAPTERS.map((c) => (
          <div key={c.key} className="relative flex min-h-[70svh] items-center justify-center overflow-hidden">
            <img srcSet={srcSet(c.key)} sizes="100vw" src={`/story/${c.key}-1920.webp`} alt={c.alt} className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-[#0b0908]/60" />
            <div className="relative px-6 py-24 text-center">
              <ChapterText chapter={c} />
            </div>
          </div>
        ))}
        <div className="py-24">
          <Finale />
        </div>
      </section>
    )
  }

  return (
    <section ref={rootRef} aria-label="The Glimmora story" className="relative bg-[#0b0908] text-ivory">
      <div ref={stageRef} className="relative h-[100svh] overflow-hidden">
        {/* Image layers, stacked so each later chapter sits above the last */}
        {CHAPTERS.map((c, i) => (
          <div key={c.key} data-layer className="absolute inset-0" style={{ opacity: i === 0 ? 1 : 0 }}>
            <img
              data-img
              srcSet={srcSet(c.key)}
              sizes="100vw"
              src={`/story/${c.key}-1920.webp`}
              alt={c.alt}
              fetchPriority={i === 0 ? 'high' : 'auto'}
              decoding="async"
              className="h-full w-full object-cover will-change-transform"
              style={{ transform: 'scale(1.2)' }}
            />
          </div>
        ))}
        {/* Finale backdrop: a warm glow instead of a photo */}
        <div
          data-layer
          className="absolute inset-0"
          style={{
            opacity: 0,
            background:
              'radial-gradient(60% 55% at 70% 50%, rgba(198,161,91,0.28) 0%, rgba(11,9,8,0) 70%), radial-gradient(80% 80% at 20% 90%, rgba(140,106,74,0.25) 0%, rgba(11,9,8,0) 60%), #0b0908',
          }}
        />

        {/* Legibility: vignette plus top and bottom falloff */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(11,9,8,0.15)_0%,rgba(11,9,8,0.55)_55%,rgba(11,9,8,0.92)_100%)]" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#0b0908]/70 via-transparent to-[#0b0908]/85" />

        <GoldDust />

        {/* Chapter copy */}
        {CHAPTERS.map((c, i) => (
          <div
            key={c.key}
            data-text
            className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center"
            style={{ opacity: i === 0 ? 1 : 0 }}
          >
            <ChapterText chapter={c} />
          </div>
        ))}
        <div data-text className="absolute inset-0 flex items-center" style={{ opacity: 0 }}>
          <Finale />
        </div>

        {/* Chapter rail */}
        <nav aria-label="Story chapters" className="absolute left-5 top-1/2 z-10 hidden -translate-y-1/2 flex-col gap-4 md:flex lg:left-10">
          {Array.from({ length: TOTAL }, (_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => jumpTo(i)}
              aria-label={i < CHAPTERS.length ? CHAPTERS[i].eyebrow : 'Explore Glimmora'}
              aria-current={active === i ? 'step' : undefined}
              className="group flex items-center gap-3"
            >
              <span
                className={`block h-px transition-all duration-500 ${
                  active === i ? 'w-10 bg-gold' : 'w-4 bg-ivory/30 group-hover:w-6 group-hover:bg-ivory/60'
                }`}
              />
              <span
                className={`text-[10px] tracking-[0.3em] transition-opacity duration-500 ${
                  active === i ? 'text-gold opacity-100' : 'text-ivory opacity-0 group-hover:opacity-60'
                }`}
              >
                {String(i + 1).padStart(2, '0')}
              </span>
            </button>
          ))}
        </nav>

        {/* Counter */}
        <div className="absolute bottom-7 left-6 z-10 font-logo text-sm tracking-[0.2em] text-ivory/60 lg:left-10">
          <span className="text-gold">{String(active + 1).padStart(2, '0')}</span> / {String(TOTAL).padStart(2, '0')}
        </div>

        {/* Scroll hint */}
        <div data-hint className="absolute bottom-7 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-3">
          <span className="text-[10px] uppercase tracking-[0.4em] text-ivory/60">Scroll the journey</span>
          <span className="relative block h-10 w-px overflow-hidden bg-ivory/15">
            <span className="absolute inset-x-0 top-0 h-1/2 animate-scroll-cue bg-gold" />
          </span>
        </div>
      </div>
    </section>
  )
}
