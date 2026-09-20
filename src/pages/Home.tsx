import { useEffect, useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AtSign } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { fetchProductCards } from '../lib/products'
import { type ProductCardData } from '../components/ProductCard'
import { CoverflowCarousel } from '../components/ui/coverflow-carousel'
import { formatInr, discountedPrice } from '../lib/pricing'
import logo from '../assets/logo.png.png'

type HomeContent = {
  section: string
  text_content: string | null
  media_url: string | null
  media_type: 'image' | 'video' | null
  link_url: string | null
  starts_at: string | null
  ends_at: string | null
}

export default function Home() {
  const navigate = useNavigate()
  const [content, setContent] = useState<Record<string, HomeContent>>({})
  const [featured, setFeatured] = useState<ProductCardData[]>([])

  const carouselCards = useMemo(() => {
    return featured.map((product) => ({
      src: product.image_url || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400&h=700&fit=crop',
      alt: product.name,
      title: product.name,
      subtitle: formatInr(discountedPrice(product.price, product.discount_percent))
    }))
  }, [featured])

  useEffect(() => {
    supabase
      .from('home_content')
      .select('section, text_content, media_url, media_type, link_url, starts_at, ends_at')
      .eq('is_active', true)
      .then(({ data }) => {
        const map: Record<string, HomeContent> = {}
        for (const row of data ?? []) map[row.section] = row
        setContent(map)
      })

    fetchProductCards({ featuredOnly: true, limit: 8 })
      .then(setFeatured)
      .catch((err) => console.error('Failed to load featured products:', err))
  }, [])

  const offerStrip = content['offer_strip']
  const followTheGlow = content['follow_the_glow']

  const now = Date.now()
  const offerStripLive =
    offerStrip?.text_content &&
    (!offerStrip.starts_at || new Date(offerStrip.starts_at).getTime() <= now) &&
    (!offerStrip.ends_at || new Date(offerStrip.ends_at).getTime() >= now)

  return (
    <div>
      {offerStripLive && (
        <section className="bg-gradient-to-r from-gold/15 via-gold/25 to-gold/15 text-center py-2.5 text-sm text-charcoal flex items-center justify-center gap-3">
          {offerStrip!.media_url && (
            <img src={offerStrip!.media_url} alt="" className="h-6 w-6 object-cover rounded-full shadow-sm" />
          )}
          {offerStrip!.text_content}
        </section>
      )}

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 py-10 md:py-16 grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">
        <div>
          <p className="eyebrow mb-4 uppercase tracking-[0.25em] text-gold-dark font-medium">The Aura of Elegance</p>
          <h1 className="font-logo text-4xl md:text-5xl leading-[1.15] mb-5 relative z-10">
            Jewellery that <span className="italic text-gold-dark">tells your story.</span>
          </h1>
          <p className="text-charcoal/70 mb-8 max-w-md relative z-10">
            Fine craftsmanship, ethically sourced materials, and timeless design for every moment —
            welcome to Glimmora.
          </p>
          <div className="flex items-center gap-6 relative z-10">
            <Link
              to="/collections"
              className="bg-gold-dark text-ivory rounded-lg px-6 py-3 text-sm tracking-wide shadow-sm hover:shadow-md transition-shadow"
            >
              Explore Collections
            </Link>
            <Link
              to="/best-sellers"
              className="text-sm tracking-wide text-charcoal border-b border-charcoal/30 hover:border-gold-dark hover:text-gold-dark pb-0.5 transition-colors"
            >
              Best Sellers
            </Link>
          </div>
        </div>

        <div className="aspect-[4/5] md:aspect-square flex items-start justify-center relative overflow-visible -mt-4 md:-mt-12">
          <div className="flex flex-col items-center origin-top animate-swing-3d">
            <div className="w-0.5 h-16 md:h-24 bg-gradient-to-b from-transparent via-gold-dark/40 to-gold-dark/80"></div>
            <img
              src={logo}
              alt="Glimmora Logo"
              className="w-full max-w-[450px] object-contain drop-shadow-2xl -mt-4"
            />
          </div>
        </div>
      </section>

      {/* Brand Tagline Banner */}
      <section className="my-10 py-12 bg-ivory/80 border-y border-gold/15 text-center relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-6 relative z-10">
          <p className="text-[11px] uppercase tracking-[0.35em] text-gold-dark mb-2 font-medium">Glimmora Signature</p>
          <h2 className="font-logo text-3xl md:text-4xl text-charcoal italic tracking-wide">
            "The Aura of Elegance"
          </h2>
          <div className="w-16 h-[1px] bg-gold-dark/40 mx-auto mt-4" />
        </div>
      </section>

      {/* Featured products */}
      <section className="max-w-6xl mx-auto px-6 py-16 md:py-20">
        <div className="text-center mb-10">
          <p className="eyebrow mb-3">Curated Collection</p>
          <h2 className="font-logo text-3xl">Designed to be cherished</h2>
        </div>
        {featured.length === 0 ? (
          <p className="text-center text-charcoal/60">Nothing featured yet.</p>
        ) : (
          <CoverflowCarousel
            slides={carouselCards}
            showCaption
            showNavigation
            onSlideClick={(_, index) => {
              const product = featured[index]
              if (product) navigate(`/product/${product.slug}`)
            }}
          />
        )}
      </section>



      {/* Follow the Glow */}
      <section className="py-16 md:py-24 bg-ivory/60 border-t border-gold/15">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-8">
            <p className="eyebrow text-gold-dark mb-3 uppercase tracking-[0.25em] font-medium">Join the Community</p>
            <h2 className="font-logo text-3xl md:text-5xl mb-4">
              Follow the <span className="italic text-gold-dark">Glow</span>
            </h2>
            <p className="text-sm text-charcoal/70 max-w-md mx-auto">
              Real moments in Glimmora, styled by you — tag us <span className="text-gold-dark font-medium">@glimmora.in</span> to be featured.
            </p>
          </div>

          <div className="text-center">
            <a
              href={followTheGlow?.link_url ?? 'https://instagram.com/glimmora.in'}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-gold-dark text-ivory px-7 py-3 text-sm tracking-wide shadow-sm hover:bg-gold-dark/90 hover:shadow-md transition-all duration-300"
            >
              <AtSign size={16} strokeWidth={2} />
              Follow @glimmora.in
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
