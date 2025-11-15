#!/usr/bin/env node

/**
 * Bitnob API Explorer - Check available endpoints
 */

import dotenv from 'dotenv'
import axios from 'axios'

dotenv.config()

const API_KEY = process.env.BITNOB_API_KEY
const BASE_URL = 'https://sandboxapi.bitnob.co'

const bitnob = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json',
  },
})

async function testEndpoint(method, path, data = null) {
  try {
    const config = { method, url: path }
    if (data) config.data = data
    
    const response = await bitnob(config)
    return {
      success: true,
      status: response.status,
      data: response.data,
    }
  } catch (error) {
    return {
      success: false,
      status: error.response?.status,
      error: error.response?.data || error.message,
    }
  }
}

async function main() {
  console.log('\n🔍 Exploring Bitnob API...\n')
  console.log(`Base URL: ${BASE_URL}`)
  console.log(`API Key: ${API_KEY?.substring(0, 20)}...\n`)
  console.log('='.repeat(70))
  
  // Test common endpoints
  const tests = [
    { name: 'Get Account Info', method: 'GET', path: '/api/v1/account' },
    { name: 'Get Customers', method: 'GET', path: '/api/v1/customers' },
    { name: 'Get Wallets List', method: 'GET', path: '/api/v1/wallets' },
    { name: 'Create Customer', method: 'POST', path: '/api/v1/customers', data: {
      email: `test${Date.now()}@example.com`,
      firstName: 'Test',
      lastName: 'User'
    }},
    { name: 'Generate Address', method: 'POST', path: '/api/v1/addresses/generate', data: {
      currency: 'btc',
      network: 'bitcoin'
    }},
    { name: 'Create Lightning Wallet', method: 'POST', path: '/api/v1/lnAddress/create', data: {
      email: `test${Date.now()}@example.com`
    }},
  ]
  
  for (const test of tests) {
    console.log(`\n📍 ${test.name}`)
    console.log(`   ${test.method} ${test.path}`)
    
    const result = await testEndpoint(test.method, test.path, test.data)
    
    if (result.success) {
      console.log(`   ✅ ${result.status} SUCCESS`)
      console.log('   Response:', JSON.stringify(result.data, null, 2))
    } else {
      console.log(`   ❌ ${result.status || 'ERROR'}`)
      if (typeof result.error === 'object') {
        console.log('   Error:', JSON.stringify(result.error, null, 2))
      } else {
        console.log('   Error:', result.error)
      }
    }
    
    await new Promise(resolve => setTimeout(resolve, 500))
  }
  
  console.log('\n' + '='.repeat(70))
  console.log('\n💡 Suggestion: Check Bitnob API documentation at:')
  console.log('   https://docs.bitnob.com')
  console.log('   Or contact support@bitnob.com\n')
}

main().catch(console.error)
