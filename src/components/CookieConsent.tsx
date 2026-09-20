import { useState } from 'react'
import { Link } from 'react-router-dom'

const CONSENT_KEY = 'glimmora_cookie_consent'

export default function CookieConsent() {
  const [choice, setChoice] = useState(() => localStorage.getItem(CONSENT_KEY))

  if (choice) return null

  function decide(value: 'accepted' | 'declined') {
    localStorage.setItem(CONSENT_KEY, value)
    setChoice(value)
  }

  return (
    <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-1.5rem)] sm:w-full max-w-xl bg-ivory border border-gold/25 rounded-2xl shadow-[0_10px_35px_rgba(0,0,0,0.12)] p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center gap-3">
      <p className="text-xs sm:text-sm text-charcoal/70 leading-relaxed flex-1">
        We use cookies and local storage to keep your cart, wishlist and login working smoothly.
        See our{' '}
        <Link to="/privacy-policy" className="text-gold-dark underline">
          Privacy Policy
        </Link>{' '}
        for details.
      </p>
      <div className="flex gap-2 shrink-0 self-end sm:self-auto">
        <button
          type="button"
          onClick={() => decide('declined')}
          className="text-xs sm:text-sm px-3 py-2 rounded-lg border border-gold/30 text-charcoal/70 hover:bg-gold/5 transition-colors"
        >
          Decline
        </button>
        <button
          type="button"
          onClick={() => decide('accepted')}
          className="text-xs sm:text-sm px-4 py-2 rounded-lg bg-gold-dark text-ivory shadow-sm hover:shadow-md transition-shadow"
        >
          Accept
        </button>
      </div>
    </div>
  )
}
