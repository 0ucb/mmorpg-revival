import React from 'react'
import { AuthProvider } from './contexts/AuthContext'
import AuthWrapper from './components/AuthWrapper'
import './styles/main.css'
import './styles/auth.css'

function App() {
  return (
    <AuthProvider>
      <AuthWrapper />
    </AuthProvider>
  )
}

export default App