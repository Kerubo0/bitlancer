import express from 'express'
import { authenticate } from '../middleware/auth.js'
import { supabase } from '../utils/db.js'
import bitnobService from '../services/bitnob.service.js'

const router = express.Router()

// Health check for auth
router.get('/me', authenticate, async (req, res) => {
  try {
    res.json({ user: req.user })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Initialize wallet after signup
router.post('/init-wallet', authenticate, async (req, res) => {
  try {
    // Check if profile exists
    let { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('wallet_id, email, full_name')
      .eq('id', req.user.id)
      .maybeSingle()

    // Create profile if it doesn't exist
    if (!profile) {
      console.log('📝 Creating profile for user:', req.user.id)
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          id: req.user.id,
          email: req.user.email,
          full_name: req.user.user_metadata?.full_name || req.user.email.split('@')[0],
        })
        .select()
        .single()

      if (createError) {
        console.error('❌ Failed to create profile:', createError)
        throw createError
      }
      
      profile = newProfile
      console.log('✅ Profile created')
    }

    if (profile?.wallet_id) {
      return res.json({ 
        success: true, 
        message: 'Wallet already exists',
        wallet_id: profile.wallet_id 
      })
    }

    // Create wallet via Bitnob
    console.log('🆕 Creating wallet for new user:', req.user.email)
    const walletData = await bitnobService.createWallet(req.user.id, req.user.email)

    // Update profile with wallet info
    const { data: updatedProfile, error } = await supabase
      .from('profiles')
      .update({
        wallet_id: walletData.walletId,
        onchain_address: walletData.onchainAddress,
        lightning_address: walletData.lightningAddress,
        btc_balance: 0,
        usd_balance: 0,
      })
      .eq('id', req.user.id)
      .select()
      .single()

    if (error) throw error

    console.log('✅ Wallet initialized successfully')
    res.json({ 
      success: true, 
      message: 'Wallet created successfully',
      wallet: updatedProfile 
    })
  } catch (error) {
    console.error('❌ Error initializing wallet:', error)
    
    // Provide user-friendly error messages
    if (error.message && error.message.includes('already exists')) {
      return res.status(409).json({ 
        error: 'Wallet already exists for this email in the payment system',
        details: error.message
      })
    }
    
    res.status(500).json({ 
      error: 'Failed to initialize wallet',
      details: error.message 
    })
  }
})

export default router
