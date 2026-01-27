-- Migration: Add RLS policies for riders table and orders/order_items
-- Run this in your Supabase SQL Editor

-- Allow anyone to view basic rider info (for order tracking)
CREATE POLICY "Anyone can view rider basic info" ON riders
  FOR SELECT USING (true);

-- Allow restaurant owners to manage their riders
CREATE POLICY "Restaurant owners can manage riders" ON riders
  FOR ALL USING (
    restaurant_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid())
  );

-- Allow riders to view and update their own record
CREATE POLICY "Riders can view own record" ON riders
  FOR SELECT USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

CREATE POLICY "Riders can update own record" ON riders
  FOR UPDATE USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Allow anyone to view orders (for order tracking page)
CREATE POLICY "Anyone can view orders" ON orders
  FOR SELECT USING (true);

-- Allow anyone to view order items
CREATE POLICY "Anyone can view order items" ON order_items
  FOR SELECT USING (true);

-- Allow public to view restaurants (for customer-facing pages)
CREATE POLICY "Anyone can view restaurants" ON restaurants
  FOR SELECT USING (true);

-- Allow public to view categories 
CREATE POLICY "Anyone can view categories" ON categories
  FOR SELECT USING (true);

-- Allow public to view menu items
CREATE POLICY "Anyone can view menu items" ON menu_items
  FOR SELECT USING (true);
