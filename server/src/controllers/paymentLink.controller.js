import { supabase } from '../utils/db.js'
import bitnobService from '../services/bitnob.service.js'

export const getAllPaymentLinks = async (req, res, next) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query

    let query = supabase
      .from('payment_links')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) throw error

    res.json({ paymentLinks: data })
  } catch (error) {
    next(error)
  }
}

export const getPaymentLink = async (req, res, next) => {
  try {
    const { id } = req.params

    const { data, error } = await supabase
      .from('payment_links')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.user.id)
      .single()

    if (error) throw error
    if (!data) return res.status(404).json({ error: 'Payment link not found' })

    res.json(data)
  } catch (error) {
    next(error)
  }
}

export const getPaymentLinkBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params

    const { data, error } = await supabase
      .from('payment_links')
      .select('*')
      .eq('slug', slug)
      .single()

    if (error) throw error
    if (!data) return res.status(404).json({ error: 'Payment link not found' })

    res.json(data)
  } catch (error) {
    next(error)
  }
}

export const createPaymentLink = async (req, res, next) => {
  try {
    const { title, description, amountUsd } = req.body

    // Get user's profile for email
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, wallet_id')
      .eq('id', req.user.id)
      .single()

    if (!profile) {
      return res.status(400).json({ error: 'User profile not found' })
    }

    // Get BTC exchange rate and calculate amounts
    const fxRate = await bitnobService.getBtcUsdRate()
    const amountBtc = await bitnobService.convertUsdToBtc(amountUsd)
    const usdtAmount = amountUsd // USDT is pegged 1:1 with USD

    // Create BTC address for freelancer to receive payment
    let btcAddress = null
    if (profile.wallet_id) {
      // Get wallet details to extract BTC address
      const { data: walletData } = await supabase
        .from('profiles')
        .select('onchain_address')
        .eq('id', req.user.id)
        .single()
      btcAddress = walletData?.onchain_address
    }

    // Create USDT virtual card/account for receiving client payment
    const virtualCard = await bitnobService.createUsdtVirtualCard(
      profile.email,
      `Payment Link: ${title}`
    )

    // Generate slug
    const { data: slugData } = await supabase.rpc('generate_payment_link_slug', {
      title,
    })
    const slug = slugData || `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`

    // Create payment link with USDT fields
    const { data, error } = await supabase
      .from('payment_links')
      .insert({
        user_id: req.user.id,
        title,
        description: description || '',
        amount_usd: amountUsd,
        amount_btc: amountBtc,
        usdt_amount: usdtAmount,
        btc_address: btcAddress,
        bitnob_usdt_virtual_account_id: virtualCard.virtualCardId,
        fx_rate: fxRate,
        slug,
        status: 'active',
        payment_status: 'pending',
      })
      .select()
      .single()

    if (error) throw error

    res.status(201).json(data)
  } catch (error) {
    next(error)
  }
}

export const updatePaymentLink = async (req, res, next) => {
  try {
    const { id } = req.params
    const updates = req.body

    // If amount is updated, recalculate BTC amount
    if (updates.amountUsd) {
      const fxRate = await bitnobService.getBtcUsdRate()
      const amountBtc = await bitnobService.convertUsdToBtc(updates.amountUsd)
      updates.fx_rate = fxRate
      updates.amount_btc = amountBtc
    }

    const { data, error } = await supabase
      .from('payment_links')
      .update(updates)
      .eq('id', id)
      .eq('user_id', req.user.id)
      .select()
      .single()

    if (error) throw error
    if (!data) return res.status(404).json({ error: 'Payment link not found' })

    res.json(data)
  } catch (error) {
    next(error)
  }
}

export const deletePaymentLink = async (req, res, next) => {
  try {
    const { id } = req.params

    const { error } = await supabase
      .from('payment_links')
      .delete()
      .eq('id', id)
      .eq('user_id', req.user.id)

    if (error) throw error

    res.json({ success: true, message: 'Payment link deleted successfully' })
  } catch (error) {
    next(error)
  }
}

export const initiatePayment = async (req, res, next) => {
  try {
    const { id } = req.params

    // Get payment link
    const { data: paymentLink, error } = await supabase
      .from('payment_links')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !paymentLink) {
      return res.status(404).json({ error: 'Payment link not found' })
    }

    if (paymentLink.status !== 'active') {
      return res.status(400).json({ error: 'Payment link is not active' })
    }

    // Update payment status to WAITING_FOR_USDT
    await supabase
      .from('payment_links')
      .update({ payment_status: 'WAITING_FOR_USDT' })
      .eq('id', id)

    // Return payment details for frontend
    res.json({
      btc_address: paymentLink.btc_address,
      usdt_amount: paymentLink.usdt_amount,
      usdt_receiver: paymentLink.bitnob_usdt_virtual_account_id,
      status: 'WAITING_FOR_USDT',
      amount_usd: paymentLink.amount_usd,
      title: paymentLink.title,
      description: paymentLink.description,
    })
  } catch (error) {
    next(error)
  }
}

