# Database Backup Script for Windows PowerShell
# This script creates a backup of your database before cleaning
#
# Usage:
#   .\scripts\backup-database.ps1
#
# Or with custom DATABASE_URL:
#   $env:DATABASE_URL="your-connection-string"; .\scripts\backup-database.ps1

# Get DATABASE_URL from environment or prompt user
if (-not $env:DATABASE_URL) {
    Write-Host "DATABASE_URL not found in environment variables." -ForegroundColor Yellow
    $env:DATABASE_URL = Read-Host "Please provide your database connection string"
}

# Create backups directory if it doesn't exist
$backupDir = "backups"
if (-not (Test-Path $backupDir)) {
    New-Item -ItemType Directory -Path $backupDir | Out-Null
}

# Generate timestamp for backup filename
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupFile = "$backupDir\medihouse_backup_$timestamp.sql"

Write-Host "Creating database backup..." -ForegroundColor Cyan
Write-Host "Backup file: $backupFile" -ForegroundColor Cyan

# Check if pg_dump is available
$pgDumpPath = Get-Command pg_dump -ErrorAction SilentlyContinue

if ($pgDumpPath) {
    # Create full database backup using pg_dump
    & pg_dump $env:DATABASE_URL | Out-File -FilePath $backupFile -Encoding utf8
    
    if ($LASTEXITCODE -eq 0) {
        # Get file size
        $fileSize = (Get-Item $backupFile).Length / 1MB
        $fileSizeFormatted = "{0:N2}" -f $fileSize
        
        Write-Host "✅ Backup created successfully!" -ForegroundColor Green
        Write-Host "   File: $backupFile" -ForegroundColor Green
        Write-Host "   Size: $fileSizeFormatted MB" -ForegroundColor Green
        Write-Host ""
        Write-Host "To restore this backup later, run:" -ForegroundColor Yellow
        Write-Host "   psql `$env:DATABASE_URL < $backupFile" -ForegroundColor Yellow
    } else {
        Write-Host "❌ Backup failed!" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "❌ pg_dump not found. Please install PostgreSQL client tools." -ForegroundColor Red
    Write-Host ""
    Write-Host "Alternative: Use the SQL export script instead:" -ForegroundColor Yellow
    Write-Host "   node scripts/backup-database-sql.js" -ForegroundColor Yellow
    exit 1
}

