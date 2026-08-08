-- ============================================================
-- ResQ AI: Refactor Pharmacy Schema for Medicine Marketplace
-- ============================================================

-- Alter medicines table
ALTER TABLE medicines ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'Other';
ALTER TABLE medicines ADD COLUMN IF NOT EXISTS description text NOT NULL DEFAULT '';
ALTER TABLE medicines ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE medicines ALTER COLUMN store_id SET DEFAULT 'c3a4f6d7-8910-1112-1314-151617181920';
ALTER TABLE medicines ALTER COLUMN store_id DROP NOT NULL;

-- Alter orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_number text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS user_id uuid;

-- Safely drop old status check constraints
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders DROP CONSTRAINT IF EXISTS check_status;

-- Migrate existing status text safely
UPDATE orders SET status = 'Placed' WHERE status NOT IN ('Placed', 'Confirmed', 'Preparing', 'Out for Delivery', 'Delivered');

-- Add new status check constraints
ALTER TABLE orders ADD CONSTRAINT orders_status_check CHECK (status IN ('Placed', 'Confirmed', 'Preparing', 'Out for Delivery', 'Delivered'));

-- Alter order_items table
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS medicine_id uuid REFERENCES medicines(id) ON DELETE SET NULL;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS total_price numeric NOT NULL DEFAULT 0;

-- Ensure RLS is configured correctly with open policies for the simulation
DROP POLICY IF EXISTS "anon_select_orders" ON orders;
CREATE POLICY "anon_select_orders" ON orders FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_orders" ON orders;
CREATE POLICY "anon_insert_orders" ON orders FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_orders" ON orders;
CREATE POLICY "anon_update_orders" ON orders FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_orders" ON orders;
CREATE POLICY "anon_delete_orders" ON orders FOR DELETE TO anon, authenticated USING (true);

-- Enable RLS for order_items
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_order_items" ON order_items;
CREATE POLICY "anon_select_order_items" ON order_items FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_order_items" ON order_items;
CREATE POLICY "anon_insert_order_items" ON order_items FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_order_items" ON order_items;
CREATE POLICY "anon_update_order_items" ON order_items FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_order_items" ON order_items;
CREATE POLICY "anon_delete_order_items" ON order_items FOR DELETE TO anon, authenticated USING (true);

-- Add some seed medicines for the Hackathon Demo
INSERT INTO medicines (id, medicine_name, category, description, price, stock, is_available, image_url)
VALUES
  (
    '018f6d7a-8910-1112-1314-151617181920',
    'Paracetamol 650mg',
    'Pain Relief',
    'Relieves mild to moderate pain and reduces fever.',
    15.00,
    50,
    true,
    'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?auto=format&fit=crop&q=80&w=200'
  ),
  (
    '018f6d7a-8910-1112-1314-151617181921',
    'Cetirizine 10mg',
    'Cold & Allergy',
    'Provides relief from runny nose, sneezing, and hives.',
    20.00,
    30,
    true,
    'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=200'
  ),
  (
    '018f6d7a-8910-1112-1314-151617181922',
    'ORS Oral Rehydration Salts',
    'Digestive Care',
    'Restores essential body fluids and electrolytes.',
    25.00,
    5,
    true,
    'https://images.unsplash.com/photo-1607619056574-7b8f304b3c93?auto=format&fit=crop&q=80&w=200'
  ),
  (
    '018f6d7a-8910-1112-1314-151617181923',
    'Antiseptic Dettol',
    'First Aid',
    'Protects against infection from cuts, scratches, and insect bites.',
    80.00,
    15,
    true,
    'https://images.unsplash.com/photo-1603398938378-e54eab446dde?auto=format&fit=crop&q=80&w=200'
  ),
  (
    '018f6d7a-8910-1112-1314-151617181924',
    'Pain Relief Gel',
    'Pain Relief',
    'Fast-acting topical gel for muscle ache and joint stiffness.',
    120.00,
    0,
    false,
    'https://images.unsplash.com/photo-1550572017-edd951b55104?auto=format&fit=crop&q=80&w=200'
  )
ON CONFLICT (id) DO UPDATE
SET
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock,
  is_available = EXCLUDED.is_available,
  image_url = EXCLUDED.image_url;
