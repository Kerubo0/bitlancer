import axios from 'axios'
import dotenv from 'dotenv'

dotenv.config()

const BITNOB_API_URL = process.env.BITNOB_API_URL || 'https://api.bitnob.co/api/v1'
const BITNOB_API_KEY = process.env.BITNOB_API_KEY

const bitnobClient = axios.create({
  baseURL: BITNOB_API_URL,
  headers: {
    'Authorization': `Bearer ${BITNOB_API_KEY}`,
    'Content-Type': 'application/json',
  },
})

/**
 * Bitnob Service
 * Handles all Bitcoin operations via Bitnob API
 */
class BitnobService {
  /**
   * Create a new Bitcoin wallet for a user
   * @param {string} userId - User ID from Supabase
   * @param {string} email - User email
   * @returns {Promise<Object>} Wallet data including addresses
   */
  async createWallet(userId, email) {
    try {
      const response = await bitnobClient.post('/wallets', {
        customerEmail: email,
        customerId: userId,
      })

      return {
        walletId: response.data.data.id,
        onchainAddress: response.data.data.address,
        lightningAddress: response.data.data.lightning?.address || null,
        balance: 0,
      }
    } catch (error) {
      console.error('Bitnob createWallet error:', error.response?.data || error.message)
      throw new Error('Failed to create Bitcoin wallet')
    }
  }

  /**
   * Get wallet balance
   * @param {string} walletId - Bitnob wallet ID
   * @returns {Promise<Object>} Balance information
   */
  async getBalance(walletId) {
    try {
      const response = await bitnobClient.get(`/wallets/${walletId}/balance`)

      return {
        btcBalance: response.data.data.availableBalance || 0,
        usdBalance: response.data.data.usdBalance || 0,
        pendingBalance: response.data.data.pendingBalance || 0,
      }
    } catch (error) {
      console.error('Bitnob getBalance error:', error.response?.data || error.message)
      throw new Error('Failed to fetch wallet balance')
    }
  }

  /**
   * Generate a Lightning invoice
   * @param {string} walletId - Bitnob wallet ID
   * @param {number} amountSats - Amount in satoshis
   * @param {string} description - Invoice description
   * @returns {Promise<Object>} Invoice data
   */
  async generateLightningInvoice(walletId, amountSats, description) {
    try {
      const response = await bitnobClient.post(`/wallets/${walletId}/lightning/invoice`, {
        amount: amountSats,
        description: description,
        expiry: 3600, // 1 hour
      })

      return {
        invoiceId: response.data.data.id,
        paymentRequest: response.data.data.paymentRequest,
        paymentHash: response.data.data.paymentHash,
        amount: response.data.data.amount,
        expiresAt: response.data.data.expiresAt,
      }
    } catch (error) {
      console.error('Bitnob generateLightningInvoice error:', error.response?.data || error.message)
      throw new Error('Failed to generate Lightning invoice')
    }
  }

  /**
   * Generate an on-chain invoice/address
   * @param {string} walletId - Bitnob wallet ID
   * @param {number} amountBtc - Amount in BTC
   * @param {string} description - Invoice description
   * @returns {Promise<Object>} On-chain invoice data
   */
  async generateOnchainInvoice(walletId, amountBtc, description) {
    try {
      const response = await bitnobClient.post(`/wallets/${walletId}/addresses`, {
        amount: amountBtc,
        label: description,
      })

      return {
        address: response.data.data.address,
        amount: response.data.data.amount,
        qrCode: response.data.data.qrCode,
      }
    } catch (error) {
      console.error('Bitnob generateOnchainInvoice error:', error.response?.data || error.message)
      throw new Error('Failed to generate on-chain invoice')
    }
  }

  /**
   * Send Bitcoin from wallet
   * @param {string} walletId - Bitnob wallet ID
   * @param {string} address - Destination address
   * @param {number} amount - Amount in BTC
   * @returns {Promise<Object>} Transaction data
   */
  async sendBitcoin(walletId, address, amount) {
    try {
      const response = await bitnobClient.post(`/wallets/${walletId}/send`, {
        address: address,
        amount: amount,
        priority: 'medium',
      })

      return {
        transactionId: response.data.data.id,
        txHash: response.data.data.hash,
        amount: response.data.data.amount,
        fee: response.data.data.fee,
        status: response.data.data.status,
      }
    } catch (error) {
      console.error('Bitnob sendBitcoin error:', error.response?.data || error.message)
      throw new Error('Failed to send Bitcoin')
    }
  }

