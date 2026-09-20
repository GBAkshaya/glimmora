import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Boxes, CheckCircle2, Star, AlertTriangle, Pencil, Trash2 } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import type { Product, Category } from '../../lib/types'

export default function AdminDashboard() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  async function loadData() {
    setLoading(true)
    const [{ data: productsData }, { data: categoriesData }] = await Promise.all([
      supabase.from('products').select('*').order('created_at', { ascending: false }),
      supabase.from('categories').select('*'),
    ])
    setProducts(productsData ?? [])
    setCategories(categoriesData ?? [])
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  function categoryName(categoryId: string) {
    return categories.find((c) => c.id === categoryId)?.name ?? '—'
  }

  async function handleDelete(product: Product) {
    if (!confirm(`Delete "${product.name}"? This can't be undone.`)) return

    const { data: cancelledItems, error: lookupError } = await supabase
      .from('order_items')
      .select('id, orders!inner(status)')
      .eq('product_id', product.id)
      .eq('orders.status', 'Cancelled')
    if (lookupError) {
      console.error('Failed to look up cancelled order items:', lookupError)
    }

    if (cancelledItems && cancelledItems.length > 0) {
      const { error: cleanupError } = await supabase
        .from('order_items')
        .delete()
        .in('id', cancelledItems.map((i) => i.id))
      if (cleanupError) {
        console.error('Failed to clean up cancelled order items:', cleanupError)
      }
    }

    const { error } = await supabase.from('products').delete().eq('id', product.id)
    if (error) {
      alert(`Could not delete product: ${error.message}`)
    } else {
      loadData()
    }
  }

  const stats = [
    { label: 'Total Products', value: products.length, icon: Boxes },
    { label: 'Active', value: products.filter((p) => p.is_active).length, icon: CheckCircle2 },
    { label: 'Featured', value: products.filter((p) => p.is_featured).length, icon: Star },
    { label: 'Out of Stock', value: products.filter((p) => p.stock_count <= 0).length, icon: AlertTriangle },
  ]

  return (
    <div className="max-w-6xl mx-auto">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-xl bg-ivory shadow-sm p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center shrink-0">
              <Icon size={18} strokeWidth={1.75} className="text-gold-dark" />
            </div>
            <div>
              <p className="text-xl font-medium leading-none">{value}</p>
              <p className="text-xs text-charcoal/50 mt-1">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium">All Products</h2>
        <Link
          to="/admin/products/new"
          className="bg-gold-dark text-ivory rounded-lg px-4 py-2 text-sm shadow-sm hover:shadow-md transition-shadow"
        >
          + Add Product
        </Link>
      </div>

      {loading ? (
        <p className="text-charcoal/60">Loading…</p>
      ) : (
        <table className="w-full text-left text-sm border-collapse rounded-2xl bg-ivory shadow-sm overflow-hidden">
          <thead>
            <tr className="border-b border-gold/20">
              <th className="py-3 px-4">Code</th>
              <th className="py-3 px-4">Name</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Section</th>
              <th className="py-3 px-4">Price</th>
              <th className="py-3 px-4">Stock</th>
              <th className="py-3 px-4">Featured</th>
              <th className="py-3 px-4">Active</th>
              <th className="py-3 px-4"></th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} className="border-b border-gold/10 hover:bg-gold/5 transition-colors">
                <td className="py-3 px-4 text-charcoal/50 font-mono text-xs">{product.product_code ?? '—'}</td>
                <td className="py-3 px-4">{product.name}</td>
                <td className="py-3 px-4">{categoryName(product.category_id)}</td>
                <td className="py-3 px-4 capitalize">{product.section}</td>
                <td className="py-3 px-4">
                  ₹{product.price}
                  {product.discount_percent > 0 && (
                    <span className="text-gold-dark ml-1">-{product.discount_percent}%</span>
                  )}
                </td>
                <td className="py-3 px-4">{product.stock_count}</td>
                <td className="py-3 px-4">
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                      product.is_featured ? 'bg-gold/15 text-gold-dark' : 'bg-charcoal/5 text-charcoal/40'
                    }`}
                  >
                    {product.is_featured ? 'Yes' : 'No'}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                      product.is_active ? 'bg-green-100 text-green-700' : 'bg-charcoal/5 text-charcoal/40'
                    }`}
                  >
                    {product.is_active ? 'Yes' : 'No'}
                  </span>
                </td>
                <td className="py-3 px-4 text-right">
                  <div className="flex justify-end gap-1">
                    <Link
                      to={`/admin/products/${product.id}`}
                      aria-label="Edit"
                      className="p-1.5 rounded-lg text-gold-dark hover:bg-gold/10 transition-colors"
                    >
                      <Pencil size={15} strokeWidth={1.75} />
                    </Link>
                    <button
                      onClick={() => handleDelete(product)}
                      aria-label="Delete"
                      className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 size={15} strokeWidth={1.75} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan={9} className="py-6 px-4 text-center text-charcoal/60">
                  No products yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  )
}
