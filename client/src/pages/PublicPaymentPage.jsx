import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import Card from '../components/Card'
import Button from '../components/Button'
import Input from '../components/Input'
import api from '../lib/api'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'

export default function PublicPaymentPage() {
  const { linkId } = useParams()
  const [paymentLink, setPaymentLink] = useState(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
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
    } catch (error) {
      toast.error('Payment link not found')
    } finally {
      setLoading(false)
    }
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
                ≈ {paymentLink.amount_btc.toFixed(8)} BTC
              </p>
            </div>
          </div>

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

            <div>
              <label className="label">Payment Method</label>
              <select
                className="input-field"
                value={formData.paymentMethod}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                required
              >
                <option value="card">Credit/Debit Card</option>
                <option value="bank">Bank Transfer</option>
              </select>
            </div>

            {formData.paymentMethod === 'card' && (
              <div className="space-y-4">
                <Input label="Card Number" placeholder="4242 4242 4242 4242" required />
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Expiry Date" placeholder="MM/YY" required />
                  <Input label="CVC" placeholder="123" required />
                </div>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={processing}>
              {processing ? 'Processing...' : `Pay $${paymentLink.amount_usd.toFixed(2)}`}
            </Button>

            <p className="text-xs text-gray-500 text-center">
              Payment will be converted to Bitcoin and sent to the merchant's wallet
            </p>
          </form>
        </Card>

        <div className="text-center text-sm text-gray-500">
          <p>Powered by BitLancer • Secure Bitcoin Payments</p>
        </div>
      </div>
    </div>
  )
}
