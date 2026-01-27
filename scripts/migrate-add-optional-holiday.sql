-- Migration: Add Optional Holiday status to attendance
-- Run this script to add 'optional_holiday' as a valid attendance status

-- Drop the existing CHECK constraint
ALTER TABLE attendance DROP CONSTRAINT IF EXISTS attendance_status_check;

-- Add the new CHECK constraint with optional_holiday included
ALTER TABLE attendance ADD CONSTRAINT attendance_status_check 
  CHECK (status IN ('present', 'absent', 'half_day', 'leave', 'optional_holiday'));

-- Analyze table for query optimization
ANALYZE attendance;

