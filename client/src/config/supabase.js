import { createClient } from '@supabase/supabase-js'

// Supabase configuration based on server config
const supabaseUrl = 'https://iihkjcqcswjbugsbxxhp.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlpaGtqY3Fjc3dqYnVnc2J4eGhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM4NzQyOTgsImV4cCI6MjA0OTQ1MDI5OH0.JPJCPXB17Q7Yr_f8mRJAK1avOL8PpWFWAu1BT0jzHvM'

// Create the Supabase client with auth options configured for frontend
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: window.localStorage
  }
})

// Auth event listener helper
export const onAuthStateChange = (callback) => {
  return supabase.auth.onAuthStateChange(callback)
}

// Get current session
export const getCurrentSession = async () => {
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

// Get current user  
export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}