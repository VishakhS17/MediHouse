-- Clean Database Script
-- This script deletes all records from all tables EXCEPT admin_users
-- It preserves admin users, roles, and permissions for a fresh start
-- 
-- WARNING: This will permanently delete all data except admin users!
-- Make sure you have a backup before running this script.
--
-- Run this script to clean your database:
-- psql $DATABASE_URL -f scripts/clean-database.sql
-- Or copy and paste into your database client

BEGIN;

-- Disable triggers temporarily to speed up deletion
SET session_replication_role = 'replica';

-- Delete in order to respect foreign key constraints

-- 1. Delete order items (references orders and products)
DELETE FROM order_items;

-- 2. Delete invoice collections (references orders and admin_users)
DELETE FROM invoice_collections;

-- 3. Delete orders (references admin_users, but we keep admin_users)
DELETE FROM orders;

-- 4. Delete outstanding bills (references admin_users)
DELETE FROM outstanding_bills;

-- 5. Delete supply records (references admin_users)
DELETE FROM supply;

-- 6. Delete attendance records (references admin_users)
DELETE FROM attendance;

-- 7. Delete products (no dependencies on data we're deleting)
DELETE FROM products;

-- Re-enable triggers
SET session_replication_role = 'origin';

-- Reset sequences to start from 1 (optional, but good for fresh start)
-- This ensures new records start with ID 1
ALTER SEQUENCE IF EXISTS order_items_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS invoice_collections_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS orders_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS outstanding_bills_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS supply_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS attendance_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS products_id_seq RESTART WITH 1;

COMMIT;

-- Verify deletion (optional - shows counts)
SELECT 
    'order_items' as table_name, COUNT(*) as remaining_records FROM order_items
UNION ALL
SELECT 'invoice_collections', COUNT(*) FROM invoice_collections
UNION ALL
SELECT 'orders', COUNT(*) FROM orders
UNION ALL
SELECT 'outstanding_bills', COUNT(*) FROM outstanding_bills
UNION ALL
SELECT 'supply', COUNT(*) FROM supply
UNION ALL
SELECT 'attendance', COUNT(*) FROM attendance
UNION ALL
SELECT 'products', COUNT(*) FROM products
UNION ALL
SELECT 'admin_users', COUNT(*) FROM admin_users;

