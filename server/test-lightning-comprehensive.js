import axios from 'axios'
import dotenv from 'dotenv'

dotenv.config()

const BITNOB_API_URL = process.env.BITNOB_API_URL || 'https://sandboxapi.bitnob.co'
const BITNOB_API_KEY = process.env.BITNOB_API_KEY

console.log('⚡ Comprehensive Lightning Address Test')
console.log('========================================')
console.log('API URL:', BITNOB_API_URL)
console.log('API Key:', BITNOB_API_KEY ? `${BITNOB_API_KEY.substring(0, 20)}...` : 'NOT SET')
console.log('========================================\n')

const bitnobClient = axios.create({
  baseURL: BITNOB_API_URL,
  headers: {
    Authorization: `Bearer ${BITNOB_API_KEY}`,
    'Content-Type': 'application/json',
  },
})

// Test different endpoint + payload combinations
const testCases = [
  {
    name: 'LNURL Create Address',
    endpoint: '/api/v1/lnurl/createaddress',
    payload: {
      customerEmail: 'test@example.com',
      username: 'testuser' + Math.random().toString(36).substring(2, 6),
    }
  },
  {
    name: 'LNURL Base',
    endpoint: '/api/v1/lnurl',
    payload: {
      customerEmail: 'test@example.com',
      username: 'testuser' + Math.random().toString(36).substring(2, 6),
    }
  },
  {
    name: 'LN Address Create',
    endpoint: '/api/v1/lnaddress/create',
    payload: {
      customerEmail: 'test@example.com',
      username: 'testuser' + Math.random().toString(36).substring(2, 6),
    }
  },
  {
    name: 'LN Address',
    endpoint: '/api/v1/lnaddress',
    payload: {
      customerEmail: 'test@example.com',
      username: 'testuser' + Math.random().toString(36).substring(2, 6),
    }
  },
  {
    name: 'Lightning Address Generate',
    endpoint: '/api/v1/addresses/lightning',
    payload: {
      customerEmail: 'test@example.com',
      username: 'testuser' + Math.random().toString(36).substring(2, 6),
    }
  },
  {
    name: 'Wallet LN Address',
    endpoint: '/api/v1/wallets/ln/address',
    payload: {
      customerEmail: 'test@example.com',
      username: 'testuser' + Math.random().toString(36).substring(2, 6),
    }
  },
  {
    name: 'LNURL with Email Only',
    endpoint: '/api/v1/lnurl',
    payload: {
      email: 'test@example.com',
      username: 'testuser' + Math.random().toString(36).substring(2, 6),
    }
  },
  {
    name: 'LN Address Create with handle',
    endpoint: '/api/v1/lnaddress/create',
    payload: {
      email: 'test@example.com',
      handle: 'testuser' + Math.random().toString(36).substring(2, 6),
    }
  },
]

async function testCase(testCase) {
  try {
    console.log(`\n📝 Test: ${testCase.name}`)
    console.log(`   POST ${testCase.endpoint}`)
    console.log(`   Payload:`, JSON.stringify(testCase.payload, null, 2))
    
    const response = await bitnobClient.post(testCase.endpoint, testCase.payload)

    console.log(`   ✅ SUCCESS! Status: ${response.status}`)
    console.log(`   Response:`, JSON.stringify(response.data, null, 2))
    return true
    
  } catch (error) {
    if (error.response?.status === 404) {
      console.log(`   ❌ 404: Endpoint not found`)
    } else if (error.response?.status === 400) {
      console.log(`   ⚠️  400: Bad Request`)
      console.log(`   Message:`, error.response?.data?.message || 'Unknown error')
    } else if (error.response?.status === 401) {
      console.log(`   ❌ 401: Unauthorized`)
    } else {
      console.log(`   ❌ ${error.response?.status || 'ERROR'}`)
      console.log(`   Error:`, error.response?.data?.message || error.message)
    }
    return false
  }
}

async function runAllTests() {
  console.log('🚀 Running all test cases...\n')
  
  let successCount = 0
  for (const test of testCases) {
    const success = await testCase(test)
    if (success) successCount++
    await new Promise(resolve => setTimeout(resolve, 500)) // Small delay between requests
  }
  
  console.log('\n========================================')
  console.log(`📊 Results: ${successCount}/${testCases.length} tests successful`)
  console.log('========================================')
  
  if (successCount === 0) {
    console.log('\n💡 Conclusion:')
    console.log('   Lightning address endpoint is not available in the sandbox.')
    console.log('   This feature might only be available in production.')
    console.log('   Contact Bitnob support to enable Lightning addresses.')
  }
}

runAllTests()
