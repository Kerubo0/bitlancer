import { supabase } from '../utils/db.js'
import bitnobService from '../../../bitnob/bitnob.service.js'

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

    // Get BTC exchange rate
    const fxRate = await bitnobService.getBtcUsdRate()
    const amountBtc = await bitnobService.convertUsdToBtc(amountUsd)

    // Generate slug
    const { data: slugData } = await supabase.rpc('generate_payment_link_slug', {
      title,
    })
    const slug = slugData || `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`

    // Create payment link
    const { data, error } = await supabase
      .from('payment_links')
      .insert({
        user_id: req.user.id,
        title,
        description: description || '',
        amount_usd: amountUsd,
        amount_btc: amountBtc,
        fx_rate: fxRate,
        slug,
        status: 'active',
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
