import api from '../lib/api'

/**
 * Invoice Service
 * Handles all invoice-related API calls
 */

class InvoiceService {
  /**
   * Get all invoices for the current user
   * @param {Object} params - Query parameters
   * @param {string} params.status - Filter by status
   * @param {number} params.limit - Number of results
   * @param {number} params.offset - Offset for pagination
   * @returns {Promise<Array>} Array of invoices
   */
  async getAllInvoices(params = {}) {
    try {
      const response = await api.get('/invoices', { params })
      return response.data.invoices
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * Get a single invoice by ID
   * @param {string} id - Invoice ID
   * @returns {Promise<Object>} Invoice data
   */
  async getInvoice(id) {
    try {
      const response = await api.get(`/invoices/${id}`)
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * Create a new invoice
   * @param {Object} invoiceData - Invoice data
   * @returns {Promise<Object>} Created invoice
   */
  async createInvoice(invoiceData) {
    try {
      const response = await api.post('/invoices', invoiceData)
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * Update an existing invoice
   * @param {string} id - Invoice ID
   * @param {Object} updates - Updated fields
   * @returns {Promise<Object>} Updated invoice
   */
  async updateInvoice(id, updates) {
    try {
      const response = await api.put(`/invoices/${id}`, updates)
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * Delete an invoice
   * @param {string} id - Invoice ID
   * @returns {Promise<Object>} Success message
   */
  async deleteInvoice(id) {
    try {
      const response = await api.delete(`/invoices/${id}`)
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * Generate PDF for an invoice
   * @param {string} id - Invoice ID
   * @returns {Promise<Object>} PDF URL or data
   */
  async generatePDF(id) {
    try {
      const response = await api.post(`/invoices/${id}/generate-pdf`)
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * Download PDF for an invoice
   * @param {string} id - Invoice ID
   * @param {string} invoiceNumber - Invoice number for filename
   * @returns {Promise<void>}
   */
  async downloadPDF(id, invoiceNumber = 'invoice') {
    try {
      const response = await api.post(`/invoices/${id}/generate-pdf`, {}, { 
        responseType: 'blob' 
      })
      
      const blob = new Blob([response.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${invoiceNumber}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * Handle API errors
   * @private
   */
  handleError(error) {
    const message = error.response?.data?.error || error.message || 'An error occurred'
    return new Error(message)
  }
}

export default new InvoiceService()
