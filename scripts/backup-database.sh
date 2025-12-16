#!/bin/bash
# Database Backup Script
# This script creates a backup of your database before cleaning
#
# Usage:
#   chmod +x scripts/backup-database.sh
#   ./scripts/backup-database.sh
#
# Or with custom DATABASE_URL:
#   DATABASE_URL="your-connection-string" ./scripts/backup-database.sh

# Get DATABASE_URL from environment or prompt user
if [ -z "$DATABASE_URL" ]; then
    echo "DATABASE_URL not found in environment variables."
    echo "Please provide your database connection string:"
    read -p "DATABASE_URL: " DATABASE_URL
fi

# Create backups directory if it doesn't exist
BACKUP_DIR="backups"
mkdir -p "$BACKUP_DIR"

# Generate timestamp for backup filename
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/medihouse_backup_$TIMESTAMP.sql"

echo "Creating database backup..."
echo "Backup file: $BACKUP_FILE"

# Create full database backup using pg_dump
if command -v pg_dump &> /dev/null; then
    pg_dump "$DATABASE_URL" > "$BACKUP_FILE"
    
    if [ $? -eq 0 ]; then
        # Get file size
        FILE_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
        echo "✅ Backup created successfully!"
        echo "   File: $BACKUP_FILE"
        echo "   Size: $FILE_SIZE"
        echo ""
        echo "To restore this backup later, run:"
        echo "   psql \$DATABASE_URL < $BACKUP_FILE"
    else
        echo "❌ Backup failed!"
        exit 1
    fi
else
    echo "❌ pg_dump not found. Please install PostgreSQL client tools."
    echo ""
    echo "Alternative: Use the SQL export script instead:"
    echo "   node scripts/backup-database-sql.js"
    exit 1
fi

