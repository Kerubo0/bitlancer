import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import Card from '../components/Card'
import Button from '../components/Button'
import { useAuth } from '../context/AuthContext'
import walletService from '../services/wallet.service'
import { formatBTC, formatUSD, copyToClipboard, shortenAddress } from '../lib/bitcoin'
import toast from 'react-hot-toast'

export default function Balances() {
  const { walletInfo } = useAuth()
  const [balance, setBalance] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchBalance()
  }, [])

  const fetchBalance = async () => {
    try {
      const data = await walletService.getBalance()
      setBalance(data)
    } catch (error) {
      toast.error(error.message || 'Failed to load balance')
    } finally {
      setLoading(false)
    }
  }

  const refreshBalance = async () => {
    setRefreshing(true)
    await fetchBalance()
    setRefreshing(false)
    toast.success('Balance refreshed')
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-primary mb-2">Balances</h1>
            <p className="text-gray-600">Your Bitcoin wallet overview</p>
          </div>
          <Button onClick={refreshBalance} disabled={refreshing}>
            {refreshing ? 'Refreshing...' : 'Refresh Balance'}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <h3 className="text-sm font-medium text-gray-600 mb-4">Total Balance (BTC)</h3>
            <p className="text-4xl font-bold text-primary mb-2">
              {formatBTC(balance?.btcBalance)}
            </p>
            <p className="text-lg text-gray-500">Bitcoin</p>
          </Card>

          <Card>
            <h3 className="text-sm font-medium text-gray-600 mb-4">USD Value</h3>
            <p className="text-4xl font-bold text-success mb-2">
              ${formatUSD(balance?.usdBalance)}
            </p>
            <p className="text-lg text-gray-500">US Dollars</p>
          </Card>

          <Card>
            <h3 className="text-sm font-medium text-gray-600 mb-4">Pending</h3>
            <p className="text-4xl font-bold text-warning mb-2">
              {formatBTC(balance?.pendingBalance)}
            </p>
            <p className="text-lg text-gray-500">Unconfirmed</p>
          </Card>
        </div>

        <Card>
          <h3 className="text-lg font-semibold text-primary mb-4">Wallet Information</h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-600">Wallet ID</label>
              <p className="text-gray-900 font-mono mt-1">{walletInfo?.wallet_id || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">On-chain Address</label>
              <p className="text-gray-900 font-mono mt-1 break-all">
                {walletInfo?.onchain_address || 'Not available'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Lightning Address</label>
              <p className="text-gray-900 font-mono mt-1 break-all">
                {walletInfo?.lightning_address || 'Not available'}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  )
}
