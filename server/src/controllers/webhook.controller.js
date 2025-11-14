import { supabase } from '../utils/db.js'
import bitnobService from '../services/bitnob.service.js'

export const handleBitnobWebhook = async (req, res, next) => {
  try {
    const signature = req.headers['x-bitnob-signature']
    const payload = req.body

    // Verify webhook signature
    const isValid = bitnobService.verifyWebhookSignature(payload, signature)

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid webhook signature' })
    }

    // Log webhook event
    const { data: webhookEvent } = await supabase
      .from('webhook_events')
      .insert({
        event_type: payload.type,
        payload,
        processed: false,
      })
      .select()
      .single()

    // Process webhook
    try {
      const processedData = await bitnobService.handleWebhook(payload)

      switch (processedData.type) {
        case 'payment_received':
          await handlePaymentReceived(processedData)
          break

        case 'lightning_paid':
          await handleLightningPaid(processedData)
          break

        case 'withdrawal_completed':
          await handleWithdrawalCompleted(processedData)
          break

        default:
          console.log('Unhandled webhook type:', processedData.type)
      }

      // Mark webhook as processed
      await supabase
        .from('webhook_events')
        .update({ processed: true })
        .eq('id', webhookEvent.id)

      res.json({ success: true })
    } catch (error) {
      // Log error
      await supabase
        .from('webhook_events')
        .update({
          processed: true,
          error: error.message,
        })
        .eq('id', webhookEvent.id)

      throw error
    }
  } catch (error) {
    next(error)
  }
}

// Helper functions
async function handlePaymentReceived(data) {
  // Find user by wallet_id
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, wallet_id')
    .eq('wallet_id', data.walletId)
    .single()

  if (!profile) {
    console.error('Profile not found for wallet:', data.walletId)
    return
  }

  // Create transaction record
  await supabase.from('transactions').insert({
    user_id: profile.id,
    type: 'manual_receive',
    amount_btc: data.amount,
    amount_usd: await bitnobService.convertBtcToUsd(data.amount),
    fx_rate: await bitnobService.getBtcUsdRate(),
    status: 'completed',
    tx_hash: data.txHash,
    payment_method: 'onchain',
  })

  // Update user balance
  const balance = await bitnobService.getBalance(profile.wallet_id)
  await supabase
    .from('profiles')
    .update({
      btc_balance: balance.btcBalance,
      usd_balance: balance.usdBalance,
    })
    .eq('id', profile.id)
}

async function handleLightningPaid(data) {
  // Find invoice by bitnob reference
  const { data: invoice } = await supabase
    .from('invoices')
    .select('*')
    .eq('bitnob_invoice_reference', data.invoiceId)
    .single()

  if (invoice) {
    // Update invoice status
    await supabase
      .from('invoices')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString(),
      })
      .eq('id', invoice.id)

    // Create transaction record
    await supabase.from('transactions').insert({
      user_id: invoice.user_id,
      type: 'invoice',
      reference_id: invoice.id,
      reference_type: 'invoice',
      amount_btc: data.amount,
      amount_usd: invoice.amount_usd,
      fx_rate: invoice.fx_rate,
      status: 'completed',
      payment_method: 'lightning',
    })

    // Update user balance
    const { data: profile } = await supabase
      .from('profiles')
      .select('wallet_id')
      .eq('id', invoice.user_id)
      .single()

    if (profile?.wallet_id) {
      const balance = await bitnobService.getBalance(profile.wallet_id)
      await supabase
        .from('profiles')
        .update({
          btc_balance: balance.btcBalance,
          usd_balance: balance.usdBalance,
        })
        .eq('id', invoice.user_id)
    }
  }
}

async function handleWithdrawalCompleted(data) {
  // Update transaction status
  await supabase
    .from('transactions')
    .update({ status: 'completed' })
    .eq('bitnob_transaction_id', data.transactionId)
}
