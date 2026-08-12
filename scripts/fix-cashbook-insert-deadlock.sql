-- Fix: Cashbook insert deadlocks from full-table recalculation on every INSERT
-- The BEFORE trigger already computes the correct running balance.
-- Full recalculation remains available for edits/deletes via recalculate_all_cashbook_balances().

CREATE OR REPLACE FUNCTION recalculate_balances_after_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Intentionally no-op on INSERT/UPDATE triggers.
  -- Balance is set by update_cashbook_balance() (BEFORE trigger).
  -- Recalculate explicitly from API after edits/deletes only.
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ensure BEFORE trigger computes balance correctly (debit - credit, ignore bank transfer)
CREATE OR REPLACE FUNCTION update_cashbook_balance()
RETURNS TRIGGER AS $$
DECLARE
  previous_balance DECIMAL(15, 2) := 0;
BEGIN
  SELECT COALESCE(balance, 0)
  INTO previous_balance
  FROM cashbook_transactions
  WHERE (transaction_date < NEW.transaction_date)
     OR (transaction_date = NEW.transaction_date AND id < COALESCE(NEW.id, 0))
  ORDER BY transaction_date DESC, id DESC
  LIMIT 1;

  previous_balance := COALESCE(previous_balance, 0);

  -- Bank transfers do not affect cash balance
  NEW.balance := previous_balance + COALESCE(NEW.debit_amount, 0) - COALESCE(NEW.credit_amount, 0);
  NEW.updated_at := NOW();

  IF NEW.receipt_number IS NULL OR NEW.receipt_number = '' THEN
    NEW.receipt_number := generate_cashbook_receipt_number();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Make receipt generation skip already-used numbers (manual receipts can collide with sequence)
CREATE OR REPLACE FUNCTION generate_cashbook_receipt_number()
RETURNS VARCHAR(100) AS $$
DECLARE
  next_val BIGINT;
  attempts INTEGER := 0;
BEGIN
  LOOP
    next_val := nextval('cashbook_receipt_seq');
    attempts := attempts + 1;

    EXIT WHEN NOT EXISTS (
      SELECT 1 FROM cashbook_transactions WHERE receipt_number = next_val::VARCHAR
    );

    IF attempts >= 100 THEN
      SELECT COALESCE(MAX(receipt_number::bigint), next_val)
      INTO next_val
      FROM cashbook_transactions
      WHERE receipt_number ~ '^[0-9]+$'
        AND receipt_number::bigint < 1000000; -- keep auto numbers in a sane range

      PERFORM setval('cashbook_receipt_seq', next_val);
      next_val := nextval('cashbook_receipt_seq');
      EXIT WHEN NOT EXISTS (
        SELECT 1 FROM cashbook_transactions WHERE receipt_number = next_val::VARCHAR
      );
    END IF;

    IF attempts > 1000 THEN
      RAISE EXCEPTION 'Unable to generate unique cashbook receipt number';
    END IF;
  END LOOP;

  RETURN next_val::VARCHAR;
END;
$$ LANGUAGE plpgsql;
