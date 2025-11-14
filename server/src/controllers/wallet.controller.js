import { supabase } from '../utils/db.js'
import bitnobService from '../../../bitnob/bitnob.service.js'

export const createWallet = async (req, res, next) => {
  try {
    const { userId } = req.body
    const user = req.user

    // Check if wallet already exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('wallet_id')
      .eq('id', userId || user.id)
      .single()

    if (existingProfile?.wallet_id) {
      return res.status(400).json({ error: 'Wallet already exists for this user' })
    }

    // Create wallet via Bitnob
    const walletData = await bitnobService.createWallet(
      userId || user.id,
      user.email
    )

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

    if (error) throw error

    res.status(201).json({ success: true, wallet: profile })
  } catch (error) {
    next(error)
  }
}

export const getWalletInfo = async (req, res, next) => {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', req.user.id)
      .single()

    if (error) throw error

    if (!profile || !profile.wallet_id) {
      return res.status(404).json({ error: 'Wallet not found' })
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
