import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import LoginScreen from './LoginScreen'
import Layout from './Layout'
import HomeScreen from './screens/HomeScreen'
import CityScreen from './screens/CityScreen'
import BattleScreen from './screens/BattleScreen'
import BeachScreen from './screens/BeachScreen'
import CombatScreen from './screens/CombatScreen'
import BlacksmithScreen from './screens/BlacksmithScreen'
import ArmourerScreen from './screens/ArmourerScreen'
import GemsStoreScreen from './screens/GemsStoreScreen'
import MarketScreen from './screens/MarketScreen'
import VoteScreen from './screens/VoteScreen'
import ManaTreeScreen from './screens/ManaTreeScreen'
import TempleScreen from './screens/TempleScreen'
import EquipmentScreen from './screens/EquipmentScreen'

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

  // If authenticated, show the main game interface with routing
  if (user) {
    return (
      <Layout>
        <Routes>
          <Route path="/" element={<HomeScreen />} />
          <Route path="/city" element={<CityScreen />} />
          <Route path="/battle" element={<BattleScreen />} />
          <Route path="/beach" element={<BeachScreen />} />
          <Route path="/combat" element={<CombatScreen />} />
          <Route path="/blacksmith" element={<BlacksmithScreen />} />
          <Route path="/armourer" element={<ArmourerScreen />} />
          <Route path="/gems-store" element={<GemsStoreScreen />} />
          <Route path="/market" element={<MarketScreen />} />
          <Route path="/vote" element={<VoteScreen />} />
          <Route path="/mana-tree" element={<ManaTreeScreen />} />
          <Route path="/temple" element={<TempleScreen />} />
          <Route path="/equipment" element={<EquipmentScreen />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    )
  }

  // If not authenticated, show login screen
  return <LoginScreen />
}

export default AuthWrapper