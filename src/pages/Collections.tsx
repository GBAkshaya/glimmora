import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { fetchProductCards } from '../lib/products'
import ProductCard, { type ProductCardData } from '../components/ProductCard'
import type { Category } from '../lib/types'

export default function Collections() {
  const { categorySlug } = useParams()
  const navigate = useNavigate()

  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<ProductCardData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('categories')
      .select('*')
      .order('sort_order')
      .then(({ data }) => setCategories(data ?? []))
  }, [])

  useEffect(() => {
    setLoading(true)
    const category = categories.find((c) => c.slug === categorySlug)

    if (categorySlug && !category && categories.length > 0) {
      // unknown category slug — nothing to filter on
      setProducts([])
      setLoading(false)
      return
    }

    fetchProductCards({ categoryId: category?.id })
      .then(setProducts)
      .catch((err) => console.error('Failed to load products:', err))
      .finally(() => setLoading(false))
  }, [categorySlug, categories])

  const activeCategory = categories.find((c) => c.slug === categorySlug)

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="flex items-end justify-between mb-10">
        <div>
          <p className="eyebrow mb-2">Shop the Range</p>
          <h1 className="font-logo text-3xl">{activeCategory ? activeCategory.name : 'All Collections'}</h1>
        </div>

        <select
          value={categorySlug ?? ''}
          onChange={(e) => navigate(e.target.value ? `/collections/${e.target.value}` : '/collections')}
          className="border border-gold/30 rounded-lg px-3 py-2 text-sm bg-ivory shadow-sm"
        >
          <option value="">All categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.slug}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="text-charcoal/60">Loading…</p>
      ) : products.length === 0 ? (
        <p className="text-charcoal/60">No products found.</p>
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
