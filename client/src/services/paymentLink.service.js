import api from '../lib/api'

/**
 * Payment Link Service
 * Handles all payment link-related API calls
 */

class PaymentLinkService {
  /**
   * Get all payment links for the current user
   * @param {Object} params - Query parameters
   * @param {string} params.status - Filter by status
   * @param {number} params.limit - Number of results
   * @param {number} params.offset - Offset for pagination
   * @returns {Promise<Array>} Array of payment links
   */
  async getAllPaymentLinks(params = {}) {
    try {
      const response = await api.get('/payment-links', { params })
      return response.data.paymentLinks
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * Get a single payment link by ID
   * @param {string} id - Payment link ID
   * @returns {Promise<Object>} Payment link data
   */
  async getPaymentLink(id) {
    try {
      const response = await api.get(`/payment-links/${id}`)
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * Get a payment link by slug (public)
   * @param {string} slug - Payment link slug
   * @returns {Promise<Object>} Payment link data
   */
  async getPaymentLinkBySlug(slug) {
    try {
      const response = await api.get(`/payment-links/slug/${slug}`)
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * Create a new payment link
   * @param {Object} linkData - Payment link data
   * @returns {Promise<Object>} Created payment link
   */
  async createPaymentLink(linkData) {
    try {
      const response = await api.post('/payment-links', linkData)
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * Update a payment link
   * @param {string} id - Payment link ID
   * @param {Object} updates - Updated fields
   * @returns {Promise<Object>} Updated payment link
   */
  async updatePaymentLink(id, updates) {
    try {
      const response = await api.put(`/payment-links/${id}`, updates)
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * Delete a payment link
   * @param {string} id - Payment link ID
   * @returns {Promise<Object>} Success message
   */
  async deletePaymentLink(id) {
    try {
      const response = await api.delete(`/payment-links/${id}`)
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * Process a payment for a payment link
   * @param {string} id - Payment link ID
   * @param {Object} paymentData - Payment data
   * @returns {Promise<Object>} Payment result
   */
  async processPayment(id, paymentData) {
    try {
      const response = await api.post(`/payment-links/${id}/pay`, paymentData)
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * Initiate USDT payment for a payment link
   * @param {string} id - Payment link ID
   * @returns {Promise<Object>} Payment initiation data with USDT details
   */
  async initiatePayment(id) {
    try {
      const response = await api.post(`/payment-links/${id}/initiate`)
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * Get payment status
   * @param {string} id - Payment link ID
   * @returns {Promise<Object>} Payment status
   */
  async getPaymentStatus(id) {
    try {
      const response = await api.get(`/payment-links/${id}/status`)
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * Confirm USDT payment (called by webhook)
   * @param {Object} webhookData - Webhook data from Bitnob
   * @returns {Promise<Object>} Confirmation result
   */
  async confirmUsdtPayment(webhookData) {
    try {
      const response = await api.post('/payment-links/confirm-usdt', webhookData)
      return response.data
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

export default new PaymentLinkService()
