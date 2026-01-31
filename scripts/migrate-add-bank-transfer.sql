-- Migration: Add Bank Transfer transaction type to cashbook
-- Run this script to add bank_transfer_amount column and update balance calculations

-- 1. Add bank_transfer_amount column
ALTER TABLE cashbook_transactions 
ADD COLUMN IF NOT EXISTS bank_transfer_amount DECIMAL(15, 2) DEFAULT 0;

-- 2. Update the constraint to allow bank_transfer_amount
ALTER TABLE cashbook_transactions 
DROP CONSTRAINT IF EXISTS check_debit_credit;

ALTER TABLE cashbook_transactions 
ADD CONSTRAINT check_debit_credit_bank_transfer CHECK (
  (debit_amount > 0 AND credit_amount = 0 AND bank_transfer_amount = 0) OR 
  (debit_amount = 0 AND credit_amount > 0 AND bank_transfer_amount = 0) OR
  (debit_amount = 0 AND credit_amount = 0 AND bank_transfer_amount > 0) OR
  (debit_amount = 0 AND credit_amount = 0 AND bank_transfer_amount = 0)
);

-- 3. Update the balance calculation function to exclude bank_transfer_amount
CREATE OR REPLACE FUNCTION recalculate_all_cashbook_balances()
RETURNS VOID AS $$
DECLARE
  rec RECORD;
  running_balance DECIMAL(15, 2) := 0;
BEGIN
  -- Set a session variable to prevent trigger recursion
  PERFORM set_config('cashbook.recalculating', 'true', false);
  
  -- Recalculate balances for all transactions in chronological order
  -- NOTE: bank_transfer_amount is NOT included in balance calculation
  FOR rec IN 
    SELECT id, debit_amount, credit_amount, balance
    FROM cashbook_transactions
    ORDER BY transaction_date ASC, id ASC
  LOOP
    -- Only add debit and subtract credit, NOT bank_transfer_amount
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

-- 4. Update the trigger function to exclude bank_transfer_amount from balance
CREATE OR REPLACE FUNCTION update_cashbook_balance()
RETURNS TRIGGER AS $$
DECLARE
  previous_balance DECIMAL(15, 2) := 0;
BEGIN
  -- Get the last balance before this transaction
  SELECT COALESCE(balance, 0)
  INTO previous_balance
  FROM cashbook_transactions
  WHERE (transaction_date < NEW.transaction_date)
     OR (transaction_date = NEW.transaction_date AND id < COALESCE(NEW.id, 0))
  ORDER BY transaction_date DESC, id DESC
  LIMIT 1;
  
  -- If no previous transaction found, start with 0
  previous_balance := COALESCE(previous_balance, 0);
  
  -- Calculate new balance: previous balance + debit - credit
  -- NOTE: bank_transfer_amount is NOT included in balance calculation
  NEW.balance := previous_balance + COALESCE(NEW.debit_amount, 0) - COALESCE(NEW.credit_amount, 0);
  
  -- Update updated_at
  NEW.updated_at := NOW();
  
  -- If receipt_number is not set, generate one
  IF NEW.receipt_number IS NULL OR NEW.receipt_number = '' THEN
    NEW.receipt_number := generate_cashbook_receipt_number();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Recalculate all existing balances (excluding bank transfers)
SELECT recalculate_all_cashbook_balances();

-- 6. Analyze table for query optimization
ANALYZE cashbook_transactions;

