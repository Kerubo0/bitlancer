import axios from 'axios'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

// Get the directory of this file
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load .env from server directory (go up 2 levels: services -> src -> server)
dotenv.config({ path: join(__dirname, '../../.env') })

const BITNOB_API_URL = process.env.BITNOB_API_URL || 'https://sandboxapi.bitnob.co'
const USE_SANDBOX = BITNOB_API_URL.includes('sandbox')

// Fix the base URL - remove duplicate /api/v1 if present
const BASE_URL = BITNOB_API_URL.replace('/api/v1', '')

// Use sandbox for testing if API key is not activated
const FINAL_BASE_URL = 'https://sandboxapi.bitnob.co' // Force sandbox for now
const BITNOB_API_KEY = process.env.BITNOB_API_KEY
const USE_MOCK = process.env.USE_MOCK_BITNOB === 'true' || !BITNOB_API_KEY || BITNOB_API_KEY === 'your_bitnob_api_key'

console.log('🔧 Bitnob Service Configuration:')
console.log('   API URL:', BITNOB_API_URL)
console.log('   API Key:', BITNOB_API_KEY ? `${BITNOB_API_KEY.substring(0, 20)}...` : 'NOT SET')
console.log('   USE_MOCK_BITNOB env var:', process.env.USE_MOCK_BITNOB)
console.log('   USE_MOCK computed:', USE_MOCK)

if (USE_MOCK) {
  console.log('⚠️  WARNING: Using MOCK Bitnob service. Set USE_MOCK_BITNOB=false when you have real credentials.')
} else {
  console.log('✅ Using REAL Bitnob API')
}

const bitnobClient = axios.create({
  baseURL: FINAL_BASE_URL,
  headers: {
    Authorization: `Bearer ${BITNOB_API_KEY}`,
    'Content-Type': 'application/json',
  },
})

// Debug: Log the full URL being constructed
console.log('🔧 Bitnob Client Base URL:', FINAL_BASE_URL)

class BitnobService {
  async createWallet(userId, email) {
    // REAL BITNOB API CALL - 2-step process
    console.log('📞 Creating Bitnob customer and generating Bitcoin address...')
    console.log('   Email:', email)
    console.log('   User ID:', userId)
    console.log('   API URL:', BITNOB_API_URL)
    
    try {
      // Step 1: Create customer in Bitnob
      console.log('   Step 1: Creating customer...')
      let customerId
      
      try {
        const customerResponse = await bitnobClient.post('/api/v1/customers', {
          email: email,
          firstName: email.split('@')[0],
          lastName: 'User',
        })
        customerId = customerResponse.data.data.id
        console.log('   ✅ Customer created:', customerId)
      } catch (customerError) {
        console.error('   ❌ Customer creation failed:')
        console.error('   Status:', customerError.response?.status)
        console.error('   Error:', JSON.stringify(customerError.response?.data, null, 2))
        
        // If customer already exists, provide helpful message
        if (customerError.response?.status === 409 || customerError.response?.status === 400) {
          const errorMsg = customerError.response?.data?.message || ''
          if (errorMsg.includes('already exists') || errorMsg.includes('duplicate')) {
            throw new Error(`A wallet for ${email} already exists in Bitnob. If you need to reset it, please contact support.`)
          }
        }
        
        // Re-throw the original error
        throw customerError
      }

      // Step 2: Generate Bitcoin address for customer
      console.log('   Step 2: Generating Bitcoin address...')
      const addressResponse = await bitnobClient.post('/api/v1/addresses/generate', {
        customerEmail: email,
        currency: 'btc',
        network: 'bitcoin',
      })

      console.log('   ✅ Bitcoin address generated!')
      console.log('   Address data:', JSON.stringify(addressResponse.data, null, 2))

      // Extract the address from response
      const addressData = addressResponse.data.data
      
      // Step 3: Try to create Lightning address (optional, won't fail wallet creation)
      let lightningAddressData = null
      try {
        console.log('   Step 3: Creating Lightning address...')
        lightningAddressData = await this.createLightningAddress(
          email, 
          email.split('@')[0] + Math.random().toString(36).substring(2, 6) // Add random suffix to avoid conflicts
        )
        console.log('   ✅ Lightning address created:', lightningAddressData.lightningAddress)
      } catch (lnError) {
        console.warn('   ⚠️  Lightning address creation skipped:', lnError.message)
      }
      
      return {
        walletId: customerId, // Customer ID serves as wallet ID
        onchainAddress: addressData.address || addressData.btcAddress,
        lightningAddress: lightningAddressData?.lightningAddress || addressData.lightningAddress || null,
        balance: 0,
      }
    } catch (error) {
      console.error('❌ Bitnob createWallet error:')
      console.error('   Status:', error.response?.status)
      console.error('   Data:', JSON.stringify(error.response?.data, null, 2))
      console.error('   Message:', error.message)
      throw new Error(`Failed to create Bitcoin wallet: ${error.response?.data?.message || error.message}`)
    }
  }

