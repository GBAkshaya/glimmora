import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Heart } from 'lucide-react'
import { useAuth } from '../lib/AuthContext'
import { useWishlist } from '../lib/WishlistContext'
import { fetchProductsByIds } from '../lib/products'
import ProductCard, { type ProductCardData } from '../components/ProductCard'

export default function Wishlist() {
  const { customer, loading: authLoading } = useAuth()
  const { productIds } = useWishlist()
  const [products, setProducts] = useState<ProductCardData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProductsByIds(Array.from(productIds))
      .then(setProducts)
      .catch((err) => console.error('Failed to load wishlist products:', err))
      .finally(() => setLoading(false))
  }, [productIds])

  if (authLoading) return null

  if (!customer) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-16 text-center">
        <h1 className="font-logo text-3xl mb-4">Your Wishlist</h1>
        <p className="text-charcoal/60 mb-4">Log in to see your saved items.</p>
        <Link
          to="/login"
          className="inline-block rounded-full bg-gold-dark text-ivory px-6 py-2.5 text-sm shadow-sm hover:shadow-md transition-shadow"
        >
          Log in
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <h1 className="font-logo text-3xl mb-8">Your Wishlist</h1>

      {loading ? (
        <p className="text-charcoal/60">Loading…</p>
      ) : products.length === 0 ? (
        <div className="text-center py-16">
          <Heart size={32} strokeWidth={1.25} className="mx-auto mb-4 text-charcoal/30" />
          <p className="text-charcoal/60 mb-4">Nothing saved yet.</p>
          <Link
            to="/collections"
            className="inline-block rounded-full border border-gold/30 text-gold-dark px-6 py-2.5 text-sm hover:bg-gold/5 transition-colors"
          >
            Browse Collections
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-10">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  )
}
