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
          // Improved error logging to help diagnose connection issues
          if (error.response) {
            console.error('Failed to fetch wallet info - response error:', error.response.status, error.response.data)
          } else if (error.request) {
            console.error('Failed to fetch wallet info - no response from server:', error.message)
          } else {
            console.error('Failed to fetch wallet info:', error.message)
          }
        }
      }
    }
    fetchWalletInfo()
  }, [user])

  const signUp = async (email, password, fullName) => {
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

    // Create wallet for new user
    if (data.user) {
      await walletService.createWallet(data.user.id)
    }

    return data
  }

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
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
