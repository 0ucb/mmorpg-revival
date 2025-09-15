import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

export const LoginScreen = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const { signIn, signUp, resetPassword, loading, error, setError } = useAuth()

  // Handle form submission for login/register
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (!email || !password) {
      setError('Email and password are required')
      return
    }

    if (isSignUp && !username) {
      setError('Username is required for registration')
      return
    }

    try {
      const authFn = isSignUp ? signUp : signIn
      const result = isSignUp 
        ? await authFn(email, password, username)
        : await authFn(email, password)
      
      if (result.error) {
        setError(result.error.message || 'Authentication failed')
      }
      // On success, the AuthContext will handle redirecting to the game
    } catch (err) {
      setError(err.message || 'An unexpected error occurred')
    }
  }

  // Handle forgot password
  const handleForgotPassword = async (e) => {
    e.preventDefault()
    
    if (!email) {
      setError('Please enter your email address')
      return
    }

    try {
      const { error } = await resetPassword(email)
      if (error) {
        setError(error.message)
      } else {
        alert('Password reset email sent! Check your inbox.')
        setShowForgotPassword(false)
      }
    } catch (err) {
      setError(err.message || 'Failed to send reset email')
    }
  }

  // Reset form when switching between login/register
  const toggleMode = () => {
    setIsSignUp(!isSignUp)
    setError(null)
    setShowForgotPassword(false)
    setPassword('')
    if (!isSignUp) setUsername('')
  }

  if (showForgotPassword) {
    return (
      <div className="login-container">
        <div className="login-content">
          <div className="marcoland-title">
            <h1>MarcoLand</h1>
            <p className="tagline">Password Recovery</p>
          </div>

          <div className="login-box game-box">
            <form onSubmit={handleForgotPassword} className="login-form">
              <p className="form-instructions">
                Enter your email address to receive a password reset link.
              </p>
              
              <div className="form-group">
                <label>Email:</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="marcoland-input"
                  placeholder="your@email.com"
                  required
                  disabled={loading}
                />
              </div>
              
              {error && (
                <div className="error-message">{error}</div>
              )}
              
              <button
                type="submit"
                className="marcoland-button primary"
                disabled={loading}
              >
                {loading ? 'Sending...' : 'Send Reset Email'}
              </button>
            </form>

            <div className="auth-divider">── OR ──</div>
            
            <button
              type="button"
              className="marcoland-button secondary"
              onClick={() => setShowForgotPassword(false)}
              disabled={loading}
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="login-container">
      <div className="login-content">
        <div className="marcoland-title">
          <h1>MarcoLand</h1>
          <p className="tagline">Survival meets Destiny</p>
        </div>

        <div className="login-box game-box">
          <form onSubmit={handleSubmit} className="login-form">
            {isSignUp && (
              <div className="form-group">
                <label>Username:</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="marcoland-input"
                  placeholder="Your Character Name"
                  required
                  disabled={loading}
                  minLength={3}
                  maxLength={30}
                />
              </div>
            )}
            
            <div className="form-group">
              <label>Email:</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="marcoland-input"
                placeholder="Your E-Mail"
                required
                disabled={loading}
              />
            </div>
            
            <div className="form-group">
              <label>Password:</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="marcoland-input"
                placeholder="Your Password"
                required
                disabled={loading}
                minLength={6}
              />
            </div>
            
            {error && (
              <div className="error-message">{error}</div>
            )}
            
            <button
              type="submit"
              className="marcoland-button primary"
              disabled={loading}
            >
              {loading ? 'Loading...' : isSignUp ? 'Create Character' : 'Enter MarcoLand'}
            </button>
          </form>

          <div className="auth-divider">── OR ──</div>
          
          <button
            type="button"
            className="marcoland-button secondary"
            onClick={toggleMode}
            disabled={loading}
          >
            {isSignUp ? 'Already have a character? Login' : 'Create New Character'}
          </button>
        </div>

        <div className="auth-links">
          <button 
            className="link-button"
            onClick={() => setShowForgotPassword(true)}
            disabled={loading}
          >
            Forgot Password?
          </button>
          <a href="#what" className="info-link">What is MarcoLand?</a>
        </div>

        {/* Info section that can be toggled */}
        <div className="info-section" id="what" style={{ display: 'none' }}>
          <div className="game-box">
            <h3>What is MarcoLand?</h3>
            <p>
              MarcoLand is a browser-based RPG where survival meets destiny. 
              Create your character, explore dangerous lands, battle monsters, 
              collect equipment, and build your legacy.
            </p>
            <ul>
              <li>Turn-based combat system</li>
              <li>Equipment collection and upgrades</li>
              <li>Character progression and stats</li>
              <li>Temple prayers and mana management</li>
              <li>PvP and guild warfare</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginScreen