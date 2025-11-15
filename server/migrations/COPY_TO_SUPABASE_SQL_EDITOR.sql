-- ============================================
-- USDT Payment Fields Migration
-- Run this in Supabase SQL Editor
-- ============================================

-- Add new columns for USDT payment functionality
ALTER TABLE payment_links
ADD COLUMN IF NOT EXISTS btc_address TEXT,
ADD COLUMN IF NOT EXISTS usdt_amount DECIMAL(20, 6),
ADD COLUMN IF NOT EXISTS bitnob_usdt_virtual_account_id TEXT,
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS usdt_tx_hash TEXT,
ADD COLUMN IF NOT EXISTS btc_tx_hash TEXT,
ADD COLUMN IF NOT EXISTS btc_amount DECIMAL(20, 8),
ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMP WITH TIME ZONE;

-- Create index for payment_status for faster queries
CREATE INDEX IF NOT EXISTS idx_payment_links_payment_status ON payment_links(payment_status);

-- Create index for bitnob_usdt_virtual_account_id for webhook lookups
CREATE INDEX IF NOT EXISTS idx_payment_links_usdt_account ON payment_links(bitnob_usdt_virtual_account_id);

-- Add check constraint for valid payment statuses
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'valid_payment_status'
    ) THEN
        ALTER TABLE payment_links
        ADD CONSTRAINT valid_payment_status
        CHECK (payment_status IN ('pending', 'WAITING_FOR_USDT', 'USDT_RECEIVED', 'BTC_SENT', 'PAID', 'failed'));
    END IF;
END $$;

-- Add comments on new columns
COMMENT ON COLUMN payment_links.btc_address IS 'BTC address generated for freelancer to receive payment';
COMMENT ON COLUMN payment_links.usdt_amount IS 'Amount in USDT that client needs to pay';
COMMENT ON COLUMN payment_links.bitnob_usdt_virtual_account_id IS 'Bitnob virtual card/account ID for receiving USDT';
COMMENT ON COLUMN payment_links.payment_status IS 'Current status of payment: pending, WAITING_FOR_USDT, USDT_RECEIVED, BTC_SENT, PAID, failed';
COMMENT ON COLUMN payment_links.usdt_tx_hash IS 'USDT transaction hash from client payment';
COMMENT ON COLUMN payment_links.btc_tx_hash IS 'BTC transaction hash when sending to freelancer';
COMMENT ON COLUMN payment_links.btc_amount IS 'Actual BTC amount sent to freelancer';
COMMENT ON COLUMN payment_links.confirmed_at IS 'Timestamp when payment was fully confirmed';

-- Verify migration
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'payment_links'
AND column_name IN (
    'btc_address',
    'usdt_amount',
    'bitnob_usdt_virtual_account_id',
    'payment_status',
    'usdt_tx_hash',
    'btc_tx_hash',
    'btc_amount',
    'confirmed_at'
)
ORDER BY column_name;
