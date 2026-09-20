import { Link, useNavigate } from 'react-router-dom'
import { Heart } from 'lucide-react'
import { discountedPrice, formatInr } from '../lib/pricing'
import { useAuth } from '../lib/AuthContext'
import { useWishlist } from '../lib/WishlistContext'
import type { Product } from '../lib/types'

export type ProductCardData = Product & { image_url?: string }

export default function ProductCard({ product }: { product: ProductCardData }) {
  const { customer } = useAuth()
  const { isWishlisted, toggleWishlist } = useWishlist()
  const navigate = useNavigate()

  const outOfStock = product.stock_count <= 0
  const hasDiscount = product.discount_percent > 0
  const wishlisted = isWishlisted(product.id)

  function handleWishlistClick(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (!customer) {
      navigate('/login')
      return
    }
    toggleWishlist(product.id)
  }

  return (
    <Link to={`/product/${product.slug}`} className="block group">
      <div className="aspect-square bg-ivory overflow-hidden relative rounded-xl border border-gold/10 group-hover:border-gold/30 transition-colors duration-200">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-charcoal/30 text-sm">
            No image
          </div>
        )}
        {outOfStock && (
          <span className="absolute top-3 left-3 bg-charcoal/80 text-ivory text-xs px-2.5 py-1 rounded-full">
            Out of stock
          </span>
        )}
        <button
          onClick={handleWishlistClick}
          aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-ivory/90 shadow-sm flex items-center justify-center hover:scale-110 transition-transform"
        >
          <Heart size={15} strokeWidth={1.75} className={wishlisted ? 'fill-gold-dark text-gold-dark' : 'text-charcoal'} />
        </button>
      </div>
      <div className="pt-4">
        <p className="text-sm text-charcoal">{product.name}</p>
        <p className="text-sm mt-1.5">
          {hasDiscount ? (
            <>
              <span className="text-gold-dark font-medium">
                {formatInr(discountedPrice(product.price, product.discount_percent))}
              </span>
              <span className="text-charcoal/40 line-through ml-2">{formatInr(product.price)}</span>
            </>
          ) : (
            <span className="text-charcoal">{formatInr(product.price)}</span>
          )}
        </p>
      </div>
    </Link>
  )
}
