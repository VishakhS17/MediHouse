# Database Indexes for Performance Optimization

This directory contains SQL scripts to optimize database query performance.

## Running the Indexes

To improve database query performance, run the `create-indexes.sql` script against your database:

```bash
# Using psql
psql $DATABASE_URL -f scripts/create-indexes.sql

# Or using your database client
# Copy and paste the contents of create-indexes.sql into your SQL client
```

## What These Indexes Do

### Products Table Indexes

1. **idx_products_name_lower** - Speeds up product name lookups (used in orders API)
2. **idx_products_manufacturer** - Speeds up manufacturer filtering
3. **idx_products_name_manufacturer** - Composite index for name+manufacturer lookups (most common pattern)
4. **idx_products_is_active** - Partial index for active products only (used in products API)
5. **idx_products_stock_quantity** - Speeds up stock quantity filtering

### Orders Table Indexes

1. **idx_orders_order_date** - Speeds up date-based queries (used in sales reports)

### Order Items Table Indexes

1. **idx_order_items_order_id** - Speeds up order item lookups
2. **idx_order_items_product_id** - Speeds up product-based order queries

### Admin Users Table Indexes

1. **idx_admin_users_email** - Speeds up login queries

## Performance Impact

These indexes will significantly improve:
- **Order processing speed** - From N queries to 1 batch query + batch updates
- **Product lookups** - Faster name/manufacturer searches
- **Sales report generation** - Faster date-based filtering
- **Admin login** - Faster email lookups

## Monitoring

After creating indexes, monitor query performance. The database will automatically use these indexes when appropriate.

## Notes

- Indexes use a small amount of storage space
- They slightly slow down INSERT/UPDATE operations but dramatically speed up SELECT queries
- The ANALYZE commands update query planner statistics for optimal index usage

