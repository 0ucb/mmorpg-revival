import { useContext } from 'react'
import { AuthContext } from '../contexts/AuthContext'

// Custom hook that provides auth utilities and state
export const useAuth = () => {
  const context = useContext(AuthContext)
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
}

// Hook for authentication-related utilities
export const useAuthUtils = () => {
  const { user, session, isAuthenticated } = useAuth()

  // Get authorization header for API requests
  const getAuthHeaders = () => {
    if (!session?.access_token) {
      return {}
    }
    
    return {
      'Authorization': `Bearer ${session.access_token}`
    }
  }

  // Check if user has specific permissions (can be extended later)
  const hasPermission = (permission) => {
    if (!user) return false
    
    // Basic permission checking - can be extended
    switch (permission) {
      case 'equipment:manage':
        return isAuthenticated
      case 'combat:participate': 
        return isAuthenticated
      case 'temple:pray':
        return isAuthenticated
      default:
        return false
    }
  }

  // Format user display name
  const getDisplayName = () => {
    if (!user) return 'Guest'
    return user.user_metadata?.username || 
           user.user_metadata?.full_name || 
           user.email?.split('@')[0] || 
           'Player'
  }

  // Check if session is expired or about to expire
  const isSessionValid = () => {
    if (!session) return false
    
    const now = Math.floor(Date.now() / 1000)
    const expiresAt = session.expires_at || 0
    
    // Consider session invalid if it expires in less than 5 minutes
    return expiresAt > (now + 300)
  }

  return {
    getAuthHeaders,
    hasPermission,
    getDisplayName,
    isSessionValid,
    user,
    session,
    isAuthenticated
  }
}

export default useAuth