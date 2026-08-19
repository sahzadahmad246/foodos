-- Allow customer-facing pages to stay visible even when restaurant is offline.
-- Orders are still blocked in app/API logic when is_online = false.

-- Restaurants
DROP POLICY IF EXISTS "Anyone can view online restaurants" ON restaurants;
DROP POLICY IF EXISTS "Anyone can view restaurants" ON restaurants;

CREATE POLICY "Anyone can view active restaurants" ON restaurants
  FOR SELECT USING (is_active = true);

-- Categories
DROP POLICY IF EXISTS "Anyone can view categories of online restaurants" ON categories;
DROP POLICY IF EXISTS "Anyone can view categories" ON categories;

CREATE POLICY "Anyone can view categories of active restaurants" ON categories
  FOR SELECT USING (
    is_active = true
    AND restaurant_id IN (
      SELECT id FROM restaurants WHERE is_active = true
    )
  );

-- Menu items
DROP POLICY IF EXISTS "Anyone can view menu items of online restaurants" ON menu_items;
DROP POLICY IF EXISTS "Anyone can view menu items" ON menu_items;

CREATE POLICY "Anyone can view menu items of active restaurants" ON menu_items
  FOR SELECT USING (
    is_available = true
    AND restaurant_id IN (
      SELECT id FROM restaurants WHERE is_active = true
    )
  );
