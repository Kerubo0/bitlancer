# Bitnob Integration Architecture

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                         │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Dashboard   │  │   Balances   │  │   Invoices   │          │
│  │              │  │              │  │              │          │
│  │  - Balance   │  │  - BTC/USD   │  │  - Create    │          │
│  │  - Addresses │  │  - Refresh   │  │  - List      │          │
│  │  - Tx List   │  │  - Pending   │  │  - PDF Gen   │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                 │                 │                   │
│         └─────────────────┴─────────────────┘                   │
│                           │                                     │
│         ┌─────────────────┴─────────────────┐                   │
│         │                                   │                   │
│    ┌────▼────┐                         ┌───▼────┐              │
│    │ Service │                         │ Utils  │              │
│    │  Layer  │                         │        │              │
│    │         │                         │ BTC    │              │
│    │ wallet  │                         │ Utils  │              │
│    │ invoice │                         │        │              │
│    │ payment │                         │ Format │              │
│    │ tx      │                         │ Valid  │              │
│    └────┬────┘                         └────────┘              │
│         │                                                       │
│         │  HTTP Requests (Axios)                               │
│         │                                                       │
└─────────┼───────────────────────────────────────────────────────┘
          │
          │  POST/GET /api/*
          │  Auth: Bearer JWT
          │
┌─────────▼───────────────────────────────────────────────────────┐
│                       BACKEND (Express)                          │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                      Middleware                          │   │
│  │  - CORS          - Auth (JWT)     - Error Handler       │   │
│  │  - Morgan        - Validation     - Request Logging     │   │
│  └──────────────────────────────────────────────────────────┘   │
│                           │                                     │
│  ┌────────────────────────┴─────────────────────────┐           │
│  │                    Routes                        │           │
│  │                                                  │           │
│  │  /api/wallet         /api/invoices              │           │
│  │  /api/payment-links  /api/transactions          │           │
│  │  /api/webhooks       /api/auth                  │           │
│  └────────────────────────┬─────────────────────────┘           │
│                           │                                     │
│  ┌────────────────────────▼─────────────────────────┐           │
│  │                  Controllers                     │           │
│  │                                                  │           │
│  │  - wallet.controller    - invoice.controller    │           │
│  │  - paymentLink.controller                       │           │
│  │  - transaction.controller                       │           │
│  │  - webhook.controller                           │           │
│  └────────────────────────┬─────────────────────────┘           │
│                           │                                     │
└───────────────────────────┼─────────────────────────────────────┘
                            │
          ┌─────────────────┴─────────────────┐
          │                                   │
          │                                   │
┌─────────▼──────────┐            ┌───────────▼──────────┐
│  Bitnob Service    │            │   Supabase Client    │
│                    │            │                      │
│  - createWallet    │            │  - Auth              │
│  - getBalance      │            │  - Database          │
│  - genLnInvoice    │            │  - RLS Policies      │
│  - convertUSD/BTC  │            │  - Triggers          │
│  - verifyWebhook   │            │                      │
│  - handleWebhook   │            │  Tables:             │
│                    │            │  - profiles          │
└─────────┬──────────┘            │  - invoices          │
          │                       │  - payment_links     │
          │ HTTPS API Calls       │  - transactions      │
          │                       │  - webhook_events    │
┌─────────▼──────────┐            └──────────────────────┘
│   Bitnob API       │
│                    │
│  - Wallet Mgmt     │
│  - Lightning       │
│  - Onchain         │
│  - Conversions     │
│  - Webhooks        │
│                    │
└────────────────────┘
```

## Data Flow Examples

### 1. User Signup Flow
```
User → Signup Form → AuthContext.signUp()
  → Supabase Auth (create user)
  → walletService.createWallet()
  → Backend /api/wallet/create
  → bitnobService.createWallet()
  → Bitnob API
  ← Wallet Created (addresses, ID)
  ← Store in Supabase profiles
  ← Return to Frontend
  → Redirect to Dashboard
```

### 2. Create Invoice Flow
```
User → Invoice Form → invoiceService.createInvoice()
  → Backend /api/invoices
  → Get user's wallet_id from Supabase
  → bitnobService.getBtcUsdRate()
  → bitnobService.convertUsdToBtc()
  → bitnobService.generateLightningInvoice()
  → Bitnob API (create LN invoice)
  ← Lightning invoice data
  ← Generate invoice number (Supabase function)
  ← Store in Supabase invoices table
  ← Return invoice with payment_request
  → Display to user
  → User shares payment link with client
```

### 3. Payment Received Flow
```
Client Pays → Bitnob detects payment
  → Sends webhook to /api/webhooks/bitnob
  → Verify webhook signature
  → Log in webhook_events table
  → Process event type
  → Update invoice status to 'paid'
  → Create transaction record
  → Update user balance
  → Mark webhook as processed
  → (Future: Send email notification)
```

### 4. Check Balance Flow
```
User → Dashboard → walletService.getBalance()
  → Backend /api/wallet/balance
  → Get wallet_id from Supabase
  → bitnobService.getBalance(wallet_id)
  → Bitnob API
  ← Balance data (BTC, USD, pending)
  ← Update Supabase cache
  ← Return to Frontend
  → formatBTC() / formatUSD()
  → Display in UI
```

## Component Dependencies

```
Dashboard.jsx
├── walletService.getBalance()
├── transactionService.getAllTransactions()
├── formatBTC()
├── formatUSD()
└── copyToClipboard()

Balances.jsx
├── walletService.getBalance()
├── formatBTC()
├── formatUSD()
└── AuthContext (walletInfo)

Invoices.jsx
├── invoiceService.getAllInvoices()
├── invoiceService.createInvoice()
├── formatBTC()
└── formatUSD()

AuthContext.jsx
├── walletService.getWalletInfo()
├── walletService.createWallet()
└── Supabase Auth

Services (all)
└── api.js (Axios instance)
    ├── Auto-attach JWT token
    ├── Handle 401 errors
    └── Error interceptors
```

## Security Layers

```
┌─────────────────────────────────────────┐
│  Frontend Security                      │
│  - No API keys in client code          │
│  - JWT stored in localStorage          │
│  - Auto logout on 401                  │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│  API Security                           │
│  - JWT verification middleware         │
│  - CORS configuration                  │
│  - Rate limiting (TODO)                │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│  Database Security                      │
│  - Row Level Security (RLS)            │
│  - Service role for backend only       │
│  - User can only access own data       │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│  External API Security                  │
│  - API keys in .env (server only)      │
│  - Webhook signature verification      │
│  - HTTPS only                          │
└─────────────────────────────────────────┘
```

## Technology Stack

### Frontend
- **Framework:** React 18
- **Build Tool:** Vite
- **Styling:** TailwindCSS
- **Animation:** Framer Motion
- **HTTP Client:** Axios
- **Notifications:** React Hot Toast
- **Routing:** React Router

### Backend
- **Runtime:** Node.js
- **Framework:** Express
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth (JWT)
- **Validation:** Zod
- **Logging:** Morgan

### External Services
- **Bitcoin:** Bitnob API
- **Database:** Supabase
- **Payment Gateway:** Stripe (TODO)
- **Email:** SendGrid/Resend (TODO)

## File Organization

```
client/src/
├── lib/                    # Utilities
│   ├── api.js             # Axios instance
│   ├── supabase.js        # Supabase client
│   └── bitcoin.js         # Bitcoin utils (NEW)
│
├── services/              # API Services (NEW)
│   ├── wallet.service.js
│   ├── invoice.service.js
│   ├── paymentLink.service.js
│   └── transaction.service.js
│
├── context/               # React Context
│   └── AuthContext.jsx
│
├── components/            # Reusable UI
│   ├── Button.jsx
│   ├── Card.jsx
│   ├── Input.jsx
│   ├── Modal.jsx
│   ├── Layout.jsx
│   └── ProtectedRoute.jsx
│
└── pages/                 # Page Components
    ├── Login.jsx
    ├── Signup.jsx
    ├── Dashboard.jsx
    ├── Balances.jsx
    ├── Invoices.jsx
    ├── PaymentLinks.jsx
    ├── Transactions.jsx
    ├── Settings.jsx
    └── PublicPaymentPage.jsx
```

## Environment Variables Flow

```
Production .env files → Build process → App runtime

Client:
  VITE_SUPABASE_URL      → import.meta.env.VITE_SUPABASE_URL
  VITE_SUPABASE_ANON_KEY → import.meta.env.VITE_SUPABASE_ANON_KEY
  VITE_API_URL           → import.meta.env.VITE_API_URL

Server:
  PORT                   → process.env.PORT
  SUPABASE_URL           → process.env.SUPABASE_URL
  SUPABASE_SERVICE_KEY   → process.env.SUPABASE_SERVICE_ROLE_KEY
  BITNOB_API_KEY         → process.env.BITNOB_API_KEY
  BITNOB_API_URL         → process.env.BITNOB_API_URL
  BITNOB_WEBHOOK_SECRET  → process.env.BITNOB_WEBHOOK_SECRET
```

## API Endpoint Map

```
Authentication
POST   /api/auth/signup
POST   /api/auth/login
GET    /api/auth/me

Wallet
POST   /api/wallet/create
GET    /api/wallet/info
GET    /api/wallet/balance

Invoices
GET    /api/invoices
GET    /api/invoices/:id
POST   /api/invoices
PUT    /api/invoices/:id
DELETE /api/invoices/:id
POST   /api/invoices/:id/generate-pdf

Payment Links
GET    /api/payment-links
GET    /api/payment-links/:id
GET    /api/payment-links/slug/:slug  (public)
POST   /api/payment-links
PUT    /api/payment-links/:id
DELETE /api/payment-links/:id
POST   /api/payment-links/:id/pay     (public)

Transactions
GET    /api/transactions
GET    /api/transactions/:id

Webhooks
POST   /api/webhooks/bitnob
```
