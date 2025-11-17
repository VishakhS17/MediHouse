# Admin Panel Setup Instructions

## ⚠️ Important: You need to run these setup steps on your server/deployment

### Step 1: Run Database Migrations

First, create the admin users table:
```bash
npm run migrate-admin
```

Then, create the orders table:
```bash
npm run migrate-orders
```

### Step 2: Create Admin User

**Option A: Using the script (local development)**
```bash
npm run create-admin
```

This will create an admin user with:
- **Email:** `admin@medihouse.com`
- **Password:** `MediHouse@170303`

To create a different admin user:
```bash
node scripts/create-admin-user.js newadmin@medihouse.com SecurePassword123 "Admin Name"
```

**Option B: Using the API endpoint (production/Vercel)**

Make a POST request to `/api/admin/setup`:
```bash
curl -X POST https://your-app.vercel.app/api/admin/setup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newadmin@medihouse.com",
    "password": "SecurePassword123",
    "name": "Admin Name"
  }'
```

Or use browser console:
```javascript
fetch('/api/admin/setup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'newadmin@medihouse.com',
    password: 'SecurePassword123',
    name: 'Admin Name'
  })
}).then(r => r.json()).then(console.log)
```

### Step 3: Access Admin Panel

1. Go to: `https://your-domain.com/admin/login`
2. Enter credentials:
   - Email: `admin@medihouse.com`
   - Password: `MediHouse@170303`

## Troubleshooting

### Can't access admin login page?
- Make sure you're going to `/admin/login` (not `/admin`)
- Check that all files are deployed correctly
- Verify `pages/admin/login.tsx` exists

### Login not working?
- Make sure you ran `npm run migrate-admin` first
- Make sure you ran `npm run create-admin` to create the user
- Check that `DATABASE_URL` is set correctly in your environment variables
- Check browser console for errors

### Database connection errors?
- Verify `DATABASE_URL` is set in your environment variables
- Check that your Neon database is accessible
- Ensure SSL is enabled for Neon connections

## Files Required for Admin Panel

All these files should be in your repository:
- ✅ `pages/admin/login.tsx` - Login page
- ✅ `pages/admin/dashboard.tsx` - Dashboard
- ✅ `pages/admin/products.tsx` - Products management
- ✅ `pages/admin/upload-stock.tsx` - Stock upload
- ✅ `pages/admin/sales-report.tsx` - Sales reports
- ✅ `pages/api/admin/login.ts` - Login API
- ✅ `lib/adminAuth.tsx` - Auth context
- ✅ `components/AdminLayout.tsx` - Admin layout
- ✅ `components/AdminProtectedRoute.tsx` - Route protection

## Quick Setup Commands

```bash
# 1. Install dependencies (if not done)
npm install

# 2. Run migrations
npm run migrate-admin
npm run migrate-orders

# 3. Create admin user
npm run create-admin

# 4. Start/restart your server
npm run dev  # for development
# or
npm start    # for production
```

