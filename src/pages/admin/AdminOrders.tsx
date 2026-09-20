import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { formatInr } from '../../lib/pricing'
import { buildWhatsAppLink } from '../../lib/whatsapp'
import type { Order, OrderItem, OrderStatus } from '../../lib/types'

type NextStep = { status: OrderStatus; label: string; message: (order: Order) => string }

const orderNumber = (o: Order) => o.order_number ?? o.id.slice(0, 8)

const NEXT_STEPS: Record<string, NextStep> = {
  Pending: {
    status: 'Confirmed',
    label: 'Mark Confirmed',
    message: (o) =>
      `Hi ${o.shipping_address.full_name}, your Glimmora order #${orderNumber(o)} has been confirmed! We're preparing it for shipment.`,
  },
  Confirmed: {
    status: 'Shipped',
    label: 'Mark Shipped',
    message: (o) =>
      `Hi ${o.shipping_address.full_name}, your Glimmora order #${orderNumber(o)} has shipped! It's on its way to you.`,
  },
  Shipped: {
    status: 'Delivered',
    label: 'Mark Delivered',
    message: (o) =>
      `Hi ${o.shipping_address.full_name}, your Glimmora order #${orderNumber(o)} has been delivered. We hope you love it!`,
  },
}

const CANCEL_MESSAGE = (o: Order) =>
  `Hi ${o.shipping_address.full_name}, your Glimmora order #${orderNumber(o)} has been cancelled. Please reach out if you have any questions.`

const STATUS_BADGE: Record<string, string> = {
  Pending: 'bg-charcoal/10 text-charcoal/70',
  Confirmed: 'bg-gold/15 text-gold-dark',
  Shipped: 'bg-gold/15 text-gold-dark',
  Delivered: 'bg-green-100 text-green-700',
  Cancelled: 'bg-red-100 text-red-600',
}

const STATUSES: OrderStatus[] = ['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled']

export default function AdminOrders() {
  const [orders, setOrders] = useState<(Order & { order_items: OrderItem[] })[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'All' | OrderStatus>('All')
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  async function loadOrders() {
    setLoading(true)
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .order('created_at', { ascending: false })
    if (error) {
      console.error('Failed to load orders:', error)
      alert(`Could not load orders: ${error.message}`)
    }
    setOrders(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    loadOrders()
  }, [])

  async function updateStatus(order: Order, status: OrderStatus, message: string) {
    setUpdatingId(order.id)
    const { error } = await supabase.from('orders').update({ status }).eq('id', order.id)
    setUpdatingId(null)
    if (error) {
      alert(`Could not update order status: ${error.message}`)
      return
    }
    window.open(buildWhatsAppLink(order.whatsapp_number.replace(/\D/g, ''), message), '_blank')
    loadOrders()
  }

  const visibleOrders = filter === 'All' ? orders : orders.filter((o) => o.status === filter)
  const countFor = (status: OrderStatus) => orders.filter((o) => o.status === status).length

  return (
    <div className="max-w-5xl mx-auto">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
        {STATUSES.map((status) => (
          <div key={status} className="rounded-xl bg-ivory shadow-sm p-4">
            <p className="text-xs text-charcoal/50 mb-1">{status}</p>
            <p className="text-2xl font-medium">{countFor(status)}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 mb-6 text-sm overflow-x-auto">
        {(['All', ...STATUSES] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-3.5 py-1.5 rounded-full border whitespace-nowrap transition-colors ${
              filter === status
                ? 'border-gold-dark bg-gold-dark text-ivory'
                : 'border-gold/20 text-charcoal/60 hover:bg-gold/5'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-charcoal/60">Loading…</p>
      ) : visibleOrders.length === 0 ? (
        <p className="text-charcoal/60">No orders.</p>
      ) : (
        <div className="flex flex-col gap-6">
          {visibleOrders.map((order) => {
            const nextStep = NEXT_STEPS[order.status]
            const canCancel = order.status === 'Pending' || order.status === 'Confirmed'

            return (
              <div key={order.id} className="rounded-2xl bg-ivory shadow-sm p-5">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="text-sm text-charcoal/60">
                      Order #{orderNumber(order)} —{' '}
                      {new Date(order.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                    <p className="text-sm">
                      {order.shipping_address.full_name} — {order.whatsapp_number}
                    </p>
                    <span
                      className={`inline-block mt-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_BADGE[order.status]}`}
                    >
                      {order.status}
                    </span>
                  </div>
                  <p className="font-medium">{formatInr(order.total)}</p>
                </div>

                <div className="flex flex-col gap-1 mb-3 text-sm text-charcoal/80">
                  {order.order_items.map((item) => (
                    <p key={item.id} className="flex justify-between">
                      <span>
                        {item.quantity} x {item.product_name}
                      </span>
                      <span>{formatInr(item.line_total)}</span>
                    </p>
                  ))}
                  {order.gift_wrap && (
                    <p className="flex justify-between text-charcoal/60">
                      <span>Gift wrap</span>
                      <span>{formatInr(order.gift_wrap_fee)}</span>
                    </p>
                  )}
                </div>

                <p className="text-xs text-charcoal/50 mb-3">
                  Ship to: {order.shipping_address.address_line1}
                  {order.shipping_address.address_line2 ? `, ${order.shipping_address.address_line2}` : ''},{' '}
                  {order.shipping_address.city}, {order.shipping_address.state} -{' '}
                  {order.shipping_address.pincode}
                </p>

                <div className="flex gap-3">
                  {nextStep && (
                    <button
                      onClick={() => updateStatus(order, nextStep.status, nextStep.message(order))}
                      disabled={updatingId === order.id}
                      className="bg-gold-dark text-ivory rounded-lg px-4 py-2 text-sm shadow-sm hover:shadow-md transition-shadow disabled:opacity-50"
                    >
                      {nextStep.label}
                    </button>
                  )}
                  {canCancel && (
                    <button
                      onClick={() => updateStatus(order, 'Cancelled', CANCEL_MESSAGE(order))}
                      disabled={updatingId === order.id}
                      className="border border-red-600 text-red-600 rounded-lg px-4 py-2 text-sm hover:bg-red-50 transition-colors disabled:opacity-50"
                    >
                      Cancel Order
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
