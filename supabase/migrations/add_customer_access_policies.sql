-- Add is_online field to restaurants if not exists
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS is_online boolean default false;

-- RLS Policies for public access to restaurant data (customer-facing)
-- Public can view active online restaurants
CREATE POLICY "Anyone can view online restaurants" ON restaurants
  FOR SELECT USING (is_online = true AND is_active = true);

-- Public can view categories for online restaurants
CREATE POLICY "Anyone can view categories of online restaurants" ON categories
  FOR SELECT USING (
    is_active = true AND
    restaurant_id IN (SELECT id FROM restaurants WHERE is_online = true AND is_active = true)
  );

-- Public can view available menu items of online restaurants
CREATE POLICY "Anyone can view menu items of online restaurants" ON menu_items
  FOR SELECT USING (
    is_available = true AND
    restaurant_id IN (SELECT id FROM restaurants WHERE is_online = true AND is_active = true)
  );

-- Public can create orders
CREATE POLICY "Anyone can create orders" ON orders
  FOR INSERT WITH CHECK (true);

-- Public can create order items
CREATE POLICY "Anyone can create order items" ON order_items
  FOR INSERT WITH CHECK (true);

-- Customers and restaurant owners can view orders
CREATE POLICY "Users can view their orders" ON orders
  FOR SELECT USING (
    auth.uid() = customer_id OR
    restaurant_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid())
  );

-- Restaurant owners can update their orders
CREATE POLICY "Restaurant owners can update their orders" ON orders
  FOR UPDATE USING (
    restaurant_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid())
  );
