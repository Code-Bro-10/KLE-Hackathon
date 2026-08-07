/*
# Create ResQ AI hospital and emergency tables

1. New Tables
- `hospital_cases`: hospital profile / capacity data.
- `emergency_cases`: each emergency triage session.

2. Security
- Enable RLS on both tables.
- Single-tenant no-auth app: allow anon + authenticated full CRUD.
*/

CREATE TABLE IF NOT EXISTS hospital_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text DEFAULT '',
  phone text DEFAULT '',
  emergency_phone text DEFAULT '',
  distance_km numeric DEFAULT 0,
  departments jsonb DEFAULT '[]'::jsonb,
  available_beds int DEFAULT 0,
  total_beds int DEFAULT 0,
  er_status text DEFAULT 'open',
  wait_time_min int DEFAULT 0,
  specialties jsonb DEFAULT '[]'::jsonb,
  lat numeric,
  lng numeric,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS emergency_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id text UNIQUE NOT NULL,
  symptoms text NOT NULL DEFAULT '',
  voice_transcript text DEFAULT '',
  condition_name text DEFAULT '',
  urgency_level text NOT NULL DEFAULT 'moderate',
  confidence numeric DEFAULT 0,
  recommended_actions jsonb DEFAULT '[]'::jsonb,
  first_aid_steps jsonb DEFAULT '[]'::jsonb,
  warnings jsonb DEFAULT '[]'::jsonb,
  hospital_id uuid REFERENCES hospital_cases(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'active',
  patient_name text DEFAULT '',
  patient_age int,
  location text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE hospital_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_cases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_hospital_cases" ON hospital_cases;
CREATE POLICY "anon_select_hospital_cases" ON hospital_cases FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_hospital_cases" ON hospital_cases;
CREATE POLICY "anon_insert_hospital_cases" ON hospital_cases FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_hospital_cases" ON hospital_cases;
CREATE POLICY "anon_update_hospital_cases" ON hospital_cases FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_hospital_cases" ON hospital_cases;
CREATE POLICY "anon_delete_hospital_cases" ON hospital_cases FOR DELETE
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_select_emergency_cases" ON emergency_cases;
CREATE POLICY "anon_select_emergency_cases" ON emergency_cases FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_emergency_cases" ON emergency_cases;
CREATE POLICY "anon_insert_emergency_cases" ON emergency_cases FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_emergency_cases" ON emergency_cases;
CREATE POLICY "anon_update_emergency_cases" ON emergency_cases FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_emergency_cases" ON emergency_cases;
CREATE POLICY "anon_delete_emergency_cases" ON emergency_cases FOR DELETE
  TO anon, authenticated USING (true);

INSERT INTO hospital_cases (name, address, phone, emergency_phone, distance_km, departments, available_beds, total_beds, er_status, wait_time_min, specialties, lat, lng)
VALUES
  ('KLES Dr. Prabhakar Kore Hospital & MRC', 'NH 4, Nehru Nagar, Belgaum, Karnataka 590010', '+91 831 247 3777', '+91 831 247 3777', 1.5, '["Emergency","Cardiology","Trauma","Radiology","Neurology"]', 25, 120, 'open', 5, '["Heart Attack","Stroke","Trauma","Cardiac Care"]', 15.8752, 74.5218),
  ('Belgaum Institute of Medical Sciences (BIMS)', 'Dr. B. R. Ambedkar Road, Belgaum, Karnataka 590001', '+91 831 240 3126', '108', 2.3, '["Emergency","Pediatrics","Surgery","General Medicine"]', 40, 200, 'open', 15, '["Pediatric Emergency","General Surgery","Internal Medicine"]', 15.8565, 74.5054),
  ('Lakeview Goaves Hospital', 'Goaves Circle, Belgaum, Karnataka 590011', '+91 831 240 3222', '+91 831 240 3222', 3.1, '["Trauma","Emergency","Cardiology","Orthopedics"]', 12, 50, 'limited', 20, '["Cardiac Emergency","Stroke Care","Orthopedic Trauma"]', 15.8442, 74.5041),
  ('Arihant Hospital', '4th Cross, Bhagya Nagar, Belgaum, Karnataka 590006', '+91 831 243 4555', '+91 831 243 4555', 3.5, '["Emergency","Cardiology","Surgery","Neurosurgery"]', 0, 30, 'full', 45, '["Spinal Injury","Heart Attack","General Trauma"]', 15.8361, 74.5122),
  ('Vardhaman Hospital', 'Mandoli Road, Near Tilakwadi, Belgaum, Karnataka 590006', '+91 831 242 4444', '+91 831 242 4444', 4.2, '["Pediatrics","Emergency","Orthopedics","General Medicine"]', 8, 40, 'open', 10, '["Pediatric","General Care","Trauma"]', 15.8385, 74.4981)
ON CONFLICT DO NOTHING;