  async createLightningAddress(customerEmail, username) {
    console.log('⚡ Creating Lightning address...')
    console.log('   Email:', customerEmail)
    console.log('   Username:', username)
    
    try {
      // Generate Lightning address for customer
      // Endpoint requires: customerEmail, username, and tld
      const response = await bitnobClient.post('/api/v1/lnurl', {
        customerEmail: customerEmail,
        username: username || customerEmail.split('@')[0], // Use email prefix if no username
        tld: 'bitnob.io', // Top-level domain for Lightning address
      })

      console.log('   ✅ Lightning address created!')
      console.log('   Response:', JSON.stringify(response.data, null, 2))
      
      const data = response.data.data || response.data
      
      return {
        lightningAddress: data.lightningAddress || data.lightning_address || data.address || `${username}@bitnob.io`,
        lnurl: data.lnurl || data.lnurlPay || data.lnurl_pay,
        username: data.username || username,
      }
    } catch (error) {
      console.error('❌ Bitnob createLightningAddress error:')
      console.error('   Status:', error.response?.status)
      console.error('   Data:', JSON.stringify(error.response?.data, null, 2))
      console.error('   Message:', error.message)
      
      // Provide helpful error messages
      if (error.response?.status === 401) {
        console.warn('⚠️  Lightning address not enabled for your account. Contact Bitnob support.')
      } else if (error.response?.status === 400) {
        const message = error.response?.data?.message || 'Invalid request'
        const messageStr = Array.isArray(message) ? message.join(', ') : message
        console.warn(`⚠️  Lightning address creation failed: ${messageStr}`)
      } else if (error.response?.status === 409) {
        console.warn('⚠️  Lightning address username already taken. Try a different username.')
      }
      
      // Don't throw error - just log warning and continue without Lightning address
      console.warn('   Continuing without Lightning address...')
      return {
        lightningAddress: null,
        lnurl: null,
        username: null,
      }
    }
  }

  async getBalance(walletId) {
    // REAL BITNOB API CALL
    // Note: In Bitnob, balance is tied to the company wallet, not individual customer addresses
    // For now, return 0 balance. Implement proper balance tracking via transactions later.
    try {
      const response = await bitnobClient.get('/api/v1/wallets')
      
      // Get the Bitcoin wallet from your company wallets
      const btcWallet = response.data.data.find(w => w.currency === 'btc')
      
      if (btcWallet) {
        return {
          btcBalance: btcWallet.balance?.btc || 0,
          usdBalance: btcWallet.balance?.usd || 0,
          pendingBalance: 0,
        }
      }
      
      return {
        btcBalance: 0,
        usdBalance: 0,
        pendingBalance: 0,
      }
    } catch (error) {
      console.error('Bitnob getBalance error:', error.response?.data || error.message)
      throw new Error('Failed to fetch wallet balance')
    }
  }

