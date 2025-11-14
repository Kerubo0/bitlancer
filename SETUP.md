# BitLancer Setup Guide

Complete guide to set up and run the BitLancer application.

## Prerequisites

- Node.js 18+ and npm
- A Supabase account (https://supabase.com)
- A Bitnob account and API credentials (https://bitnob.com)
- Git

## Step 1: Clone and Install Dependencies

```bash
# Clone the repository
cd bitlancer

# Install client dependencies
cd client
npm install

# Install server dependencies
cd ../server
npm install

# Return to root
cd ..
```

## Step 2: Set Up Supabase

### 2.1 Create a Supabase Project

1. Go to https://supabase.com and create a new project
2. Wait for the project to be provisioned
3. Note your project URL and API keys

### 2.2 Run Database Migrations

1. In your Supabase dashboard, go to the SQL Editor
2. Copy the contents of `supabase-schema.sql` from the root directory
3. Paste and run the SQL to create all tables and functions

### 2.3 Configure Authentication

1. In Supabase dashboard, go to Authentication > Providers
2. Enable Email provider
3. (Optional) Configure email templates for better UX

## Step 3: Get Bitnob API Credentials

1. Sign up at https://bitnob.com
2. Complete KYC verification
3. Navigate to API settings in your dashboard
4. Generate API keys (keep these secure!)
5. Note your API key and webhook secret

## Step 4: Configure Environment Variables

### 4.1 Server Environment

Create `server/.env`:

```env
PORT=5000
NODE_ENV=development

# Supabase
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SUPABASE_ANON_KEY=your_supabase_anon_key

# Bitnob
BITNOB_API_KEY=your_bitnob_api_key
BITNOB_API_URL=https://api.bitnob.co/api/v1
BITNOB_WEBHOOK_SECRET=your_webhook_secret

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

### 4.2 Client Environment

Create `client/.env`:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_URL=http://localhost:5000
```

## Step 5: Run the Application

### Development Mode

Open two terminal windows:

**Terminal 1 - Server:**
```bash
cd server
npm run dev
```

**Terminal 2 - Client:**
```bash
cd client
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## Step 6: Test the Application

### 6.1 Create an Account

1. Navigate to http://localhost:3000
2. Click "Sign up"
3. Enter your details and create an account
4. Check your email for verification (if configured in Supabase)

### 6.2 Verify Wallet Creation

After signup, a Bitcoin wallet should be automatically created via Bitnob. Check:
1. Dashboard shows wallet addresses
2. Balance cards display (should show 0.00000000 BTC initially)

### 6.3 Create Test Invoice

1. Go to Invoices page
2. Click "Create Invoice"
3. Fill in client details and line items
4. Submit - this should generate a Lightning invoice via Bitnob

### 6.4 Create Payment Link

1. Go to Payment Links
2. Click "Create Payment Link"
3. Enter title, description, and amount
4. Copy the generated link
5. Open in incognito/private window to test payment flow

## Step 7: Configure Webhooks (Production)

For production deployment:

1. Deploy your server to a public URL (e.g., Heroku, Render, Railway)
2. In Bitnob dashboard, configure webhook URL:
   ```
   https://your-domain.com/api/webhooks/bitnob
   ```
3. Add webhook secret to your server environment variables

## Troubleshooting

### Wallet Creation Fails

- Verify Bitnob API credentials are correct
- Check Bitnob API status
- Ensure your Bitnob account is verified

### Authentication Issues

- Verify Supabase URL and keys are correct
- Check Supabase project status
- Ensure RLS policies are properly set up

### Database Errors

- Verify all migrations ran successfully
- Check table permissions in Supabase
- Ensure RLS is enabled on all tables

### API Connection Issues

- Verify CORS settings in server
- Check that both client and server are running
- Ensure environment variables are loaded correctly

## Production Deployment

### Backend Deployment (Railway/Render/Heroku)

1. Push code to GitHub
2. Connect repository to hosting platform
3. Set all environment variables
4. Deploy

### Frontend Deployment (Vercel/Netlify)

1. Push code to GitHub
2. Import project in Vercel/Netlify
3. Set environment variables
4. Set build command: `cd client && npm run build`
5. Set output directory: `client/dist`
6. Deploy

### Database (Supabase)

Already cloud-hosted, just update environment variables with production URLs.

## Security Checklist

- [ ] Never commit `.env` files
- [ ] Use service role key only on backend
- [ ] Enable RLS on all Supabase tables
- [ ] Verify webhook signatures
- [ ] Use HTTPS in production
- [ ] Implement rate limiting
- [ ] Set up proper CORS policies
- [ ] Regular security audits

## Support

For issues:
- Check Bitnob API documentation: https://docs.bitnob.com
- Check Supabase documentation: https://supabase.com/docs
- Review application logs

## Next Steps

After successful setup:

1. Customize the color scheme in `client/tailwind.config.js`
2. Add your logo and branding
3. Implement PDF generation for invoices
4. Add email notifications
5. Integrate payment gateway (Stripe/Flutterwave) for card payments
6. Add analytics and reporting features
7. Implement withdrawal functionality

Congratulations! Your BitLancer application is now running! 🎉
