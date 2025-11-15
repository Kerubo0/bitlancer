import axios from 'axios'

const API_URL = 'http://localhost:5000'

// You'll need a valid auth token - get it from browser localStorage
// For testing, we'll just try the endpoint
async function testInitWallet() {
  try {
    console.log('Testing /api/auth/init-wallet endpoint...\n')
    
    // This will fail without auth but show us the error
    const response = await axios.post(`${API_URL}/api/auth/init-wallet`, {}, {
      headers: {
        'Authorization': 'Bearer test-token', // Replace with real token from browser
        'Content-Type': 'application/json'
      }
    })
    
    console.log('✅ Success:', response.data)
  } catch (error) {
    console.log('❌ Error Response:')
    console.log('Status:', error.response?.status)
    console.log('Data:', JSON.stringify(error.response?.data, null, 2))
    
    if (error.response?.status === 401) {
      console.log('\n💡 This is expected - you need a valid auth token')
      console.log('   Get it from browser console: localStorage.getItem("supabase.auth.token")')
    }
  }
}

testInitWallet()
