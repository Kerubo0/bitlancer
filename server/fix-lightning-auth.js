#!/usr/bin/env node

import dotenv from 'dotenv'
import axios from 'axios'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load .env from server directory
dotenv.config({ path: join(__dirname, '.env') })

const API_KEY = process.env.BITNOB_API_KEY
const BASE_URL = 'https://sandboxapi.bitnob.co'

if (!API_KEY) {
  console.error('❌ BITNOB_API_KEY not found in .env file')
  console.log('Please check your .env file in:', join(__dirname, '.env'))
  process.exit(1)
}

console.log('\n🔐 Testing Authorization Methods...\n')
console.log(`API Key: ${API_KEY.substring(0, 30)}...`)
console.log('='.repeat(70))

// Test different authorization header formats
const authMethods = [
  {
    name: 'Bearer Token (current)',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    }
  },
  {
    name: 'x-api-key header',
    headers: {
      'x-api-key': API_KEY,
      'Content-Type': 'application/json',
    }
  },
  {
    name: 'API-Key header',
    headers: {
      'API-Key': API_KEY,
      'Content-Type': 'application/json',
    }
  },
  {
    name: 'Authorization without Bearer',
    headers: {
      'Authorization': API_KEY,
      'Content-Type': 'application/json',
    }
  },
]

const testData = {
  amount: 1000,
  description: 'Test Invoice',
}

async function testAuth(method) {
  console.log(`\n📍 Testing: ${method.name}`)
  console.log('   Headers:', JSON.stringify(method.headers, null, 2).replace(API_KEY, API_KEY.substring(0, 20) + '...'))
  
  try {
    const response = await axios.post(
      `${BASE_URL}/api/v1/wallets/ln/createinvoice`,
      testData,
      { headers: method.headers }
    )
    
    console.log(`   ✅ SUCCESS! Status: ${response.status}`)
    console.log('   Response:', JSON.stringify(response.data, null, 2))
    return true
  } catch (error) {
    console.log(`   ❌ ${error.response?.status || 'ERROR'}`)
    if (error.response?.data) {
      console.log('   Error:', JSON.stringify(error.response.data, null, 2))
    }
    return false
  }
}

async function checkAccountPermissions() {
  console.log('\n📋 Checking Account Info & Permissions...\n')
  
  const endpoints = [
    { path: '/api/v1/wallets', name: 'Get Wallets' },
    { path: '/api/v1/customers', name: 'Get Customers' },
    { path: '/api/v1/account', name: 'Get Account Info' },
    { path: '/api/v1/profile', name: 'Get Profile' },
  ]
  
  for (const endpoint of endpoints) {
    console.log(`\n📍 ${endpoint.name}: GET ${endpoint.path}`)
    try {
      const response = await axios.get(`${BASE_URL}${endpoint.path}`, {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
        }
      })
      
      console.log(`   ✅ ${response.status}`)
      console.log('   Data:', JSON.stringify(response.data, null, 2))
      
      // Check for Lightning-related info
      if (response.data.data) {
        const hasLightning = JSON.stringify(response.data.data).toLowerCase().includes('lightning')
        if (hasLightning) {
          console.log('   ⚡ Lightning-related data found!')
        }
      }
    } catch (error) {
      console.log(`   ❌ ${error.response?.status || 'ERROR'}`)
    }
    
    await new Promise(resolve => setTimeout(resolve, 300))
  }
}

async function main() {
  // Test different auth methods
  for (const method of authMethods) {
    const success = await testAuth(method)
    if (success) {
      console.log('\n' + '='.repeat(70))
      console.log(`✨ WORKING METHOD FOUND: ${method.name}`)
      console.log('='.repeat(70))
      return
    }
    await new Promise(resolve => setTimeout(resolve, 500))
  }
  
  console.log('\n' + '='.repeat(70))
  console.log('❌ All authorization methods failed')
  console.log('='.repeat(70))
  
  // Check account permissions
  await checkAccountPermissions()
  
  console.log('\n' + '='.repeat(70))
  console.log('💡 Solutions to Fix 401 Unauthorized:')
  console.log('='.repeat(70))
  console.log('\n1. Contact Bitnob Support:')
  console.log('   Email: support@bitnob.com')
  console.log('   Subject: "Enable Lightning Network API Access"')
  console.log('   Message: Request Lightning Network permissions for your API key')
  console.log('\n2. Check Account Type:')
  console.log('   - Sandbox accounts may have limited features')
  console.log('   - Try production API: https://api.bitnob.co')
  console.log('   - Complete KYC verification if required')
  console.log('\n3. Generate New API Key:')
  console.log('   - Go to Bitnob Dashboard → Settings → API')
  console.log('   - Generate new key with Lightning permissions')
  console.log('   - Update BITNOB_API_KEY in .env')
  console.log('\n4. Check API Key Scope:')
  console.log('   - Some API keys are read-only')
  console.log('   - Ensure key has "write" and "lightning" scopes')
}

main().catch(console.error)
