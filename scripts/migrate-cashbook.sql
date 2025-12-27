-- Migration: Cashbook Management System
-- Run this script to add cashbook functionality

-- 1. Create cashbook_transactions table
CREATE TABLE IF NOT EXISTS cashbook_transactions (
  id SERIAL PRIMARY KEY,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  receipt_number VARCHAR(100) UNIQUE NOT NULL,
  staff_name VARCHAR(255) NOT NULL,
  party_name VARCHAR(255),
  bill_numbers TEXT,
  debit_amount DECIMAL(15, 2) DEFAULT 0,
  credit_amount DECIMAL(15, 2) DEFAULT 0,
  balance DECIMAL(15, 2) NOT NULL,
  notes TEXT,
  created_by INTEGER REFERENCES admin_users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT check_debit_credit CHECK (
    (debit_amount > 0 AND credit_amount = 0) OR 
    (debit_amount = 0 AND credit_amount > 0) OR
    (debit_amount = 0 AND credit_amount = 0)
  )
);

-- 2. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_cashbook_transactions_date ON cashbook_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_cashbook_transactions_receipt ON cashbook_transactions(receipt_number);
CREATE INDEX IF NOT EXISTS idx_cashbook_transactions_staff ON cashbook_transactions(staff_name);
CREATE INDEX IF NOT EXISTS idx_cashbook_transactions_party ON cashbook_transactions(party_name);
CREATE INDEX IF NOT EXISTS idx_cashbook_transactions_created_at ON cashbook_transactions(created_at DESC);

-- 3. Create sequence for receipt numbers (starting from 1)
CREATE SEQUENCE IF NOT EXISTS cashbook_receipt_seq START 1;

-- 4. Create function to generate receipt number
CREATE OR REPLACE FUNCTION generate_cashbook_receipt_number()
RETURNS VARCHAR(100) AS $$
DECLARE
  next_val INTEGER;
BEGIN
  next_val := nextval('cashbook_receipt_seq');
  RETURN next_val::VARCHAR;
END;
$$ LANGUAGE plpgsql;

-- 5. Create trigger function that sets initial balance (will be recalculated)
CREATE OR REPLACE FUNCTION update_cashbook_balance()
RETURNS TRIGGER AS $$
BEGIN
  -- Just set balance to 0 initially (will be recalculated by AFTER trigger)
  -- This prevents NOT NULL constraint violations
  IF NEW.balance IS NULL THEN
    NEW.balance := 0;
  END IF;
  
  -- Update updated_at
  NEW.updated_at := NOW();
  
  -- If receipt_number is not set, generate one
  IF NEW.receipt_number IS NULL OR NEW.receipt_number = '' THEN
    NEW.receipt_number := generate_cashbook_receipt_number();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Create function to recalculate all balances from scratch
CREATE OR REPLACE FUNCTION recalculate_all_cashbook_balances()
RETURNS VOID AS $$
DECLARE
  rec RECORD;
  running_balance DECIMAL(15, 2) := 0;
BEGIN
  -- Set a session variable to prevent trigger recursion
  PERFORM set_config('cashbook.recalculating', 'true', false);
  
  -- Recalculate balances for all transactions in chronological order
  FOR rec IN 
    SELECT id, debit_amount, credit_amount, balance
    FROM cashbook_transactions
    ORDER BY transaction_date ASC, id ASC
  LOOP
    running_balance := running_balance + COALESCE(rec.debit_amount, 0) - COALESCE(rec.credit_amount, 0);
    
    -- Only update if balance has changed (more efficient)
    IF rec.balance IS DISTINCT FROM running_balance THEN
      UPDATE cashbook_transactions
      SET balance = running_balance
      WHERE id = rec.id;
    END IF;
  END LOOP;
  
  -- Clear the session variable
  PERFORM set_config('cashbook.recalculating', 'false', false);
END;
$$ LANGUAGE plpgsql;

-- 7. Create trigger function to recalculate all balances after insert/update
CREATE OR REPLACE FUNCTION recalculate_balances_after_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Skip recalculation if we're already in a recalculation (prevent infinite recursion)
  BEGIN
    IF current_setting('cashbook.recalculating', true) = 'true' THEN
      RETURN NEW;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- Setting doesn't exist, continue with recalculation
    NULL;
  END;
  
  -- After any insert or update, recalculate all balances to ensure correctness
  -- This is simple and reliable, and for most use cases, the performance impact is minimal
  PERFORM recalculate_all_cashbook_balances();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Create trigger to set initial balance on insert/update
DROP TRIGGER IF EXISTS trigger_update_cashbook_balance ON cashbook_transactions;
CREATE TRIGGER trigger_update_cashbook_balance
  BEFORE INSERT OR UPDATE ON cashbook_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_cashbook_balance();

-- 9. Create trigger to recalculate balances after insert/update
DROP TRIGGER IF EXISTS trigger_recalculate_after_change ON cashbook_transactions;
CREATE TRIGGER trigger_recalculate_after_change
  AFTER INSERT OR UPDATE ON cashbook_transactions
  FOR EACH ROW
  EXECUTE FUNCTION recalculate_balances_after_change();


-- 10. Add permission for managing cashbook
INSERT INTO admin_permissions (name, description) VALUES
  ('manage_cashbook', 'Can manage cashbook transactions and view cashbook records')
ON CONFLICT (name) DO NOTHING;

-- 11. Assign cashbook permission to invoice_handler and super_admin
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM admin_roles r, admin_permissions p
WHERE (r.name = 'invoice_handler' OR r.name = 'super_admin') AND p.name = 'manage_cashbook'
ON CONFLICT DO NOTHING;

-- 12. Analyze table for query optimization
ANALYZE cashbook_transactions;

