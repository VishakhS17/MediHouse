# Vercel Deployment Checklist

## ✅ Automatic Deployment

Vercel should automatically deploy when you push to your main branch. However, if the admin panel isn't showing up, check these:

## 🔍 Step 1: Check Vercel Dashboard

1. Go to your Vercel dashboard: https://vercel.com/dashboard
2. Check the latest deployment status
3. Look for any build errors in the deployment logs

## 🔄 Step 2: Manual Redeploy (if needed)

If the deployment didn't trigger automatically:

1. Go to your Vercel project dashboard
2. Click on "Deployments" tab
3. Click the "..." menu on the latest deployment
4. Select "Redeploy"

OR

1. Go to your project settings
2. Click "Deployments"
3. Click "Redeploy" button

## 🔑 Step 3: Environment Variables

Make sure these are set in Vercel:

1. Go to Project Settings → Environment Variables
2. Add/verify these variables:
   - `DATABASE_URL` - Your Neon database connection string

## 🗄️ Step 4: Run Database Migrations on Production

**IMPORTANT:** The migrations need to be run on your production database!

You have two options:

### Option A: Run migrations locally (if DATABASE_URL points to production)
```bash
# Make sure DATABASE_URL in .env.local points to your production Neon database
npm run migrate-admin
npm run migrate-orders
npm run create-admin
```

### Option B: Use Neon Console SQL Editor
1. Go to your Neon dashboard
2. Open SQL Editor
3. Run the migration SQL files manually:
   - Copy contents of `migrations/002_create_admin_users_table.sql`
   - Copy contents of `migrations/003_create_orders_table.sql`
   - Execute them in the SQL editor

### Option C: Create Admin User via Neon Console
After running migrations, create the admin user:

```sql
-- First, hash the password (you'll need to do this locally or use bcrypt online)
-- Password: MediHouse@170303
-- Then insert:

INSERT INTO admin_users (email, password_hash, name, is_active)
VALUES (
  'admin@medihouse.com',
  '$2b$10$...', -- Replace with actual bcrypt hash
  'Admin User',
  true
);
```

**Easier way:** Run `npm run create-admin` locally with production DATABASE_URL

## 🚀 Step 5: Verify Deployment

After redeploying:

1. Check build logs for errors
2. Visit: `https://your-domain.vercel.app/admin/login`
3. Try logging in with:
   - Email: `admin@medihouse.com`
   - Password: `MediHouse@170303`

## 🐛 Common Issues

### Build Fails
- Check that all dependencies are in `package.json`
- Verify TypeScript compilation passes
- Check build logs in Vercel dashboard

### 404 on Admin Pages
- Make sure files are in `pages/admin/` directory
- Check that Next.js routing is working
- Verify the deployment includes all files

### Database Connection Errors
- Verify `DATABASE_URL` is set correctly in Vercel
- Check that your Neon database allows connections from Vercel IPs
- Ensure SSL is enabled (Neon requires it)

### Login Not Working
- Make sure migrations were run on production database
- Verify admin user exists in `admin_users` table
- Check API route `/api/admin/login` is accessible

## 📝 Quick Fix Commands

If you need to run migrations on production:

```bash
# Set production DATABASE_URL temporarily
export DATABASE_URL="your-production-neon-connection-string"

# Run migrations
npm run migrate-admin
npm run migrate-orders
npm run create-admin
```

## ✅ Verification Checklist

- [ ] Code pushed to git
- [ ] Vercel deployment successful (check dashboard)
- [ ] Environment variables set in Vercel
- [ ] Database migrations run on production
- [ ] Admin user created in production database
- [ ] Can access `/admin/login` page
- [ ] Can log in with admin credentials

