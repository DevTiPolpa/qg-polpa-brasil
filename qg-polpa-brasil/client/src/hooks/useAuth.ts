import { useEffect, useState } from 'react'
import { getCurrentUser, logout as logoutRequest, type AuthUser } from '../lib/api'

export function useAuth(redirectIfUnauthenticated = false) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  async function loadCurrentUser() {
    setIsLoading(true)

    try {
      const currentUser = await getCurrentUser()
      setUser(currentUser)

      if (redirectIfUnauthenticated && !currentUser) {
        window.location.href = '/login'
      }
    } catch {
      setUser(null)

      if (redirectIfUnauthenticated) {
        window.location.href = '/login'
      }
    } finally {
      setIsLoading(false)
    }
  }

  async function logout() {
    await logoutRequest()
    window.location.href = '/login'
  }

  useEffect(() => {
    loadCurrentUser()
  }, [])

  const isAuthenticated = !!user && !isLoading
  const isAdmin = user?.role === 'ADMIN'

  return { user, isLoading, isAuthenticated, isAdmin, logout }
}