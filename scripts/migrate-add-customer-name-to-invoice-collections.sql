-- Migration: Add customer_name to invoice_collections
-- Customer name is recorded at collection time and shown wherever the invoice number appears.

ALTER TABLE invoice_collections
ADD COLUMN IF NOT EXISTS customer_name VARCHAR(255);

-- Backfill from supply records (same invoice number)
UPDATE invoice_collections ic
SET customer_name = s.customer_name
FROM supply s
WHERE ic.invoice_number = s.invoice_number
  AND (ic.customer_name IS NULL OR TRIM(ic.customer_name) = '')
  AND s.customer_name IS NOT NULL
  AND TRIM(s.customer_name) <> '';

-- Backfill from linked website orders
UPDATE invoice_collections ic
SET customer_name = o.customer_name
FROM orders o
WHERE ic.order_id = o.id
  AND (ic.customer_name IS NULL OR TRIM(ic.customer_name) = '')
  AND o.customer_name IS NOT NULL
  AND TRIM(o.customer_name) <> '';

CREATE INDEX IF NOT EXISTS idx_invoice_collections_customer_name ON invoice_collections(customer_name);

ANALYZE invoice_collections;
