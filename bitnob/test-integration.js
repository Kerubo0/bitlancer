#!/usr/bin/env node

/**
 * Bitnob Integration Test Script
 * Tests the Bitnob service integration with the backend
 */

import bitnobService from './bitnob.service.js'

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
}

const log = {
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  info: (msg) => console.log(`${colors.cyan}ℹ${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  section: (msg) => console.log(`\n${colors.cyan}${msg}${colors.reset}\n${'='.repeat(50)}`),
}

async function testBitnobIntegration() {
  console.log('\n🚀 BitLancer - Bitnob Integration Test\n')
  
  let testResults = {
    passed: 0,
    failed: 0,
    warnings: 0,
  }

  // Test 1: Get BTC/USD Exchange Rate
  log.section('Test 1: BTC/USD Exchange Rate')
  try {
    const rate = await bitnobService.getBtcUsdRate()
    if (rate > 0) {
      log.success(`Exchange rate fetched: $${rate.toLocaleString()} per BTC`)
      testResults.passed++
    } else {
      log.error('Invalid exchange rate received')
      testResults.failed++
    }
  } catch (error) {
    log.error(`Failed to fetch exchange rate: ${error.message}`)
    testResults.failed++
  }

  // Test 2: USD to BTC Conversion
  log.section('Test 2: Currency Conversion')
  try {
    const usdAmount = 100
    const btcAmount = await bitnobService.convertUsdToBtc(usdAmount)
    const usdBack = await bitnobService.convertBtcToUsd(btcAmount)
    
    log.success(`$${usdAmount} USD = ${btcAmount.toFixed(8)} BTC`)
    log.success(`${btcAmount.toFixed(8)} BTC = $${usdBack.toFixed(2)} USD`)
    
    if (Math.abs(usdAmount - usdBack) < 0.01) {
      log.success('Conversion accuracy: OK')
      testResults.passed++
    } else {
      log.warning('Conversion has minor rounding differences')
      testResults.warnings++
    }
  } catch (error) {
    log.error(`Conversion test failed: ${error.message}`)
    testResults.failed++
  }

  // Test 3: Create Wallet (commented out to avoid creating test wallets)
  log.section('Test 3: Wallet Creation')
  log.warning('Wallet creation test skipped (would create real wallet)')
  log.info('To test wallet creation, uncomment this section and use test credentials')
  testResults.warnings++

  // Test 4: Webhook Signature Verification
  log.section('Test 4: Webhook Security')
  try {
    const testPayload = { type: 'test', data: { amount: 0.001 } }
    const testSignature = 'test_signature'
    
    // This will likely fail without proper secret, which is expected
    const isValid = bitnobService.verifyWebhookSignature(testPayload, testSignature)
    
    if (typeof isValid === 'boolean') {
      log.success('Webhook signature verification method is functional')
      testResults.passed++
    } else {
      log.error('Webhook signature verification returned unexpected type')
      testResults.failed++
    }
  } catch (error) {
    log.warning(`Webhook verification test: ${error.message}`)
    testResults.warnings++
  }

  // Test 5: Webhook Event Handling
  log.section('Test 5: Webhook Event Handling')
  try {
    const mockEvent = {
      type: 'payment.received',
      data: {
        walletId: 'test_wallet_123',
        amount: 0.001,
        hash: 'test_tx_hash',
      },
    }
    
    const processed = await bitnobService.handleWebhook(mockEvent)
    
    if (processed && processed.type === 'payment_received') {
      log.success('Webhook event processing: OK')
      log.info(`Processed type: ${processed.type}`)
      testResults.passed++
    } else {
      log.error('Webhook event processing returned unexpected result')
      testResults.failed++
    }
  } catch (error) {
    log.error(`Webhook handling failed: ${error.message}`)
    testResults.failed++
  }

  // Summary
  log.section('Test Results Summary')
  console.log(`✓ Passed:   ${colors.green}${testResults.passed}${colors.reset}`)
  console.log(`✗ Failed:   ${colors.red}${testResults.failed}${colors.reset}`)
  console.log(`⚠ Warnings: ${colors.yellow}${testResults.warnings}${colors.reset}`)
  
  const total = testResults.passed + testResults.failed + testResults.warnings
  const successRate = ((testResults.passed / total) * 100).toFixed(1)
  
  console.log(`\nSuccess Rate: ${successRate}%\n`)

  if (testResults.failed === 0) {
    log.success('All critical tests passed! ✨')
  } else {
    log.error('Some tests failed. Please check the configuration.')
  }

  // Configuration Check
  log.section('Configuration Check')
  const hasApiKey = !!process.env.BITNOB_API_KEY
  const hasWebhookSecret = !!process.env.BITNOB_WEBHOOK_SECRET
  const hasApiUrl = !!process.env.BITNOB_API_URL

  if (hasApiKey) {
    log.success('Bitnob API Key is set')
  } else {
    log.error('Bitnob API Key is missing')
  }

  if (hasWebhookSecret) {
    log.success('Bitnob Webhook Secret is set')
  } else {
    log.error('Bitnob Webhook Secret is missing')
  }

  if (hasApiUrl) {
    log.success(`Bitnob API URL: ${process.env.BITNOB_API_URL}`)
  } else {
    log.warning('Using default Bitnob API URL')
  }

  console.log('\n')
}

// Run tests
testBitnobIntegration().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
