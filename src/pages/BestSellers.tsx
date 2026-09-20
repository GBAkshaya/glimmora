import { useEffect, useState } from 'react'
import { fetchProductCards } from '../lib/products'
import ProductCard, { type ProductCardData } from '../components/ProductCard'

export default function BestSellers() {
  const [products, setProducts] = useState<ProductCardData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProductCards({ featuredOnly: true })
      .then(setProducts)
      .catch((err) => console.error('Failed to load products:', err))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="text-center mb-10">
        <p className="eyebrow mb-2">Most Loved</p>
        <h1 className="font-logo text-3xl">Best Sellers</h1>
      </div>

      {loading ? (
        <p className="text-charcoal/60">Loading…</p>
      ) : products.length === 0 ? (
        <p className="text-charcoal/60">No featured products yet.</p>
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