  /**
   * Credit a wallet (used after fiat payment)
   * @param {string} walletId - Bitnob wallet ID
   * @param {number} amountBtc - Amount in BTC
   * @param {string} reference - Payment reference
   * @returns {Promise<Object>} Credit transaction data
   */
  async creditWallet(walletId, amountBtc, reference) {
    try {
      const response = await bitnobClient.post('/virtual-accounts/credit', {
        walletId: walletId,
        amount: amountBtc,
        reference: reference,
      })

      return {
        transactionId: response.data.data.id,
        amount: response.data.data.amount,
        status: response.data.data.status,
      }
    } catch (error) {
      console.error('Bitnob creditWallet error:', error.response?.data || error.message)
      throw new Error('Failed to credit wallet')
    }
  }

  /**
   * Get current BTC to USD exchange rate
   * @returns {Promise<number>} Current exchange rate
   */
  async getBtcUsdRate() {
    try {
      const response = await bitnobClient.get('/rates/btc-usd')
      return response.data.data.rate || 0
    } catch (error) {
      console.error('Bitnob getBtcUsdRate error:', error.response?.data || error.message)
      // Fallback to a public API if Bitnob fails
      try {
        const fallback = await axios.get('https://api.coinbase.com/v2/exchange-rates?currency=BTC')
        return parseFloat(fallback.data.data.rates.USD)
      } catch (fallbackError) {
        console.error('Fallback rate fetch error:', fallbackError.message)
        return 0
      }
    }
  }

  /**
   * Convert USD to BTC
   * @param {number} usdAmount - Amount in USD
   * @returns {Promise<number>} Amount in BTC
   */
  async convertUsdToBtc(usdAmount) {
    const rate = await this.getBtcUsdRate()
    if (rate === 0) throw new Error('Unable to fetch exchange rate')
    return usdAmount / rate
  }

  /**
   * Convert BTC to USD
   * @param {number} btcAmount - Amount in BTC
   * @returns {Promise<number>} Amount in USD
   */
  async convertBtcToUsd(btcAmount) {
    const rate = await this.getBtcUsdRate()
    if (rate === 0) throw new Error('Unable to fetch exchange rate')
    return btcAmount * rate
  }

  /**
   * Verify webhook signature
   * @param {Object} payload - Webhook payload
   * @param {string} signature - Webhook signature
   * @returns {boolean} Whether signature is valid
   */
  verifyWebhookSignature(payload, signature) {
    // Implement webhook signature verification
    // This depends on Bitnob's webhook signing method
    const crypto = require('crypto')
    const secret = process.env.BITNOB_WEBHOOK_SECRET

    const computedSignature = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex')

    return computedSignature === signature
  }

  /**
   * Handle webhook event
   * @param {Object} event - Webhook event data
   * @returns {Promise<Object>} Processed event data
   */
  async handleWebhook(event) {
    try {
      const { type, data } = event

      switch (type) {
        case 'payment.received':
          return {
            type: 'payment_received',
            walletId: data.walletId,
            amount: data.amount,
            txHash: data.hash,
            status: 'confirmed',
          }

        case 'lightning.invoice.paid':
          return {
            type: 'lightning_paid',
            invoiceId: data.invoiceId,
            amount: data.amount,
            walletId: data.walletId,
            status: 'confirmed',
          }

        case 'withdrawal.completed':
          return {
            type: 'withdrawal_completed',
            transactionId: data.id,
            amount: data.amount,
            status: 'completed',
          }

        default:
          console.log('Unknown webhook event type:', type)
          return { type: 'unknown', data }
      }
    } catch (error) {
      console.error('Webhook handling error:', error)
      throw error
    }
  }
}

export default new BitnobService()
