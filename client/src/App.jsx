import React from 'react'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import AuthWrapper from './components/AuthWrapper'
import './styles/main.css'
import './styles/auth.css'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AuthWrapper />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App