  async generateLightningInvoice(amountSats, description, customerEmail) {
    console.log('⚡ Generating Lightning invoice...')
    console.log('   Amount:', amountSats, 'sats')
    console.log('   Description:', description)
    console.log('   Customer Email:', customerEmail)
    
    try {
      // Correct endpoint with correct field names
      const response = await bitnobClient.post('/api/v1/wallets/ln/createinvoice', {
        satoshis: amountSats,           // Changed from 'amount' to 'satoshis'
        description: description,
        customerEmail: customerEmail,    // Required field
      })

      console.log('   ✅ Lightning invoice created!')
      console.log('   Response:', JSON.stringify(response.data, null, 2))
      
      // Handle different possible response formats
      const data = response.data.data || response.data
      
      return {
        invoiceId: data.id || data.reference || data.invoice_id || `ln_${Date.now()}`,
        paymentRequest: data.request || data.paymentRequest || data.payment_request || data.pr,
        paymentHash: data.paymentHash || data.payment_hash || data.hash || data.payment_id,
        amount: amountSats,
        expiresAt: data.expiresAt || data.expires_at || data.expiry,
      }
    } catch (error) {
      console.error('❌ Bitnob generateLightningInvoice error:')
      console.error('   Status:', error.response?.status)
      console.error('   Data:', JSON.stringify(error.response?.data, null, 2))
      console.error('   Message:', error.message)
      
      // Provide helpful error messages
      if (error.response?.status === 401) {
        throw new Error('Lightning not enabled for your account. Contact Bitnob support to enable Lightning Network features.')
      }
      
      if (error.response?.status === 404) {
        throw new Error('Lightning endpoint not found. The API may have changed.')
      }
      
      if (error.response?.status === 400) {
        const messages = error.response?.data?.message || []
        throw new Error(`Invalid request: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
      }
      
      throw new Error(`Failed to generate Lightning invoice: ${error.response?.data?.message || error.message}`)
    }
  }

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

  async sendBitcoin(walletId, address, amount) {
    try {
      const response = await bitnobClient.post(`/wallets/send_bitcoin`, {
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

  async getBtcUsdRate() {
    try {
      const response = await bitnobClient.get('/rates/btc-usd')
      return response.data.data.rate || 0
    } catch (error) {
      console.error('Bitnob getBtcUsdRate error:', error.response?.data || error.message)
      try {
        const fallback = await axios.get('https://api.coinbase.com/v2/exchange-rates?currency=BTC')
        return parseFloat(fallback.data.data.rates.USD)
      } catch (fallbackError) {
        console.error('Fallback rate fetch error:', fallbackError.message)
        return 0
      }
    }
  }

  async convertUsdToBtc(usdAmount) {
    const rate = await this.getBtcUsdRate()
    if (rate === 0) throw new Error('Unable to fetch exchange rate')
    return usdAmount / rate
  }

  async convertBtcToUsd(btcAmount) {
    const rate = await this.getBtcUsdRate()
    if (rate === 0) throw new Error('Unable to fetch exchange rate')
    return btcAmount * rate
  }

  verifyWebhookSignature(payload, signature) {
    const crypto = require('crypto')
    const secret = process.env.BITNOB_WEBHOOK_SECRET

    const computedSignature = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex')

    return computedSignature === signature
  }

  async createUsdtVirtualCard(customerEmail, description = 'USDT Payment Receiver', amount = 5) {
    console.log('💳 Generating USDT address on Tron network...')
    console.log('   Email:', customerEmail)
    console.log('   Description:', description)

    try {
      // Generate USDT address on Tron (TRC20) network
      const response = await bitnobClient.post('/api/v1/addresses/tron/generate', {
        customerEmail: customerEmail,
        label: description,
      })

      console.log('   ✅ USDT address generated!')
      console.log('   Response:', JSON.stringify(response.data, null, 2))

      const data = response.data.data || response.data

      return {
        virtualCardId: data.id || data.addressId || `tron_${Date.now()}`,
        usdtAddress: data.address || data.tronAddress || data.depositAddress,
        currency: 'USDT',
        network: 'TRC20',
        qrCode: data.qrCode || null,
        addressDetails: data,
      }
    } catch (error) {
      console.error('❌ Bitnob createUsdtVirtualCard error:')
      console.error('   Status:', error.response?.status)
      console.error('   Data:', JSON.stringify(error.response?.data, null, 2))
      console.error('   Message:', error.message)

      // Provide helpful error messages
      if (error.response?.status === 401) {
        throw new Error('Unauthorized. Check your Bitnob API key.')
      } else if (error.response?.status === 400) {
        const message = error.response?.data?.message || 'Invalid request'
        const messageStr = Array.isArray(message) ? message.join(', ') : message
        throw new Error(`USDT address generation failed: ${messageStr}`)
      }

      throw new Error(`Failed to generate USDT address: ${error.response?.data?.message || error.message}`)
    }
  }

  async getUsdtToBtcRate() {
    try {
      // Get USDT to BTC conversion rate
      // Since USDT is pegged to USD, we can use USD/BTC rate
      const btcUsdRate = await this.getBtcUsdRate()
      return 1 / btcUsdRate // USDT to BTC rate
    } catch (error) {
      console.error('Bitnob getUsdtToBtcRate error:', error.message)
      throw new Error('Failed to fetch USDT/BTC exchange rate')
    }
  }

  async convertUsdtToBtc(usdtAmount) {
    const rate = await this.getUsdtToBtcRate()
    if (rate === 0) throw new Error('Unable to fetch exchange rate')
    return usdtAmount * rate
  }

  async convertBtcToUsdt(btcAmount) {
    const rate = await this.getBtcUsdRate()
    if (rate === 0) throw new Error('Unable to fetch exchange rate')
    return btcAmount * rate
  }

  async convertUsdtToBtcAndSend(usdtAmount, btcAddress, description) {
    console.log('🔄 Converting USDT to BTC and sending...')
    console.log('   USDT Amount:', usdtAmount)
    console.log('   BTC Address:', btcAddress)
    console.log('   Description:', description)

    try {
      // Step 1: Convert USDT to BTC using Bitnob's FX API
      const btcAmount = await this.convertUsdtToBtc(usdtAmount)
      console.log('   Calculated BTC amount:', btcAmount)

      // Step 2: Send BTC to the specified address
      const response = await bitnobClient.post('/api/v1/wallets/send_bitcoin', {
        address: btcAddress,
        amount: btcAmount,
        priority: 'medium',
        description: description,
      })

      console.log('   ✅ BTC sent successfully!')
      console.log('   Response:', JSON.stringify(response.data, null, 2))

      const data = response.data.data || response.data

      return {
        transactionId: data.id || data.transactionId,
        txHash: data.hash || data.txHash || data.txId,
        btcAmount: btcAmount,
        usdtAmount: usdtAmount,
        fee: data.fee || 0,
        status: data.status || 'pending',
      }
    } catch (error) {
      console.error('❌ Bitnob convertUsdtToBtcAndSend error:')
      console.error('   Status:', error.response?.status)
      console.error('   Data:', JSON.stringify(error.response?.data, null, 2))
      console.error('   Message:', error.message)

      throw new Error(`Failed to convert USDT to BTC and send: ${error.response?.data?.message || error.message}`)
    }
  }

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

        case 'usdt.deposit':
        case 'virtualcard.deposit':
          return {
            type: 'usdt_received',
            virtualCardId: data.virtualCardId || data.cardId,
            amount: data.amount,
            currency: data.currency || 'USDT',
            txHash: data.txHash || data.hash,
            sender: data.sender || data.from,
            status: 'confirmed',
            meta: data.meta || {},
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
