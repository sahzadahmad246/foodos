-- Add timestamp columns for order status history
-- Run this migration in Supabase SQL Editor

-- Add timestamp columns for each status change
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS confirmed_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS preparing_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS ready_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS picked_up_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS delivered_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS cancelled_at timestamp with time zone;

-- Update existing orders to have created_at as the placed time (already exists)
-- Set confirmed/preparing times for orders that are already past those stages
UPDATE orders SET confirmed_at = created_at WHERE status IN ('preparing', 'ready', 'out_for_delivery', 'delivered') AND confirmed_at IS NULL;
UPDATE orders SET preparing_at = created_at WHERE status IN ('preparing', 'ready', 'out_for_delivery', 'delivered') AND preparing_at IS NULL;
UPDATE orders SET ready_at = updated_at WHERE status IN ('ready', 'out_for_delivery', 'delivered') AND ready_at IS NULL;
UPDATE orders SET picked_up_at = updated_at WHERE status IN ('out_for_delivery', 'delivered') AND picked_up_at IS NULL;
UPDATE orders SET delivered_at = updated_at WHERE status = 'delivered' AND delivered_at IS NULL;
UPDATE orders SET cancelled_at = updated_at WHERE status = 'cancelled' AND cancelled_at IS NULL;

-- Comment: After running this, the orders table will have:
-- created_at: when order was placed
-- confirmed_at: when restaurant accepted (status changed to preparing)
-- preparing_at: same as confirmed_at (order starts preparing immediately)
-- ready_at: when marked ready for pickup/delivery
-- picked_up_at: when rider picked up (out_for_delivery)
-- delivered_at: when delivered
-- cancelled_at: when cancelled
