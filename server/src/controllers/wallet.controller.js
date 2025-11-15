import { supabase } from '../utils/db.js'
import bitnobService from '../services/bitnob.service.js'

export const createWallet = async (req, res, next) => {
  try {
    const { userId } = req.body
    const user = req.user

    console.log('Creating wallet for user:', userId || user.id)

    // Check if wallet already exists
    const { data: existingProfile, error: checkError } = await supabase
      .from('profiles')
      .select('wallet_id')
      .eq('id', userId || user.id)
      .maybeSingle()  // Changed to maybeSingle to handle missing profiles

    if (checkError) {
      console.error('Error checking existing profile:', checkError)
      throw checkError
    }

    if (existingProfile?.wallet_id) {
      console.log('Wallet already exists:', existingProfile.wallet_id)
      return res.status(400).json({ error: 'Wallet already exists for this user' })
    }

    // Create wallet via Bitnob
    console.log('Calling Bitnob API to create wallet...')
    const walletData = await bitnobService.createWallet(
      userId || user.id,
      user.email
    )

    console.log('Wallet created successfully:', walletData)

    // Update profile with wallet info
    const { data: profile, error } = await supabase
      .from('profiles')
      .upsert({
        id: userId || user.id,
        full_name: user.user_metadata?.full_name || user.email.split('@')[0],
        email: user.email,
        wallet_id: walletData.walletId,
        onchain_address: walletData.onchainAddress,
        lightning_address: walletData.lightningAddress,
        btc_balance: 0,
        usd_balance: 0,
      })
      .select()
      .single()

    if (error) {
      console.error('Error saving profile:', error)
      throw error
    }

    console.log('Profile updated successfully')
    res.status(201).json({ success: true, wallet: profile })
  } catch (error) {
    console.error('Wallet creation error:', error)
    next(error)
  }
}

export const getWalletInfo = async (req, res, next) => {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', req.user.id)
      .maybeSingle()  // Changed from .single() to handle missing profiles gracefully

    if (error) throw error

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found. Please complete signup.' })
    }

    if (!profile.wallet_id) {
      return res.status(404).json({ error: 'Wallet not found. Creating wallet...' })
    }

    res.json(profile)
  } catch (error) {
    next(error)
  }
}

export const getBalance = async (req, res, next) => {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('wallet_id')
      .eq('id', req.user.id)
      .single()

    if (!profile?.wallet_id) {
      return res.status(404).json({ error: 'Wallet not found' })
    }

    // Fetch live balance from Bitnob
    const balance = await bitnobService.getBalance(profile.wallet_id)

    // Update local cache
    await supabase
      .from('profiles')
      .update({
        btc_balance: balance.btcBalance,
        usd_balance: balance.usdBalance,
      })
      .eq('id', req.user.id)

    res.json(balance)
  } catch (error) {
    next(error)
  }
}

export const createLightningAddress = async (req, res, next) => {
  try {
    const { username } = req.body
    
    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, lightning_address')
      .eq('id', req.user.id)
      .single()

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' })
    }

    if (profile.lightning_address) {
      return res.status(400).json({ 
        error: 'Lightning address already exists',
        lightningAddress: profile.lightning_address 
      })
    }

    // Create Lightning address
    console.log('Creating Lightning address for user:', req.user.id)
    const lightningData = await bitnobService.createLightningAddress(
      profile.email,
      username || profile.email.split('@')[0]
    )

    if (!lightningData.lightningAddress) {
      return res.status(500).json({ error: 'Failed to create Lightning address' })
    }

    // Update profile
    const { data: updatedProfile, error } = await supabase
      .from('profiles')
      .update({
        lightning_address: lightningData.lightningAddress,
      })
      .eq('id', req.user.id)
      .select()
      .single()

    if (error) throw error

    res.json({ 
      success: true,
      lightningAddress: lightningData.lightningAddress,
      profile: updatedProfile 
    })
  } catch (error) {
    console.error('Lightning address creation error:', error)
    next(error)
  }
}
