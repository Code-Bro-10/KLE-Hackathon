-- ============================================================
-- ResQ AI: Add Google Meet Columns to consultations table
-- ============================================================

-- 1. Dynamically drop any existing check constraints on the consultations table to avoid name mismatches
DO $$
DECLARE
    con_name text;
BEGIN
    FOR con_name IN
        SELECT con.conname
        FROM pg_constraint con
        JOIN pg_class rel ON rel.oid = con.conrelid
        JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
        WHERE nsp.nspname = 'public'
          AND rel.relname = 'consultations'
          AND con.contype = 'c'
    LOOP
        EXECUTE 'ALTER TABLE public.consultations DROP CONSTRAINT IF EXISTS ' || quote_ident(con_name);
    END LOOP;
END;
$$;

-- 2. Add the updated check constraint allowing all telehealth statuses
ALTER TABLE consultations ADD CONSTRAINT consultations_status_check 
  CHECK (status IN ('pending', 'accepted', 'rejected', 'active', 'completed'));

-- 3. Update the default value of the status column to pending
ALTER TABLE consultations ALTER COLUMN status SET DEFAULT 'pending';

-- 4. Add columns for patient email and symptoms
ALTER TABLE consultations ADD COLUMN IF NOT EXISTS patient_email text DEFAULT '';
ALTER TABLE consultations ADD COLUMN IF NOT EXISTS symptoms text DEFAULT '';

-- 5. Add columns for Google Meet space tracking
ALTER TABLE consultations ADD COLUMN IF NOT EXISTS meet_link text DEFAULT '';
ALTER TABLE consultations ADD COLUMN IF NOT EXISTS meet_space_name text DEFAULT '';
ALTER TABLE consultations ADD COLUMN IF NOT EXISTS meet_status text DEFAULT '';
ALTER TABLE consultations ADD COLUMN IF NOT EXISTS meeting_created_at timestamptz;

-- 6. Ensure consultations table is published to Supabase Realtime replication
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE consultations;
  EXCEPTION WHEN others THEN NULL;
  END;
END;
$$;
