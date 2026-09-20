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

type GlowImage = {
  id: string
  image_url: string
  link_url: string | null
  sort_order: number
  is_active: boolean
}

function toLocalInputValue(iso: string | null) {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function getInstagramDetails(url?: string | null) {
  if (!url) return { isInsta: false, code: null, thumbUrl: null, type: 'other' }
  const match = url.match(/instagram\.com\/(p|reel|tv)\/([^/?#&]+)/i)
  if (match) {
    const type = match[1].toLowerCase()
    const code = match[2]
    return {
      isInsta: true,
      code,
      type,
      thumbUrl: `https://www.instagram.com/${type}/${code}/media/?size=l`,
    }
  }
  return { isInsta: false, code: null, thumbUrl: null, type: 'other' }
}

function isGlowVideo(url?: string | null) {
  if (!url) return false
  const lower = url.toLowerCase()
  return (
    lower.endsWith('.mp4') ||
    lower.endsWith('.webm') ||
    lower.endsWith('.mov') ||
    lower.includes('/video/') ||
    lower.includes('video=true') ||
    lower.includes('format=mp4')
  )
}

export default function AdminHomeContent() {
  const [rows, setRows] = useState<HomeContentRow[]>([])
  const [loading, setLoading] = useState(true)
  const [savingSection, setSavingSection] = useState<string | null>(null)
  const [glowImages, setGlowImages] = useState<GlowImage[]>([])
  const [glowUploading, setGlowUploading] = useState(false)
  const [glowMediaUrlInput, setGlowMediaUrlInput] = useState('')
  const [glowReelLinkInput, setGlowReelLinkInput] = useState('')

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('home_content').select('*')
    setRows(data ?? [])
    setLoading(false)
  }

  async function loadGlowImages() {
    try {
      const { data, error } = await supabase
        .from('follow_glow_images')
        .select('*')
        .order('sort_order', { ascending: true })
      if (!error && data) setGlowImages(data)
    } catch {
      // ignore missing table error
    }
  }

  useEffect(() => {
    load()
    loadGlowImages()
  }, [])

  async function addGlowMediaByUrl() {
    const media = glowMediaUrlInput.trim()
    const link = glowReelLinkInput.trim()
    if (!media && !link) return
    setGlowUploading(true)

    const rawUrl = link || media
    const insta = getInstagramDetails(rawUrl)
    
    let finalMedia = media
    let finalLink = link

    if (insta.isInsta) {
      finalMedia = media || insta.thumbUrl || rawUrl
      finalLink = link || `https://www.instagram.com/${insta.type}/${insta.code}/`
    } else {
      if (!finalMedia) finalMedia = rawUrl
      if (!finalLink) finalLink = rawUrl
    }

    const nextSort = glowImages.length ? Math.max(...glowImages.map((g) => g.sort_order)) + 1 : 0
    const { error } = await supabase.from('follow_glow_images').insert({
      image_url: finalMedia,
      link_url: finalLink || null,
      sort_order: nextSort,
      is_active: true,
    })
    if (error) {
      alert(`Could not add media: ${error.message}`)
    } else {
      setGlowMediaUrlInput('')
      setGlowReelLinkInput('')
      await loadGlowImages()
    }
    setGlowUploading(false)
  }

  async function uploadGlowImage(file: File) {
    setGlowUploading(true)
    const path = `follow_glow/${crypto.randomUUID()}-${file.name}`
    const { error } = await supabase.storage.from('home-media').upload(path, file)
    if (error) {
      alert(error.message)
      setGlowUploading(false)
      return
    }
    const {
      data: { publicUrl },
    } = supabase.storage.from('home-media').getPublicUrl(path)
    const nextSort = glowImages.length ? Math.max(...glowImages.map((g) => g.sort_order)) + 1 : 0
    const { error: insertError } = await supabase.from('follow_glow_images').insert({
      image_url: publicUrl,
      sort_order: nextSort,
      is_active: true,
    })
    if (insertError) {
      alert(`Uploaded file but could not save it: ${insertError.message}`)
    }
    await loadGlowImages()
    setGlowUploading(false)
  }

  async function deleteGlowImage(id: string) {
    if (!confirm('Delete this media item?')) return
    const { error } = await supabase.from('follow_glow_images').delete().eq('id', id)
    if (error) {
      alert(`Could not delete item: ${error.message}`)
    } else {
      loadGlowImages()
    }
  }

  async function moveGlowImage(id: string, direction: -1 | 1) {
    const index = glowImages.findIndex((g) => g.id === id)
    const swapIndex = index + direction
    if (index < 0 || swapIndex < 0 || swapIndex >= glowImages.length) return
    const a = glowImages[index]
    const b = glowImages[swapIndex]
    const [{ error: errorA }, { error: errorB }] = await Promise.all([
      supabase.from('follow_glow_images').update({ sort_order: b.sort_order }).eq('id', a.id),
      supabase.from('follow_glow_images').update({ sort_order: a.sort_order }).eq('id', b.id),
    ])
    if (errorA || errorB) {
      alert(`Could not reorder: ${(errorA ?? errorB)?.message}`)
    }
    await loadGlowImages()
  }

  async function setGlowImageLink(id: string, link: string) {
    const insta = getInstagramDetails(link)
    const patch: Record<string, any> = { link_url: link || null }
    if (insta.isInsta) {
      patch.image_url = insta.thumbUrl
    }
    const { error } = await supabase
      .from('follow_glow_images')
      .update(patch)
      .eq('id', id)
    if (error) {
      alert(`Could not save link: ${error.message}`)
    }
    await loadGlowImages()
  }

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

        <div className="border-t border-gold/10 mt-6 pt-6">
          <h3 className="text-sm font-medium mb-1">Instagram Posts & Reels Grid</h3>
          <p className="text-xs text-charcoal/60 mb-4">
            Upload photos or videos (MP4), or paste Instagram Reel video links. Videos automatically play without sound on the homepage and redirect directly to the Reel when touched!
          </p>

          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-6">
            {glowImages.map((img, index) => {
              const instaMedia = getInstagramDetails(img.image_url)
              const instaLink = getInstagramDetails(img.link_url)
              const insta = instaMedia.isInsta ? instaMedia : instaLink
              const isVid = isGlowVideo(img.image_url) || (insta.isInsta && (insta.type === 'reel' || insta.type === 'tv'))

              return (
                <div key={img.id} className="relative group rounded-lg overflow-hidden shadow-sm bg-black/5">
                  {insta.isInsta ? (
                    <iframe
                      src={`https://www.instagram.com/${insta.type}/${insta.code}/embed/`}
                      className="w-full aspect-square border-0 pointer-events-none object-cover scale-[1.2]"
                      scrolling="no"
                      title="Instagram Preview"
                    />
                  ) : isVid ? (
                    <video
                      src={img.image_url}
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="w-full aspect-square object-cover"
                    />
                  ) : (
                    <img
                      src={img.image_url}
                      alt=""
                      className="w-full aspect-square object-cover"
                      onError={(e) => {
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=800&auto=format&fit=crop'
                      }}
                    />
                  )}
                  {isVid && (
                    <span className="absolute top-1.5 left-1.5 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded font-medium tracking-wider uppercase z-10">
                      Reel
                    </span>
                  )}
                  <div className="absolute inset-0 bg-charcoal/0 group-hover:bg-charcoal/70 transition-colors flex flex-col items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 p-2 z-20">
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => moveGlowImage(img.id, -1)}
                        disabled={index === 0}
                        className="bg-ivory/90 rounded-full h-6 w-6 text-xs disabled:opacity-40"
                        title="Move earlier"
                      >
                        ←
                      </button>
                      <button
                        type="button"
                        onClick={() => moveGlowImage(img.id, 1)}
                        disabled={index === glowImages.length - 1}
                        className="bg-ivory/90 rounded-full h-6 w-6 text-xs disabled:opacity-40"
                        title="Move later"
                      >
                        →
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteGlowImage(img.id)}
                        className="bg-red-50 text-red-600 rounded-full h-6 w-6 text-xs"
                        title="Remove"
                      >
                        ×
                      </button>
                    </div>
                    <input
                      type="url"
                      defaultValue={img.link_url ?? ''}
                      onBlur={(e) => setGlowImageLink(img.id, e.target.value)}
                      placeholder="Instagram Reel/Post link"
                      className="w-full text-[10px] rounded px-1.5 py-1 border-0 bg-white text-charcoal shadow-sm"
                    />
                  </div>
                </div>
              )
            })}
            {glowImages.length === 0 && (
              <p className="col-span-full text-sm text-charcoal/50 py-4 text-center">
                No photos or videos yet — add some below.
              </p>
            )}
          </div>

          <div className="flex flex-col gap-3 bg-cream/50 p-4 rounded-xl border border-gold/15">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gold-dark">Add New Media or Reel</h4>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="file"
                accept="image/*,video/*"
                disabled={glowUploading}
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) uploadGlowImage(file)
                  e.target.value = ''
                }}
                className="text-xs text-charcoal/60 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-gold-dark file:text-ivory file:text-xs file:cursor-pointer hover:file:opacity-90 cursor-pointer"
              />
            </div>
            
            <div className="flex items-center gap-2 text-xs text-charcoal/50 my-1">
              <span className="h-px bg-gold/20 flex-1" />
              <span>OR ADD VIDEO / REEL VIA URL</span>
              <span className="h-px bg-gold/20 flex-1" />
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="url"
                value={glowMediaUrlInput}
                onChange={(e) => setGlowMediaUrlInput(e.target.value)}
                placeholder="Video / Image URL (e.g. https://.../video.mp4)"
                className="flex-1 text-xs border border-gold/30 rounded-lg px-3 py-2"
              />
              <input
                type="url"
                value={glowReelLinkInput}
                onChange={(e) => setGlowReelLinkInput(e.target.value)}
                placeholder="Instagram Reel Link (e.g. https://instagram.com/reel/...)"
                className="flex-1 text-xs border border-gold/30 rounded-lg px-3 py-2"
              />
              <button
                type="button"
                onClick={addGlowMediaByUrl}
                disabled={glowUploading || (!glowMediaUrlInput.trim() && !glowReelLinkInput.trim())}
                className="bg-gold-dark text-ivory rounded-lg px-4 py-2 text-xs shadow-sm hover:shadow-md transition-shadow disabled:opacity-50"
              >
                Add Reel/Post
              </button>
            </div>
            {glowUploading && <span className="text-xs text-charcoal/50">Processing media…</span>}
          </div>
        </div>
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
