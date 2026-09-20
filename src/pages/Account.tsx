import { useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { User } from 'lucide-react'
import { useAuth } from '../lib/AuthContext'

export default function Account() {
  const { session, customer, isAdmin, loading, signOut } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && !session) navigate('/login')
  }, [loading, session, navigate])

  if (loading || !session) return null

  return (
    <div className="max-w-md mx-auto px-6 py-16">
      <div className="w-14 h-14 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-4">
        <User size={22} strokeWidth={1.5} className="text-gold-dark" />
      </div>
      <h1 className="font-logo text-3xl mb-8 text-center">Account</h1>

      {customer ? (
        <div className="flex flex-col gap-4 rounded-2xl bg-ivory shadow-sm p-6">
          <p>
            <span className="text-charcoal/60 text-sm">Name</span>
            <br />
            {customer.name}
          </p>
          <p>
            <span className="text-charcoal/60 text-sm">WhatsApp number</span>
            <br />
            {customer.whatsapp_number}
          </p>
          <Link
            to="/orders"
            className="inline-block text-center rounded-full border border-gold/30 text-gold-dark px-4 py-2 text-sm hover:bg-gold/5 transition-colors"
          >
            My Orders
          </Link>
          <button
            onClick={() => signOut().then(() => navigate('/'))}
            className="border border-gold/30 rounded-lg px-4 py-2 mt-2 hover:bg-gold/5 transition-colors"
          >
            Log out
          </button>
        </div>
      ) : (
        <div className="text-center flex flex-col items-center gap-4 rounded-2xl bg-ivory shadow-sm p-6">
          <p className="text-charcoal/70">
            This account doesn't have a customer profile{isAdmin ? ' — it is an admin account.' : '.'}
          </p>
          {isAdmin && (
            <Link to="/admin" className="text-gold-dark underline">
              Go to Admin Dashboard
            </Link>
          )}
          <button
            onClick={() => signOut().then(() => navigate('/'))}
            className="border border-gold/30 rounded-lg px-4 py-2 hover:bg-gold/5 transition-colors"
          >
            Log out
          </button>
        </div>
      )}
    </div>
  )
}
