import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import Card from '../components/Card'
import Button from '../components/Button'
import Input from '../components/Input'
import Modal from '../components/Modal'
import api from '../lib/api'
import toast from 'react-hot-toast'

export default function PaymentLinks() {
  const [paymentLinks, setPaymentLinks] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    amountUsd: '',
  })

  useEffect(() => {
    fetchPaymentLinks()
  }, [])

  const fetchPaymentLinks = async () => {
    try {
      const { data } = await api.get('/payment-links')
      setPaymentLinks(data.paymentLinks)
    } catch (error) {
      toast.error('Failed to load payment links')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      await api.post('/payment-links', {
        ...formData,
        amountUsd: parseFloat(formData.amountUsd),
      })
      toast.success('Payment link created successfully!')
      setShowModal(false)
      fetchPaymentLinks()
      setFormData({ title: '', description: '', amountUsd: '' })
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create payment link')
    }
  }

  const copyLink = (slug) => {
    const link = `${window.location.origin}/pay/${slug}`
    navigator.clipboard.writeText(link)
    toast.success('Link copied to clipboard!')
  }

  const getStatusColor = (status) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      paid: 'bg-blue-100 text-blue-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  return (
    <Layout>
      <div className="p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-primary mb-2">Payment Links</h1>
            <p className="text-gray-600">Create shareable payment links</p>
          </div>
          <Button onClick={() => setShowModal(true)}>Create Payment Link</Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
          </div>
        ) : paymentLinks.length > 0 ? (
          <div className="grid gap-4">
            {paymentLinks.map((link) => (
              <Card key={link.id} hover>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-primary">{link.title}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(link.status)}`}>
                        {link.status}
                      </span>
                    </div>
                    {link.description && (
                      <p className="text-gray-600 mb-2">{link.description}</p>
                    )}
                    <p className="text-sm text-gray-500">
                      Created: {new Date(link.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary mb-1">
                      ${link.amount_usd.toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-500">{link.amount_btc.toFixed(8)} BTC</p>
                  </div>
                </div>

                <div className="border-t pt-4 mt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex-1 bg-gray-50 rounded-lg px-4 py-2">
                      <p className="text-sm text-gray-800 font-mono truncate">
                        {window.location.origin}/pay/{link.slug}
                      </p>
                    </div>
                    <Button size="sm" onClick={() => copyLink(link.slug)}>Copy</Button>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Payments</p>
                      <p className="font-semibold">{link.payment_count}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Total Received</p>
                      <p className="font-semibold">${link.total_received_usd.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">BTC Received</p>
                      <p className="font-semibold">{link.total_received_btc.toFixed(8)}</p>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <div className="text-center py-12 text-gray-500">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              <p className="mb-4">No payment links yet</p>
              <Button onClick={() => setShowModal(true)}>Create Your First Link</Button>
            </div>
          </Card>
        )}

        <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Create Payment Link">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Web Development Service"
              required
            />

            <div>
              <label className="label">Description (optional)</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input-field min-h-24"
                placeholder="Describe what this payment is for..."
              />
            </div>

            <Input
              label="Amount (USD)"
              type="number"
              step="0.01"
              value={formData.amountUsd}
              onChange={(e) => setFormData({ ...formData, amountUsd: e.target.value })}
              placeholder="100.00"
              required
            />

            <div className="flex gap-3">
              <Button type="button" variant="secondary" onClick={() => setShowModal(false)} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" className="flex-1">Create Link</Button>
            </div>
          </form>
        </Modal>
      </div>
    </Layout>
  )
}
