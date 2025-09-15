import React from 'react'
import { useAuth } from '../contexts/AuthContext'
import LoginScreen from './LoginScreen'
import Layout from './Layout'
import EquipmentScreen from './EquipmentScreen'

export const AuthWrapper = () => {
  const { user, loading, error } = useAuth()

  // Show loading screen while checking authentication
  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-content">
          <div className="marcoland-title">
            <h1>MarcoLand</h1>
            <p className="tagline">Loading...</p>
          </div>
          <div className="loading-spinner"></div>
          <p className="loading-text">Checking authentication...</p>
        </div>
      </div>
    )
  }

  // Show error screen if there's a critical auth error
  if (error && !user) {
    return (
      <div className="error-screen">
        <div className="error-content">
          <div className="marcoland-title">
            <h1>MarcoLand</h1>
            <p className="tagline">Connection Error</p>
          </div>
          <div className="error-box game-box">
            <h3>Authentication Error</h3>
            <p className="error-message">{error}</p>
            <button 
              className="marcoland-button primary"
              onClick={() => window.location.reload()}
            >
              Retry Connection
            </button>
          </div>
        </div>
      </div>
    )
  }

  // If authenticated, show the main game interface
  if (user) {
    return (
      <Layout>
        <EquipmentScreen />
      </Layout>
    )
  }

  // If not authenticated, show login screen
  return <LoginScreen />
}

export default AuthWrapper