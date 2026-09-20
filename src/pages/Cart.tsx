import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Minus, Plus, X, ShoppingBag } from 'lucide-react'
import { useCart } from '../lib/CartContext'
import { useAuth } from '../lib/AuthContext'
import { fetchProductsByIds } from '../lib/products'
import { discountedPrice, formatInr, GIFT_WRAP_FEE } from '../lib/pricing'
import type { ProductCardData } from '../components/ProductCard'

export default function Cart() {
  const { items, giftWrap, setQuantity, removeFromCart, toggleGiftWrap } = useCart()
  const { customer } = useAuth()
  const navigate = useNavigate()
  const [products, setProducts] = useState<ProductCardData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (items.length === 0) {
      setProducts([])
      setLoading(false)
      return
    }

    let isMounted = true
    setLoading(true)

    fetchProductsByIds(items.map((item) => item.productId))
      .then((fetchedProducts) => {
        if (!isMounted) return
        setProducts(fetchedProducts)

        // Prune stale or deleted product IDs from cart so Navbar badge and Cart remain in sync
        const validIds = new Set(fetchedProducts.map((p) => p.id))
        const staleItems = items.filter((item) => !validIds.has(item.productId))
        if (staleItems.length > 0) {
          staleItems.forEach((staleItem) => removeFromCart(staleItem.productId))
        }
      })
      .catch((err) => {
        console.error('Error fetching cart products:', err)
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [items, removeFromCart])

  const lines = items
    .map((item) => ({ item, product: products.find((p) => p.id === item.productId) }))
    .filter((line) => line.product)

  const subtotal = lines.reduce(
    (sum, line) =>
      sum + discountedPrice(line.product!.price, line.product!.discount_percent) * line.item.quantity,
    0,
  )
  const total = subtotal + (giftWrap ? GIFT_WRAP_FEE : 0)

  function handleCheckout() {
    navigate(customer ? '/checkout' : '/login')
  }

  if (loading) return <div className="max-w-4xl mx-auto px-6 py-12">Loading…</div>

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="font-logo text-3xl mb-8">Your Cart</h1>

      {lines.length === 0 ? (
        <div className="text-center py-16">
          <ShoppingBag size={32} strokeWidth={1.25} className="mx-auto mb-4 text-charcoal/30" />
          <p className="text-charcoal/60 mb-4">Your cart is empty.</p>
          <Link
            to="/collections"
            className="inline-block rounded-full border border-gold/30 text-gold-dark px-6 py-2.5 text-sm hover:bg-gold/5 transition-colors"
          >
            Browse Collections
          </Link>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-4">
            {lines.map(({ item, product }) => (
              <div
                key={item.productId}
                className="flex gap-4 items-center rounded-xl bg-ivory shadow-sm p-4"
              >
                <div className="w-20 h-20 bg-white rounded-lg shrink-0 overflow-hidden">
                  {product!.image_url && (
                    <img src={product!.image_url} alt="" className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="flex-1">
                  <Link to={`/product/${product!.slug}`} className="text-sm hover:text-gold-dark">
                    {product!.name}
                  </Link>
                  <p className="text-sm text-charcoal/60 mt-1">
                    {formatInr(discountedPrice(product!.price, product!.discount_percent))}
                  </p>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setQuantity(item.productId, item.quantity - 1)}
                      className="w-7 h-7 flex items-center justify-center border border-gold/30 rounded-full hover:bg-gold/10 transition-colors"
                    >
                      <Minus size={13} />
                    </button>
                    <span className="w-6 text-center text-sm">{item.quantity}</span>
                    <button
                      onClick={() => setQuantity(item.productId, item.quantity + 1)}
                      disabled={item.quantity >= product!.stock_count}
                      className="w-7 h-7 flex items-center justify-center border border-gold/30 rounded-full hover:bg-gold/10 transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                    >
                      <Plus size={13} />
                    </button>
                  </div>
                  {item.quantity >= product!.stock_count && (
                    <span className="text-[10px] text-charcoal/50">Max stock</span>
                  )}
                </div>
                <button
                  onClick={() => removeFromCart(item.productId)}
                  aria-label="Remove"
                  className="w-7 h-7 flex items-center justify-center text-charcoal/40 hover:text-red-600 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>

          <label className="flex items-center gap-2 text-sm mt-8">
            <input type="checkbox" checked={giftWrap} onChange={toggleGiftWrap} className="rounded" />
            Add gift wrapping (+{formatInr(GIFT_WRAP_FEE)})
          </label>

          <div className="mt-6 flex flex-col items-end gap-1">
            <p className="text-sm text-charcoal/60">Subtotal: {formatInr(subtotal)}</p>
            {giftWrap && <p className="text-sm text-charcoal/60">Gift wrap: {formatInr(GIFT_WRAP_FEE)}</p>}
            <p className="text-lg font-medium">Total: {formatInr(total)}</p>
          </div>

          <div className="flex justify-end mt-6">
            <button
              onClick={handleCheckout}
              className="bg-gold-dark text-ivory rounded-lg px-6 py-3 shadow-sm hover:shadow-md transition-shadow"
            >
              Proceed to Checkout
            </button>
          </div>
        </>
      )}
    </div>
  )
}
