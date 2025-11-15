import axios from 'axios'
import dotenv from 'dotenv'

dotenv.config()

const BITNOB_API_URL = process.env.BITNOB_API_URL || 'https://sandboxapi.bitnob.co'
const BITNOB_API_KEY = process.env.BITNOB_API_KEY

console.log('🔍 Testing Lightning Address Endpoints')
console.log('========================================\n')

const bitnobClient = axios.create({
  baseURL: BITNOB_API_URL,
  headers: {
    Authorization: `Bearer ${BITNOB_API_KEY}`,
    'Content-Type': 'application/json',
  },
})

const endpoints = [
  '/api/v1/lnurl',
]

async function testEndpoint(endpoint) {
  try {
    const response = await bitnobClient.post(endpoint, {
      customerEmail: 'test@example.com',
      username: 'testuser' + Math.random().toString(36).substring(2, 6),
    })

    console.log(`✅ ${endpoint}`)
    console.log('   Response:', JSON.stringify(response.data, null, 2))
    return true
  } catch (error) {
    console.log(`❌ ${endpoint}`)
    console.log('   Status:', error.response?.status)
    console.log('   Error:', error.response?.data?.message || error.message)
    return false
  }
}

async function testAll() {
  for (const endpoint of endpoints) {
    console.log(`\nTesting: ${endpoint}`)
    await testEndpoint(endpoint)
  }
}

testAll()
