#!/usr/bin/env node

/**
 * Wallet Creation Diagnostic Script
 * Tests the complete wallet creation flow
 */

import dotenv from 'dotenv'
import axios from 'axios'

dotenv.config()

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m',
}

const log = {
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  info: (msg) => console.log(`${colors.cyan}ℹ${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  section: (msg) => console.log(`\n${colors.blue}${msg}${colors.reset}\n${'='.repeat(60)}`),
}

async function diagnoseWalletCreation() {
  console.log('\n🔍 BitLancer Wallet Creation Diagnostic\n')
  
  let issues = []
  let passes = []

  // 1. Check Environment Variables
  log.section('1. Checking Environment Variables')
  
  const requiredEnvVars = {
    'BITNOB_API_KEY': process.env.BITNOB_API_KEY,
    'BITNOB_API_URL': process.env.BITNOB_API_URL,
    'SUPABASE_URL': process.env.SUPABASE_URL,
    'SUPABASE_SERVICE_ROLE_KEY': process.env.SUPABASE_SERVICE_ROLE_KEY,
  }

  for (const [key, value] of Object.entries(requiredEnvVars)) {
    if (value) {
      log.success(`${key} is set`)
      passes.push(key)
    } else {
      log.error(`${key} is MISSING`)
      issues.push(`Missing ${key} in .env file`)
    }
  }

  // 2. Test Bitnob API Connection
  log.section('2. Testing Bitnob API Connection')
  
  try {
    const testEmail = `test-${Date.now()}@example.com`
    const testUserId = `test-user-${Date.now()}`
    
    log.info(`Creating test wallet for ${testEmail}...`)
    
    const response = await axios.post(
      `${process.env.BITNOB_API_URL}/wallets`,
      {
        customerEmail: testEmail,
        customerId: testUserId,
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.BITNOB_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (response.data && response.data.data) {
      log.success('Bitnob API is working!')
      log.info(`Wallet ID: ${response.data.data.id}`)
      log.info(`Address: ${response.data.data.address}`)
      passes.push('Bitnob API connection')
    }
  } catch (error) {
    log.error('Bitnob API call failed')
    if (error.response) {
      log.error(`Status: ${error.response.status}`)
      log.error(`Error: ${JSON.stringify(error.response.data)}`)
      issues.push(`Bitnob API Error: ${error.response.status} - ${JSON.stringify(error.response.data)}`)
    } else {
      log.error(`Error: ${error.message}`)
      issues.push(`Bitnob API Error: ${error.message}`)
    }
  }

  // 3. Test Backend Server
  log.section('3. Testing Backend Server')
  
  try {
    const healthCheck = await axios.get('http://localhost:5000/health', {
      timeout: 2000,
    })
    log.success('Backend server is running')
    log.info(`Response: ${JSON.stringify(healthCheck.data)}`)
    passes.push('Backend server')
  } catch (error) {
    log.error('Backend server is NOT running on port 5000')
    log.warning('Start it with: cd server && npm run dev')
    issues.push('Backend server not running')
  }

  // 4. Test Wallet Creation Endpoint
  log.section('4. Testing Wallet Creation Endpoint')
  
  try {
    log.warning('Skipping (requires authentication)')
    log.info('To test manually, use the frontend signup page')
  } catch (error) {
    // Skip for now
  }

  // 5. Check Frontend Configuration
  log.section('5. Checking Frontend Configuration')
  
  try {
    const fs = await import('fs')
    const clientEnv = fs.readFileSync('../client/.env', 'utf8')
    
    if (clientEnv.includes('VITE_API_URL=http://localhost:5000')) {
      log.success('Frontend API URL is correctly set')
      passes.push('Frontend configuration')
    } else {
      log.warning('Frontend API URL might be incorrect')
      issues.push('Check VITE_API_URL in client/.env')
    }
  } catch (error) {
    log.warning('Could not read client/.env file')
  }

  // Summary
  log.section('Diagnostic Summary')
  
  console.log(`${colors.green}Passed:${colors.reset} ${passes.length} checks`)
  passes.forEach(p => console.log(`  ✓ ${p}`))
  
  console.log(`\n${colors.red}Issues:${colors.reset} ${issues.length} found`)
  issues.forEach(i => console.log(`  ✗ ${i}`))

  console.log('\n')

  if (issues.length === 0) {
    log.success('All checks passed! Wallet creation should work.')
    log.info('If it still doesn\'t work, check:')
    console.log('  1. Browser console for errors')
    console.log('  2. Backend console logs during signup')
    console.log('  3. Network tab for failed API calls')
  } else {
    log.error('Found issues that need to be fixed:')
    console.log('\nQuick fixes:')
    if (issues.some(i => i.includes('Backend server'))) {
      console.log(`  ${colors.yellow}→${colors.reset} cd server && npm run dev`)
    }
    if (issues.some(i => i.includes('BITNOB'))) {
      console.log(`  ${colors.yellow}→${colors.reset} Check your .env file has correct Bitnob credentials`)
    }
    if (issues.some(i => i.includes('SUPABASE'))) {
      console.log(`  ${colors.yellow}→${colors.reset} Add Supabase credentials to .env file`)
    }
  }

  console.log('\n')
}

// Run diagnostics
diagnoseWalletCreation().catch((error) => {
  console.error('Diagnostic failed:', error)
  process.exit(1)
})
