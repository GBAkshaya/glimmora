import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../lib/AuthContext'

type Step = 'email' | 'otp' | 'profile'

export default function Login() {
  const navigate = useNavigate()
  const { refreshCustomer } = useAuth()

  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [name, setName] = useState('')
  const [whatsappNumber, setWhatsappNumber] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSendOtp(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    const { error } = await supabase.auth.signInWithOtp({ email })
    setSubmitting(false)
    if (error) {
      console.error('signInWithOtp failed:', { status: error.status, code: error.code, message: error.message, error })
      const looksEmpty = !error.message || error.message === '{}'
      setError(
        looksEmpty
          ? `Failed to send code (status ${error.status ?? 'unknown'}${error.code ? `, code: ${error.code}` : ''}). This usually means Supabase rejected the email send — check the console for details.`
          : error.message
      )
      return
    }
    setStep('otp')
  }

  async function handleVerifyOtp(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    const { data, error } = await supabase.auth.verifyOtp({ email, token: otp, type: 'email' })
    if (error || !data.user) {
      setSubmitting(false)
      setError(error?.message ?? 'Verification failed')
      return
    }

    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('id')
      .eq('id', data.user.id)
      .maybeSingle()

    setSubmitting(false)
    if (existingCustomer) {
      await refreshCustomer()
      navigate('/account')
    } else {
      setStep('profile')
    }
  }

  async function handleCompleteProfile(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setSubmitting(false)
      setError('Session expired, please log in again')
      setStep('email')
      return
    }

    const { error } = await supabase.from('customers').insert({
      id: user.id,
      name,
      whatsapp_number: whatsappNumber,
    })

    setSubmitting(false)
    if (error) {
      setError(error.message)
      return
    }

    await refreshCustomer()
    navigate('/account')
  }

  return (
    <div className="max-w-md mx-auto px-6 py-16">
      <p className="eyebrow text-center mb-3">Welcome Back</p>
      <h1 className="font-logo text-3xl mb-3 text-center">Login</h1>
      <div className="flex justify-center gap-1.5 mb-8">
        {(['email', 'otp', 'profile'] as Step[]).map((s) => (
          <span
            key={s}
            className={`h-1.5 rounded-full transition-all ${
              s === step ? 'w-6 bg-gold-dark' : 'w-1.5 bg-gold/25'
            }`}
          />
        ))}
      </div>

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      <div className="rounded-2xl bg-ivory shadow-sm p-6">
      {step === 'email' && (
        <form onSubmit={handleSendOtp} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm">
            Email
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border border-gold/30 rounded-lg px-3 py-2"
              placeholder="you@example.com"
            />
          </label>
          <button
            type="submit"
            disabled={submitting}
            className="bg-gold-dark text-ivory rounded-lg px-4 py-2 shadow-sm hover:shadow-md transition-shadow disabled:opacity-50 disabled:shadow-none"
          >
            {submitting ? 'Sending code…' : 'Send login code'}
          </button>
        </form>
      )}

      {step === 'otp' && (
        <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
          <p className="text-sm text-charcoal/70">Enter the code sent to {email}</p>
          <label className="flex flex-col gap-1 text-sm">
            Code
            <input
              type="text"
              required
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="border border-gold/30 rounded-lg px-3 py-2 tracking-widest"
              placeholder="123456"
            />
          </label>
          <button
            type="submit"
            disabled={submitting}
            className="bg-gold-dark text-ivory rounded-lg px-4 py-2 shadow-sm hover:shadow-md transition-shadow disabled:opacity-50 disabled:shadow-none"
          >
            {submitting ? 'Verifying…' : 'Verify & continue'}
          </button>
        </form>
      )}

      {step === 'profile' && (
        <form onSubmit={handleCompleteProfile} className="flex flex-col gap-4">
          <p className="text-sm text-charcoal/70">
            Almost done — we need this to keep you posted on your orders over WhatsApp.
          </p>
          <label className="flex flex-col gap-1 text-sm">
            Name
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="border border-gold/30 rounded-lg px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            WhatsApp number
            <input
              type="tel"
              required
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              className="border border-gold/30 rounded-lg px-3 py-2"
              placeholder="+91 98765 43210"
            />
          </label>
          <button
            type="submit"
            disabled={submitting}
            className="bg-gold-dark text-ivory rounded-lg px-4 py-2 shadow-sm hover:shadow-md transition-shadow disabled:opacity-50 disabled:shadow-none"
          >
            {submitting ? 'Saving…' : 'Complete profile'}
          </button>
        </form>
      )}
      </div>
    </div>
  )
}
