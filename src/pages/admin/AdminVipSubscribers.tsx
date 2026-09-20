import { useEffect, useState, type FormEvent } from 'react'
import { Crown, MessageCircle, Trash2, Copy, Check, Plus, Search, Sparkles } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'

export type VipSubscriber = {
  id: string
  whatsapp_number: string
  created_at: string
}

export default function AdminVipSubscribers() {
  const [subscribers, setSubscribers] = useState<VipSubscriber[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [newNumber, setNewNumber] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [copiedAll, setCopiedAll] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function loadData() {
    setLoading(true)
    setError(null)
    const { data, error: sbError } = await supabase
      .from('vip_subscribers')
      .select('*')
      .order('created_at', { ascending: false })

    if (sbError) {
      console.error('Failed to load VIP subscribers:', sbError)
      setError('Could not load VIP subscribers.')
    } else {
      setSubscribers(data ?? [])
    }
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  async function handleAddSubscriber(e: FormEvent) {
    e.preventDefault()
    if (!newNumber.trim()) return
    setError(null)
    setSubmitting(true)

    const cleanNum = newNumber.replace(/\D/g, '')
    if (cleanNum.length < 7) {
      setError('Please enter a valid WhatsApp phone number.')
      setSubmitting(false)
      return
    }

    const payload = {
      whatsapp_number: cleanNum.startsWith('91') ? cleanNum : cleanNum.length === 10 ? `91${cleanNum}` : cleanNum,
    }

    const { error: insertErr } = await supabase.from('vip_subscribers').insert(payload)
    setSubmitting(false)

    if (insertErr) {
      setError(
        insertErr.code === '23505'
          ? 'This WhatsApp number is already registered in VIP list.'
          : insertErr.message
      )
      return
    }

    setNewNumber('')
    loadData()
  }

  async function handleDelete(sub: VipSubscriber) {
    if (!confirm(`Remove ${sub.whatsapp_number} from VIP list?`)) return
    const { error: deleteErr } = await supabase.from('vip_subscribers').delete().eq('id', sub.id)
    if (deleteErr) {
      alert(`Could not remove subscriber: ${deleteErr.message}`)
      return
    }
    loadData()
  }

  function handleCopyNumber(num: string, id: string) {
    navigator.clipboard.writeText(num)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  function handleCopyAll() {
    const numbers = subscribers.map((s) => s.whatsapp_number).join(', ')
    navigator.clipboard.writeText(numbers)
    setCopiedAll(true)
    setTimeout(() => setCopiedAll(false), 2000)
  }

  const filteredSubscribers = subscribers.filter((s) =>
    s.whatsapp_number.toLowerCase().includes(search.toLowerCase())
  )

  const todayCount = subscribers.filter((s) => {
    const date = new Date(s.created_at)
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }).length

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header & Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-ivory shadow-xs p-5 border border-gold/20 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gold/15 flex items-center justify-center text-gold-dark shrink-0">
            <Crown size={24} />
          </div>
          <div>
            <p className="text-2xl font-serif font-medium">{subscribers.length}</p>
            <p className="text-xs text-charcoal/60">Total VIP Members</p>
          </div>
        </div>

        <div className="rounded-2xl bg-ivory shadow-xs p-5 border border-gold/20 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <Sparkles size={24} />
          </div>
          <div>
            <p className="text-2xl font-serif font-medium">{todayCount}</p>
            <p className="text-xs text-charcoal/60">Joined Today</p>
          </div>
        </div>

        <div className="rounded-2xl bg-ivory shadow-xs p-5 border border-gold/20 flex items-center justify-between">
          <div>
            <p className="text-xs text-charcoal/60 mb-1 font-medium">Broadcast Ready</p>
            <p className="text-xs text-charcoal/50">Copy all numbers for WhatsApp campaign</p>
          </div>
          <button
            onClick={handleCopyAll}
            disabled={subscribers.length === 0}
            className="px-3.5 py-2 rounded-xl bg-gold-dark text-white text-xs font-medium hover:brightness-110 transition-all flex items-center gap-1.5 shrink-0 disabled:opacity-50"
          >
            {copiedAll ? <Check size={14} /> : <Copy size={14} />}
            <span>{copiedAll ? 'Copied!' : 'Copy All'}</span>
          </button>
        </div>
      </div>

      {/* Add VIP Member & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-ivory p-4 rounded-2xl border border-gold/15 shadow-xs">
        <form onSubmit={handleAddSubscriber} className="flex gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <MessageCircle size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-charcoal/40" />
            <input
              type="text"
              placeholder="Enter WhatsApp number (e.g. 9876543210)"
              value={newNumber}
              onChange={(e) => setNewNumber(e.target.value)}
              className="w-full pl-10 pr-3 py-2 text-sm bg-white rounded-xl border border-gold/20 focus:border-gold focus:ring-2 focus:ring-gold/20"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 bg-charcoal text-gold text-xs font-medium rounded-xl hover:bg-gold hover:text-charcoal transition-all flex items-center gap-1.5 shrink-0"
          >
            <Plus size={14} />
            <span>Add VIP</span>
          </button>
        </form>

        <div className="relative w-full sm:w-64">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-charcoal/40" />
          <input
            type="text"
            placeholder="Search numbers…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-3 py-2 text-sm bg-white rounded-xl border border-gold/20 focus:border-gold focus:ring-2 focus:ring-gold/20"
          />
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
          {error}
        </div>
      )}

      {/* VIP Subscribers Table */}
      {loading ? (
        <div className="p-8 text-center text-charcoal/60">Loading VIP details…</div>
      ) : (
        <div className="overflow-hidden rounded-2xl bg-ivory shadow-xs border border-gold/20">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-gold/20 bg-gold/5 text-xs text-charcoal/70 uppercase tracking-wider">
                <th className="py-3.5 px-5">#</th>
                <th className="py-3.5 px-5">WhatsApp Number</th>
                <th className="py-3.5 px-5">Subscribed On</th>
                <th className="py-3.5 px-5">Direct Contact</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gold/10">
              {filteredSubscribers.map((sub, index) => {
                const formattedNum = sub.whatsapp_number.startsWith('+')
                  ? sub.whatsapp_number
                  : sub.whatsapp_number.startsWith('91')
                  ? `+${sub.whatsapp_number}`
                  : `+91 ${sub.whatsapp_number}`

                const cleanForWa = sub.whatsapp_number.replace(/\D/g, '')

                return (
                  <tr key={sub.id || index} className="hover:bg-gold/5 transition-colors">
                    <td className="py-3.5 px-5 text-xs text-charcoal/50 font-mono">{index + 1}</td>
                    <td className="py-3.5 px-5 font-mono text-sm font-medium text-charcoal">
                      {formattedNum}
                    </td>
                    <td className="py-3.5 px-5 text-xs text-charcoal/60">
                      {new Date(sub.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3.5 px-5">
                      <a
                        href={`https://wa.me/${cleanForWa}?text=${encodeURIComponent(
                          'Hi! Thank you for joining Glimmora VIP Circle ✦ Here is your exclusive update.'
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-medium hover:bg-emerald-100 transition-colors"
                      >
                        <MessageCircle size={14} />
                        <span>Chat on WhatsApp</span>
                      </a>
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleCopyNumber(sub.whatsapp_number, sub.id)}
                          title="Copy number"
                          className="p-1.5 rounded-lg text-charcoal/60 hover:text-gold-dark hover:bg-gold/10 transition-colors"
                        >
                          {copiedId === sub.id ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
                        </button>

                        <button
                          onClick={() => handleDelete(sub)}
                          title="Delete VIP subscriber"
                          className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}

              {filteredSubscribers.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-charcoal/50 text-xs">
                    {search ? 'No VIP members match your search.' : 'No VIP WhatsApp members yet.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
