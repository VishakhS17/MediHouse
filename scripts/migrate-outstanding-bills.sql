-- Migration: Outstanding Bills (DRS) Management System
-- Run this script to add outstanding bills tracking functionality

-- 1. Create outstanding_bills table
CREATE TABLE IF NOT EXISTS outstanding_bills (
  id SERIAL PRIMARY KEY,
  invoice_number VARCHAR(100) NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  bill_date DATE NOT NULL,
  ref VARCHAR(255),
  total_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
  received_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
  pending_balance DECIMAL(15, 2) NOT NULL DEFAULT 0,
  as_of_date DATE DEFAULT CURRENT_DATE,
  credit_days INTEGER,
  uploaded_by INTEGER REFERENCES admin_users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(invoice_number, customer_name)
);

-- 2. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_outstanding_bills_invoice_number ON outstanding_bills(invoice_number);
CREATE INDEX IF NOT EXISTS idx_outstanding_bills_customer_name ON outstanding_bills(customer_name);
CREATE INDEX IF NOT EXISTS idx_outstanding_bills_invoice_customer ON outstanding_bills(invoice_number, customer_name);
CREATE INDEX IF NOT EXISTS idx_outstanding_bills_bill_date ON outstanding_bills(bill_date);

-- Text search indexes for faster ILIKE queries (using trigram extension if available)
-- These indexes significantly improve search performance on customer_name and invoice_number
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_outstanding_bills_customer_name_trgm ON outstanding_bills USING gin (customer_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_outstanding_bills_invoice_number_trgm ON outstanding_bills USING gin (invoice_number gin_trgm_ops);

-- 3. Add function to automatically calculate pending_balance and credit_days
CREATE OR REPLACE FUNCTION update_outstanding_bill_calculations()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate pending balance: total_amount - received_amount
  NEW.pending_balance = NEW.total_amount - NEW.received_amount;
  
  -- Calculate credit days: as_of_date - bill_date
  IF NEW.as_of_date IS NULL THEN
    NEW.as_of_date = CURRENT_DATE;
  END IF;
  NEW.credit_days = NEW.as_of_date - NEW.bill_date;
  
  -- Update updated_at timestamp
  NEW.updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Create trigger to auto-calculate values
DROP TRIGGER IF EXISTS trigger_update_outstanding_bill_calculations ON outstanding_bills;
CREATE TRIGGER trigger_update_outstanding_bill_calculations
  BEFORE INSERT OR UPDATE ON outstanding_bills
  FOR EACH ROW
  EXECUTE FUNCTION update_outstanding_bill_calculations();

-- 5. Add permission for managing outstanding bills
INSERT INTO admin_permissions (name, description) VALUES
  ('manage_outstanding_bills', 'Can upload and manage outstanding bills (DRS files)')
ON CONFLICT (name) DO NOTHING;

-- 6. Assign outstanding bills permission to invoice_handler and super_admin
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM admin_roles r, admin_permissions p
WHERE (r.name = 'invoice_handler' OR r.name = 'super_admin') AND p.name = 'manage_outstanding_bills'
ON CONFLICT DO NOTHING;

-- 7. Add REF column if it doesn't exist (for existing tables)
ALTER TABLE outstanding_bills 
ADD COLUMN IF NOT EXISTS ref VARCHAR(255);

-- 8. Create index for ref column if needed
CREATE INDEX IF NOT EXISTS idx_outstanding_bills_ref ON outstanding_bills(ref);

-- 9. Create text search index for faster REF searches (requires pg_trgm extension)
CREATE INDEX IF NOT EXISTS idx_outstanding_bills_ref_trgm ON outstanding_bills USING gin (ref gin_trgm_ops);

-- 10. Analyze table for query optimization
ANALYZE outstanding_bills;

