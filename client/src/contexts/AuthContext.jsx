import React, { createContext, useContext, useEffect, useState } from 'react'

const AuthContext = createContext({})

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [player, setPlayer] = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Check for existing session from backend
    const checkSession = async () => {
      try {
        const response = await fetch('/api/auth/session', {
          credentials: 'include'
        })
        
        if (response.ok) {
          const data = await response.json()
          setUser(data.user)
          setPlayer(data.player)
          setSession(data.session)
        }
      } catch (err) {
        console.error('Error checking session:', err)
      } finally {
        setLoading(false)
      }
    }

    checkSession()
  }, [])


  // Sign in with email and password
  const signIn = async (email, password) => {
    try {
      setError(null)
      setLoading(true)
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Login failed')
      }

      // Set local state from backend response
      setUser(data.user)
      setPlayer(data.player)
      setSession(data.session)
      
      return { data, error: null }
    } catch (error) {
      console.error('Sign in error:', error)
      setError(error.message)
      return { data: null, error }
    } finally {
      setLoading(false)
    }
  }

  // Sign up with email and password
  const signUp = async (email, password, username) => {
    try {
      setError(null)
      setLoading(true)
      
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ 
          email, 
          password, 
          username: username || email.split('@')[0],
          characterClass: 'warrior' 
        })
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Registration failed')
      }

      // After successful registration, sign in
      return await signIn(email, password)
    } catch (error) {
      console.error('Sign up error:', error)
      setError(error.message)
      return { data: null, error }
    } finally {
      setLoading(false)
    }
  }

  // Sign out
  const signOut = async () => {
    try {
      setError(null)
      
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      })
      
      // Clear local state regardless of backend response
      setUser(null)
      setPlayer(null)
      setSession(null)
      
      return { error: null }
    } catch (error) {
      console.error('Sign out error:', error)
      setError(error.message)
      // Still clear local state on error
      setUser(null)
      setPlayer(null)
      setSession(null)
      return { error }
    }
  }

  // Reset password
  const resetPassword = async (email) => {
    try {
      setError(null)
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Password reset failed')
      }
      
      return { data, error: null }
    } catch (error) {
      console.error('Reset password error:', error)
      setError(error.message)
      return { data: null, error }
    }
  }

  const value = {
    user,
    player,
    session,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    resetPassword,
    isAuthenticated: !!user,
    setError
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext)
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  
  return context
}