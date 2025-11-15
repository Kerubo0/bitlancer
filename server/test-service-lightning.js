import bitnobService from './src/services/bitnob.service.js'

console.log('🧪 Testing Lightning Address via Bitnob Service')
console.log('================================================\n')

async function test() {
  try {
    const username = 'testuser' + Math.random().toString(36).substring(2, 8)
    const email = 'test@example.com'
    
    console.log('Creating Lightning address...')
    console.log('Email:', email)
    console.log('Username:', username)
    console.log('')
    
    const result = await bitnobService.createLightningAddress(email, username)
    
    console.log('\n✅ Result:')
    console.log(JSON.stringify(result, null, 2))
    
    if (result.lightningAddress) {
      console.log('\n🎉 SUCCESS! Lightning address created:')
      console.log('   Address:', result.lightningAddress)
      console.log('   LNURL:', result.lnurl)
    } else {
      console.log('\n⚠️  Lightning address not available (expected in sandbox)')
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message)
  }
}

test()
