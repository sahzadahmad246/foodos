-- Customer addresses table
CREATE TABLE IF NOT EXISTS customer_addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Location
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  locality TEXT, -- Area/neighborhood from geocoding
  
  -- Address details (entered by user)
  flat_building TEXT NOT NULL,
  landmark TEXT,
  
  -- Auto-filled
  city TEXT,
  state TEXT,
  pincode TEXT,
  
  -- Metadata
  address_type TEXT DEFAULT 'other', -- 'home', 'work', 'other'
  is_default BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE customer_addresses ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own addresses" ON customer_addresses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own addresses" ON customer_addresses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own addresses" ON customer_addresses
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own addresses" ON customer_addresses
  FOR DELETE USING (auth.uid() = user_id);

-- Index for location-based queries
CREATE INDEX IF NOT EXISTS customer_addresses_user_id_idx ON customer_addresses(user_id);
CREATE INDEX IF NOT EXISTS customer_addresses_location_idx ON customer_addresses(latitude, longitude);

-- Function to calculate distance between two points (Haversine formula)
-- Returns distance in meters
CREATE OR REPLACE FUNCTION calculate_distance(
  lat1 DECIMAL, lon1 DECIMAL,
  lat2 DECIMAL, lon2 DECIMAL
) RETURNS DECIMAL AS $$
DECLARE
  R CONSTANT DECIMAL := 6371000; -- Earth radius in meters
  dLat DECIMAL;
  dLon DECIMAL;
  a DECIMAL;
  c DECIMAL;
BEGIN
  dLat := radians(lat2 - lat1);
  dLon := radians(lon2 - lon1);
  
  a := sin(dLat/2) * sin(dLat/2) +
       cos(radians(lat1)) * cos(radians(lat2)) *
       sin(dLon/2) * sin(dLon/2);
  
  c := 2 * atan2(sqrt(a), sqrt(1-a));
  
  RETURN R * c;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
