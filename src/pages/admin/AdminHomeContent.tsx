import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'

type HomeContentRow = {
  id: string
  section: string
  text_content: string | null
  media_url: string | null
  media_type: 'image' | 'video' | null
  link_url: string | null
  starts_at: string | null
  ends_at: string | null
  is_active: boolean
}

function toLocalInputValue(iso: string | null) {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function AdminHomeContent() {
  const [rows, setRows] = useState<HomeContentRow[]>([])
  const [loading, setLoading] = useState(true)
  const [savingSection, setSavingSection] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('home_content').select('*')
    setRows(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  function getRow(section: string): HomeContentRow {
    return (
      rows.find((r) => r.section === section) ?? {
        id: '',
        section,
        text_content: null,
        media_url: null,
        media_type: null,
        link_url: null,
        starts_at: null,
        ends_at: null,
        is_active: true,
      }
    )
  }

  async function save(section: string, patch: Partial<HomeContentRow>) {
    setSavingSection(section)
    const { error } = await supabase.from('home_content').update(patch).eq('section', section)
    if (error) {
      alert(`Could not save: ${error.message}`)
    }
    await load()
    setSavingSection(null)
  }

  async function uploadMedia(section: string, file: File) {
    const mediaType = file.type.startsWith('video') ? 'video' : 'image'
    const path = `${section}/${crypto.randomUUID()}-${file.name}`
    const { error } = await supabase.storage.from('home-media').upload(path, file)
    if (error) {
      alert(error.message)
      return
    }
    const {
      data: { publicUrl },
    } = supabase.storage.from('home-media').getPublicUrl(path)
    await save(section, { media_url: publicUrl, media_type: mediaType })
  }

  if (loading) return <div className="max-w-3xl mx-auto text-charcoal/60">Loading…</div>

  const offerStrip = getRow('offer_strip')
  const heroBanner = getRow('hero_banner')
  const followTheGlow = getRow('follow_the_glow')

  return (
    <div className="max-w-3xl mx-auto">
      {/* Offer strip */}
      <section className="rounded-2xl bg-ivory shadow-sm p-6 mb-6">
        <h2 className="text-lg font-medium mb-4">Offer Strip</h2>
        <OfferStripForm row={offerStrip} saving={savingSection === 'offer_strip'} onSave={save} />
      </section>

      {/* Hero banner */}
      <section className="rounded-2xl bg-ivory shadow-sm p-6 mb-6">
        <h2 className="text-lg font-medium mb-4">Hero Banner</h2>
        {heroBanner.media_url && (
          <div className="mb-3">
            {heroBanner.media_type === 'video' ? (
              <video
                src={heroBanner.media_url}
                className="w-full max-h-48 object-cover rounded-lg shadow-sm"
                muted
                controls
              />
            ) : (
              <img
                src={heroBanner.media_url}
                alt=""
                className="w-full max-h-48 object-cover rounded-lg shadow-sm"
              />
            )}
          </div>
        )}
        <input
          type="file"
          accept="image/*,video/*"
          onChange={(e) => e.target.files?.[0] && uploadMedia('hero_banner', e.target.files[0])}
          className="text-sm text-charcoal/60 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-gold-dark file:text-ivory file:text-sm file:cursor-pointer hover:file:opacity-90 cursor-pointer"
        />
        <label className="flex items-center gap-2 text-sm mt-3">
          <input
            type="checkbox"
            checked={heroBanner.is_active}
            onChange={(e) => save('hero_banner', { is_active: e.target.checked })}
            className="accent-gold-dark w-4 h-4"
          />
          Active
        </label>
      </section>

      {/* Follow the Glow */}
      <section className="rounded-2xl bg-ivory shadow-sm p-6">
        <h2 className="text-lg font-medium mb-4">Follow the Glow</h2>
        <FollowTheGlowForm
          row={followTheGlow}
          saving={savingSection === 'follow_the_glow'}
          onSave={save}
        />
      </section>
    </div>
  )
}

function OfferStripForm({
  row,
  saving,
  onSave,
}: {
  row: HomeContentRow
  saving: boolean
  onSave: (section: string, patch: Partial<HomeContentRow>) => Promise<void>
}) {
  const [text, setText] = useState(row.text_content ?? '')
  const [startsAt, setStartsAt] = useState(toLocalInputValue(row.starts_at))
  const [endsAt, setEndsAt] = useState(toLocalInputValue(row.ends_at))
  const [isActive, setIsActive] = useState(row.is_active)

  return (
    <div className="flex flex-col gap-3">
      {row.media_url && (
        <img src={row.media_url} alt="" className="w-full max-h-32 object-cover rounded-lg shadow-sm" />
      )}
      <input
        type="file"
        accept="image/*"
        onChange={async (e) => {
          const file = e.target.files?.[0]
          if (!file) return
          e.target.value = ''
          const path = `offer_strip/${crypto.randomUUID()}-${file.name}`
          const { error } = await supabase.storage.from('home-media').upload(path, file)
          if (error) {
            alert(`Could not upload image: ${error.message}`)
            return
          }
          const { data } = supabase.storage.from('home-media').getPublicUrl(path)
          await onSave('offer_strip', { media_url: data.publicUrl, media_type: 'image' })
        }}
        className="text-sm text-charcoal/60 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-gold-dark file:text-ivory file:text-sm file:cursor-pointer hover:file:opacity-90 cursor-pointer"
      />
      <label className="flex flex-col gap-1 text-sm">
        Text
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="border border-gold/30 rounded-lg px-3 py-2"
        />
      </label>
      <div className="flex gap-4">
        <label className="flex flex-col gap-1 text-sm flex-1">
          Starts at (optional)
          <input
            type="datetime-local"
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
            className="border border-gold/30 rounded-lg px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm flex-1">
          Ends at (optional)
          <input
            type="datetime-local"
            value={endsAt}
            onChange={(e) => setEndsAt(e.target.value)}
            className="border border-gold/30 rounded-lg px-3 py-2"
          />
        </label>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
          className="accent-gold-dark w-4 h-4"
        />
        Active
      </label>
      <button
        onClick={() =>
          onSave('offer_strip', {
            text_content: text,
            starts_at: startsAt ? new Date(startsAt).toISOString() : null,
            ends_at: endsAt ? new Date(endsAt).toISOString() : null,
            is_active: isActive,
          })
        }
        disabled={saving}
        className="bg-gold-dark text-ivory rounded-lg px-4 py-2 text-sm self-start shadow-sm hover:shadow-md transition-shadow disabled:opacity-50 disabled:shadow-none"
      >
        {saving ? 'Saving…' : 'Save'}
      </button>
    </div>
  )
}

function FollowTheGlowForm({
  row,
  saving,
  onSave,
}: {
  row: HomeContentRow
  saving: boolean
  onSave: (section: string, patch: Partial<HomeContentRow>) => Promise<void>
}) {
  const [text, setText] = useState(row.text_content ?? '')
  const [link, setLink] = useState(row.link_url ?? '')
  const [isActive, setIsActive] = useState(row.is_active)

  return (
    <div className="flex flex-col gap-3">
      <label className="flex flex-col gap-1 text-sm">
        Display text (e.g. @glimmora.in)
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="border border-gold/30 rounded-lg px-3 py-2"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Instagram link
        <input
          type="url"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          className="border border-gold/30 rounded-lg px-3 py-2"
          placeholder="https://instagram.com/glimmora.in"
        />
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
          className="accent-gold-dark w-4 h-4"
        />
        Active
      </label>
      <button
        onClick={() => onSave('follow_the_glow', { text_content: text, link_url: link, is_active: isActive })}
        disabled={saving}
        className="bg-gold-dark text-ivory rounded-lg px-4 py-2 text-sm self-start shadow-sm hover:shadow-md transition-shadow disabled:opacity-50 disabled:shadow-none"
      >
        {saving ? 'Saving…' : 'Save'}
      </button>
    </div>
  )
}
