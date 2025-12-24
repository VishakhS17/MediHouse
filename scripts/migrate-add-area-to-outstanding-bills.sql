-- Migration: Add Area Column to Outstanding Bills
-- Run this script to add area field to outstanding bills table

-- Add area column if it doesn't exist
ALTER TABLE outstanding_bills 
ADD COLUMN IF NOT EXISTS area VARCHAR(255);

-- Create index for area column if needed
CREATE INDEX IF NOT EXISTS idx_outstanding_bills_area ON outstanding_bills(area);

-- Create text search index for faster area searches (requires pg_trgm extension)
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_outstanding_bills_area_trgm ON outstanding_bills USING gin (area gin_trgm_ops);

-- Analyze table for query optimization
ANALYZE outstanding_bills;
