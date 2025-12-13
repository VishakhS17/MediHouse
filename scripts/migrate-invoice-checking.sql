-- Migration: Invoice Checking System
-- Run this script to add invoice checking functionality

-- Add columns to invoice_collections table for checking
ALTER TABLE invoice_collections 
ADD COLUMN IF NOT EXISTS checker_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS checked_date TIMESTAMP WITH TIME ZONE;

-- Create index for checked_date
CREATE INDEX IF NOT EXISTS idx_invoice_collections_checked_date ON invoice_collections(checked_date);

-- Add permission for invoice checking
INSERT INTO admin_permissions (name, description) VALUES
  ('check_invoices', 'Can check invoices and mark them as verified')
ON CONFLICT (name) DO NOTHING;

-- Assign invoice checking permission to invoice_handler role (and invoice_collector for backward compatibility)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM admin_roles r, admin_permissions p
WHERE (r.name = 'invoice_handler' OR r.name = 'invoice_collector') AND p.name = 'check_invoices'
ON CONFLICT DO NOTHING;

-- Also assign to super_admin (all permissions already assigned, but ensure it's there)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM admin_roles r, admin_permissions p
WHERE r.name = 'super_admin' AND p.name = 'check_invoices'
ON CONFLICT DO NOTHING;

-- Analyze table for query optimization
ANALYZE invoice_collections;

