import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { fetchProductCards } from '../lib/products'
import ProductCard, { type ProductCardData } from './ProductCard'
import SectionToggle from './SectionToggle'
import type { Category, ProductSection } from '../lib/types'

const THEME = {
  casual: {
    wrapper: 'bg-white',
    heading: 'text-charcoal',
  },
  ethnic: {
    wrapper: 'bg-gradient-to-b from-gold/15 to-cream',
    heading: 'text-gold-dark',
  },
} as const

export default function SectionCollection({ section }: { section: ProductSection }) {
  const [categories, setCategories] = useState<Category[]>([])
  const [categoryId, setCategoryId] = useState('')
  const [products, setProducts] = useState<ProductCardData[]>([])
  const [loading, setLoading] = useState(true)

  const theme = THEME[section]
  const title = section === 'casual' ? 'Casuals' : 'Ethnic'

  useEffect(() => {
    supabase
      .from('categories')
      .select('*')
      .order('sort_order')
      .then(({ data }) => setCategories(data ?? []))
  }, [])

  useEffect(() => {
    setLoading(true)
    fetchProductCards({ section, categoryId: categoryId || undefined })
      .then(setProducts)
      .catch((err) => console.error('Failed to load products:', err))
      .finally(() => setLoading(false))
  }, [section, categoryId])

  return (
    <div className={`${theme.wrapper} min-h-screen`}>
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex justify-center mb-8">
          <SectionToggle current={section} />
        </div>

        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="eyebrow mb-2">{section === 'casual' ? 'Everyday Wear' : 'Festive & Traditional'}</p>
            <h1 className={`font-logo text-3xl ${theme.heading}`}>{title}</h1>
          </div>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="border border-gold/30 rounded-lg px-3 py-2 text-sm bg-white/70 shadow-sm"
          >
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <p className="text-charcoal/60">Loading…</p>
        ) : products.length === 0 ? (
          <p className="text-charcoal/60">No products in {title} yet.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-10">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
