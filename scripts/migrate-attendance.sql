-- Migration: Employee Attendance System
-- Run this script to add attendance tracking functionality

-- 1. Create attendance table
CREATE TABLE IF NOT EXISTS attendance (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER REFERENCES admin_users(id) ON DELETE CASCADE,
  attendance_date DATE NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('present', 'absent', 'half_day', 'leave')),
  marked_by INTEGER REFERENCES admin_users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(employee_id, attendance_date)
);

-- 2. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_attendance_employee_id ON attendance(employee_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(attendance_date);
CREATE INDEX IF NOT EXISTS idx_attendance_employee_date ON attendance(employee_id, attendance_date);

-- 3. Add permission for managing attendance
INSERT INTO admin_permissions (name, description) VALUES
  ('manage_attendance', 'Can mark and view employee attendance')
ON CONFLICT (name) DO NOTHING;

-- 4. Assign attendance permission to super_admin
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM admin_roles r, admin_permissions p
WHERE r.name = 'super_admin' AND p.name = 'manage_attendance'
ON CONFLICT DO NOTHING;

-- 5. Ensure super_admin has ALL permissions (including any new ones added)
-- This ensures super_admin always has access to everything
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM admin_roles r, admin_permissions p
WHERE r.name = 'super_admin'
ON CONFLICT DO NOTHING;

-- Analyze table for query optimization
ANALYZE attendance;

