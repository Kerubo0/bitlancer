# BitLancer

A full-stack web application for Kenyan freelancers to receive Bitcoin payments from global clients.

## Technology Stack

### Frontend
- React + Vite
- TailwindCSS
- Framer Motion
- React Router

### Backend
- Node.js + Express
- Supabase (Auth & PostgreSQL)
- Bitnob API (Bitcoin payments)

## Getting Started

### Prerequisites
- Node.js (v18+)
- npm or yarn
- Supabase account
- Bitnob API credentials

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd bitlancer
```

2. Install client dependencies
```bash
cd client
npm install
```

3. Install server dependencies
```bash
cd ../server
npm install
```

4. Set up environment variables
- Copy `.env.example` to `.env` in both client and server directories
- Fill in your Supabase and Bitnob credentials

### Running the Application

#### Development Mode

Terminal 1 - Client:
```bash
cd client
npm run dev
```

Terminal 2 - Server:
```bash
cd server
npm run dev
```

## Features

- 🔐 Secure authentication with Supabase
- 💰 Bitcoin wallet creation via Bitnob
- 📄 Invoice generation and management
- 🔗 Payment link creation
- 💳 Card payment processing with auto BTC conversion
- 📊 Transaction history and analytics
- ⚡ Lightning Network support
- 🎨 Modern, responsive UI

## Project Structure

```
bitlancer/
├── client/              # React frontend
│   └── src/
│       ├── components/  # Reusable UI components
│       ├── pages/       # Page components
│       ├── hooks/       # Custom React hooks
│       ├── context/     # React context providers
│       ├── lib/         # Utility functions
│       └── styles/      # Global styles
├── server/              # Express backend
│   └── src/
│       ├── routes/      # API routes
│       ├── controllers/ # Route controllers
│       ├── services/    # Business logic
│       ├── middleware/  # Express middleware
│       └── utils/       # Utility functions
└── bitnob/              # Bitnob integration
    └── bitnob.service.js
```

## License

MIT
