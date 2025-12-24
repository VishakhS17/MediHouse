-- Migration: Add Attendance Permission to Invoice Handler Role
-- Run this script to allow invoice handlers to view and mark attendance (but not edit existing records)

-- Assign manage_attendance permission to invoice_handler role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM admin_roles r, admin_permissions p
WHERE r.name = 'invoice_handler' AND p.name = 'manage_attendance'
ON CONFLICT DO NOTHING;

-- Analyze tables for query optimization
ANALYZE role_permissions;
