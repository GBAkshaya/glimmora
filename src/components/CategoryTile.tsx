import { useRef, type PointerEvent } from 'react'
import { Link } from 'react-router-dom'

export type CategoryTileData = {
  id: string
  name: string
  slug: string
  image?: string
  count: number
}

/** A category card that tilts toward the pointer, with a light sheen following it. */
export default function CategoryTile({ category }: { category: CategoryTileData }) {
  const cardRef = useRef<HTMLAnchorElement>(null)

  function handleMove(e: PointerEvent<HTMLAnchorElement>) {
    if (e.pointerType !== 'mouse') return
    const card = cardRef.current
    if (!card) return
    const r = card.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width
    const y = (e.clientY - r.top) / r.height
    card.style.transform = `perspective(900px) rotateY(${(x - 0.5) * 12}deg) rotateX(${(0.5 - y) * 12}deg) translateZ(0)`
    card.style.setProperty('--sheen-x', `${x * 100}%`)
    card.style.setProperty('--sheen-y', `${y * 100}%`)
  }

  function reset() {
    const card = cardRef.current
    if (card) card.style.transform = ''
  }

  return (
    <Link
      ref={cardRef}
      to={`/collections/${category.slug}`}
      onPointerMove={handleMove}
      onPointerLeave={reset}
      className="group relative block aspect-[3/4] overflow-hidden rounded-2xl bg-onyx shadow-[0_18px_40px_-18px_rgba(35,31,28,0.45)] transition-transform duration-300 ease-out will-change-transform"
    >
      {category.image ? (
        <img
          src={category.image}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
      ) : (
        <div className="h-full w-full bg-[radial-gradient(circle_at_30%_20%,#c6a15b55,transparent_60%),#231f1c]" />
      )}

      {/* Product shots are mostly on white, so the falloff has to reach well up the card */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0b0908]/95 from-10% via-[#0b0908]/55 via-40% to-transparent to-70%" />
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-[radial-gradient(circle_at_var(--sheen-x,50%)_var(--sheen-y,50%),rgba(255,236,196,0.28),transparent_45%)]" />
      <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-gold/0 transition-all duration-300 group-hover:ring-gold/60" />

      <div className="absolute inset-x-0 bottom-0 p-5">
        <p className="text-[10px] uppercase tracking-[0.3em] text-gold">
          {category.count} {category.count === 1 ? 'piece' : 'pieces'}
        </p>
        <h3 className="mt-1 font-logo text-2xl text-pearl md:text-3xl">{category.name}</h3>
        <span className="mt-3 inline-flex items-center gap-2 text-xs tracking-wide text-pearl/70 transition-colors group-hover:text-gold">
          Shop now
          <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">→</span>
        </span>
      </div>
    </Link>
  )
}
