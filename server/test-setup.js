import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import axios from 'axios'

dotenv.config()

console.log('🧪 BitLancer USDT Payment Setup Test\n')

// Test 1: Environment Variables
console.log('✅ Test 1: Environment Variables')
console.log('   PORT:', process.env.PORT || '5000')
console.log('   SUPABASE_URL:', process.env.SUPABASE_URL ? '✓' : '✗')
console.log('   SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✓' : '✗')
console.log('   BITNOB_API_KEY:', process.env.BITNOB_API_KEY ? '✓' : '✗')
console.log('   BITNOB_API_URL:', process.env.BITNOB_API_URL)
console.log('   BITNOB_WEBHOOK_SECRET:', process.env.BITNOB_WEBHOOK_SECRET ? '✓' : '✗')
console.log()

// Test 2: Supabase Connection
console.log('✅ Test 2: Supabase Connection')
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

try {
  const { data, error } = await supabase
    .from('payment_links')
    .select('*')
    .limit(1)

  if (error) {
    console.log('   ✗ Failed to connect to Supabase:', error.message)
  } else {
    console.log('   ✓ Successfully connected to Supabase')
    console.log('   ✓ payment_links table is accessible')
  }
} catch (error) {
  console.log('   ✗ Error:', error.message)
}
console.log()

// Test 3: Check for new USDT fields
console.log('✅ Test 3: Database Schema (USDT fields)')
try {
  const { data, error } = await supabase.rpc('exec_sql', {
    sql_query: `
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'payment_links'
      AND column_name IN (
        'btc_address',
        'usdt_amount',
        'bitnob_usdt_virtual_account_id',
        'payment_status',
        'usdt_tx_hash',
        'btc_tx_hash',
        'btc_amount',
        'confirmed_at'
      )
      ORDER BY column_name;
    `
  })

  if (error) {
    console.log('   ⚠️  Could not verify schema via RPC')
    console.log('   Please run the migration manually in Supabase SQL Editor')
    console.log('   File: migrations/COPY_TO_SUPABASE_SQL_EDITOR.sql')
  } else {
    console.log('   ✓ Schema verification query executed')
    if (data && data.length > 0) {
      console.log('   ✓ Found', data.length, 'USDT payment fields')
      data.forEach(col => {
        console.log(`     - ${col.column_name} (${col.data_type})`)
      })
    }
  }
} catch (error) {
  console.log('   ⚠️  Schema check skipped (RPC not available)')
  console.log('   Please verify migration manually')
}
console.log()

// Test 4: Bitnob API Connection
console.log('✅ Test 4: Bitnob API Connection')
try {
  const response = await axios.get(`${process.env.BITNOB_API_URL}/api/v1/wallets`, {
    headers: {
      'Authorization': `Bearer ${process.env.BITNOB_API_KEY}`,
      'Content-Type': 'application/json'
    },
    timeout: 10000
  })

  if (response.status === 200) {
    console.log('   ✓ Successfully connected to Bitnob API')
    console.log('   ✓ API Key is valid')
  }
} catch (error) {
  if (error.response?.status === 401) {
    console.log('   ✗ Bitnob API Key is invalid or expired')
  } else if (error.code === 'ECONNABORTED') {
    console.log('   ✗ Bitnob API request timed out')
  } else {
    console.log('   ⚠️  Could not verify Bitnob connection:', error.message)
  }
}
console.log()

// Summary
console.log('📊 Summary')
console.log('─'.repeat(50))
console.log('Next steps:')
console.log('1. Run database migration (if not done):')
console.log('   - Open Supabase SQL Editor')
console.log('   - Run migrations/COPY_TO_SUPABASE_SQL_EDITOR.sql')
console.log()
console.log('2. Start the backend server:')
console.log('   cd /Users/wandiamugo/DadaDevs/bitlancer/server')
console.log('   npm start')
console.log()
console.log('3. Start the frontend:')
console.log('   cd /Users/wandiamugo/DadaDevs/bitlancer/client')
console.log('   npm run dev')
console.log()
console.log('4. Test the flow:')
console.log('   - Create a payment link')
console.log('   - Open the public payment page')
console.log('   - Select USDT payment')
console.log('   - Verify QR code displays')
console.log()
