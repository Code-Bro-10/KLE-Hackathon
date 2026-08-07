-- Create medical_stores table
CREATE TABLE IF NOT EXISTS medical_stores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  address text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create medicines table
CREATE TABLE IF NOT EXISTS medicines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES medical_stores(id) ON DELETE CASCADE NOT NULL,
  medicine_name text NOT NULL,
  price numeric NOT NULL DEFAULT 0,
  stock integer NOT NULL DEFAULT 0,
  is_available boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security (RLS)
ALTER TABLE medical_stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE medicines ENABLE ROW LEVEL SECURITY;

-- Security policies for medical_stores (anon & authenticated open access)
DROP POLICY IF EXISTS "anon_select_stores" ON medical_stores;
CREATE POLICY "anon_select_stores" ON medical_stores FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_stores" ON medical_stores;
CREATE POLICY "anon_insert_stores" ON medical_stores FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_stores" ON medical_stores;
CREATE POLICY "anon_update_stores" ON medical_stores FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_stores" ON medical_stores;
CREATE POLICY "anon_delete_stores" ON medical_stores FOR DELETE
  TO anon, authenticated USING (true);

-- Security policies for medicines (anon & authenticated open access)
DROP POLICY IF EXISTS "anon_select_medicines" ON medicines;
CREATE POLICY "anon_select_medicines" ON medicines FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_medicines" ON medicines;
CREATE POLICY "anon_insert_medicines" ON medicines FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_medicines" ON medicines;
CREATE POLICY "anon_update_medicines" ON medicines FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_medicines" ON medicines;
CREATE POLICY "anon_delete_medicines" ON medicines FOR DELETE
  TO anon, authenticated USING (true);

-- Enable Supabase Realtime replication
ALTER PUBLICATION supabase_realtime ADD TABLE medical_stores;
ALTER PUBLICATION supabase_realtime ADD TABLE medicines;

-- Seed pharmacies in the Belgaum, Karnataka region
-- User coordinate baseline: 15.8497, 74.4977
INSERT INTO medical_stores (id, name, phone, latitude, longitude, address)
VALUES
  ('c3a4f6d7-8910-1112-1314-151617181920', 'Belgaum Drug House', '+919876543210', 15.8520, 74.5030, 'Maratha Mandir Road, Belgaum, Karnataka 590001'),
  ('d3a4f6d7-8910-1112-1314-151617181921', 'KLES Pharmacy', '+919988776655', 15.8610, 74.5090, 'Nehru Nagar, Belgaum, Karnataka 590010'),
  ('e3a4f6d7-8910-1112-1314-151617181922', 'Goaves Wellness Pharmacy', '+919448112233', 15.8420, 74.4980, 'Goaves Circle, Belgaum, Karnataka 590011')
ON CONFLICT (id) DO NOTHING;

-- Seed medicines inventory for pharmacies
INSERT INTO medicines (store_id, medicine_name, price, stock, is_available)
VALUES
  -- Belgaum Drug House
  ('c3a4f6d7-8910-1112-1314-151617181920', 'Paracetamol 650', 15.00, 50, true),
  ('c3a4f6d7-8910-1112-1314-151617181920', 'Sterile Gauze', 25.00, 100, true),
  ('c3a4f6d7-8910-1112-1314-151617181920', 'Antiseptic Solution', 75.00, 30, true),
  ('c3a4f6d7-8910-1112-1314-151617181920', 'Adhesive Bandages', 5.00, 200, true),
  ('c3a4f6d7-8910-1112-1314-151617181920', 'Pain Relief Spray', 110.00, 0, false),

  -- KLES Pharmacy
  ('d3a4f6d7-8910-1112-1314-151617181921', 'Paracetamol 650', 16.50, 80, true),
  ('d3a4f6d7-8910-1112-1314-151617181921', 'Sterile Gauze', 30.00, 150, true),
  ('d3a4f6d7-8910-1112-1314-151617181921', 'Antiseptic Solution', 85.00, 50, true),
  ('d3a4f6d7-8910-1112-1314-151617181921', 'Adhesive Bandages', 4.50, 400, true),
  ('d3a4f6d7-8910-1112-1314-151617181921', 'Burn Ointment', 60.00, 25, true),

  -- Goaves Wellness Pharmacy
  ('e3a4f6d7-8910-1112-1314-151617181922', 'Paracetamol 650', 14.00, 20, true),
  ('e3a4f6d7-8910-1112-1314-151617181922', 'Sterile Gauze', 28.00, 60, true),
  ('e3a4f6d7-8910-1112-1314-151617181922', 'Antiseptic Solution', 80.00, 15, true),
  ('e3a4f6d7-8910-1112-1314-151617181922', 'Adhesive Bandages', 6.00, 100, true),
  ('e3a4f6d7-8910-1112-1314-151617181922', 'Pain Relief Spray', 125.00, 12, true)
ON CONFLICT DO NOTHING;
