// Authentication API functions for MarcoLand Revival

const API_BASE = '/api/auth'

// Helper function to handle API responses
const handleAuthResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Network error' }))
    throw new Error(errorData.error || `HTTP ${response.status}`)
  }
  return response.json()
}

// Login with email and password
export const loginUser = async (email, password) => {
  try {
    const response = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ email, password })
    })
    
    return await handleAuthResponse(response)
  } catch (error) {
    console.error('Login API error:', error)
    throw error
  }
}

// Register new user and character
export const registerUser = async (email, password, username, characterClass = 'warrior') => {
  try {
    const response = await fetch(`${API_BASE}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ 
        email, 
        password, 
        username,
        characterClass 
      })
    })
    
    return await handleAuthResponse(response)
  } catch (error) {
    console.error('Registration API error:', error)
    throw error
  }
}

// Logout user
export const logoutUser = async () => {
  try {
    const response = await fetch(`${API_BASE}/logout`, {
      method: 'POST',
      credentials: 'include'
    })
    
    // Don't throw on logout errors, just log them
    if (!response.ok) {
      console.warn('Logout request failed:', response.status)
    }
    
    return response.ok
  } catch (error) {
    console.warn('Logout API error:', error)
    return false
  }
}

// Get current session info
export const getSession = async () => {
  try {
    const response = await fetch(`${API_BASE}/session`, {
      credentials: 'include'
    })
    
    if (response.status === 401) {
      return { user: null, session: null }
    }
    
    return await handleAuthResponse(response)
  } catch (error) {
    console.error('Session check error:', error)
    return { user: null, session: null }
  }
}

// Request password reset
export const requestPasswordReset = async (email) => {
  try {
    const response = await fetch(`${API_BASE}/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email })
    })
    
    return await handleAuthResponse(response)
  } catch (error) {
    console.error('Password reset API error:', error)
    throw error
  }
}

// Verify email (if needed)
export const verifyEmail = async (token) => {
  try {
    const response = await fetch(`${API_BASE}/verify-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token })
    })
    
    return await handleAuthResponse(response)
  } catch (error) {
    console.error('Email verification API error:', error)
    throw error
  }
}

// OAuth provider login (Google, Discord, etc.)
export const loginWithOAuth = async (provider) => {
  try {
    const response = await fetch(`${API_BASE}/oauth/${provider}`, {
      method: 'POST',
      credentials: 'include'
    })
    
    const data = await handleAuthResponse(response)
    
    // Redirect to OAuth provider
    if (data.url) {
      window.location.href = data.url
    }
    
    return data
  } catch (error) {
    console.error(`${provider} OAuth error:`, error)
    throw error
  }
}

// Handle OAuth callback
export const handleOAuthCallback = async (accessToken, refreshToken) => {
  try {
    const response = await fetch(`${API_BASE}/oauth/callback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ 
        access_token: accessToken,
        refresh_token: refreshToken 
      })
    })
    
    return await handleAuthResponse(response)
  } catch (error) {
    console.error('OAuth callback error:', error)
    throw error
  }
}

// Check if username is available
export const checkUsernameAvailability = async (username) => {
  try {
    const response = await fetch(`${API_BASE}/check-username`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username })
    })
    
    const data = await handleAuthResponse(response)
    return data.available || false
  } catch (error) {
    console.error('Username check error:', error)
    return false
  }
}

export default {
  loginUser,
  registerUser,
  logoutUser,
  getSession,
  requestPasswordReset,
  verifyEmail,
  loginWithOAuth,
  handleOAuthCallback,
  checkUsernameAvailability
}