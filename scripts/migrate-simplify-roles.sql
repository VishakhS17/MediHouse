-- Migration: Simplify Roles to 3 Roles
-- Run this script to update roles to: Invoice Handler, Employee, and Super Admin

-- 1. Create new roles (or update existing ones)
INSERT INTO admin_roles (name, description) VALUES
  ('invoice_handler', 'Can collect invoices and check/verify invoices'),
  ('employee', 'Can view products and orders only'),
  ('super_admin', 'Full access to all features')
ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description;

-- 2. Remove old roles from role_permissions (clean up)
DELETE FROM role_permissions 
WHERE role_id IN (
  SELECT id FROM admin_roles 
  WHERE name IN ('warehouse_staff', 'sales_staff', 'stock_manager', 'invoice_collector')
);

-- 3. Assign permissions to Invoice Handler role
-- Invoice Handler: collect_invoices + check_invoices + view_dashboard
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM admin_roles r, admin_permissions p
WHERE r.name = 'invoice_handler' 
  AND p.name IN ('collect_invoices', 'check_invoices', 'view_dashboard')
ON CONFLICT DO NOTHING;

-- 4. Assign permissions to Employee role
-- Employee: manage_products + manage_orders + view_dashboard
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM admin_roles r, admin_permissions p
WHERE r.name = 'employee' 
  AND p.name IN ('manage_products', 'manage_orders', 'view_dashboard')
ON CONFLICT DO NOTHING;

-- 5. Ensure Super Admin has all permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM admin_roles r, admin_permissions p
WHERE r.name = 'super_admin'
ON CONFLICT DO NOTHING;

-- 6. Update existing users with old roles to new roles
-- Map old roles to new roles:
-- invoice_collector -> invoice_handler
-- warehouse_staff -> invoice_handler (if they had collect_invoices)
-- sales_staff -> employee
-- stock_manager -> employee (if they only need products/orders)
-- super_admin -> super_admin (no change)

UPDATE admin_users 
SET role_id = (SELECT id FROM admin_roles WHERE name = 'invoice_handler' LIMIT 1)
WHERE role_id IN (
  SELECT id FROM admin_roles WHERE name IN ('invoice_collector', 'warehouse_staff')
);

UPDATE admin_users 
SET role_id = (SELECT id FROM admin_roles WHERE name = 'employee' LIMIT 1)
WHERE role_id IN (
  SELECT id FROM admin_roles WHERE name IN ('sales_staff', 'stock_manager')
);

-- Note: super_admin users remain unchanged

-- 7. Delete old roles (after migrating users)
DELETE FROM admin_roles 
WHERE name IN ('warehouse_staff', 'sales_staff', 'stock_manager', 'invoice_collector');

-- Analyze tables for query optimization
ANALYZE admin_roles;
ANALYZE role_permissions;
ANALYZE admin_users;

