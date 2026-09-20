import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Star, Heart, Check } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { discountedPrice, formatInr } from '../lib/pricing'
import { useCart } from '../lib/CartContext'
import { useAuth } from '../lib/AuthContext'
import { useWishlist } from '../lib/WishlistContext'
import type { Product, ProductImage } from '../lib/types'

type Review = {
  id: string
  customer_id: string
  customer_name: string
  rating: number
  comment: string | null
  created_at: string
}

export default function ProductDetail() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { addToCart } = useCart()
  const { customer } = useAuth()
  const { isWishlisted, toggleWishlist } = useWishlist()
  const [product, setProduct] = useState<Product | null>(null)
  const [images, setImages] = useState<ProductImage[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [activeImage, setActiveImage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [addedToCart, setAddedToCart] = useState(false)
  const [zoomStyle, setZoomStyle] = useState<{ backgroundPosition: string } | null>(null)
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewComment, setReviewComment] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)
  const [reviewError, setReviewError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const { data: productData } = await supabase
        .from('products')
        .select('*')
        .eq('slug', slug)
        .maybeSingle()

      if (!productData) {
        setProduct(null)
        setLoading(false)
        return
      }

      setProduct(productData)

      const [{ data: imageData, error: imageError }, { data: reviewData, error: reviewErr }] = await Promise.all([
        supabase
          .from('product_images')
          .select('*')
          .eq('product_id', productData.id)
          .order('sort_order'),
        supabase
          .from('reviews')
          .select('id, customer_id, customer_name, rating, comment, created_at')
          .eq('product_id', productData.id)
          .order('created_at', { ascending: false }),
      ])
      if (imageError) console.error('Failed to load product images:', imageError)
      if (reviewErr) console.error('Failed to load reviews:', reviewErr)
      setImages(imageData ?? [])
      setReviews(reviewData ?? [])
      setActiveImage(0)
      setLoading(false)
    }
    load()
  }, [slug])

  async function handleSubmitReview() {
    if (!product || !customer) return
    setReviewError(null)
    setSubmittingReview(true)

    const { error } = await supabase.from('reviews').insert({
      product_id: product.id,
      customer_id: customer.id,
      customer_name: customer.name,
      rating: reviewRating,
      comment: reviewComment || null,
    })

    setSubmittingReview(false)
    if (error) {
      setReviewError(error.code === '23505' ? "You've already reviewed this product." : error.message)
      return
    }

    const { data: reviewData } = await supabase
      .from('reviews')
      .select('id, customer_id, customer_name, rating, comment, created_at')
      .eq('product_id', product.id)
      .order('created_at', { ascending: false })
    setReviews(reviewData ?? [])
    setReviewComment('')
    setReviewRating(5)
  }

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setZoomStyle({ backgroundPosition: `${x}% ${y}%` })
  }

  if (loading) return <div className="max-w-6xl mx-auto px-6 py-12">Loading…</div>
  if (!product) return <div className="max-w-6xl mx-auto px-6 py-12">Product not found.</div>

  const outOfStock = product.stock_count <= 0
  const hasDiscount = product.discount_percent > 0
  const currentImage = images[activeImage]
  const averageRating = reviews.length
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : null

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-2 gap-12">
      <div>
        <div
          className="aspect-square bg-ivory overflow-hidden cursor-zoom-in bg-no-repeat bg-cover rounded-2xl shadow-md"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setZoomStyle(null)}
          style={
            currentImage && zoomStyle
              ? { backgroundImage: `url(${currentImage.image_url})`, backgroundSize: '200%', ...zoomStyle }
              : undefined
          }
        >
          {currentImage && !zoomStyle && (
            <img src={currentImage.image_url} alt={product.name} className="w-full h-full object-contain" />
          )}
        </div>
        {images.length > 1 && (
          <div className="flex gap-3 mt-4">
            {images.map((image, i) => (
              <button
                key={image.id}
                onClick={() => setActiveImage(i)}
                className={`w-16 h-16 overflow-hidden rounded-lg border-2 transition-colors ${
                  i === activeImage ? 'border-gold-dark' : 'border-transparent hover:border-gold/40'
                }`}
              >
                <img src={image.image_url} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        <h1 className="font-logo text-3xl mb-2">{product.name}</h1>

        {averageRating !== null && (
          <p className="flex items-center gap-1 text-sm text-charcoal/60 mb-4">
            <Star size={14} className="fill-gold-dark text-gold-dark" />
            {averageRating.toFixed(1)} ({reviews.length} review{reviews.length !== 1 ? 's' : ''})
          </p>
        )}

        <p className="text-xl mb-4">
          {hasDiscount ? (
            <>
              <span className="text-gold-dark font-medium">
                {formatInr(discountedPrice(product.price, product.discount_percent))}
              </span>
              <span className="text-charcoal/40 line-through ml-3">{formatInr(product.price)}</span>
            </>
          ) : (
            formatInr(product.price)
          )}
        </p>

        <p className={`text-sm mb-6 ${outOfStock ? 'text-red-600' : 'text-charcoal/70'}`}>
          {outOfStock ? 'Out of stock' : `${product.stock_count} in stock`}
        </p>

        {product.description && <p className="text-charcoal/80 mb-8">{product.description}</p>}

        <div className="flex gap-3 items-center">
          <button
            disabled={outOfStock}
            onClick={() => {
              addToCart(product.id)
              setAddedToCart(true)
              setTimeout(() => setAddedToCart(false), 1500)
            }}
            className="flex items-center gap-2 bg-gold-dark text-ivory rounded-lg px-6 py-3 shadow-sm hover:shadow-md transition-shadow disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
          >
            {addedToCart && <Check size={16} />}
            {outOfStock ? 'Out of stock' : addedToCart ? 'Added' : 'Add to Cart'}
          </button>

          <button
            onClick={() => (customer ? toggleWishlist(product.id) : navigate('/login'))}
            className="flex items-center gap-2 border border-gold/30 rounded-lg px-4 py-3 text-sm hover:bg-gold/5 transition-colors"
          >
            <Heart
              size={15}
              strokeWidth={1.75}
              className={isWishlisted(product.id) ? 'fill-gold-dark text-gold-dark' : 'text-charcoal'}
            />
            {isWishlisted(product.id) ? 'Wishlisted' : 'Add to Wishlist'}
          </button>
        </div>

        <div className="mt-12">
          <h2 className="text-lg font-medium mb-4">Reviews</h2>
          {reviews.length === 0 ? (
            <p className="text-sm text-charcoal/60">No reviews yet.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {reviews.map((review) => (
                <div key={review.id} className="rounded-xl bg-ivory shadow-sm p-4">
                  <p className="flex items-center gap-1.5 text-sm font-medium">
                    {review.customer_name}
                    <span className="flex items-center gap-0.5 text-gold-dark">
                      <Star size={12} className="fill-gold-dark" />
                      {review.rating}
                    </span>
                  </p>
                  {review.comment && <p className="text-sm text-charcoal/70 mt-1">{review.comment}</p>}
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-gold/10">
            {customer && reviews.some((r) => r.customer_id === customer.id) ? (
              <p className="text-sm text-charcoal/60">You've already reviewed this product.</p>
            ) : customer ? (
              <div className="flex flex-col gap-3 rounded-xl bg-ivory shadow-sm p-5">
                <label className="flex flex-col gap-1 text-sm">
                  Your rating
                  <select
                    value={reviewRating}
                    onChange={(e) => setReviewRating(Number(e.target.value))}
                    className="border border-gold/30 rounded-lg px-3 py-2 w-24"
                  >
                    {[5, 4, 3, 2, 1].map((n) => (
                      <option key={n} value={n}>
                        {n} ★
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  Comment (optional)
                  <textarea
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    className="border border-gold/30 rounded-lg px-3 py-2"
                    rows={3}
                  />
                </label>
                {reviewError && <p className="text-red-600 text-sm">{reviewError}</p>}
                <button
                  onClick={handleSubmitReview}
                  disabled={submittingReview}
                  className="bg-gold-dark text-ivory rounded-lg px-4 py-2 text-sm self-start shadow-sm hover:shadow-md transition-shadow disabled:opacity-50"
                >
                  {submittingReview ? 'Submitting…' : 'Submit Review'}
                </button>
              </div>
            ) : (
              <p className="text-sm text-charcoal/60">
                <button onClick={() => navigate('/login')} className="text-gold-dark underline">
                  Log in
                </button>{' '}
                to leave a review.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
