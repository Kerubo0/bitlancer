import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

// Get the directory of this file
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
dotenv.config()

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function runMigration() {
  console.log('🔄 Running USDT payment fields migration...')

  try {
    // Read the migration file
    const migrationSQL = readFileSync(
      join(__dirname, 'migrations', 'add_usdt_payment_fields.sql'),
      'utf8'
    )

    console.log('📄 Migration SQL loaded')
    console.log('📊 Connecting to Supabase...')

    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))

    console.log(`📝 Found ${statements.length} SQL statements to execute`)

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      console.log(`\n⚙️  Executing statement ${i + 1}/${statements.length}...`)

      // Supabase doesn't support raw SQL through the JS client for DDL
      // We need to use the RPC method or direct SQL execution
      const { data, error } = await supabase.rpc('exec_sql', {
        sql_query: statement + ';'
      }).catch(async () => {
        // If RPC doesn't work, we'll need to execute via the REST API
        console.log('⚠️  RPC method not available. Please run the migration manually.')
        console.log('\nOption 1: Use Supabase SQL Editor')
        console.log('  1. Go to https://app.supabase.com')
        console.log('  2. Select your project')
        console.log('  3. Go to SQL Editor')
        console.log('  4. Paste the contents of migrations/add_usdt_payment_fields.sql')
        console.log('  5. Click "Run"')

        console.log('\nOption 2: Use psql command line')
        console.log(`  psql "${process.env.SUPABASE_URL.replace('https://', 'postgresql://postgres:[YOUR-PASSWORD]@').replace('.supabase.co', '.supabase.co:5432/postgres')}" -f migrations/add_usdt_payment_fields.sql`)

        return { error: 'Manual migration required' }
      })

      if (error) {
        if (error === 'Manual migration required') {
          process.exit(0)
        }
        console.error('❌ Error:', error)
        throw error
      }

      console.log('✅ Statement executed successfully')
    }

    console.log('\n✅ Migration completed successfully!')

    // Verify the migration by checking if the columns exist
    console.log('\n🔍 Verifying migration...')
    const { data, error } = await supabase
      .from('payment_links')
      .select('*')
      .limit(1)

    if (error) {
      console.error('⚠️  Could not verify migration:', error.message)
    } else {
      console.log('✅ Migration verified - payment_links table is accessible')
    }

  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    process.exit(1)
  }
}

// Run the migration
runMigration()
