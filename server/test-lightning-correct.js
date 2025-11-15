#!/usr/bin/env node

import dotenv from 'dotenv'
import axios from 'axios'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: join(__dirname, '.env') })

const API_KEY = process.env.BITNOB_API_KEY
const BASE_URL = 'https://sandboxapi.bitnob.co'

console.log('\n⚡ Testing CORRECT Lightning Invoice Format...\n')
console.log('='.repeat(70))

const correctData = {
  satoshis: 1000,
  description: 'Test Lightning Invoice',
  customerEmail: 'test@example.com'
}

console.log('\n📍 POST /api/v1/wallets/ln/createinvoice')
console.log('Payload:', JSON.stringify(correctData, null, 2))

async function testLightning() {
  try {
    const response = await axios.post(
      `${BASE_URL}/api/v1/wallets/ln/createinvoice`,
      correctData,
      {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
        }
      }
    )
    
    console.log('\n✅ SUCCESS!')
    console.log('Status:', response.status)
    console.log('\nResponse:', JSON.stringify(response.data, null, 2))
    
    console.log('\n' + '='.repeat(70))
    console.log('🎉 LIGHTNING INVOICE CREATED SUCCESSFULLY!')
    console.log('='.repeat(70))
    
    const data = response.data.data || response.data
    console.log('\n📋 Invoice Details:')
    console.log('   Payment Request:', (data.paymentRequest || data.payment_request || data.pr))
    console.log('   Amount:', correctData.satoshis, 'sats')
    console.log('   Description:', correctData.description)
    
  } catch (error) {
    console.log('\n❌ FAILED')
    console.log('Status:', error.response?.status)
    console.log('\nError:', JSON.stringify(error.response?.data, null, 2))
    
    console.log('\n' + '='.repeat(70))
    if (error.response?.status === 400) {
      console.log('⚠️  Invalid Request - Check Required Fields')
    } else if (error.response?.status === 401) {
      console.log('❌ Unauthorized - Lightning not enabled')
    } else {
      console.log('❌ Lightning Invoice Creation Failed')
    }
    console.log('='.repeat(70))
  }
}

testLightning()
