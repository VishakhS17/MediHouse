# Role-Based Access Control (RBAC) and Invoice Collection System

This migration adds role-based access control and invoice collection tracking to the MediHouse admin system.

## What This Migration Does

1. **Creates RBAC Tables:**
   - `admin_roles` - Defines different admin roles (super_admin, warehouse_staff, etc.)
   - `admin_permissions` - Defines available permissions (manage_products, collect_invoices, etc.)
   - `role_permissions` - Links roles to their permissions

2. **Creates Invoice Collection Table:**
   - `invoice_collections` - Tracks when medicines are collected from warehouse using invoice numbers

3. **Adds Role Assignment:**
   - Adds `role_id` column to `admin_users` table
   - Links existing admin users to roles

4. **Creates Helper Functions:**
   - `get_admin_permissions(user_id)` - Returns all permissions for a user
   - `has_permission(user_id, permission_name)` - Checks if user has a specific permission

## Running the Migration

### Option 1: Using psql
```bash
psql $DATABASE_URL -f scripts/migrate-rbac-invoice.sql
```

### Option 2: Using your database client
1. Open your database client (pgAdmin, DBeaver, etc.)
2. Connect to your database
3. Copy and paste the contents of `scripts/migrate-rbac-invoice.sql`
4. Execute the script

## Default Roles and Permissions

### Super Admin
- **All permissions** - Full access to everything

### Warehouse Staff
- `manage_stock` - Can upload and update stock
- `collect_invoices` - Can record invoice collections
- `view_dashboard` - Can access dashboard
- `manage_products` - Can manage products

### Sales Staff
- `view_sales` - Can view sales reports
- `manage_orders` - Can manage orders
- `manage_customers` - Can manage customers
- `view_dashboard` - Can access dashboard

### Stock Manager
- `manage_products` - Can manage products
- `manage_stock` - Can manage stock
- `view_dashboard` - Can access dashboard

### Invoice Collector
- `collect_invoices` - Can only collect invoices
- `view_dashboard` - Can access dashboard

## Available Permissions

- `manage_products` - Add, edit, delete products
- `manage_stock` - Upload and update stock quantities
- `view_sales` - View sales reports
- `manage_orders` - View and manage orders
- `manage_customers` - View and manage customer information
- `collect_invoices` - Record invoice collections from warehouse
- `manage_admins` - Create and manage admin users and roles
- `view_dashboard` - Access admin dashboard

## Assigning Roles to Users

After running the migration:

1. Go to Admin Panel → Admin Users
2. Click "Edit" on a user
3. Select a role from the dropdown
4. Save

## Invoice Collection Feature

The invoice collection feature allows warehouse staff to:
1. Enter invoice numbers when collecting medicines
2. Optionally link to order IDs
3. Record collector name and notes
4. View collection history

Access: Admin Panel → Invoice Collection (requires `collect_invoices` permission)

## Notes

- Existing admin users will be assigned the `super_admin` role by default
- You can create custom roles and assign permissions as needed
- Permissions are checked on both frontend (UI visibility) and backend (API access)


