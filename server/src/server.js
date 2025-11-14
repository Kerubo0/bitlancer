import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import dotenv from 'dotenv'

// Routes
import authRoutes from './routes/auth.routes.js'
import walletRoutes from './routes/wallet.routes.js'
import invoiceRoutes from './routes/invoice.routes.js'
import paymentLinkRoutes from './routes/paymentLink.routes.js'
import transactionRoutes from './routes/transaction.routes.js'
import webhookRoutes from './routes/webhook.routes.js'

// Middleware
import { errorHandler } from './middleware/errorHandler.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

// Middleware
// Allow multiple dev origins configured in FRONTEND_URL (comma-separated)
const rawFrontend = process.env.FRONTEND_URL || 'http://localhost:5173'
const allowedOrigins = rawFrontend.split(',').map((s) => s.trim())

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g., mobile clients, curl)
      if (!origin) return callback(null, true)
      if (allowedOrigins.includes(origin)) return callback(null, true)
      return callback(new Error('CORS policy: origin not allowed'))
    },
    credentials: true,
  })
)
app.use(morgan('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() })
})

// API Routes
app.use('/api/auth', authRoutes)
app.use('/api/wallet', walletRoutes)
app.use('/api/invoices', invoiceRoutes)
app.use('/api/payment-links', paymentLinkRoutes)
app.use('/api/transactions', transactionRoutes)
app.use('/api/webhooks', webhookRoutes)

// Error handling
app.use(errorHandler)

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
  console.log(`📡 Environment: ${process.env.NODE_ENV}`)
})

export default app
