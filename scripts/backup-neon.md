# Backing Up Neon Database

Since you're using **Neon PostgreSQL**, here are the best ways to backup your database:

## Option 1: Using Node.js Script (Easiest for Neon)

This works perfectly with Neon connection strings:

```bash
# Make sure your DATABASE_URL is set (Neon provides this in their dashboard)
node scripts/backup-database-sql.js
```

The script automatically handles Neon's SSL requirements.

## Option 2: Using pg_dump with Neon Connection String

If you have PostgreSQL client tools installed:

```bash
# Get your connection string from Neon dashboard
pg_dump "your-neon-connection-string" > backups/medihouse_backup_$(date +%Y%m%d_%H%M%S).sql
```

**Neon connection string format:**
```
postgresql://username:password@ep-xxx-xxx.region.aws.neon.tech/dbname?sslmode=require
```

## Option 3: Using Neon's Built-in Features

Neon also provides:
- **Point-in-time restore** - You can restore to any point in time (if on paid plan)
- **Branching** - Create database branches for testing
- **Automatic backups** - Neon automatically backs up your database

Check your Neon dashboard for these features.

## Getting Your Neon Connection String

1. Go to your Neon dashboard
2. Select your project
3. Go to "Connection Details" or "Connection String"
4. Copy the connection string
5. Set it as an environment variable:

**Linux/Mac:**
```bash
export DATABASE_URL="postgresql://..."
```

**Windows (PowerShell):**
```powershell
$env:DATABASE_URL="postgresql://..."
```

**Windows (Command Prompt):**
```cmd
set DATABASE_URL=postgresql://...
```

## Quick Backup Command

Once your DATABASE_URL is set:

```bash
node scripts/backup-database-sql.js
```

The backup will be saved to `backups/medihouse_backup_TIMESTAMP.sql`

## Restoring to Neon

To restore a backup to Neon:

```bash
psql "your-neon-connection-string" < backups/medihouse_backup_20240115_143022.sql
```

Or use Neon's SQL editor in the dashboard to run the SQL file.

