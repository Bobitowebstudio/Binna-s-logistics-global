-- SQL Schema for Binna's Logistics Global
-- Table: orders
-- Description: Stores client quote/contact submission requests.

-- 1. Create the orders table
CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    company_name TEXT DEFAULT 'Individual',
    email TEXT NOT NULL,
    phone TEXT DEFAULT 'Not Provided',
    service_needed TEXT DEFAULT 'General Enquiry',
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Unread',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies

-- Policy A: Allow anyone to submit an order (Insert permission is public)
CREATE POLICY "Allow public order creation" 
ON orders 
FOR INSERT 
TO public 
WITH CHECK (true);

-- Policy B: Prevent anonymous/unauthenticated users from reading or altering order rows.
-- Note: In our current setup, server-side operations using the Service Role Key bypass RLS automatically.
-- For standard authenticated admins or managers who view via client connections, they can select rows.
CREATE POLICY "Allow authenticated users to read orders"
ON orders
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to update orders"
ON orders
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to delete orders"
ON orders
FOR DELETE
TO authenticated
USING (true);
