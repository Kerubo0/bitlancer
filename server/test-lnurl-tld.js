import axios from 'axios'
import dotenv from 'dotenv'

dotenv.config()

const BITNOB_API_URL = process.env.BITNOB_API_URL || 'https://sandboxapi.bitnob.co'
const BITNOB_API_KEY = process.env.BITNOB_API_KEY

console.log('⚡ Testing LNURL Endpoint with TLD')
console.log('====================================\n')

const bitnobClient = axios.create({
  baseURL: BITNOB_API_URL,
  headers: {
    Authorization: `Bearer ${BITNOB_API_KEY}`,
    'Content-Type': 'application/json',
  },
})

const testCases = [
  {
    name: 'With bitnob.io TLD',
    payload: {
      customerEmail: 'test@example.com',
      username: 'testuser' + Math.random().toString(36).substring(2, 6),
      tld: 'bitnob.io'
    }
  },
  {
    name: 'With bitnob.com TLD',
    payload: {
      customerEmail: 'test@example.com',
      username: 'testuser' + Math.random().toString(36).substring(2, 6),
      tld: 'bitnob.com'
    }
  },
  {
    name: 'With ln.bitnob.co TLD',
    payload: {
      customerEmail: 'test@example.com',
      username: 'testuser' + Math.random().toString(36).substring(2, 6),
      tld: 'ln.bitnob.co'
    }
  },
  {
    name: 'With identifier instead of username',
    payload: {
      customerEmail: 'test@example.com',
      identifier: 'testuser' + Math.random().toString(36).substring(2, 6),
      tld: 'bitnob.io'
    }
  },
]

async function test(testCase) {
  try {
    console.log(`\n📝 Test: ${testCase.name}`)
    console.log(`   Payload:`, JSON.stringify(testCase.payload, null, 2))
    
    const response = await bitnobClient.post('/api/v1/lnurl', testCase.payload)

    console.log(`   ✅ SUCCESS!`)
    console.log(`   Status: ${response.status}`)
    console.log(`   Response:`, JSON.stringify(response.data, null, 2))
    
    if (response.data.data?.lightningAddress || response.data.lightningAddress) {
      console.log(`   🎉 Lightning Address Created!`)
      console.log(`   Address: ${response.data.data?.lightningAddress || response.data.lightningAddress}`)
    }
    return true
    
  } catch (error) {
    console.log(`   ❌ Failed`)
    console.log(`   Status: ${error.response?.status}`)
    console.log(`   Error:`, error.response?.data?.message || error.message)
    if (error.response?.data) {
      console.log(`   Details:`, JSON.stringify(error.response.data, null, 2))
    }
    return false
  }
}

async function runTests() {
  console.log('🚀 Testing different TLD configurations...\n')
  
  let successCount = 0
  for (const testCase of testCases) {
    const success = await test(testCase)
    if (success) successCount++
    await new Promise(resolve => setTimeout(resolve, 500))
  }
  
  console.log('\n========================================')
  console.log(`📊 Results: ${successCount}/${testCases.length} successful`)
  console.log('========================================')
}

runTests()
