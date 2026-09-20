import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { searchProducts } from '../lib/products'
import ProductCard, { type ProductCardData } from '../components/ProductCard'

export default function Search() {
  const [searchParams] = useSearchParams()
  const query = searchParams.get('q') ?? ''

  const [products, setProducts] = useState<ProductCardData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    searchProducts(query)
      .then(setProducts)
      .catch((err) => console.error('Search failed:', err))
      .finally(() => setLoading(false))
  }, [query])

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <p className="eyebrow mb-2">Search Results</p>
      <h1 className="font-logo text-3xl mb-10">
        {query ? `“${query}”` : 'Search'}
      </h1>

      {loading ? (
        <p className="text-charcoal/60">Loading…</p>
      ) : products.length === 0 ? (
        <p className="text-charcoal/60">
          {query ? `No products found for "${query}".` : 'Type something to search.'}
        </p>
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
