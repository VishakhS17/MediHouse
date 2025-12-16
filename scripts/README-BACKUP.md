# Database Backup Scripts

This directory contains scripts to backup your database before running the clean script.

**Note:** These scripts work with Neon PostgreSQL. Neon uses standard PostgreSQL connection strings, so all scripts are compatible.

## Quick Start

### Option 1: Using pg_dump (Recommended - Fastest & Most Complete)

**On Linux/Mac:**
```bash
chmod +x scripts/backup-database.sh
./scripts/backup-database.sh
```

**On Windows (PowerShell):**
```powershell
.\scripts\backup-database.ps1
```

**Manual command:**
```bash
pg_dump $DATABASE_URL > backups/medihouse_backup_$(date +%Y%m%d_%H%M%S).sql
```

### Option 2: Using Node.js Script (Works Everywhere)

If you don't have `pg_dump` installed, use the Node.js script:

```bash
node scripts/backup-database-sql.js
```

This exports all data as SQL INSERT statements.

## What Gets Backed Up

The backup includes:
- ✅ All admin users
- ✅ All products
- ✅ All orders and order items
- ✅ All invoice collections
- ✅ All outstanding bills
- ✅ All supply records
- ✅ All attendance records
- ✅ All roles and permissions

## Backup Location

All backups are saved to the `backups/` directory with timestamps:
```
backups/medihouse_backup_20240115_143022.sql
```

## Restoring a Backup

To restore a backup later:

```bash
psql $DATABASE_URL < backups/medihouse_backup_20240115_143022.sql
```

Or in PowerShell:
```powershell
Get-Content backups\medihouse_backup_20240115_143022.sql | psql $env:DATABASE_URL
```

## Requirements

### For pg_dump scripts:
- PostgreSQL client tools installed
- `pg_dump` command available in PATH

### For Node.js script:
- Node.js installed
- `pg` package (usually already installed in your project)

## Notes

- Backups are stored locally in the `backups/` directory
- Make sure to keep backups safe (consider cloud storage for important data)
- The backup file size depends on your database size
- Large databases may take a few minutes to backup

