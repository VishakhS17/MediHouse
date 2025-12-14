-- Migration: Supply Management System
-- Run this script to add supply tracking functionality

-- 1. Create supply table
CREATE TABLE IF NOT EXISTS supply (
  id SERIAL PRIMARY KEY,
  invoice_number VARCHAR(100) NOT NULL,
  supplied_by VARCHAR(255) NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  delivery_date TIMESTAMP WITH TIME ZONE,
  created_by INTEGER REFERENCES admin_users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(invoice_number)
);

-- Add delivery_date column if it doesn't exist (for existing tables)
ALTER TABLE supply 
ADD COLUMN IF NOT EXISTS delivery_date TIMESTAMP WITH TIME ZONE;

-- Add location columns for device geolocation tracking
ALTER TABLE supply 
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8);

ALTER TABLE supply 
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

ALTER TABLE supply 
ADD COLUMN IF NOT EXISTS location_address TEXT;

-- 2. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_supply_invoice_number ON supply(invoice_number);
CREATE INDEX IF NOT EXISTS idx_supply_customer_name ON supply(customer_name);
CREATE INDEX IF NOT EXISTS idx_supply_location ON supply(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- 3. Add permission for managing supply
INSERT INTO admin_permissions (name, description) VALUES
  ('manage_supply', 'Can manage supply records and track invoice supplies')
ON CONFLICT (name) DO NOTHING;

-- 4. Assign supply permission to invoice_handler and super_admin
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM admin_roles r, admin_permissions p
WHERE (r.name = 'invoice_handler' OR r.name = 'super_admin') AND p.name = 'manage_supply'
ON CONFLICT DO NOTHING;

-- Analyze table for query optimization
ANALYZE supply;

