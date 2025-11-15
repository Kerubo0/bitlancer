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

async function testEndpoint(path, data) {
  try {
    const response = await axios.post(
      `${BASE_URL}${path}`,
      data,
      {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    )
    return { success: true, status: response.status, data: response.data }
  } catch (error) {
    return {
      success: false,
      status: error.response?.status,
      error: error.response?.data
    }
  }
}

async function testAllVariations() {
  console.log('\n⚡ Testing ALL Lightning Invoice Endpoint Variations...\n')
  console.log(`API Key: ${API_KEY?.substring(0, 20)}...`)
  console.log('='.repeat(70))
  
  const testData = {
    amount: 1000,
    description: 'Test Invoice',
    customerEmail: 'test@example.com'
  }
  
  const endpoints = [
    '/wallets/ln/createinvoice',
    '/api/v1/wallets/ln/createinvoice',
    '/ln/createinvoice',
    '/api/v1/ln/createinvoice',
    '/lightning/createinvoice',
    '/api/v1/lightning/createinvoice',
  ]
  
  for (const endpoint of endpoints) {
    console.log(`\n📍 Testing: POST ${endpoint}`)
    const result = await testEndpoint(endpoint, testData)
    
    if (result.success) {
      console.log(`   ✅ SUCCESS! Status: ${result.status}`)
      console.log('   Response:', JSON.stringify(result.data, null, 2))
      console.log('\n' + '='.repeat(70))
      console.log(`✨ WORKING ENDPOINT FOUND: ${endpoint}`)
      console.log('='.repeat(70))
      return
    } else {
      console.log(`   ❌ ${result.status || 'ERROR'}`)
      console.log(`   ${JSON.stringify(result.error).substring(0, 100)}...`)
    }
    
    await new Promise(resolve => setTimeout(resolve, 500))
  }
  
  console.log('\n' + '='.repeat(70))
  console.log('❌ No working Lightning endpoint found')
  console.log('='.repeat(70))
  console.log('\n💡 Recommendation:')
  console.log('   Contact Bitnob support at: support@bitnob.com')
  console.log('   Ask for: Lightning invoice creation endpoint documentation')
  console.log('   Provide: Your API key for account verification')
}

testAllVariations().catch(console.error)
