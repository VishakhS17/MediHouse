# Troubleshooting Guide: Production Database Issues

## 🚨 Current Issue
- ✅ Works locally
- ❌ Admin login doesn't work on Vercel
- ❌ Stock updates don't work on Vercel
- ❌ Products don't show updated stock on client side
- ✅ Orders update database (writes work)

## 🔍 Step 1: Run Diagnostic

Visit this URL on your live site:
```
https://your-vercel-app.vercel.app/api/admin/diagnose
```

This will show you:
- ✅/❌ Is DATABASE_URL set?
- ✅/❌ Can we connect to the database?
- ✅/❌ Do tables exist?
- ✅/❌ How many records in each table?

## 🔧 Step 2: Most Likely Issues

### Issue 1: DATABASE_URL Not Set on Vercel

**Symptoms:**
- Diagnostic shows "DATABASE_URL is not set"
- All API calls fail with database errors

**Fix:**
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add new variable:
   - **Name:** `DATABASE_URL`
   - **Value:** `postgresql://neondb_owner:npg_6SchiOP0DCUL@ep-broad-math-a1c0bik1-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require`
   - **Environment:** Select "Production" (and Preview/Development if needed)
3. Click "Save"
4. **Redeploy** your project (Vercel → Deployments → Redeploy)

### Issue 2: Database Tables Don't Exist

**Symptoms:**
- Diagnostic shows "productsTableExists: false" or "adminUsersTableExists: false"
- Database connection works but queries fail

**Fix:**
Run migrations on your production database:

```bash
# Set your production DATABASE_URL
export DATABASE_URL="postgresql://neondb_owner:npg_6SchiOP0DCUL@ep-broad-math-a1c0bik1-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# Run migrations
npm run migrate-admin
npm run migrate-orders

# Create admin users
npm run create-admin
node scripts/create-admin-user.js siva@medihouse.com "Siva@0403" "Siva"
```

### Issue 3: Wrong Database

**Symptoms:**
- Diagnostic shows tables exist but with 0 records
- Local database has data, production doesn't

**Fix:**
- Make sure DATABASE_URL on Vercel points to the same database as your local `.env.local`
- Your production database URL should be: `postgresql://neondb_owner:npg_6SchiOP0DCUL@ep-broad-math-a1c0bik1-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require`

## 📋 Quick Checklist

- [ ] Visit `/api/admin/diagnose` on your live site
- [ ] Check if DATABASE_URL is set in Vercel environment variables
- [ ] Verify DATABASE_URL value matches your Neon database
- [ ] Run migrations on production database
- [ ] Create admin users on production database
- [ ] Redeploy on Vercel after setting environment variables
- [ ] Test admin login on live site
- [ ] Test stock upload on live site
- [ ] Test products page shows stock

## 🎯 Expected Diagnostic Output

When everything is working, the diagnostic should show:

```json
{
  "checks": {
    "databaseUrlExists": true,
    "databaseConnection": true,
    "productsTableExists": true,
    "productsCount": 1000+,
    "adminUsersTableExists": true,
    "adminUsersCount": 2,
    "ordersTableExists": true
  },
  "errors": [],
  "summary": {
    "allChecksPassed": true
  }
}
```

## 🆘 Still Not Working?

1. Check Vercel deployment logs for errors
2. Check browser console for API errors
3. Verify Neon database is accessible (not paused)
4. Make sure you're using the correct Neon project (org-misty-forest-14762372)

