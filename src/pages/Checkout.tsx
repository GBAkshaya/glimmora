import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../lib/AuthContext'
import { useCart } from '../lib/CartContext'
import { fetchProductsByIds } from '../lib/products'
import { discountedPrice, formatInr, GIFT_WRAP_FEE } from '../lib/pricing'
import { ADMIN_WHATSAPP_NUMBER, buildWhatsAppLink } from '../lib/whatsapp'
import type { ProductCardData } from '../components/ProductCard'

export default function Checkout() {
  const navigate = useNavigate()
  const { customer, session, loading: authLoading } = useAuth()
  const { items, giftWrap, clearCart, removeFromCart } = useCart()

  const [products, setProducts] = useState<ProductCardData[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [couponCode, setCouponCode] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string
    discount_type: 'percent' | 'amount'
    discount_value: number
  } | null>(null)
  const [couponMessage, setCouponMessage] = useState<string | null>(null)
  const [checkingCoupon, setCheckingCoupon] = useState(false)

  const [fullName, setFullName] = useState('')
  const [addressLine1, setAddressLine1] = useState('')
  const [addressLine2, setAddressLine2] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [pincode, setPincode] = useState('')
  const [whatsappNumber, setWhatsappNumber] = useState('')

  useEffect(() => {
    if (!authLoading && !customer) navigate('/login')
  }, [authLoading, customer, navigate])

  useEffect(() => {
    if (customer) setWhatsappNumber(customer.whatsapp_number)
  }, [customer])

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

        const validIds = new Set(fetchedProducts.map((p) => p.id))
        const staleItems = items.filter((item) => !validIds.has(item.productId))
        if (staleItems.length > 0) {
          staleItems.forEach((staleItem) => removeFromCart(staleItem.productId))
        }
      })
      .catch((err) => {
        console.error('Failed to fetch checkout products:', err)
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
  const giftWrapFee = giftWrap ? GIFT_WRAP_FEE : 0
  const discountAmount = appliedCoupon
    ? appliedCoupon.discount_type === 'percent'
      ? subtotal * (appliedCoupon.discount_value / 100)
      : Math.min(appliedCoupon.discount_value, subtotal)
    : 0
  const total = subtotal - discountAmount + giftWrapFee

  async function handleApplyCoupon() {
    if (!couponCode.trim()) return
    setCheckingCoupon(true)
    setCouponMessage(null)
    const { data: rawData, error: rpcError } = await supabase
      .rpc('validate_coupon', { p_code: couponCode.trim().toUpperCase() })
      .single()
    setCheckingCoupon(false)

    const data = rawData as {
      valid: boolean
      discount_type: 'percent' | 'amount'
      discount_value: number
      message: string
    } | null

    if (rpcError || !data || !data.valid) {
      setAppliedCoupon(null)
      setCouponMessage(data?.message ?? rpcError?.message ?? 'Invalid coupon code')
      return
    }
    setAppliedCoupon({
      code: couponCode.trim().toUpperCase(),
      discount_type: data.discount_type,
      discount_value: data.discount_value,
    })
    setCouponMessage(data.message)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (lines.length === 0) {
      setError('Your cart is empty.')
      return
    }
    if (!ADMIN_WHATSAPP_NUMBER) {
      setError('Store WhatsApp number is not configured. Contact the site admin.')
      return
    }

    setSubmitting(true)

    const { data: orderData, error: rpcError } = await supabase
      .rpc('create_order', {
        p_shipping_address: {
          full_name: fullName,
          address_line1: addressLine1,
          address_line2: addressLine2,
          city,
          state,
          pincode,
        },
        p_whatsapp_number: whatsappNumber,
        p_gift_wrap: giftWrap,
        p_gift_wrap_fee: giftWrapFee,
        p_items: lines.map((line) => ({ product_id: line.item.productId, quantity: line.item.quantity })),
        p_coupon_code: appliedCoupon?.code ?? null,
      })
      .single()

    if (rpcError || !orderData) {
      setSubmitting(false)
      setError(rpcError?.message ?? 'Failed to place order')
      return
    }

    const { id: orderId, order_number: rawOrderNumber } = orderData as {
      id: string
      order_number: string | null
    }
    const orderNumber = rawOrderNumber ?? orderId.slice(0, 8)

    clearCart()

    // Automatic WhatsApp notification: PDF order summary to the store, QR + payment
    // reminder to the customer. Handled entirely server-side by the notify-order function.
    // Race against a timeout so an undeployed/slow function can't stall checkout —
    // falls back to the manual click-to-send flow below either way.
    const notifyResult = await Promise.race([
      supabase.functions.invoke('notify-order', { body: { order_id: orderId } }),
      new Promise<{ error: Error }>((resolve) =>
        setTimeout(() => resolve({ error: new Error('notify-order timed out') }), 6000),
      ),
    ])
    const notifyError = notifyResult.error

    if (notifyError) {
      // Automation not set up yet (or failed) — fall back to the manual click-to-send flow
      // so the admin still hears about the order.
      console.error('notify-order failed, falling back to manual WhatsApp link', notifyError)

      const orderItemsText = lines
        .map((line, i) => {
          const lineTotal =
            discountedPrice(line.product!.price, line.product!.discount_percent) * line.item.quantity
          return `${i + 1}. ${line.product!.product_code ?? '—'} - ${line.product!.name} x ${
            line.item.quantity
          } — ${formatInr(lineTotal)}`
        })
        .join('\n')

      const extraLines = [
        giftWrap ? `Gift wrap: ${formatInr(GIFT_WRAP_FEE)}` : null,
        appliedCoupon ? `Coupon ${appliedCoupon.code}: -${formatInr(discountAmount)}` : null,
      ].filter((line): line is string => line !== null)

      const message = [
        'Hello GLIMMORA! I would like to place an order.',
        '',
        '*Customer Details*',
        `Name: ${fullName}`,
        `Phone: ${whatsappNumber}`,
        `Email: ${session?.user.email ?? '—'}`,
        '',
        '*Delivery Address*',
        `${addressLine1},`,
        addressLine2 ? `${addressLine2}, ${city} - ${pincode}` : `${city} - ${pincode}`,
        '',
        `*Order ID: ${orderNumber}*`,
        '',
        '*Order Items*',
        orderItemsText,
        `Total: ${formatInr(subtotal)}`,
        ...(extraLines.length ? ['', ...extraLines] : []),
        '',
        `*Grand Total: ${formatInr(total)}*`,
        '',
        'Please confirm my order. Thank you!',
      ].join('\n')

      window.open(buildWhatsAppLink(ADMIN_WHATSAPP_NUMBER, message), '_blank')
    }

    navigate('/orders')
  }

  if (authLoading || loading) return <div className="max-w-2xl mx-auto px-6 py-12">Loading…</div>

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <p className="eyebrow mb-2">Almost there</p>
      <h1 className="font-logo text-3xl mb-8">Checkout</h1>

      {lines.length === 0 ? (
        <p className="text-charcoal/60">Your cart is empty.</p>
      ) : (
        <>
          <div className="rounded-xl bg-ivory shadow-sm p-5 mb-6">
            {lines.map((line) => (
              <p key={line.item.productId} className="text-sm flex justify-between py-1">
                <span>
                  {line.item.quantity} x {line.product!.name}
                </span>
                <span>
                  {formatInr(
                    discountedPrice(line.product!.price, line.product!.discount_percent) *
                      line.item.quantity,
                  )}
                </span>
              </p>
            ))}
            {giftWrap && (
              <p className="text-sm flex justify-between py-1 text-charcoal/60">
                <span>Gift wrap</span>
                <span>{formatInr(GIFT_WRAP_FEE)}</span>
              </p>
            )}
            {appliedCoupon && (
              <p className="text-sm flex justify-between py-1 text-gold-dark">
                <span>Coupon {appliedCoupon.code}</span>
                <span>-{formatInr(discountAmount)}</span>
              </p>
            )}
            <p className="flex justify-between font-medium mt-2">
              <span>Total</span>
              <span>{formatInr(total)}</span>
            </p>
          </div>

          <div className="flex gap-2 mb-6">
            <input
              type="text"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              placeholder="Coupon code"
              className="border border-gold/30 rounded-lg px-3 py-2 text-sm flex-1 uppercase"
            />
            <button
              type="button"
              onClick={handleApplyCoupon}
              disabled={checkingCoupon}
              className="border border-gold-dark text-gold-dark rounded-lg px-4 py-2 text-sm hover:bg-gold/5 transition-colors disabled:opacity-50"
            >
              {checkingCoupon ? 'Checking…' : 'Apply'}
            </button>
          </div>
          {couponMessage && (
            <p className={`text-sm mb-4 ${appliedCoupon ? 'text-gold-dark' : 'text-red-600'}`}>
              {couponMessage}
            </p>
          )}

          {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <label className="flex flex-col gap-1 text-sm">
              Full name
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="border border-gold/30 rounded-lg px-3 py-2"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Address line 1
              <input
                type="text"
                required
                value={addressLine1}
                onChange={(e) => setAddressLine1(e.target.value)}
                className="border border-gold/30 rounded-lg px-3 py-2"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Address line 2 (optional)
              <input
                type="text"
                value={addressLine2}
                onChange={(e) => setAddressLine2(e.target.value)}
                className="border border-gold/30 rounded-lg px-3 py-2"
              />
            </label>
            <div className="flex gap-4">
              <label className="flex flex-col gap-1 text-sm flex-1">
                City
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="border border-gold/30 rounded-lg px-3 py-2"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm flex-1">
                State
                <input
                  type="text"
                  required
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="border border-gold/30 rounded-lg px-3 py-2"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm flex-1">
                Pincode
                <input
                  type="text"
                  required
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  className="border border-gold/30 rounded-lg px-3 py-2"
                />
              </label>
            </div>
            <label className="flex flex-col gap-1 text-sm">
              WhatsApp number
              <input
                type="tel"
                required
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                className="border border-gold/30 rounded-lg px-3 py-2"
              />
            </label>

            <button
              type="submit"
              disabled={submitting}
              className="bg-gold-dark text-ivory rounded-lg px-6 py-3 shadow-sm hover:shadow-md transition-shadow disabled:opacity-50 disabled:shadow-none"
            >
              {submitting ? 'Placing order…' : 'Place Order via WhatsApp'}
            </button>
          </form>
        </>
      )}
    </div>
  )
}
