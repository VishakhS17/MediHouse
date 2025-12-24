-- Migration: Remove Location Columns from Supply Table
-- Run this script to remove location tracking from supply records

-- Drop the location index first
DROP INDEX IF EXISTS idx_supply_location;

-- Remove location columns
ALTER TABLE supply 
DROP COLUMN IF EXISTS latitude;

ALTER TABLE supply 
DROP COLUMN IF EXISTS longitude;

ALTER TABLE supply 
DROP COLUMN IF EXISTS location_address;

-- Analyze table for query optimization
ANALYZE supply;
