-- ============================================================
-- ResQ AI: COMPLETE SETUP SCRIPT
-- Paste and run this ENTIRE file in Supabase SQL Editor
-- ============================================================

-- 1. Create doctors table (if not exists)
CREATE TABLE IF NOT EXISTS doctors (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  specialty     text NOT NULL,
  status        text NOT NULL DEFAULT 'available'
                  CHECK (status IN ('available', 'busy', 'offline')),
  meet_url      text NOT NULL DEFAULT '',
  avatar_url    text DEFAULT '',
  created_at    timestamptz DEFAULT now()
);

-- 2. Create appointments table (replaces/supplements consultations)
CREATE TABLE IF NOT EXISTS appointments (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id    text NOT NULL DEFAULT '',
  doctor_id     uuid REFERENCES doctors(id) ON DELETE CASCADE NOT NULL,
  patient_name  text NOT NULL DEFAULT 'Anonymous Patient',
  patient_email text NOT NULL DEFAULT '',
  symptoms      text NOT NULL DEFAULT '',
  status        text NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'accepted', 'rejected')),
  meeting_link  text DEFAULT '',
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

-- 3. Enable RLS
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for doctors
DROP POLICY IF EXISTS "anon_select_doctors" ON doctors;
CREATE POLICY "anon_select_doctors" ON doctors FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_doctors" ON doctors;
CREATE POLICY "anon_insert_doctors" ON doctors FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_doctors" ON doctors;
CREATE POLICY "anon_update_doctors" ON doctors FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_doctors" ON doctors;
CREATE POLICY "anon_delete_doctors" ON doctors FOR DELETE TO anon, authenticated USING (true);

-- 5. RLS Policies for appointments
DROP POLICY IF EXISTS "appointments_select" ON appointments;
CREATE POLICY "appointments_select" ON appointments FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "appointments_insert" ON appointments;
CREATE POLICY "appointments_insert" ON appointments FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "appointments_update" ON appointments;
CREATE POLICY "appointments_update" ON appointments FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "appointments_delete" ON appointments;
CREATE POLICY "appointments_delete" ON appointments FOR DELETE TO anon, authenticated USING (true);

-- 6. Enable Supabase Realtime
-- NOTE: If you get an error here saying table already exists in publication, that's OK.
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE doctors;
  EXCEPTION WHEN others THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE appointments;
  EXCEPTION WHEN others THEN NULL;
  END;
END;
$$;

-- 7. auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS set_appointments_updated_at ON appointments;
CREATE TRIGGER set_appointments_updated_at
  BEFORE UPDATE ON appointments
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 8. Seed default doctors (skip if already exist)
INSERT INTO doctors (name, specialty, status, meet_url, avatar_url)
VALUES
  ('Dr. Sarah Jenkins', 'Cardiologist', 'available',
   'https://meet.google.com/abc-defg-hij',
   'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300'),
  ('Dr. David Chen', 'Neurologist', 'available',
   'https://meet.google.com/klm-nopq-rst',
   'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=300'),
  ('Dr. Aisha Rahman', 'Pediatrician', 'busy',
   'https://meet.google.com/uvw-xyz1-234',
   'https://images.unsplash.com/photo-1594824813573-246434de83fb?auto=format&fit=crop&q=80&w=300'),
  ('Dr. James Wilson', 'Trauma Specialist', 'offline',
   'https://meet.google.com/567-890a-bcd',
   'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=300')
ON CONFLICT DO NOTHING;

-- Done!
SELECT 'ResQ DB setup complete ✅' as status;
