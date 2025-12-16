-- Migration: Upload History Tracking
-- This script creates a table to track the last upload dates for stock and DRS uploads

-- Create upload_history table to track last upload dates
CREATE TABLE IF NOT EXISTS upload_history (
  id SERIAL PRIMARY KEY,
  upload_type VARCHAR(50) NOT NULL UNIQUE, -- 'stock' or 'drs'
  last_upload_date TIMESTAMP WITH TIME ZONE NOT NULL,
  uploaded_by INTEGER REFERENCES admin_users(id) ON DELETE SET NULL,
  records_count INTEGER, -- Number of records processed in last upload
  file_name VARCHAR(255), -- Name of the uploaded file
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_upload_history_type ON upload_history(upload_type);

-- Insert initial records (if they don't exist)
INSERT INTO upload_history (upload_type, last_upload_date, records_count)
VALUES 
  ('stock', NOW(), 0),
  ('drs', NOW(), 0)
ON CONFLICT (upload_type) DO NOTHING;

-- Analyze table for query optimization
ANALYZE upload_history;

