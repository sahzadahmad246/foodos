-- Add order cancellation and return fields
-- Migration: add_order_cancellation_fields.sql

-- Add cancellation fields to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
ADD COLUMN IF NOT EXISTS cancelled_by TEXT,
ADD COLUMN IF NOT EXISTS cancelled_step TEXT,
ADD COLUMN IF NOT EXISTS return_otp VARCHAR(6),
ADD COLUMN IF NOT EXISTS return_verified_at TIMESTAMP WITH TIME ZONE;

-- Add comment for documentation
COMMENT ON COLUMN orders.cancellation_reason IS 'Reason for order cancellation';
COMMENT ON COLUMN orders.cancelled_by IS 'Who cancelled: restaurant or customer';
COMMENT ON COLUMN orders.cancelled_step IS 'Order status when cancellation occurred';
COMMENT ON COLUMN orders.return_otp IS '6-digit OTP for return verification when order was out_for_delivery';
COMMENT ON COLUMN orders.return_verified_at IS 'Timestamp when return was verified by restaurant';
