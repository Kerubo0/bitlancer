-- Migration: Add USDT payment fields to payment_links table
-- Created: 2025-11-15

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
ALTER TABLE payment_links
ADD CONSTRAINT IF NOT EXISTS valid_payment_status
CHECK (payment_status IN ('pending', 'WAITING_FOR_USDT', 'USDT_RECEIVED', 'BTC_SENT', 'PAID', 'failed'));

-- Comment on new columns
COMMENT ON COLUMN payment_links.btc_address IS 'BTC address generated for freelancer to receive payment';
COMMENT ON COLUMN payment_links.usdt_amount IS 'Amount in USDT that client needs to pay';
COMMENT ON COLUMN payment_links.bitnob_usdt_virtual_account_id IS 'Bitnob virtual card/account ID for receiving USDT';
COMMENT ON COLUMN payment_links.payment_status IS 'Current status of payment: pending, WAITING_FOR_USDT, USDT_RECEIVED, BTC_SENT, PAID, failed';
COMMENT ON COLUMN payment_links.usdt_tx_hash IS 'USDT transaction hash from client payment';
COMMENT ON COLUMN payment_links.btc_tx_hash IS 'BTC transaction hash when sending to freelancer';
COMMENT ON COLUMN payment_links.btc_amount IS 'Actual BTC amount sent to freelancer';
COMMENT ON COLUMN payment_links.confirmed_at IS 'Timestamp when payment was fully confirmed';
