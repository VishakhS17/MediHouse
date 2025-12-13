-- Migration: Add REF column to outstanding_bills table
-- Run this script if the outstanding_bills table already exists and you need to add the REF column

-- Add ref column if it doesn't exist
ALTER TABLE outstanding_bills 
ADD COLUMN IF NOT EXISTS ref VARCHAR(255);

-- Create index for ref column if needed
CREATE INDEX IF NOT EXISTS idx_outstanding_bills_ref ON outstanding_bills(ref);

-- Create text search index for faster REF searches (requires pg_trgm extension)
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_outstanding_bills_ref_trgm ON outstanding_bills USING gin (ref gin_trgm_ops);

-- Analyze table for query optimization
ANALYZE outstanding_bills;

