import { Navigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'

export default function AdminRoute({ children }: { children: React.ReactNode }) {
  const { session, isAdmin, loading } = useAuth()

  if (loading) return null
  if (!session || !isAdmin) return <Navigate to="/admin/login" replace />

  return <>{children}</>
}
