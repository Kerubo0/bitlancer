import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// Load environment variables early so this module can be imported safely
dotenv.config()

export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)
