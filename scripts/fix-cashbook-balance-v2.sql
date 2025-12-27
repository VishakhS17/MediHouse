-- Fix Cashbook Balance Calculation (Version 2 - Simplified)
-- This version uses a simpler approach that always recalculates all balances after insert
-- Run this script to fix the balance calculation issue

-- 1. Drop existing triggers and functions
DROP TRIGGER IF EXISTS trigger_update_cashbook_balance ON cashbook_transactions;
DROP TRIGGER IF EXISTS trigger_recalculate_after_insert ON cashbook_transactions;
DROP TRIGGER IF EXISTS trigger_recalculate_after_change ON cashbook_transactions;
DROP FUNCTION IF EXISTS update_cashbook_balance() CASCADE;
DROP FUNCTION IF EXISTS recalculate_balances_after_insert() CASCADE;
DROP FUNCTION IF EXISTS recalculate_balances_after_change() CASCADE;
DROP FUNCTION IF EXISTS recalculate_balances_from_date(DATE) CASCADE;

-- 2. Create a simpler trigger function that sets initial balance (will be recalculated)
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

-- 3. Create function to recalculate all balances from scratch
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

-- 4. Create trigger function to recalculate all balances after insert/update
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

-- 5. Recreate triggers
CREATE TRIGGER trigger_update_cashbook_balance
  BEFORE INSERT OR UPDATE ON cashbook_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_cashbook_balance();

CREATE TRIGGER trigger_recalculate_after_change
  AFTER INSERT OR UPDATE ON cashbook_transactions
  FOR EACH ROW
  EXECUTE FUNCTION recalculate_balances_after_change();

-- 6. Recalculate all existing balances to fix any incorrect data
SELECT recalculate_all_cashbook_balances();

