# Database Profile Trigger Setup

## Issue
Users signing up don't get a profile automatically created in the `profiles` table, causing 500 errors when trying to fetch wallet info.

## Solution
We need to add a database trigger that automatically creates a profile record when a new user signs up in Supabase Auth.

## Setup Steps

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy and paste the contents of `supabase-profile-trigger.sql`
5. Click **Run** to execute the SQL

### Option 2: Using Supabase CLI

```bash
# If you have Supabase CLI installed
supabase db push supabase-profile-trigger.sql
```

## What This Does

1. **Creates `handle_new_user()` function**: Automatically creates a profile record whenever a new user signs up
2. **Creates trigger**: Listens to INSERT events on `auth.users` table
3. **Adds INSERT policy**: Allows authenticated users to create their own profile

## Verification

After running the migration, test by:

1. Clear any existing test users from your Supabase Auth dashboard
2. Restart your backend server: `cd server && npm run dev`
3. Try signing up with a new email address
4. Check the `profiles` table in Supabase - you should see the new profile created automatically

## Expected Behavior After Fix

When a user signs up:
1. Supabase Auth creates user in `auth.users` table ✓
2. Trigger fires and creates profile in `profiles` table ✓
3. Backend creates mock wallet and updates profile with wallet info ✓
4. User can now access dashboard and see their wallet ✓

## Files Modified

- **Created**: `supabase-profile-trigger.sql` - Database migration for profile trigger
- **Updated**: `client/src/context/AuthContext.jsx` - Better error handling
- **Updated**: `server/src/controllers/wallet.controller.js` - Changed .single() to .maybeSingle()

## Current Mock Mode Status

Mock mode is enabled (`USE_MOCK_BITNOB=true` in server/.env):
- Wallet creation bypasses actual Bitnob API calls
- Returns mock wallet data for testing
- Once you have working Bitnob credentials, set `USE_MOCK_BITNOB=false`

## Troubleshooting

### "422 Unprocessable Entity" on signup
- User already exists with that email
- Solution: Use a different email or delete existing user from Supabase Auth dashboard

### "400 Bad Request" on login
- Invalid email/password combination
- Solution: Double-check credentials or reset password

### "Cannot coerce the result to a single JSON object"
- Profile doesn't exist for user
- Solution: Run the profile trigger migration SQL above

### Bitnob API 404 errors
- Mock mode is enabled to bypass this
- Solution: Contact Bitnob support for correct API documentation/credentials
