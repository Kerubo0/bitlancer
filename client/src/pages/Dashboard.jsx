import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Layout from '../components/Layout'
import Card from '../components/Card'
import Button from '../components/Button'
import { useAuth } from '../context/AuthContext'
import walletService from '../services/wallet.service'
import transactionService from '../services/transaction.service'
import { formatBTC, formatUSD, copyToClipboard } from '../lib/bitcoin'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'

export default function Dashboard() {
  const { walletInfo } = useAuth()
  const [balance, setBalance] = useState(null)
  const [recentTransactions, setRecentTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const [balance, transactions] = await Promise.all([
        walletService.getBalance(),
        transactionService.getAllTransactions({ limit: 5 }),
      ])

      setBalance(balance)
      setRecentTransactions(transactions || [])
    } catch (error) {
      toast.error(error.message || 'Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboardHandler = async (text) => {
    const success = await copyToClipboard(text)
    if (success) {
      setCopied(true)
      toast.success('Copied to clipboard!')
      setTimeout(() => setCopied(false), 2000)
    } else {
      toast.error('Failed to copy')
    }
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">Dashboard</h1>
          <p className="text-gray-600">Welcome back! Here's your overview.</p>
        </div>

        {/* Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600">Bitcoin Balance</h3>
              <div className="w-10 h-10 bg-warning/10 rounded-full flex items-center justify-center">
                <span className="text-warning text-xl">₿</span>
              </div>
            </div>
            <p className="text-3xl font-bold text-primary mb-1">
              {formatBTC(balance?.btcBalance)} BTC
            </p>
            <p className="text-sm text-gray-500">
              ≈ ${formatUSD(balance?.usdBalance)} USD
            </p>
          </Card>

          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600">USD Value</h3>
              <div className="w-10 h-10 bg-success/10 rounded-full flex items-center justify-center">
                <span className="text-success text-xl">$</span>
              </div>
            </div>
            <p className="text-3xl font-bold text-primary mb-1">
              ${formatUSD(balance?.usdBalance)}
            </p>
            <p className="text-sm text-gray-500">Available to withdraw</p>
          </Card>

          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600">Pending</h3>
              <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-primary mb-1">
              {formatBTC(balance?.pendingBalance)} BTC
            </p>
            <p className="text-sm text-gray-500">Unconfirmed transactions</p>
          </Card>
        </div>

        {/* Wallet Addresses */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <h3 className="text-lg font-semibold text-primary mb-4">On-chain Address</h3>
            <div className="bg-gray-50 rounded-lg p-4 mb-3">
              <p className="text-sm text-gray-800 font-mono break-all">
                {walletInfo?.onchain_address || 'Not available'}
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => copyToClipboardHandler(walletInfo?.onchain_address)}
              className="w-full"
            >
              {copied ? 'Copied!' : 'Copy Address'}
            </Button>
          </Card>

          <Card>
            <h3 className="text-lg font-semibold text-primary mb-4">Lightning Address</h3>
            <div className="bg-gray-50 rounded-lg p-4 mb-3">
              <p className="text-sm text-gray-800 font-mono break-all">
                {walletInfo?.lightning_address || 'Not available'}
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => copyToClipboardHandler(walletInfo?.lightning_address)}
              className="w-full"
            >
              {copied ? 'Copied!' : 'Copy Address'}
            </Button>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="mb-8">
          <h3 className="text-lg font-semibold text-primary mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link to="/invoices">
              <Button variant="primary" className="w-full">
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create New Invoice
                </span>
              </Button>
            </Link>
            <Link to="/payment-links">
              <Button variant="secondary" className="w-full">
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  Generate Payment Link
                </span>
              </Button>
            </Link>
          </div>
        </Card>

        {/* Recent Transactions */}
        <Card>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-primary">Recent Transactions</h3>
            <Link to="/transactions" className="text-accent hover:underline text-sm">
              View all
            </Link>
          </div>
          {recentTransactions.length > 0 ? (
            <div className="space-y-3">
              {recentTransactions.map((tx) => (
                <motion.div
                  key={tx.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 smooth-animation"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      tx.status === 'completed' ? 'bg-success/10' : 'bg-gray-300'
                    }`}>
                      <svg className={`w-5 h-5 ${tx.status === 'completed' ? 'text-success' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 capitalize">{tx.type.replace('_', ' ')}</p>
                      <p className="text-sm text-gray-500">{new Date(tx.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{tx.amount_btc.toFixed(8)} BTC</p>
                    <p className="text-sm text-gray-500">${tx.amount_usd.toFixed(2)}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p>No transactions yet</p>
            </div>
          )}
        </Card>
      </div>
    </Layout>
  )
}
