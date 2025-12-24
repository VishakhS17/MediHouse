-- Migration: Add Location Tracking to Attendance
-- Run this script to add location tracking to attendance records

-- Add location columns for device geolocation tracking
ALTER TABLE attendance 
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8);

ALTER TABLE attendance 
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

ALTER TABLE attendance 
ADD COLUMN IF NOT EXISTS location_address TEXT;

-- Create index for location queries
CREATE INDEX IF NOT EXISTS idx_attendance_location ON attendance(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Analyze table for query optimization
ANALYZE attendance;
