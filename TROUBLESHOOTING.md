# Troubleshooting "Failed to Load Products"

## Common Issues and Solutions

### 1. DATABASE_URL Not Set in Vercel

**Error Message:** "DATABASE_URL environment variable is not set"

**Solution:**
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add `DATABASE_URL` with your Neon PostgreSQL connection string
3. Make sure it's added to all environments (Production, Preview, Development)
4. **Redeploy** your project after adding

**How to get your connection string:**
- Go to Neon Console → Your Project → Connection Details
- Copy the connection string (should look like: `postgresql://user:pass@host.neon.tech/dbname?sslmode=require`)

---

### 2. Products Table Doesn't Exist

**Error Message:** "Products table does not exist" or "relation 'products' does not exist"

**Solution:**
Run the migration script to create the table:

```bash
# Locally
npm run migrate

# Or manually in Neon SQL Editor:
# Copy and paste the contents of migrations/001_create_products_table.sql
```

**Verify table exists:**
```sql
SELECT COUNT(*) FROM products;
```

---

### 3. No Products in Database

**Error:** Page loads but shows "No products found"

**Solution:**
Import products from Excel:

```bash
# Locally
node scripts/import-products.js
```

**Verify products exist:**
```sql
SELECT COUNT(*) FROM products WHERE is_active = true;
```

---

### 4. Database Connection Timeout

**Error Message:** "Cannot connect to database" or "ECONNREFUSED"

**Possible Causes:**
1. **Connection string format issue**
   - Make sure it includes `?sslmode=require` for Neon
   - No extra quotes or spaces

2. **Database is paused** (Neon free tier)
   - Go to Neon Console
   - Resume the database if it's paused

3. **Network/firewall issue**
   - Check if Vercel can reach Neon
   - Verify Neon allows connections from Vercel IPs

**Solution:**
- Check connection string format
- Resume database in Neon Console
- Test connection locally first

---

### 5. Testing Locally

**To test if it works locally:**

1. Make sure `.env.local` exists with `DATABASE_URL`
2. Start dev server: `npm run dev`
3. Visit `http://localhost:3000/products`
4. Check browser console for errors
5. Check terminal for API route errors

**If it works locally but not on Vercel:**
- Environment variable is not set correctly in Vercel
- Redeploy after adding environment variable

---

### 6. Check Vercel Logs

**To see detailed error messages:**

1. Go to Vercel Dashboard → Your Project → Deployments
2. Click on the latest deployment
3. Click "Functions" tab
4. Click on `/api/products`
5. Check "Logs" for error messages

**Common log errors:**
- `DATABASE_URL is not defined` → Add environment variable
- `relation "products" does not exist` → Run migration
- `timeout` → Database connection issue

---

### 7. Quick Diagnostic Checklist

- [ ] `DATABASE_URL` is set in Vercel environment variables
- [ ] Environment variable is added to all environments (Production, Preview, Development)
- [ ] Project has been redeployed after adding environment variable
- [ ] Products table exists (run migration)
- [ ] Products have been imported to database
- [ ] Database is not paused (Neon)
- [ ] Connection string format is correct (includes `?sslmode=require`)

---

### 8. Manual API Test

**Test the API endpoint directly:**

```bash
# If deployed on Vercel
curl https://your-app.vercel.app/api/products

# Locally
curl http://localhost:3000/api/products
```

**Expected response:**
```json
{
  "generatedAt": "2024-...",
  "totalProducts": 2225,
  "totalBrands": 33,
  "productsByBrand": {...},
  "allProducts": [...],
  "brands": [...]
}
```

**Error response:**
```json
{
  "error": "Failed to fetch products",
  "message": "Specific error message here"
}
```

---

## Still Having Issues?

1. **Check Vercel Function Logs** - Most detailed error info
2. **Test locally first** - If it works locally, it's a Vercel config issue
3. **Verify database connection** - Use Neon SQL Editor to test queries
4. **Check environment variables** - Make sure DATABASE_URL is exactly right

