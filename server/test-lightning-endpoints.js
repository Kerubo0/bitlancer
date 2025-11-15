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

const bitnob = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json',
  },
})

async function testLightningEndpoints() {
  console.log('\n⚡ Testing Bitnob Lightning Invoice Endpoints...\n')
  
  const endpoints = [
    {
      name: 'Create Lightning Invoice',
      method: 'POST',
      path: '/api/v1/lnurlp/createinvoice',
      data: {
        amount: 1000, // sats
        description: 'Test invoice',
      }
    },
    {
      name: 'Create Lightning Invoice v2',
      method: 'POST',
      path: '/api/v1/wallets/ln/createinvoice',
      data: {
        amount: 1000,
        description: 'Test invoice',
      }
    },
    {
      name: 'Get Lightning Info',
      method: 'GET',
      path: '/api/v1/wallets/ln',
    },
  ]
  
  for (const endpoint of endpoints) {
    console.log(`\n📍 ${endpoint.name}`)
    console.log(`   ${endpoint.method} ${endpoint.path}`)
    
    try {
      const config = { method: endpoint.method, url: endpoint.path }
      if (endpoint.data) config.data = endpoint.data
      
      const response = await bitnob(config)
      console.log(`   ✅ ${response.status} SUCCESS`)
      console.log('   Response:', JSON.stringify(response.data, null, 2))
    } catch (error) {
      console.log(`   ❌ ${error.response?.status || 'ERROR'}`)
      if (error.response?.data) {
        console.log('   Error:', JSON.stringify(error.response.data, null, 2))
      } else {
        console.log('   Error:', error.message)
      }
    }
    
    await new Promise(resolve => setTimeout(resolve, 500))
  }
}

testLightningEndpoints().catch(console.error)
