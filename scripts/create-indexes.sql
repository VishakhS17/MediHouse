-- Performance optimization: Create indexes for faster queries
-- Run this script to improve database query performance

-- Index for products table - name lookups (used in orders API)
CREATE INDEX IF NOT EXISTS idx_products_name_lower ON products (LOWER(name));

-- Index for products table - manufacturer lookups
CREATE INDEX IF NOT EXISTS idx_products_manufacturer ON products (manufacturer);

-- Composite index for name + manufacturer lookups (most common query pattern)
CREATE INDEX IF NOT EXISTS idx_products_name_manufacturer ON products (LOWER(name), LOWER(manufacturer));

-- Index for active products filter (used in products API)
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products (is_active) WHERE is_active = true;

-- Index for stock quantity (used in filtering)
CREATE INDEX IF NOT EXISTS idx_products_stock_quantity ON products (stock_quantity);

-- Index for orders table - date lookups (used in sales report)
CREATE INDEX IF NOT EXISTS idx_orders_order_date ON orders (order_date);

-- Index for order_items table - order_id lookups
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items (order_id);

-- Index for order_items table - product_id lookups
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items (product_id);

-- Index for admin_users table - email lookups (used in login)
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users (email);

-- Analyze tables to update statistics for query planner
ANALYZE products;
ANALYZE orders;
ANALYZE order_items;
ANALYZE admin_users;

