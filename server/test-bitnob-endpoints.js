#!/usr/bin/env node

/**
 * Bitnob API Endpoint Tester
 * Tests different Bitnob API endpoints to find the correct one
 */

import dotenv from 'dotenv'
import axios from 'axios'

dotenv.config()

const API_KEY = process.env.BITNOB_API_KEY

const endpoints = [
  { base: 'https://sandboxapi.bitnob.co', path: '/wallets' },
  { base: 'https://sandboxapi.bitnob.co', path: '/api/v1/wallets' },
  { base: 'https://sandboxapi.bitnob.co', path: '/api/wallets' },
  { base: 'https://api.bitnob.co', path: '/api/v1/wallets' },
  { base: 'https://api.bitnob.co', path: '/wallets' },
]

async function testEndpoint(baseUrl, path) {
  try {
    const response = await axios.post(
      `${baseUrl}${path}`,
      {
        customerEmail: 'test@example.com',
        customerId: 'test123',
      },
      {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 5000,
      }
    )
    return { success: true, data: response.data }
  } catch (error) {
    if (error.response) {
      return {
        success: false,
        status: error.response.status,
        error: error.response.data,
      }
    }
    return { success: false, error: error.message }
  }
}

async function main() {
  console.log('\n🔍 Testing Bitnob API Endpoints...\n')
  console.log(`Using API Key: ${API_KEY?.substring(0, 15)}...`)
  console.log('='.repeat(70))

  for (const endpoint of endpoints) {
    const fullUrl = `${endpoint.base}${endpoint.path}`
    process.stdout.write(`\nTesting: ${fullUrl}... `)
    
    const result = await testEndpoint(endpoint.base, endpoint.path)
    
    if (result.success) {
      console.log('✅ SUCCESS!')
      console.log('Response:', JSON.stringify(result.data, null, 2))
      console.log('\n✨ Found working endpoint!')
      console.log(`Use: BITNOB_API_URL=${endpoint.base}`)
      console.log(`Endpoint path: ${endpoint.path}`)
      break
    } else {
      console.log(`❌ ${result.status || 'ERROR'}`)
      if (result.error) {
        console.log(`   ${JSON.stringify(result.error).substring(0, 100)}...`)
      }
    }
  }
  
  console.log('\n')
}

main()
