-- Create ambulances table
CREATE TABLE IF NOT EXISTS ambulances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_name text NOT NULL,
  vehicle_number text NOT NULL,
  phone text NOT NULL,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'busy', 'offline')),
  type text NOT NULL DEFAULT 'bls' CHECK (type IN ('bls', 'als', 'icu')),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE ambulances ENABLE ROW LEVEL SECURITY;

-- Security policies for ambulances
DROP POLICY IF EXISTS "anon_select_ambulances" ON ambulances;
CREATE POLICY "anon_select_ambulances" ON ambulances FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_ambulances" ON ambulances;
CREATE POLICY "anon_insert_ambulances" ON ambulances FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_ambulances" ON ambulances;
CREATE POLICY "anon_update_ambulances" ON ambulances FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_ambulances" ON ambulances;
CREATE POLICY "anon_delete_ambulances" ON ambulances FOR DELETE
  TO anon, authenticated USING (true);

-- Enable Supabase Realtime replication
ALTER PUBLICATION supabase_realtime ADD TABLE ambulances;

-- Seed ambulances in the Belgaum region
INSERT INTO ambulances (driver_name, vehicle_number, phone, latitude, longitude, status, type)
VALUES
  ('Amit Deshpande', 'KA-22-M-1234', '+919876543210', 15.8520, 74.5030, 'available', 'bls'),
  ('Rohit Joshi', 'KA-22-M-5678', '+919988776655', 15.8610, 74.5090, 'available', 'als'),
  ('Vinayak Patil', 'KA-22-M-9012', '+919448112233', 15.8420, 74.4980, 'available', 'icu')
ON CONFLICT DO NOTHING;
