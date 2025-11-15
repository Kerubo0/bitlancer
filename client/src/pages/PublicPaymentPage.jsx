import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import Card from '../components/Card'
import Button from '../components/Button'
import Input from '../components/Input'
import api from '../lib/api'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import QRCode from 'qrcode'

export default function PublicPaymentPage() {
  const { linkId } = useParams()
  const [paymentLink, setPaymentLink] = useState(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('usdt')
  const [paymentData, setPaymentData] = useState(null)
  const [paymentStatus, setPaymentStatus] = useState('idle')
  const [selectedChain, setSelectedChain] = useState('TRC20')
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const qrCanvasRef = useRef(null)
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    paymentMethod: 'card',
  })

  useEffect(() => {
    fetchPaymentLink()
  }, [linkId])

  const fetchPaymentLink = async () => {
    try {
      const { data } = await api.get(`/payment-links/slug/${linkId}`)
      setPaymentLink(data)

      // If there's a payment link ID, initiate payment
      if (data.id) {
        await initiatePayment(data.id)
      }
    } catch (error) {
      toast.error('Payment link not found')
    } finally {
      setLoading(false)
    }
  }

  const initiatePayment = async (paymentLinkId) => {
    try {
      const { data } = await api.post(`/payment-links/${paymentLinkId}/initiate`)
      setPaymentData(data)
      setPaymentStatus(data.status)

      // Generate QR code for USDT address
      if (data.usdt_receiver) {
        await generateQRCode(data.usdt_receiver, data.usdt_amount)
      }
    } catch (error) {
      console.error('Failed to initiate payment:', error)
      toast.error('Failed to initiate payment')
    }
  }

  const generateQRCode = async (address, amount) => {
    try {
      // For USDT, we can create a payment URI
      // Format: ethereum:{address}?value={amount}&token=USDT
      // Or for TRON: {address} (simple address for TRC20)

      let qrData = address // Default to just the address

      if (selectedChain === 'TRC20') {
        // TRON format - just the address
        qrData = address
      } else {
        // Ethereum format with USDT contract
        qrData = `ethereum:${address}?value=${amount}&token=0xdac17f958d2ee523a2206206994597c13d831ec7`
      }

      // Generate QR code as data URL
      const url = await QRCode.toDataURL(qrData, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })

      setQrCodeUrl(url)
    } catch (error) {
      console.error('Failed to generate QR code:', error)
    }
  }

  // Regenerate QR code when chain changes
  useEffect(() => {
    if (paymentData?.usdt_receiver) {
      generateQRCode(paymentData.usdt_receiver, paymentData.usdt_amount)
    }
  }, [selectedChain, paymentData])

  const handlePayWithUsdt = () => {
    if (!paymentData) return

    setPaymentStatus('WAITING_FOR_USDT')

    // Start polling for payment status
    const pollInterval = setInterval(async () => {
      try {
        const { data } = await api.get(`/payment-links/${paymentLink.id}/status`)
        setPaymentStatus(data.status)

        if (data.status === 'PAID' || data.status === 'failed') {
          clearInterval(pollInterval)

          if (data.status === 'PAID') {
            toast.success('Payment received! BTC has been sent to the freelancer.')
          } else {
            toast.error('Payment failed. Please contact support.')
          }
        }
      } catch (error) {
        console.error('Failed to check payment status:', error)
      }
    }, 10000) // Poll every 10 seconds

    // Clear interval after 30 minutes
    setTimeout(() => clearInterval(pollInterval), 30 * 60 * 1000)
  }

  const openWalletApp = () => {
    if (!paymentData) return

    const amount = paymentData.usdt_amount
    const address = paymentData.usdt_receiver

    // Generate deep link for USDT transfer
    let deepLink = ''
    if (selectedChain === 'TRC20') {
      deepLink = `tronlink://send?to=${address}&amount=${amount}&token=USDT`
    } else {
      deepLink = `ethereum:${address}?value=${amount}&token=0xdac17f958d2ee523a2206206994597c13d831ec7`
    }

    window.open(deepLink, '_blank')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setProcessing(true)

    try {
      await api.post(`/payment-links/${paymentLink.id}/pay`, {
        ...formData,
        amount: paymentLink.amount_usd,
        currency: 'USD',
      })
      toast.success('Payment processed successfully!')
    } catch (error) {
      toast.error(error.response?.data?.error || 'Payment failed')
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-accent-light via-background to-accent/10">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
      </div>
    )
  }

  if (!paymentLink) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-accent-light via-background to-accent/10 px-4">
        <Card className="max-w-md w-full text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-primary mb-2">Payment Link Not Found</h2>
          <p className="text-gray-600">This payment link doesn't exist or has been removed.</p>
        </Card>
      </div>
    )
  }

  // Render payment success page
  if (paymentStatus === 'PAID') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-accent-light via-background to-accent/10 flex items-center justify-center px-4">
        <Card className="max-w-md w-full text-center">
          <div className="text-green-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-primary mb-2">Payment Successful!</h2>
          <p className="text-gray-600 mb-4">BTC has been delivered to the freelancer.</p>
          <p className="text-sm text-gray-500">You can safely close this window.</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent-light via-background to-accent/10 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-primary mb-2">BitLancer Payment</h1>
          <p className="text-gray-600">Secure Bitcoin payment processing</p>
        </motion.div>

        <Card className="mb-6">
          <h2 className="text-2xl font-bold text-primary mb-4">{paymentLink.title}</h2>
          {paymentLink.description && (
            <p className="text-gray-600 mb-6">{paymentLink.description}</p>
          )}

          <div className="bg-accent/5 rounded-lg p-6 mb-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">Amount Due</p>
              <p className="text-5xl font-bold text-primary mb-2">
                ${paymentLink.amount_usd.toFixed(2)}
              </p>
              <p className="text-gray-500">
                ≈ {paymentLink.amount_btc?.toFixed(8) || '0.00000000'} BTC
              </p>
              {paymentData?.usdt_amount && (
                <p className="text-gray-500 mt-2">
                  = {paymentData.usdt_amount.toFixed(2)} USDT
                </p>
              )}
            </div>
          </div>

          {/* Payment Method Selection */}
          <div className="mb-6">
            <label className="label">Select Payment Method</label>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setPaymentMethod('usdt')}
                className={`flex-1 p-4 rounded-lg border-2 transition ${
                  paymentMethod === 'usdt'
                    ? 'border-accent bg-accent/10'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-semibold">USDT</div>
                <div className="text-sm text-gray-600">TRC20 / ERC20</div>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                className={`flex-1 p-4 rounded-lg border-2 transition ${
                  paymentMethod === 'card'
                    ? 'border-accent bg-accent/10'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-semibold">Card</div>
                <div className="text-sm text-gray-600">Credit/Debit</div>
              </button>
            </div>
          </div>

          {/* USDT Payment UI */}
          {paymentMethod === 'usdt' && paymentData && (
            <div className="space-y-6">
              {/* Chain Selector */}
              <div>
                <label className="label">Network</label>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setSelectedChain('TRC20')}
                    className={`flex-1 p-3 rounded-lg border-2 transition ${
                      selectedChain === 'TRC20'
                        ? 'border-accent bg-accent/10'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    TRC20 (TRON)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedChain('ERC20')}
                    className={`flex-1 p-3 rounded-lg border-2 transition ${
                      selectedChain === 'ERC20'
                        ? 'border-accent bg-accent/10'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    ERC20 (Ethereum)
                  </button>
                </div>
              </div>

              {/* Payment Instructions */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800 font-semibold mb-2">Instructions:</p>
                <p className="text-sm text-yellow-700">
                  Send exactly <strong>{paymentData.usdt_amount} USDT</strong> to the address below
                </p>
              </div>

              {/* USDT Amount */}
              <div>
                <label className="label">Amount to Send</label>
                <div className="input-field font-mono text-lg">
                  {paymentData.usdt_amount} USDT
                </div>
              </div>

              {/* USDT Address */}
              <div>
                <label className="label">Payment Address</label>
                <div className="input-field font-mono text-sm break-all">
                  {paymentData.usdt_receiver}
                </div>
              </div>

              {/* QR Code */}
              <div className="flex justify-center">
                <div className="bg-gray-100 p-4 rounded-lg">
                  {qrCodeUrl ? (
                    <img
                      src={qrCodeUrl}
                      alt="USDT Payment QR Code"
                      className="w-64 h-64"
                    />
                  ) : (
                    <div className="w-64 h-64 bg-white flex items-center justify-center border-2 border-gray-300">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto mb-2"></div>
                        <p className="text-gray-500 text-sm">Generating QR Code...</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button
                  onClick={openWalletApp}
                  className="w-full"
                  disabled={paymentStatus === 'WAITING_FOR_USDT'}
                >
                  Open Wallet to Pay
                </Button>
                <Button
                  onClick={handlePayWithUsdt}
                  className="w-full"
                  variant="secondary"
                  disabled={paymentStatus === 'WAITING_FOR_USDT'}
                >
                  {paymentStatus === 'WAITING_FOR_USDT' ? 'Waiting for Payment...' : 'I have sent the payment'}
                </Button>
              </div>

              {/* Payment Status */}
              {paymentStatus === 'WAITING_FOR_USDT' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                    <p className="text-sm text-blue-800">
                      Waiting for USDT payment confirmation...
                    </p>
                  </div>
                </div>
              )}
              {paymentStatus === 'USDT_RECEIVED' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-800">
                    USDT received! Converting to BTC...
                  </p>
                </div>
              )}
              {paymentStatus === 'BTC_SENT' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-800">
                    BTC sent to freelancer! Finalizing...
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Card Payment UI (existing) */}
          {paymentMethod === 'card' && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <Input
                label="Your Name"
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                required
              />

              <Input
                label="Email"
                type="email"
                value={formData.customerEmail}
                onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                required
              />

              <div className="space-y-4">
                <Input label="Card Number" placeholder="4242 4242 4242 4242" required />
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Expiry Date" placeholder="MM/YY" required />
                  <Input label="CVC" placeholder="123" required />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={processing}>
                {processing ? 'Processing...' : `Pay $${paymentLink.amount_usd.toFixed(2)}`}
              </Button>
            </form>
          )}

          <p className="text-xs text-gray-500 text-center mt-6">
            Payment will be converted to Bitcoin and sent to the merchant's wallet
          </p>
        </Card>

        <div className="text-center text-sm text-gray-500">
          <p>Powered by BitLancer • Secure Bitcoin Payments</p>
        </div>
      </div>
    </div>
  )
}
