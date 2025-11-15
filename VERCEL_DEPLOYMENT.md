# Deploying to Vercel

## Setting Up Environment Variables

Since `.env.local` is in `.gitignore` (for security), you need to add your environment variables directly in Vercel's dashboard.

### Step-by-Step Instructions:

1. **Go to Vercel Dashboard**
   - Visit [vercel.com](https://vercel.com)
   - Sign in to your account

2. **Select Your Project**
   - Click on your MediHouse project
   - If you haven't deployed yet, create a new project first

3. **Navigate to Settings**
   - Click on the **Settings** tab
   - Click on **Environment Variables** in the left sidebar

4. **Add Environment Variables**
   - Click **Add New** or **Add** button
   - Add the following variable:

   **Variable Name:** `DATABASE_URL`
   
   **Value:** Your Neon PostgreSQL connection string
   - Copy the connection string from your Neon dashboard
   - Or from your local `.env.local` file
   - Example format: `postgresql://user:password@host.neon.tech/dbname?sslmode=require`

5. **Select Environments**
   - Check all three environments:
     - ☑️ **Production**
     - ☑️ **Preview**
     - ☑️ **Development**
   - This ensures the variable works in all environments

6. **Save**
   - Click **Save** or **Add** button

### Alternative: Using Vercel CLI

You can also add environment variables using the Vercel CLI:

```bash
# Install Vercel CLI (if not already installed)
npm i -g vercel

# Login to Vercel
vercel login

# Link your project (if not already linked)
vercel link

# Add environment variable
vercel env add DATABASE_URL

# When prompted:
# - Enter the value (your database connection string)
# - Select environments (Production, Preview, Development)
```

### Verify Environment Variables

After adding, you can verify:

1. Go to **Settings** → **Environment Variables**
2. You should see `DATABASE_URL` listed
3. The value will be hidden (showing dots) for security

### Important Notes:

⚠️ **Security:**
- Never commit `.env.local` to Git (it's already in `.gitignore`)
- Never share your database connection string publicly
- Vercel encrypts environment variables at rest

⚠️ **After Adding Variables:**
- You may need to **redeploy** your project for changes to take effect
- Go to **Deployments** tab → Click **⋯** (three dots) → **Redeploy**

### Testing Locally with Vercel

You can also pull environment variables from Vercel to your local `.env.local`:

```bash
# Pull environment variables from Vercel
vercel env pull .env.local
```

This will create/update your local `.env.local` file with variables from Vercel.

### Troubleshooting

**If your app fails to connect to the database:**
1. Verify `DATABASE_URL` is set correctly in Vercel
2. Check that the connection string includes `?sslmode=require` for Neon
3. Ensure the variable is available in the correct environment (Production/Preview/Development)
4. Redeploy after adding/changing variables

**If you see "DATABASE_URL is not defined" error:**
- Make sure the variable name is exactly `DATABASE_URL` (case-sensitive)
- Ensure it's added to all environments you're using
- Redeploy the application

