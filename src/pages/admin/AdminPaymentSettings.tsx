import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'

export default function AdminPaymentSettings() {
  const [qrUrl, setQrUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)

  async function load() {
    setLoading(true)
    const { data, error } = await supabase.from('store_settings').select('payment_qr_url').eq('id', true).single()
    if (error) {
      console.error('Failed to load payment settings:', error)
    }
    setQrUrl(data?.payment_qr_url ?? null)
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  async function uploadQr(file: File) {
    setUploading(true)
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const path = `payment_qr/${crypto.randomUUID()}-${safeName}`
    const { error } = await supabase.storage.from('home-media').upload(path, file)
    if (error) {
      alert(error.message)
      setUploading(false)
      return
    }
    const {
      data: { publicUrl },
    } = supabase.storage.from('home-media').getPublicUrl(path)
    const { error: updateError } = await supabase
      .from('store_settings')
      .update({ payment_qr_url: publicUrl, updated_at: new Date().toISOString() })
      .eq('id', true)
    if (updateError) {
      alert(`Uploaded file but could not save it: ${updateError.message}`)
    }
    await load()
    setUploading(false)
  }

  if (loading) return <div className="max-w-3xl mx-auto text-charcoal/60">Loading…</div>

  return (
    <div className="max-w-3xl mx-auto">
      <section className="rounded-2xl bg-ivory shadow-sm p-6">
        <h2 className="text-lg font-medium mb-1">Payment QR Code</h2>
        <p className="text-sm text-charcoal/60 mb-4">
          This QR code is sent automatically to a customer's WhatsApp right after they place an order,
          along with a payment reminder. Upload your UPI / payment QR image here.
        </p>

        {qrUrl && (
          <img
            src={qrUrl}
            alt="Payment QR"
            className="w-48 h-48 object-contain rounded-lg shadow-sm bg-white p-2 mb-4"
          />
        )}

        <input
          type="file"
          accept="image/*"
          disabled={uploading}
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) uploadQr(file)
            e.target.value = ''
          }}
          className="text-sm text-charcoal/60 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-gold-dark file:text-ivory file:text-sm file:cursor-pointer hover:file:opacity-90 cursor-pointer"
        />
        {uploading && <span className="text-xs text-charcoal/50 ml-2">Uploading…</span>}
      </section>
    </div>
  )
}
