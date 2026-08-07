-- Create equipment_vendors table
CREATE TABLE IF NOT EXISTS equipment_vendors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text NOT NULL,
  phone text NOT NULL,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  rating numeric DEFAULT 4.5,
  created_at timestamptz DEFAULT now()
);

-- Create equipment_items table
CREATE TABLE IF NOT EXISTS equipment_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid REFERENCES equipment_vendors(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  category text NOT NULL,
  price_per_day numeric NOT NULL DEFAULT 0,
  deposit numeric NOT NULL DEFAULT 0,
  quantity_available integer NOT NULL DEFAULT 1,
  delivery_available boolean NOT NULL DEFAULT true,
  image_url text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Create equipment_bookings table
CREATE TABLE IF NOT EXISTS equipment_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id uuid REFERENCES equipment_items(id) ON DELETE CASCADE NOT NULL,
  patient_name text NOT NULL DEFAULT '',
  start_date date NOT NULL,
  end_date date NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  total_price numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security (RLS)
ALTER TABLE equipment_vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_bookings ENABLE ROW LEVEL SECURITY;

-- Security policies for equipment_vendors (anon & authenticated open access)
DROP POLICY IF EXISTS "anon_select_vendors" ON equipment_vendors;
CREATE POLICY "anon_select_vendors" ON equipment_vendors FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_vendors" ON equipment_vendors;
CREATE POLICY "anon_insert_vendors" ON equipment_vendors FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_vendors" ON equipment_vendors;
CREATE POLICY "anon_update_vendors" ON equipment_vendors FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_vendors" ON equipment_vendors;
CREATE POLICY "anon_delete_vendors" ON equipment_vendors FOR DELETE
  TO anon, authenticated USING (true);

-- Security policies for equipment_items (anon & authenticated open access)
DROP POLICY IF EXISTS "anon_select_equip" ON equipment_items;
CREATE POLICY "anon_select_equip" ON equipment_items FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_equip" ON equipment_items;
CREATE POLICY "anon_insert_equip" ON equipment_items FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_equip" ON equipment_items;
CREATE POLICY "anon_update_equip" ON equipment_items FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_equip" ON equipment_items;
CREATE POLICY "anon_delete_equip" ON equipment_items FOR DELETE
  TO anon, authenticated USING (true);

-- Security policies for equipment_bookings (anon & authenticated open access)
DROP POLICY IF EXISTS "anon_select_bookings" ON equipment_bookings;
CREATE POLICY "anon_select_bookings" ON equipment_bookings FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_bookings" ON equipment_bookings;
CREATE POLICY "anon_insert_bookings" ON equipment_bookings FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_bookings" ON equipment_bookings;
CREATE POLICY "anon_update_bookings" ON equipment_bookings FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_bookings" ON equipment_bookings;
CREATE POLICY "anon_delete_bookings" ON equipment_bookings FOR DELETE
  TO anon, authenticated USING (true);

-- Enable Supabase Realtime replication
ALTER PUBLICATION supabase_realtime ADD TABLE equipment_vendors;
ALTER PUBLICATION supabase_realtime ADD TABLE equipment_items;
ALTER PUBLICATION supabase_realtime ADD TABLE equipment_bookings;

-- Seed equipment vendors in the Belgaum region
-- User coordinate baseline: 15.8497, 74.4977
INSERT INTO equipment_vendors (id, name, phone, latitude, longitude, address, rating)
VALUES
  ('a1a4f6d7-8910-1112-1314-151617181920', 'Belgaum Healthcare Rentals', '+919876543210', 15.8520, 74.5030, 'Maratha Mandir Road, Belgaum, Karnataka 590001', 4.8),
  ('b1a4f6d7-8910-1112-1314-151617181921', 'KLES Medical Equipment Supplies', '+919988776655', 15.8610, 74.5090, 'Nehru Nagar, Belgaum, Karnataka 590010', 4.9),
  ('c1a4f6d7-8910-1112-1314-151617181922', 'Goaves Surgical Rentals', '+919448112233', 15.8420, 74.4980, 'Goaves Circle, Belgaum, Karnataka 590011', 4.6)
ON CONFLICT (id) DO NOTHING;

-- Seed equipment inventory items
-- Categories: Wheelchair, Concentrator, Cylinder, Bed, Walker, Crutches, CPAP
INSERT INTO equipment_items (vendor_id, name, category, price_per_day, deposit, quantity_available, delivery_available, image_url)
VALUES
  -- Belgaum Healthcare Rentals
  ('a1a4f6d7-8910-1112-1314-151617181920', 'Standard Ergonomic Wheelchair', 'Wheelchair', 150.00, 2000.00, 4, true, 'https://images.unsplash.com/photo-1579684389782-64d84b5e905d?auto=format&fit=crop&q=80&w=300'),
  ('a1a4f6d7-8910-1112-1314-151617181920', '5L Portable Oxygen Concentrator', 'Concentrator', 800.00, 10000.00, 2, true, 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=300'),
  ('a1a4f6d7-8910-1112-1314-151617181920', 'Adjustable Height Walker', 'Walker', 50.00, 500.00, 8, true, 'https://images.unsplash.com/photo-1579684389782-64d84b5e905d?auto=format&fit=crop&q=80&w=300'),

  -- KLES Medical Equipment Supplies
  ('b1a4f6d7-8910-1112-1314-151617181921', 'Semi-Fowler Hospital Bed', 'Bed', 500.00, 15000.00, 3, true, 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&q=80&w=300'),
  ('b1a4f6d7-8910-1112-1314-151617181921', '10L Double Flow Oxygen Concentrator', 'Concentrator', 1200.00, 15000.00, 1, true, 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=300'),
  ('b1a4f6d7-8910-1112-1314-151617181921', 'Aluminium Underarm Crutches', 'Crutches', 30.00, 300.00, 12, false, 'https://images.unsplash.com/photo-1579684389782-64d84b5e905d?auto=format&fit=crop&q=80&w=300'),
  ('b1a4f6d7-8910-1112-1314-151617181921', 'Auto-CPAP Therapy Machine', 'CPAP', 400.00, 8000.00, 2, true, 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=300'),

  -- Goaves Surgical Rentals
  ('c1a4f6d7-8910-1112-1314-151617181922', 'Standard Ergonomic Wheelchair', 'Wheelchair', 140.00, 1500.00, 2, true, 'https://images.unsplash.com/photo-1579684389782-64d84b5e905d?auto=format&fit=crop&q=80&w=300'),
  ('c1a4f6d7-8910-1112-1314-151617181922', 'Aluminium Underarm Crutches', 'Crutches', 25.00, 250.00, 6, true, 'https://images.unsplash.com/photo-1579684389782-64d84b5e905d?auto=format&fit=crop&q=80&w=300'),
  ('c1a4f6d7-8910-1112-1314-151617181922', 'Medical Oxygen Cylinder (B-Type)', 'Cylinder', 250.00, 2500.00, 5, true, 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=300')
ON CONFLICT DO NOTHING;
