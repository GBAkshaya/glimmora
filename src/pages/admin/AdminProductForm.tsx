import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { ArrowLeft, X } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import type { Category, ProductImage, ProductSection } from '../../lib/types'

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export default function AdminProductForm() {
  const { id } = useParams()
  const isNew = !id || id === 'new'
  const navigate = useNavigate()

  const [categories, setCategories] = useState<Category[]>([])
  const [images, setImages] = useState<ProductImage[]>([])
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [slugTouched, setSlugTouched] = useState(!isNew)

  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [discountPercent, setDiscountPercent] = useState('0')
  const [categoryId, setCategoryId] = useState('')
  const [productCode, setProductCode] = useState<string | null>(null)
  const [section, setSection] = useState<ProductSection>('casual')
  const [stockCount, setStockCount] = useState('0')
  const [isFeatured, setIsFeatured] = useState(false)
  const [isActive, setIsActive] = useState(true)

  useEffect(() => {
    supabase
      .from('categories')
      .select('*')
      .order('sort_order')
      .then(({ data }) => setCategories(data ?? []))
  }, [])

  useEffect(() => {
    if (isNew) return
    async function loadProduct() {
      const [{ data: product }, { data: productImages }] = await Promise.all([
        supabase.from('products').select('*').eq('id', id).single(),
        supabase.from('product_images').select('*').eq('product_id', id).order('sort_order'),
      ])
      if (product) {
        setName(product.name)
        setSlug(product.slug)
        setDescription(product.description ?? '')
        setPrice(String(product.price))
        setDiscountPercent(String(product.discount_percent))
        setCategoryId(product.category_id)
        setProductCode(product.product_code)
        setSection(product.section)
        setStockCount(String(product.stock_count))
        setIsFeatured(product.is_featured)
        setIsActive(product.is_active)
      }
      setImages(productImages ?? [])
      setLoading(false)
    }
    loadProduct()
  }, [id, isNew])

  function handleNameChange(value: string) {
    setName(value)
    if (!slugTouched) setSlug(slugify(value))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSaving(true)

    const payload = {
      name,
      slug,
      description: description || null,
      price: Number(price),
      discount_percent: Number(discountPercent),
      category_id: categoryId,
      section,
      stock_count: Number(stockCount),
      is_featured: isFeatured,
      is_active: isActive,
    }

    if (isNew) {
      const { data, error } = await supabase.from('products').insert(payload).select('id').single()
      setSaving(false)
      if (error || !data) {
        setError(error?.message ?? 'Failed to create product')
        return
      }
      navigate(`/admin/products/${data.id}`, { replace: true })
    } else {
      const { error } = await supabase.from('products').update(payload).eq('id', id)
      setSaving(false)
      if (error) {
        setError(error.message)
        return
      }
      navigate('/admin')
    }
  }

  async function handleImageUpload(files: FileList | null) {
    if (!files || files.length === 0 || isNew) return
    setError(null)

    for (const file of Array.from(files)) {
      const path = `${id}/${crypto.randomUUID()}-${file.name}`
      const { error: uploadError } = await supabase.storage.from('product-images').upload(path, file)
      if (uploadError) {
        setError(uploadError.message)
        continue
      }
      const {
        data: { publicUrl },
      } = supabase.storage.from('product-images').getPublicUrl(path)

      const { error: insertError } = await supabase.from('product_images').insert({
        product_id: id,
        image_url: publicUrl,
        sort_order: images.length,
      })
      if (insertError) {
        setError(insertError.message)
      }
    }

    const { data: refreshed } = await supabase
      .from('product_images')
      .select('*')
      .eq('product_id', id)
      .order('sort_order')
    setImages(refreshed ?? [])
  }

  async function handleImageDelete(image: ProductImage) {
    if (!confirm('Remove this image?')) return
    const { error } = await supabase.from('product_images').delete().eq('id', image.id)
    if (error) {
      alert(`Could not delete image: ${error.message}`)
      return
    }
    if (image.image_url.startsWith('https')) {
      const path = image.image_url.split('/').pop()
      if (path) supabase.storage.from('product-images').remove([path])
    }
    setImages(prev => prev.filter(i => i.id !== image.id))
  }

  if (loading) return <div className="max-w-2xl mx-auto text-charcoal/60">Loading…</div>

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-logo text-3xl">{isNew ? 'Add Product' : 'Edit Product'}</h1>
          <p className="text-xs text-charcoal/50 font-mono mt-1">
            {isNew ? 'Code: generated after saving' : `Code: ${productCode ?? '—'}`}
          </p>
        </div>
        <Link
          to="/admin"
          className="flex items-center gap-1.5 text-gold-dark text-sm hover:underline"
        >
          <ArrowLeft size={15} />
          Back to dashboard
        </Link>
      </div>

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-2xl bg-ivory shadow-sm p-6">
        <label className="flex flex-col gap-1 text-sm">
          Name
          <input
            type="text"
            required
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            className="border border-gold/30 rounded-lg px-3 py-2"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Slug
          <input
            type="text"
            required
            value={slug}
            onChange={(e) => {
              setSlugTouched(true)
              setSlug(e.target.value)
            }}
            className="border border-gold/30 rounded-lg px-3 py-2"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Description
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="border border-gold/30 rounded-lg px-3 py-2"
            rows={4}
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Category
          <select
            required
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="border border-gold/30 rounded-lg px-3 py-2"
          >
            <option value="" disabled>
              Select a category
            </option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Section
          <select
            value={section}
            onChange={(e) => setSection(e.target.value as ProductSection)}
            className="border border-gold/30 rounded-lg px-3 py-2"
          >
            <option value="casual">Casuals</option>
            <option value="ethnic">Ethnic</option>
          </select>
        </label>

        <div className="flex gap-4">
          <label className="flex flex-col gap-1 text-sm flex-1">
            Price (₹)
            <input
              type="number"
              required
              min="0"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="border border-gold/30 rounded-lg px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm flex-1">
            Discount (%)
            <input
              type="number"
              min="0"
              max="100"
              value={discountPercent}
              onChange={(e) => setDiscountPercent(e.target.value)}
              className="border border-gold/30 rounded-lg px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm flex-1">
            Stock count
            <input
              type="number"
              min="0"
              value={stockCount}
              onChange={(e) => setStockCount(e.target.value)}
              className="border border-gold/30 rounded-lg px-3 py-2"
            />
          </label>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={isFeatured}
            onChange={(e) => setIsFeatured(e.target.checked)}
            className="accent-gold-dark w-4 h-4"
          />
          Show in Featured Products (homepage)
        </label>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="accent-gold-dark w-4 h-4"
          />
          Active (visible to customers)
        </label>

        <button
          type="submit"
          disabled={saving}
          className="bg-gold-dark text-ivory rounded-lg px-4 py-2 shadow-sm hover:shadow-md transition-shadow disabled:opacity-50 disabled:shadow-none"
        >
          {saving ? 'Saving…' : isNew ? 'Create product' : 'Save changes'}
        </button>
      </form>

      <div className="mt-8 rounded-2xl bg-ivory shadow-sm p-6">
        <h2 className="text-lg font-medium mb-3">Images</h2>
        {isNew ? (
          <p className="text-sm text-charcoal/60">Save the product first, then add images here.</p>
        ) : (
          <>
            <div className="flex flex-wrap gap-3 mb-4">
              {images.map((image) => (
                <div key={image.id} className="relative">
                  <img src={image.image_url} alt="" className="w-24 h-24 object-cover rounded-lg shadow-sm" />
                  <button
                    onClick={() => handleImageDelete(image)}
                    className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center shadow-sm"
                    type="button"
                    aria-label="Remove image"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => handleImageUpload(e.target.files)}
              className="text-sm text-charcoal/60 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-gold-dark file:text-ivory file:text-sm file:cursor-pointer hover:file:opacity-90 cursor-pointer"
            />
          </>
        )}
      </div>
    </div>
  )
}
