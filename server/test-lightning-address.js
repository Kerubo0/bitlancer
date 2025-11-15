import axios from 'axios'
import dotenv from 'dotenv'

dotenv.config()

const BITNOB_API_URL = process.env.BITNOB_API_URL || 'https://sandboxapi.bitnob.co'
const BITNOB_API_KEY = process.env.BITNOB_API_KEY

console.log('🧪 Testing Lightning Address Creation')
console.log('=====================================\n')

const bitnobClient = axios.create({
  baseURL: BITNOB_API_URL,
  headers: {
    Authorization: `Bearer ${BITNOB_API_KEY}`,
    'Content-Type': 'application/json',
  },
})

async function testLightningAddress() {
  try {
    console.log('📞 Creating Lightning address...')
    console.log('   Email: test@example.com')
    console.log('   Username: testuser' + Math.random().toString(36).substring(2, 6))
    
    const response = await bitnobClient.post('/api/v1/lnurl', {
      customerEmail: 'test@example.com',
      username: 'testuser' + Math.random().toString(36).substring(2, 6),
    })

    console.log('\n✅ SUCCESS!')
    console.log('Status:', response.status)
    console.log('Response:', JSON.stringify(response.data, null, 2))
    
  } catch (error) {
    console.log('\n❌ ERROR')
    console.log('Status:', error.response?.status)
    console.log('Error:', JSON.stringify(error.response?.data, null, 2))
    console.log('Message:', error.message)
  }
}

testLightningAddress()
