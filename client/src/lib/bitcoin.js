/**
 * Bitcoin utility functions for frontend
 */

/**
 * Format BTC amount with proper decimals
 * @param {number} amount - Amount in BTC
 * @param {number} decimals - Number of decimal places (default 8)
 * @returns {string} Formatted BTC amount
 */
export const formatBTC = (amount, decimals = 8) => {
  if (!amount || isNaN(amount)) return '0.00000000'
  return parseFloat(amount).toFixed(decimals)
}

/**
 * Format USD amount
 * @param {number} amount - Amount in USD
 * @returns {string} Formatted USD amount
 */
export const formatUSD = (amount) => {
  if (!amount || isNaN(amount)) return '0.00'
  return parseFloat(amount).toFixed(2)
}

/**
 * Convert satoshis to BTC
 * @param {number} satoshis - Amount in satoshis
 * @returns {number} Amount in BTC
 */
export const satsToBTC = (satoshis) => {
  return satoshis / 100000000
}

/**
 * Convert BTC to satoshis
 * @param {number} btc - Amount in BTC
 * @returns {number} Amount in satoshis
 */
export const btcToSats = (btc) => {
  return Math.floor(btc * 100000000)
}

/**
 * Shorten Bitcoin address for display
 * @param {string} address - Bitcoin address
 * @param {number} chars - Number of characters to show on each side
 * @returns {string} Shortened address
 */
export const shortenAddress = (address, chars = 6) => {
  if (!address) return ''
  if (address.length <= chars * 2) return address
  return `${address.slice(0, chars)}...${address.slice(-chars)}`
}

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} Success status
 */
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (error) {
    console.error('Failed to copy:', error)
    return false
  }
}

/**
 * Validate Bitcoin address (basic check)
 * @param {string} address - Bitcoin address to validate
 * @returns {boolean} Whether address is valid
 */
export const isValidBitcoinAddress = (address) => {
  if (!address) return false
  
  // Basic validation for Bitcoin addresses
  // Starts with 1, 3, or bc1 and has proper length
  const regexLegacy = /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/
  const regexSegwit = /^bc1[a-z0-9]{39,59}$/
  
  return regexLegacy.test(address) || regexSegwit.test(address)
}

/**
 * Validate Lightning invoice
 * @param {string} invoice - Lightning invoice to validate
 * @returns {boolean} Whether invoice is valid
 */
export const isValidLightningInvoice = (invoice) => {
  if (!invoice) return false
  return invoice.toLowerCase().startsWith('lnbc') || invoice.toLowerCase().startsWith('lntb')
}

/**
 * Calculate transaction fee percentage
 * @param {number} amount - Transaction amount
 * @param {number} fee - Fee amount
 * @returns {number} Fee percentage
 */
export const calculateFeePercentage = (amount, fee) => {
  if (!amount || amount === 0) return 0
  return (fee / amount) * 100
}

/**
 * Get Bitcoin network name from address
 * @param {string} address - Bitcoin address
 * @returns {string} Network name (mainnet/testnet)
 */
export const getNetworkFromAddress = (address) => {
  if (!address) return 'unknown'
  if (address.startsWith('tb1') || address.startsWith('m') || address.startsWith('n')) {
    return 'testnet'
  }
  return 'mainnet'
}

/**
 * Format timestamp to readable date
 * @param {string|Date} timestamp - Timestamp to format
 * @returns {string} Formatted date string
 */
export const formatDate = (timestamp) => {
  if (!timestamp) return 'N/A'
  const date = new Date(timestamp)
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Format relative time (e.g., "2 hours ago")
 * @param {string|Date} timestamp - Timestamp to format
 * @returns {string} Relative time string
 */
export const formatRelativeTime = (timestamp) => {
  if (!timestamp) return 'N/A'
  
  const now = new Date()
  const date = new Date(timestamp)
  const seconds = Math.floor((now - date) / 1000)
  
  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60,
  }
  
  for (const [unit, value] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / value)
    if (interval >= 1) {
      return `${interval} ${unit}${interval > 1 ? 's' : ''} ago`
    }
  }
  
  return 'Just now'
}
