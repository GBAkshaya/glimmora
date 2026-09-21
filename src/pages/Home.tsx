import { useEffect, useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AtSign, Play } from 'lucide-react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { supabase } from '../lib/supabaseClient'
import { fetchProductCards } from '../lib/products'
import { type ProductCardData } from '../components/ProductCard'
import { CoverflowCarousel } from '../components/ui/coverflow-carousel'
import ScrollStory from '../components/ScrollStory'
import Depth from '../components/Depth'
import MarqueeBand from '../components/MarqueeBand'
import CategoryTile, { type CategoryTileData } from '../components/CategoryTile'
import { formatInr, discountedPrice } from '../lib/pricing'

function getInstagramDetails(url?: string | null) {
  if (!url) return { isInsta: false, code: null, thumbUrl: null, type: 'other' }
  const match = url.match(/instagram\.com\/(p|reel|tv)\/([^/?#&]+)/i)
  if (match) {
    const type = match[1].toLowerCase()
    const code = match[2]
    return {
      isInsta: true,
      code,
      type,
      thumbUrl: `https://www.instagram.com/${type}/${code}/media/?size=l`,
    }
  }
  return { isInsta: false, code: null, thumbUrl: null, type: 'other' }
}

function isGlowVideo(url?: string | null) {
  if (!url) return false
  const lower = url.toLowerCase()
  return (
    lower.endsWith('.mp4') ||
    lower.endsWith('.webm') ||
    lower.endsWith('.mov') ||
    lower.includes('/video/') ||
    lower.includes('video=true') ||
    lower.includes('format=mp4')
  )
}

type HomeContent = {
  section: string
  text_content: string | null
  media_url: string | null
  media_type: 'image' | 'video' | null
  link_url: string | null
  starts_at: string | null
  ends_at: string | null
}

type GlowImage = {
  id: string
  image_url: string
  link_url: string | null
}

export default function Home() {
  const navigate = useNavigate()
  const [content, setContent] = useState<Record<string, HomeContent>>({})
  const [featured, setFeatured] = useState<ProductCardData[]>([])
  const [glowImages, setGlowImages] = useState<GlowImage[]>([])
  const [categories, setCategories] = useState<CategoryTileData[]>([])

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

    supabase
      .from('follow_glow_images')
      .select('id, image_url, link_url, is_active')
      .order('sort_order', { ascending: true })
      .then(
        ({ data, error }) => {
          if (!error && data) {
            setGlowImages(data.filter((item) => item.is_active !== false))
          }
        },
        () => {}
      )

    fetchProductCards({ featuredOnly: true, limit: 8 })
      .then(setFeatured)
      .catch((err) => console.error('Failed to load featured products:', err))

    // Category tiles: each shows its newest product's photo and how many pieces it holds.
    Promise.all([
      supabase.from('categories').select('id, name, slug').order('sort_order'),
      fetchProductCards({}),
    ])
      .then(([{ data: cats }, products]) => {
        setCategories(
          (cats ?? [])
            .map((c) => {
              const inCategory = products.filter((p) => p.category_id === c.id)
              return { ...c, count: inCategory.length, image: inCategory.find((p) => p.image_url)?.image_url }
            })
            .filter((c) => c.count > 0),
        )
      })
      .catch((err) => console.error('Failed to load categories:', err))
  }, [])

  // Sections below the pinned story change height as their data arrives, which
  // moves every scroll trigger after them; re-measure once they have.
  useEffect(() => {
    const id = requestAnimationFrame(() => ScrollTrigger.refresh())
    return () => cancelAnimationFrame(id)
  }, [featured.length, categories.length, glowImages.length])

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

      {/* Pinned, scroll-driven hero: the life of a piece, ending on the shop CTAs */}
      <ScrollStory />

      {/* Brand band: oversized type sliding with the scroll */}
      <MarqueeBand
        lines={[
          ['Glimmora', 'The Aura of Elegance'],
          ['Rings', 'Earrings', 'Pendants', 'Necklaces', 'Bracelets'],
        ]}
      />

      {/* Featured products */}
      <section className="max-w-6xl mx-auto px-6 py-16 md:py-24">
        <Depth watch={featured.length}>
          <div className="text-center mb-10">
            <p className="eyebrow mb-3">Curated Collection</p>
            <h2 className="font-logo text-4xl md:text-6xl">
              Designed to be <span className="italic text-gold-dark">cherished.</span>
            </h2>
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
        </Depth>
      </section>

      {/* Shop by category */}
      {categories.length > 0 && (
        <section className="max-w-6xl mx-auto px-6 py-16 md:py-24">
          <Depth watch={categories.length}>
            <div className="mb-10 flex flex-col items-center justify-between gap-4 text-center md:flex-row md:items-end md:text-left">
              <div>
                <p className="eyebrow mb-3">Explore</p>
                <h2 className="font-logo text-4xl md:text-6xl">
                  Shop by <span className="italic text-gold-dark">category.</span>
                </h2>
              </div>
              <Link
                to="/collections"
                className="text-sm tracking-wide text-charcoal border-b border-charcoal/30 hover:border-gold-dark hover:text-gold-dark pb-0.5 transition-colors"
              >
                View all collections
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-5 lg:grid-cols-5">
              {categories.map((c) => (
                <CategoryTile key={c.id} category={c} />
              ))}
            </div>
          </Depth>
        </section>
      )}

      {/* Follow the Glow */}
      <section className="py-16 md:py-24">
        <Depth watch={glowImages.length} exit={false} className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="eyebrow text-gold-dark mb-3 uppercase tracking-[0.25em] font-medium">Join the Community</p>
            <h2 className="font-logo text-4xl md:text-6xl mb-4">
              Follow the <span className="italic text-gold-dark">Glow</span>
            </h2>
            <p className="text-sm text-charcoal/70 max-w-md mx-auto">
              Real moments in Glimmora, styled by you — tag us <span className="text-gold-dark font-medium">@glimmora.in</span> to be featured.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-10">
            {(glowImages.length > 0
              ? glowImages
              : [
                { id: '1', image_url: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=800&auto=format&fit=crop', link_url: 'https://instagram.com/glimmora.in' },
                { id: '2', image_url: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?q=80&w=800&auto=format&fit=crop', link_url: 'https://instagram.com/glimmora.in' },
                { id: '3', image_url: 'https://images.unsplash.com/photo-1611591475140-4988844870f7?q=80&w=800&auto=format&fit=crop', link_url: 'https://instagram.com/glimmora.in' },
                { id: '4', image_url: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=80&w=800&auto=format&fit=crop', link_url: 'https://instagram.com/glimmora.in' },
              ]
            ).map((item, i) => {
              const instaMedia = getInstagramDetails(item.image_url)
              const instaLink = getInstagramDetails(item.link_url)
              const insta = instaMedia.isInsta ? instaMedia : instaLink

              const isDirectVid = isGlowVideo(item.image_url)
              const isInstaReel = insta.isInsta && (insta.type === 'reel' || insta.type === 'tv')
              const isVid = isDirectVid || isInstaReel

              const displayImg = isDirectVid
                ? item.image_url
                : insta.isInsta
                  ? insta.thumbUrl
                  : item.image_url

              const redirectUrl =
                item.link_url ||
                (insta.isInsta ? `https://www.instagram.com/${insta.type}/${insta.code}/` : followTheGlow?.link_url ?? 'https://instagram.com/glimmora.in')

              return (
                <a
                  key={item.id || i}
                  href={redirectUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="group relative block aspect-[4/5] overflow-hidden rounded-2xl border border-gold/15 bg-ivory shadow-sm transition-all duration-300 hover:shadow-md hover:border-gold/30"
                >
                  {insta.isInsta ? (
                    <iframe
                      src={`https://www.instagram.com/${insta.type}/${insta.code}/embed/`}
                      className="w-full h-full border-0 pointer-events-none object-cover scale-[1.25]"
                      scrolling="no"
                      title="Instagram Post"
                    />
                  ) : isDirectVid ? (
                    <video
                      src={item.image_url}
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <img
                      src={displayImg || 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=800&auto=format&fit=crop'}
                      alt="Glimmora Community"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=800&auto=format&fit=crop'
                      }}
                    />
                  )}

                  {isVid && (
                    <div className="absolute top-3 left-3 bg-black/50 backdrop-blur-md text-pearl text-[10px] tracking-wider uppercase px-2.5 py-1 rounded-full flex items-center gap-1 font-medium z-10 border border-white/10">
                      <Play size={10} fill="currentColor" /> Reel
                    </div>
                  )}

                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-ivory/90 text-gold-dark flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-md">
                      <AtSign size={18} strokeWidth={2} />
                    </div>
                  </div>
                </a>
              )
            })}
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
        </Depth>
      </section>
    </div>
  )
}
