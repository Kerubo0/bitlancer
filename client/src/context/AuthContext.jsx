import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import walletService from '../services/wallet.service'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [walletInfo, setWalletInfo] = useState(null)

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.access_token) {
        localStorage.setItem('supabase.auth.token', session.access_token)
      }
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.access_token) {
        localStorage.setItem('supabase.auth.token', session.access_token)
      } else {
        localStorage.removeItem('supabase.auth.token')
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // Fetch wallet info when user is authenticated
  useEffect(() => {
    const fetchWalletInfo = async () => {
      if (user) {
        try {
          const data = await walletService.getWalletInfo()
          setWalletInfo(data)
        } catch (error) {
          // Don't show error if wallet just doesn't exist yet (404)
          if (error.message && !error.message.includes('not found')) {
            console.error('Failed to fetch wallet info:', error.message)
          } else {
            console.log('Wallet not created yet for user')
          }
        }
      } else {
        setWalletInfo(null)
      }
    }
    fetchWalletInfo()
  }, [user])

  const signUp = async (email, password, fullName) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      })
      
      if (error) throw error

      // Auto-initialize wallet for new user
      if (data.user && data.session) {
        console.log('✅ User signed up successfully, initializing wallet...')
        
        // Store token immediately
        localStorage.setItem('supabase.auth.token', data.session.access_token)
        
        // Initialize wallet (don't wait, do it in background)
        initializeWallet(data.session.access_token)
      }

      return data
    } catch (error) {
      console.error('Signup error:', error)
      throw error
    }
  }

  // Helper function to initialize wallet
  const initializeWallet = async (token) => {
    try {
      console.log('🔄 Initializing wallet...')
      
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/init-wallet`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
      
      const result = await response.json()
      
      if (response.ok) {
        console.log('✅ Wallet initialized:', result.message)
        // Refresh wallet info
        try {
          const walletData = await walletService.getWalletInfo()
          setWalletInfo(walletData)
        } catch (refreshError) {
          console.warn('⚠️  Could not refresh wallet info:', refreshError.message)
        }
      } else {
        console.error('⚠️  Wallet initialization failed:', result.error)
        // Don't throw - allow signup to succeed even if wallet creation fails
      }
    } catch (error) {
      console.error('⚠️  Wallet initialization error:', error.message)
      // Don't throw - allow signup to succeed
    }
  }

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error

    // Check if user has a wallet, initialize if not
    if (data.user && data.session) {
      // Store token
      localStorage.setItem('supabase.auth.token', data.session.access_token)
      
      try {
        const walletData = await walletService.getWalletInfo()
        setWalletInfo(walletData)
      } catch (walletError) {
        // If wallet doesn't exist, initialize it
        if (walletError.message && (walletError.message.includes('not found') || walletError.message.includes('No wallet'))) {
          console.log('No wallet found, initializing...')
          initializeWallet(data.session.access_token)
        }
      }
    }

    return data
  }

  const signInWithMagicLink = async (email) => {
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin + '/dashboard',
      },
    })
    if (error) throw error
    return data
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    setWalletInfo(null)
  }

  const resetPassword = async (email) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/reset-password',
    })
    if (error) throw error
    return data
  }

  const value = {
    user,
    loading,
    walletInfo,
    signUp,
    signIn,
    signInWithMagicLink,
    signOut,
    resetPassword,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
