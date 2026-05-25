import { Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase, isAdmin } from '../lib/supabase'

export default function ProtectedRoute({ children }) {
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setAuthorized(false)
        setLoading(false)
        return
      }
      
      const admin = await isAdmin()
      if (admin) {
        setAuthorized(true)
      } else {
        setAuthorized(false)
      }
      setLoading(false)
    }
    
    checkAuth()
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return authorized ? children : <Navigate to="/login" replace />
}
