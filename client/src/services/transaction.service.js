import api from '../lib/api'

/**
 * Transaction Service
 * Handles all transaction-related API calls
 */

class TransactionService {
  /**
   * Get all transactions for the current user
   * @param {Object} params - Query parameters
   * @param {string} params.type - Filter by type
   * @param {string} params.status - Filter by status
   * @param {number} params.limit - Number of results
   * @param {number} params.offset - Offset for pagination
   * @returns {Promise<Array>} Array of transactions
   */
  async getAllTransactions(params = {}) {
    try {
      const response = await api.get('/transactions', { params })
      return response.data.transactions
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * Get a single transaction by ID
   * @param {string} id - Transaction ID
   * @returns {Promise<Object>} Transaction data
   */
  async getTransaction(id) {
    try {
      const response = await api.get(`/transactions/${id}`)
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

export default new TransactionService()
