import { useEffect, useState, type FormEvent } from 'react'
import { Trash2 } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'

type Coupon = {
  id: string
  code: string
  discount_type: 'percent' | 'amount'
  discount_value: number
  expires_at: string | null
  usage_limit_per_user: number
  is_active: boolean
}

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [code, setCode] = useState('')
  const [discountType, setDiscountType] = useState<'percent' | 'amount'>('percent')
  const [discountValue, setDiscountValue] = useState('10')
  const [expiresAt, setExpiresAt] = useState('')
  const [usageLimit, setUsageLimit] = useState('1')
  const [submitting, setSubmitting] = useState(false)

  async function load() {
    setLoading(true)
    const { data, error } = await supabase.from('coupons').select('*').order('created_at', { ascending: false })
    if (error) {
      console.error('Failed to load coupons:', error)
      setError('Could not load coupons.')
    }
    setCoupons(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  async function handleCreate(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    const { error } = await supabase.from('coupons').insert({
      code: code.toUpperCase(),
      discount_type: discountType,
      discount_value: Number(discountValue),
      expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
      usage_limit_per_user: Number(usageLimit),
    })

    setSubmitting(false)
    if (error) {
      setError(error.message)
      return
    }
    setCode('')
    setDiscountValue('10')
    setExpiresAt('')
    setUsageLimit('1')
    load()
  }

  async function toggleActive(coupon: Coupon) {
    const { error } = await supabase.from('coupons').update({ is_active: !coupon.is_active }).eq('id', coupon.id)
    if (error) {
      alert(`Could not update coupon: ${error.message}`)
      return
    }
    load()
  }

  async function handleDelete(coupon: Coupon) {
    if (!confirm(`Delete coupon "${coupon.code}"?`)) return
    const { error } = await supabase.from('coupons').delete().eq('id', coupon.id)
    if (error) {
      alert(`Could not delete coupon: ${error.message}`)
    } else {
      load()
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <form onSubmit={handleCreate} className="rounded-2xl bg-ivory shadow-sm p-6 mb-8 flex flex-col gap-3">
        <h2 className="text-lg font-medium mb-1">New Coupon</h2>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <div className="flex gap-3">
          <label className="flex flex-col gap-1 text-sm flex-1">
            Code
            <input
              type="text"
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="border border-gold/30 rounded-lg px-3 py-2 uppercase"
              placeholder="WELCOME10"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Type
            <select
              value={discountType}
              onChange={(e) => setDiscountType(e.target.value as 'percent' | 'amount')}
              className="border border-gold/30 rounded-lg px-3 py-2"
            >
              <option value="percent">% off</option>
              <option value="amount">₹ off</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Value
            <input
              type="number"
              required
              min="0"
              max={discountType === 'percent' ? 100 : undefined}
              value={discountValue}
              onChange={(e) => setDiscountValue(e.target.value)}
              className="border border-gold/30 rounded-lg px-3 py-2 w-24"
            />
          </label>
        </div>
        <div className="flex gap-3">
          <label className="flex flex-col gap-1 text-sm flex-1">
            Expires at (optional)
            <input
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="border border-gold/30 rounded-lg px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Uses per customer
            <input
              type="number"
              required
              min="1"
              value={usageLimit}
              onChange={(e) => setUsageLimit(e.target.value)}
              className="border border-gold/30 rounded-lg px-3 py-2 w-24"
            />
          </label>
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="bg-gold-dark text-ivory rounded-lg px-4 py-2 text-sm self-start shadow-sm hover:shadow-md transition-shadow disabled:opacity-50 disabled:shadow-none"
        >
          {submitting ? 'Creating…' : 'Create Coupon'}
        </button>
      </form>

      {loading ? (
        <p className="text-charcoal/60">Loading…</p>
      ) : (
        <table className="w-full text-left text-sm border-collapse rounded-2xl bg-ivory shadow-sm overflow-hidden">
          <thead>
            <tr className="border-b border-gold/20">
              <th className="py-3 px-4">Code</th>
              <th className="py-3 px-4">Discount</th>
              <th className="py-3 px-4">Expires</th>
              <th className="py-3 px-4">Uses/customer</th>
              <th className="py-3 px-4">Active</th>
              <th className="py-3 px-4"></th>
            </tr>
          </thead>
          <tbody>
            {coupons.map((coupon) => (
              <tr key={coupon.id} className="border-b border-gold/10 hover:bg-gold/5 transition-colors">
                <td className="py-3 px-4 font-medium">{coupon.code}</td>
                <td className="py-3 px-4">
                  {coupon.discount_type === 'percent' ? `${coupon.discount_value}%` : `₹${coupon.discount_value}`}
                </td>
                <td className="py-3 px-4">
                  {coupon.expires_at ? new Date(coupon.expires_at).toLocaleDateString('en-IN') : 'Never'}
                </td>
                <td className="py-3 px-4">{coupon.usage_limit_per_user}</td>
                <td className="py-3 px-4">
                  <button
                    onClick={() => toggleActive(coupon)}
                    className={`text-xs font-medium px-2.5 py-1 rounded-full transition-colors ${
                      coupon.is_active ? 'bg-green-100 text-green-700' : 'bg-charcoal/5 text-charcoal/40'
                    }`}
                  >
                    {coupon.is_active ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="py-3 px-4 text-right">
                  <button
                    onClick={() => handleDelete(coupon)}
                    aria-label="Delete"
                    className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 size={15} strokeWidth={1.75} />
                  </button>
                </td>
              </tr>
            ))}
            {coupons.length === 0 && (
              <tr>
                <td colSpan={6} className="py-6 px-4 text-center text-charcoal/60">
                  No coupons yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  )
}
