-- ============================================================
-- ResQ AI: Appointments Table (Real-time Doctor Consultation)
-- Run this in Supabase SQL Editor or via: npm run db-push
-- ============================================================

-- Create appointments table
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

-- Enable Row Level Security
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if re-running
DROP POLICY IF EXISTS "appointments_anon_insert"  ON appointments;
DROP POLICY IF EXISTS "appointments_anon_select"  ON appointments;
DROP POLICY IF EXISTS "appointments_anon_update"  ON appointments;
DROP POLICY IF EXISTS "appointments_anon_delete"  ON appointments;

-- Allow anonymous and authenticated users full access
-- (Simplest policy that works without auth; tighten later with auth.uid())
CREATE POLICY "appointments_anon_insert" ON appointments
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "appointments_anon_select" ON appointments
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "appointments_anon_update" ON appointments
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "appointments_anon_delete" ON appointments
  FOR DELETE TO anon, authenticated USING (true);

-- Enable Supabase Realtime for this table
-- (Realtime must be enabled in Supabase dashboard > Database > Replication for this to work)
ALTER PUBLICATION supabase_realtime ADD TABLE appointments;

-- Also ensure consultations table is published for realtime
ALTER PUBLICATION supabase_realtime ADD TABLE consultations;

-- Add updated_at auto-trigger function (if not already created)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to appointments
DROP TRIGGER IF EXISTS set_appointments_updated_at ON appointments;
CREATE TRIGGER set_appointments_updated_at
  BEFORE UPDATE ON appointments
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();
