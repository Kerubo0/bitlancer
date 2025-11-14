import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import Card from '../components/Card'
import Button from '../components/Button'
import Input from '../components/Input'
import Modal from '../components/Modal'
import api from '../lib/api'
import toast from 'react-hot-toast'

export default function Invoices() {
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    clientName: '',
    clientEmail: '',
    invoiceItems: [{ description: '', quantity: 1, rate: 0, amount: 0 }],
    subtotal: 0,
    amountUsd: 0,
  })

  useEffect(() => {
    fetchInvoices()
  }, [])

  const fetchInvoices = async () => {
    try {
      const { data } = await api.get('/invoices')
      setInvoices(data.invoices)
    } catch (error) {
      toast.error('Failed to load invoices')
    } finally {
      setLoading(false)
    }
  }

  const addItem = () => {
    setFormData({
      ...formData,
      invoiceItems: [...formData.invoiceItems, { description: '', quantity: 1, rate: 0, amount: 0 }],
    })
  }

  const updateItem = (index, field, value) => {
    const items = [...formData.invoiceItems]
    items[index][field] = value

    if (field === 'quantity' || field === 'rate') {
      items[index].amount = items[index].quantity * items[index].rate
    }

    const subtotal = items.reduce((sum, item) => sum + item.amount, 0)

    setFormData({
      ...formData,
      invoiceItems: items,
      subtotal,
      amountUsd: subtotal,
    })
  }

  const removeItem = (index) => {
    const items = formData.invoiceItems.filter((_, i) => i !== index)
    const subtotal = items.reduce((sum, item) => sum + item.amount, 0)

    setFormData({
      ...formData,
      invoiceItems: items,
      subtotal,
      amountUsd: subtotal,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      await api.post('/invoices', formData)
      toast.success('Invoice created successfully!')
      setShowModal(false)
      fetchInvoices()
      setFormData({
        clientName: '',
        clientEmail: '',
        invoiceItems: [{ description: '', quantity: 1, rate: 0, amount: 0 }],
        subtotal: 0,
        amountUsd: 0,
      })
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create invoice')
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      expired: 'bg-gray-100 text-gray-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  return (
    <Layout>
      <div className="p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-primary mb-2">Invoices</h1>
            <p className="text-gray-600">Manage your invoices</p>
          </div>
          <Button onClick={() => setShowModal(true)}>Create Invoice</Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
          </div>
        ) : invoices.length > 0 ? (
          <div className="grid gap-4">
            {invoices.map((invoice) => (
              <Card key={invoice.id} hover>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-primary">
                        {invoice.invoice_number}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                        {invoice.status}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-1">Client: {invoice.client_name}</p>
                    <p className="text-sm text-gray-500">{invoice.client_email}</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Created: {new Date(invoice.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary mb-1">
                      ${invoice.amount_usd.toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-500">{invoice.amount_btc.toFixed(8)} BTC</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <div className="text-center py-12 text-gray-500">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="mb-4">No invoices yet</p>
              <Button onClick={() => setShowModal(true)}>Create Your First Invoice</Button>
            </div>
          </Card>
        )}

        <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Create New Invoice" size="lg">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Client Name"
                value={formData.clientName}
                onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                required
              />
              <Input
                label="Client Email"
                type="email"
                value={formData.clientEmail}
                onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                required
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="label">Invoice Items</label>
                <Button type="button" size="sm" onClick={addItem}>Add Item</Button>
              </div>

              {formData.invoiceItems.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 mb-2">
                  <Input
                    className="col-span-5"
                    placeholder="Description"
                    value={item.description}
                    onChange={(e) => updateItem(index, 'description', e.target.value)}
                    required
                  />
                  <Input
                    className="col-span-2"
                    type="number"
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                    required
                  />
                  <Input
                    className="col-span-2"
                    type="number"
                    step="0.01"
                    placeholder="Rate"
                    value={item.rate}
                    onChange={(e) => updateItem(index, 'rate', parseFloat(e.target.value) || 0)}
                    required
                  />
                  <Input
                    className="col-span-2"
                    type="number"
                    step="0.01"
                    value={item.amount.toFixed(2)}
                    disabled
                  />
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="col-span-1 text-red-500 hover:text-red-700"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">Subtotal:</span>
                <span className="text-xl font-bold">${formData.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-2xl font-bold text-primary">
                <span>Total:</span>
                <span>${formData.amountUsd.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button type="button" variant="secondary" onClick={() => setShowModal(false)} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" className="flex-1">Create Invoice</Button>
            </div>
          </form>
        </Modal>
      </div>
    </Layout>
  )
}
