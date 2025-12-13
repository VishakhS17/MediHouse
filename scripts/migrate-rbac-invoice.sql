-- Migration: Role-Based Access Control (RBAC) and Invoice Collection System
-- Run this script to add roles, permissions, and invoice tracking

-- 1. Create admin_roles table
CREATE TABLE IF NOT EXISTS admin_roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create admin_permissions table
CREATE TABLE IF NOT EXISTS admin_permissions (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create role_permissions junction table
CREATE TABLE IF NOT EXISTS role_permissions (
  role_id INTEGER REFERENCES admin_roles(id) ON DELETE CASCADE,
  permission_id INTEGER REFERENCES admin_permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

-- 4. Add role_id to admin_users table
ALTER TABLE admin_users 
ADD COLUMN IF NOT EXISTS role_id INTEGER REFERENCES admin_roles(id) ON DELETE SET NULL;

-- 5. Create invoice_collections table
CREATE TABLE IF NOT EXISTS invoice_collections (
  id SERIAL PRIMARY KEY,
  invoice_number VARCHAR(100) NOT NULL,
  order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
  collected_by INTEGER REFERENCES admin_users(id) ON DELETE SET NULL,
  collector_name VARCHAR(255) NOT NULL,
  collection_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Insert default permissions
INSERT INTO admin_permissions (name, description) VALUES
  ('manage_products', 'Can add, edit, and delete products'),
  ('manage_stock', 'Can upload and update stock quantities'),
  ('view_sales', 'Can view sales reports'),
  ('manage_orders', 'Can view and manage orders'),
  ('manage_customers', 'Can view and manage customer information'),
  ('collect_invoices', 'Can record invoice collections from warehouse'),
  ('manage_admins', 'Can create and manage admin users and roles'),
  ('view_dashboard', 'Can access admin dashboard')
ON CONFLICT (name) DO NOTHING;

-- 7. Insert default roles
INSERT INTO admin_roles (name, description) VALUES
  ('super_admin', 'Full access to all features'),
  ('warehouse_staff', 'Can collect invoices and manage stock'),
  ('sales_staff', 'Can view sales reports and manage orders'),
  ('stock_manager', 'Can manage products and stock'),
  ('invoice_collector', 'Can only collect invoices')
ON CONFLICT (name) DO NOTHING;

-- 8. Assign permissions to roles
-- Super Admin: All permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM admin_roles r, admin_permissions p
WHERE r.name = 'super_admin'
ON CONFLICT DO NOTHING;

-- Warehouse Staff: Stock management and invoice collection
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM admin_roles r, admin_permissions p
WHERE r.name = 'warehouse_staff' 
  AND p.name IN ('manage_stock', 'collect_invoices', 'view_dashboard', 'manage_products')
ON CONFLICT DO NOTHING;

-- Sales Staff: Sales reports and orders
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM admin_roles r, admin_permissions p
WHERE r.name = 'sales_staff' 
  AND p.name IN ('view_sales', 'manage_orders', 'manage_customers', 'view_dashboard')
ON CONFLICT DO NOTHING;

-- Stock Manager: Products and stock
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM admin_roles r, admin_permissions p
WHERE r.name = 'stock_manager' 
  AND p.name IN ('manage_products', 'manage_stock', 'view_dashboard')
ON CONFLICT DO NOTHING;

-- Invoice Collector: Only invoice collection
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM admin_roles r, admin_permissions p
WHERE r.name = 'invoice_collector' 
  AND p.name IN ('collect_invoices', 'view_dashboard')
ON CONFLICT DO NOTHING;

-- 9. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_admin_users_role_id ON admin_users(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON role_permissions(permission_id);
CREATE INDEX IF NOT EXISTS idx_invoice_collections_invoice_number ON invoice_collections(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoice_collections_order_id ON invoice_collections(order_id);
CREATE INDEX IF NOT EXISTS idx_invoice_collections_collected_by ON invoice_collections(collected_by);
CREATE INDEX IF NOT EXISTS idx_invoice_collections_collection_date ON invoice_collections(collection_date);

-- 10. Set default role for existing admin users (if they don't have one)
UPDATE admin_users 
SET role_id = (SELECT id FROM admin_roles WHERE name = 'super_admin' LIMIT 1)
WHERE role_id IS NULL;

-- 11. Create function to get user permissions
CREATE OR REPLACE FUNCTION get_admin_permissions(user_id INTEGER)
RETURNS TABLE(permission_name VARCHAR) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT p.name
  FROM admin_permissions p
  INNER JOIN role_permissions rp ON p.id = rp.permission_id
  INNER JOIN admin_users au ON rp.role_id = au.role_id
  WHERE au.id = user_id;
END;
$$ LANGUAGE plpgsql;

-- 12. Create function to check if user has permission
CREATE OR REPLACE FUNCTION has_permission(user_id INTEGER, permission_name VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM admin_permissions p
    INNER JOIN role_permissions rp ON p.id = rp.permission_id
    INNER JOIN admin_users au ON rp.role_id = au.role_id
    WHERE au.id = user_id AND p.name = permission_name
  );
END;
$$ LANGUAGE plpgsql;

-- Analyze tables for query optimization
ANALYZE admin_roles;
ANALYZE admin_permissions;
ANALYZE role_permissions;
ANALYZE invoice_collections;
ANALYZE admin_users;