export const confirmUsdtPayment = async (req, res, next) => {
  try {
    const { virtualCardId, amount, txHash, sender, meta } = req.body

    // Find payment link by virtual card ID
    const { data: paymentLink, error } = await supabase
      .from('payment_links')
      .select('*')
      .eq('bitnob_usdt_virtual_account_id', virtualCardId)
      .single()

    if (error || !paymentLink) {
      console.error('Payment link not found for virtual card:', virtualCardId)
      return res.status(404).json({ error: 'Payment link not found' })
    }

    // Update payment link with USDT receipt
    await supabase
      .from('payment_links')
      .update({
        payment_status: 'USDT_RECEIVED',
        usdt_tx_hash: txHash,
      })
      .eq('id', paymentLink.id)

    // Convert USDT to BTC and send to freelancer
    if (paymentLink.btc_address) {
      try {
        const btcResult = await bitnobService.convertUsdtToBtcAndSend(
          amount,
          paymentLink.btc_address,
          `Payment Link: ${paymentLink.title}`
        )

        // Update payment link with BTC transaction details
        await supabase
          .from('payment_links')
          .update({
            payment_status: 'BTC_SENT',
            btc_tx_hash: btcResult.txHash,
            btc_amount: btcResult.btcAmount,
          })
          .eq('id', paymentLink.id)

        // Mark as PAID once BTC is sent
        await supabase
          .from('payment_links')
          .update({
            payment_status: 'PAID',
            confirmed_at: new Date().toISOString(),
            payment_count: paymentLink.payment_count + 1,
            total_received_usd: paymentLink.total_received_usd + amount,
            total_received_btc: paymentLink.total_received_btc + btcResult.btcAmount,
          })
          .eq('id', paymentLink.id)

        // Create transaction record
        await supabase.from('transactions').insert({
          user_id: paymentLink.user_id,
          type: 'payment_link',
          reference_id: paymentLink.id,
          reference_type: 'payment_link',
          amount_usd: amount,
          amount_btc: btcResult.btcAmount,
          fx_rate: await bitnobService.getBtcUsdRate(),
          status: 'completed',
          payment_method: 'usdt',
          bitnob_transaction_id: btcResult.transactionId,
          metadata: {
            usdt_tx_hash: txHash,
            btc_tx_hash: btcResult.txHash,
            sender: sender,
            meta: meta,
          },
        })

        res.json({
          success: true,
          status: 'PAID',
          btc_tx_hash: btcResult.txHash,
          message: 'Payment received and BTC sent to freelancer',
        })
      } catch (btcError) {
        console.error('Error converting USDT to BTC:', btcError)

        // Update status to show error
        await supabase
          .from('payment_links')
          .update({ payment_status: 'failed' })
          .eq('id', paymentLink.id)

        return res.status(500).json({
          error: 'USDT received but BTC conversion failed',
          details: btcError.message,
        })
      }
    } else {
      return res.status(400).json({ error: 'BTC address not found for freelancer' })
    }
  } catch (error) {
    next(error)
  }
}

export const getPaymentStatus = async (req, res, next) => {
  try {
    const { id } = req.params

    const { data: paymentLink, error } = await supabase
      .from('payment_links')
      .select('payment_status, usdt_tx_hash, btc_tx_hash, btc_amount, confirmed_at')
      .eq('id', id)
      .single()

    if (error || !paymentLink) {
      return res.status(404).json({ error: 'Payment link not found' })
    }

    res.json({
      status: paymentLink.payment_status,
      usdt_tx_hash: paymentLink.usdt_tx_hash,
      btc_tx_hash: paymentLink.btc_tx_hash,
      btc_amount: paymentLink.btc_amount,
      confirmed_at: paymentLink.confirmed_at,
    })
  } catch (error) {
    next(error)
  }
}

export const processPayment = async (req, res, next) => {
  try {
    const { id } = req.params
    const { paymentMethod, amount, customerEmail, customerName } = req.body

    // Get payment link
    const { data: paymentLink } = await supabase
      .from('payment_links')
      .select('*')
      .eq('id', id)
      .single()

    if (!paymentLink) {
      return res.status(404).json({ error: 'Payment link not found' })
    }

    if (paymentLink.status !== 'active') {
      return res.status(400).json({ error: 'Payment link is not active' })
    }

    // Get user's wallet
    const { data: profile } = await supabase
      .from('profiles')
      .select('wallet_id')
      .eq('id', paymentLink.user_id)
      .single()

    if (!profile?.wallet_id) {
      return res.status(400).json({ error: 'Wallet not found for merchant' })
    }

    // Process fiat payment (integrate with Stripe or other PSP)
    // For now, simulate successful payment
    const paymentSuccessful = true

    if (paymentSuccessful) {
      // Convert USD to BTC
      const amountBtc = await bitnobService.convertUsdToBtc(amount)

      // Credit merchant's wallet
      const creditResult = await bitnobService.creditWallet(
        profile.wallet_id,
        amountBtc,
        `Payment Link: ${paymentLink.title}`
      )

      // Create transaction record
      const { data: transaction } = await supabase
        .from('transactions')
        .insert({
          user_id: paymentLink.user_id,
          type: 'payment_link',
          reference_id: paymentLink.id,
          reference_type: 'payment_link',
          amount_usd: amount,
          amount_btc: amountBtc,
          fx_rate: await bitnobService.getBtcUsdRate(),
          status: 'completed',
          payment_method: paymentMethod,
          bitnob_transaction_id: creditResult.transactionId,
          metadata: {
            customer_email: customerEmail,
            customer_name: customerName,
          },
        })
        .select()
        .single()

      // Update payment link stats
      await supabase
        .from('payment_links')
        .update({
          payment_count: paymentLink.payment_count + 1,
          total_received_usd: paymentLink.total_received_usd + amount,
          total_received_btc: paymentLink.total_received_btc + amountBtc,
        })
        .eq('id', id)

      res.json({
        success: true,
        transaction,
        message: 'Payment processed successfully',
      })
    } else {
      throw new Error('Payment processing failed')
    }
  } catch (error) {
    next(error)
  }
}
