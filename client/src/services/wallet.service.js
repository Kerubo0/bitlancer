import api from '../lib/api'

/**
 * Wallet Service
 * Handles all wallet-related API calls
 */

class WalletService {
  /**
   * Create a new Bitcoin wallet for the user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Wallet data
   */
  async createWallet(userId) {
    try {
      const response = await api.post('/wallet/create', { userId })
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * Get wallet information
   * @returns {Promise<Object>} Wallet info
   */
  async getWalletInfo() {
    try {
      const response = await api.get('/wallet/info')
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * Get current wallet balance
   * @returns {Promise<Object>} Balance data with BTC and USD values
   */
  async getBalance() {
    try {
      const response = await api.get('/wallet/balance')
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

export default new WalletService()
