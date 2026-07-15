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

-- Policy B: Prevent standard authenticated users or anonymous public visitors from accessing order rows.
-- Restrict SELECT, UPDATE, and DELETE operations strictly to the authorized system administrator's email address.
CREATE POLICY "Allow authenticated admin to read orders"
ON orders
FOR SELECT
TO authenticated
USING (auth.jwt() ->> 'email' = 'info@binnaslogisticsglobal.com.ng');

CREATE POLICY "Allow authenticated admin to update orders"
ON orders
FOR UPDATE
TO authenticated
USING (auth.jwt() ->> 'email' = 'info@binnaslogisticsglobal.com.ng');

CREATE POLICY "Allow authenticated admin to delete orders"
ON orders
FOR DELETE
TO authenticated
USING (auth.jwt() ->> 'email' = 'info@binnaslogisticsglobal.com.ng');
