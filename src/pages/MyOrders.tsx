import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../lib/AuthContext'
import { formatInr } from '../lib/pricing'
import { ADMIN_WHATSAPP_NUMBER, buildWhatsAppLink } from '../lib/whatsapp'
import type { Order, OrderItem } from '../lib/types'

const STATUS_BADGE: Record<string, string> = {
  Pending: 'bg-charcoal/10 text-charcoal/70',
  Confirmed: 'bg-gold/15 text-gold-dark',
  Shipped: 'bg-gold/15 text-gold-dark',
  Delivered: 'bg-green-100 text-green-700',
  Cancelled: 'bg-red-100 text-red-600',
}

export default function MyOrders() {
  const { customer, loading: authLoading } = useAuth()
  const [orders, setOrders] = useState<(Order & { order_items: OrderItem[] })[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    if (!customer) {
      setLoading(false)
      return
    }
    async function load() {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('customer_id', customer!.id)
        .order('created_at', { ascending: false })
      if (error) {
        console.error('Failed to load orders:', error)
        setLoadError('Could not load your orders. Please try again.')
      }
      setOrders(data ?? [])
      setLoading(false)
    }
    load()
  }, [customer])

  if (authLoading || loading) return <div className="max-w-4xl mx-auto px-6 py-12">Loading…</div>

  if (!customer) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-16 text-center">
        <h1 className="font-logo text-3xl mb-4">My Orders</h1>
        <p className="text-charcoal/60 mb-4">Log in to see your orders.</p>
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
    <div className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="font-logo text-3xl mb-8">My Orders</h1>

      {loadError ? (
        <div className="text-center py-16">
          <p className="text-red-600 mb-4">{loadError}</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-charcoal/60 mb-4">No orders yet.</p>
          <Link
            to="/collections"
            className="inline-block rounded-full border border-gold/30 text-gold-dark px-6 py-2.5 text-sm hover:bg-gold/5 transition-colors"
          >
            Browse Collections
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {orders.map((order) => (
            <div key={order.id} className="rounded-xl bg-ivory shadow-sm p-5">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="text-sm text-charcoal/60">
                    Order #{order.order_number ?? order.id.slice(0, 8)} —{' '}
                    {new Date(order.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                  <span
                    className={`inline-block mt-1 text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_BADGE[order.status]}`}
                  >
                    {order.status}
                  </span>
                </div>
                <p className="font-medium">{formatInr(order.total)}</p>
              </div>

              <div className="flex flex-col gap-1 mb-3">
                {order.order_items.map((item) => (
                  <p key={item.id} className="text-sm text-charcoal/80 flex justify-between">
                    <span>
                      {item.quantity} x {item.product_name}
                    </span>
                    <span>{formatInr(item.line_total)}</span>
                  </p>
                ))}
                {order.gift_wrap && (
                  <p className="text-sm text-charcoal/60 flex justify-between">
                    <span>Gift wrap</span>
                    <span>{formatInr(order.gift_wrap_fee)}</span>
                  </p>
                )}
              </div>

              {order.status === 'Delivered' && ADMIN_WHATSAPP_NUMBER && (
                <a
                  href={buildWhatsAppLink(
                    ADMIN_WHATSAPP_NUMBER,
                    `I'd like to request a return/exchange for order #${order.order_number ?? order.id.slice(0, 8)}.`,
                  )}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block mt-2 rounded-full border border-gold/30 text-gold-dark px-4 py-1.5 text-sm hover:bg-gold/5 transition-colors"
                >
                  Request Return / Exchange
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
