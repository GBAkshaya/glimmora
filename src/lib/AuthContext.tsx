import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabaseClient'

type Customer = {
  id: string
  whatsapp_number: string
  name: string
}

type AuthContextValue = {
  session: Session | null
  customer: Customer | null
  isAdmin: boolean
  loading: boolean
  refreshCustomer: () => Promise<void>
  refreshAdmin: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  async function loadCustomer(userId: string) {
    const { data } = await supabase
      .from('customers')
      .select('id, whatsapp_number, name')
      .eq('id', userId)
      .maybeSingle()
    setCustomer(data ?? null)
  }

  async function loadIsAdmin() {
    const { data } = await supabase.rpc('is_admin')
    setIsAdmin(data === true)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) {
        Promise.all([loadCustomer(session.user.id), loadIsAdmin()]).finally(() => setLoading(false))
      } else {
        setLoading(false)
      }
    })

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) {
        loadCustomer(session.user.id)
        loadIsAdmin()
      } else {
        setCustomer(null)
        setIsAdmin(false)
      }
    })

    return () => subscription.subscription.unsubscribe()
  }, [])

  async function refreshCustomer() {
    if (session) await loadCustomer(session.user.id)
  }

  async function refreshAdmin() {
    if (session) await loadIsAdmin()
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider
      value={{ session, customer, isAdmin, loading, refreshCustomer, refreshAdmin, signOut }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
