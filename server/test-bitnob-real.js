#!/usr/bin/env node

/**
 * Bitnob API Real Test - Tests actual wallet creation
 * This will attempt to create a real wallet using your Bitnob API key
 */

import dotenv from 'dotenv'
import axios from 'axios'

dotenv.config()

const API_KEY = process.env.BITNOB_API_KEY
const testEmail = `test+${Date.now()}@example.com`
const testCustomerId = `test_${Date.now()}`

// Different endpoint combinations to try
const endpoints = [
  { 
    base: 'https://sandboxapi.bitnob.co', 
    path: '/api/v1/wallets/ln',
    name: 'Sandbox - Lightning Wallet'
  },
  { 
    base: 'https://sandboxapi.bitnob.co', 
    path: '/api/v1/wallets/onchain',
    name: 'Sandbox - Onchain Wallet'
  },
  { 
    base: 'https://sandboxapi.bitnob.co', 
    path: '/api/v1/wallets',
    name: 'Sandbox - Default Wallets'
  },
  { 
    base: 'https://sandboxapi.bitnob.co', 
    path: '/wallets',
    name: 'Sandbox - Root Wallets'
  },
  { 
    base: 'https://api.bitnob.co', 
    path: '/api/v1/wallets',
    name: 'Production - v1 Wallets'
  },
]

async function testEndpoint(config) {
  const fullUrl = `${config.base}${config.path}`
  
  try {
    console.log(`\n📞 Testing: ${config.name}`)
    console.log(`   URL: ${fullUrl}`)
    console.log(`   Payload:`, { customerEmail: testEmail, customerId: testCustomerId })
    
    const response = await axios.post(
      fullUrl,
      {
        customerEmail: testEmail,
        customerId: testCustomerId,
      },
      {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        timeout: 10000,
      }
    )
    
    console.log('   ✅ SUCCESS!')
    console.log('   Status:', response.status)
    console.log('   Response:', JSON.stringify(response.data, null, 2))
    return { success: true, config, data: response.data }
    
  } catch (error) {
    if (error.response) {
      console.log(`   ❌ HTTP ${error.response.status}`)
      console.log('   Error:', JSON.stringify(error.response.data, null, 2))
      return {
        success: false,
        status: error.response.status,
        error: error.response.data,
      }
    } else if (error.request) {
      console.log(`   ❌ No response from server`)
      console.log('   Error:', error.message)
      return { success: false, error: 'No response' }
    } else {
      console.log(`   ❌ Error:`, error.message)
      return { success: false, error: error.message }
    }
  }
}

async function main() {
  console.log('\n' + '='.repeat(70))
  console.log('🧪 Bitnob API Wallet Creation Test')
  console.log('='.repeat(70))
  console.log(`\nAPI Key: ${API_KEY?.substring(0, 20)}...`)
  console.log(`Test Email: ${testEmail}`)
  console.log(`Customer ID: ${testCustomerId}`)
  
  let workingEndpoint = null
  
  for (const endpoint of endpoints) {
    const result = await testEndpoint(endpoint)
    
    if (result.success) {
      workingEndpoint = result
      break
    }
    
    // Wait a bit between requests
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
  
  console.log('\n' + '='.repeat(70))
  
  if (workingEndpoint) {
    console.log('✨ FOUND WORKING ENDPOINT!')
    console.log('='.repeat(70))
    console.log(`\nUpdate your .env file:`)
    console.log(`BITNOB_API_URL=${workingEndpoint.config.base}`)
    console.log(`\nEndpoint path to use: ${workingEndpoint.config.path}`)
    console.log(`\nWallet created:`)
    console.log(JSON.stringify(workingEndpoint.data, null, 2))
  } else {
    console.log('❌ NO WORKING ENDPOINT FOUND')
    console.log('='.repeat(70))
    console.log('\nPossible issues:')
    console.log('1. ⚠️  Your API key may not be activated yet')
    console.log('2. ⚠️  You may need to complete KYC verification')
    console.log('3. ⚠️  The Bitnob API documentation may have changed')
    console.log('4. ⚠️  Your account may not have wallet creation permissions')
    console.log('\n📧 Contact Bitnob support:')
    console.log('   Email: support@bitnob.com')
    console.log('   Ask for: Correct wallet creation endpoint for your API key')
  }
  
  console.log('\n')
}

main().catch(console.error)
