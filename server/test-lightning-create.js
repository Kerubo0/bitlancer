#!/usr/bin/env node

import dotenv from 'dotenv'
import axios from 'axios'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: join(__dirname, '../.env') })

const API_KEY = process.env.BITNOB_API_KEY
const BASE_URL = 'https://sandboxapi.bitnob.co'

async function testLightningInvoice() {
  console.log('\n⚡ Testing Lightning Invoice Creation...\n')
  console.log(`API URL: ${BASE_URL}`)
  console.log(`API Key: ${API_KEY?.substring(0, 20)}...`)
  console.log('='.repeat(70))
  
  const testData = {
    amount: 1000, // 1000 sats = ~$1
    description: 'Test Lightning Invoice',
    customerEmail: 'test@example.com'
  }
  
  console.log('\n📍 Testing: POST /wallets/ln/createinvoice')
  console.log('   Payload:', JSON.stringify(testData, null, 2))
  
  try {
    const response = await axios.post(
      `${BASE_URL}/wallets/ln/createinvoice`,
      testData,
      {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    )
    
    console.log('\n   ✅ SUCCESS!')
    console.log('   Status:', response.status)
    console.log('   Response:', JSON.stringify(response.data, null, 2))
    
    console.log('\n' + '='.repeat(70))
    console.log('✨ Lightning Invoice Created Successfully!')
    console.log('='.repeat(70))
    
    const data = response.data.data || response.data
    console.log('\n📋 Invoice Details:')
    console.log('   Invoice ID:', data.id || data.reference || data.invoice_id)
    console.log('   Payment Request:', (data.paymentRequest || data.payment_request || data.pr)?.substring(0, 50) + '...')
    console.log('   Amount:', testData.amount, 'sats')
    
  } catch (error) {
    console.log('\n   ❌ FAILED')
    console.log('   Status:', error.response?.status)
    console.log('   Error:', JSON.stringify(error.response?.data, null, 2))
    
    console.log('\n' + '='.repeat(70))
    console.log('❌ Lightning Invoice Creation Failed')
    console.log('='.repeat(70))
    
    if (error.response?.status === 401) {
      console.log('\n💡 Possible Issues:')
      console.log('   - API key may not have Lightning permissions')
      console.log('   - Account needs Lightning Network enabled')
      console.log('   - Contact Bitnob support to enable Lightning')
    } else if (error.response?.status === 404) {
      console.log('\n💡 Possible Issues:')
      console.log('   - Endpoint path may be incorrect')
      console.log('   - Lightning feature may not be available in sandbox')
      console.log('   - Try production API: https://api.bitnob.co')
    }
  }
}

testLightningInvoice().catch(console.error)
