import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../lib/AuthContext'

export default function AdminLogin() {
  const navigate = useNavigate()
  const { refreshAdmin } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error || !data.user) {
      setSubmitting(false)
      setError(error?.message ?? 'Login failed')
      return
    }

    const { data: isAdmin } = await supabase.rpc('is_admin')

    if (!isAdmin) {
      await supabase.auth.signOut()
      setSubmitting(false)
      setError('This account is not an admin.')
      return
    }

    await refreshAdmin()
    setSubmitting(false)
    navigate('/admin')
  }

  return (
    <div className="max-w-md mx-auto px-6 py-16">
      <div className="w-14 h-14 rounded-full bg-charcoal flex items-center justify-center mx-auto mb-4">
        <ShieldCheck size={22} strokeWidth={1.5} className="text-gold" />
      </div>
      <h1 className="font-logo text-3xl mb-8 text-center">Admin Login</h1>

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-2xl bg-ivory shadow-sm p-6">
        <label className="flex flex-col gap-1 text-sm">
          Email
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border border-gold/30 rounded-lg px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Password
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border border-gold/30 rounded-lg px-3 py-2"
          />
        </label>
        <button
          type="submit"
          disabled={submitting}
          className="bg-gold-dark text-ivory rounded-lg px-4 py-2 shadow-sm hover:shadow-md transition-shadow disabled:opacity-50 disabled:shadow-none"
        >
          {submitting ? 'Logging in…' : 'Log in'}
        </button>
      </form>
    </div>
  )
}
