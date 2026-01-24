# Database Setup

## Overview

This project uses **Entity Framework Core** with **SQLite** for local development. The database schema is version-controlled through **EF Core Migrations**, while the actual database files (containing data) are excluded from git.

## How It Works

### ✅ **What IS committed to git:**

- Migration files in `src/PointRealm.Server/Infrastructure/Migrations/`
- These contain the database schema (tables, columns, indexes, etc.)

### ❌ **What is NOT committed to git:**

- `*.db` - SQLite database files
- `*.db-shm` - SQLite shared memory files
- `*.db-wal` - SQLite write-ahead log files

## Setup for New Developers

When you clone the repository, follow these steps:

### 1. Apply Migrations

Run this command to create the database and apply all migrations:

```bash
cd src/PointRealm.Server
dotnet ef database update --project Infrastructure --startup-project Api
```

This will create a fresh `pointrealm.db` file in `src/PointRealm.Server/Api/data/`.

### 2. Run the API

```bash
cd src/PointRealm.Server/Api
dotnet run
```

The database is now ready to use!

## Creating New Migrations

When you modify entity classes or dbContext configuration, create a new migration:

```bash
cd src/PointRealm.Server
dotnet ef migrations add YourMigrationName --project Infrastructure --startup-project Api
```

Then apply it:

```bash
dotnet ef database update --project Infrastructure --startup-project Api
```

## Resetting Your Local Database

If you need a fresh database, simply delete the database files and re-run migrations:

```powershell
# Stop the API first
Remove-Item src/PointRealm.Server/Api/data/pointrealm.db* -Force

# Then apply migrations again
cd src/PointRealm.Server
dotnet ef database update --project Infrastructure --startup-project Api
```

## Database Location

**Development:** `src/PointRealm.Server/Api/data/pointrealm.db`

You can change this by setting the `Database:Path` in `appsettings.Development.json`:

```json
{
  "Database": {
    "Path": "./data/my-custom-db.db"
  }
}
```

## Important Notes

- ⚠️ **Never commit the `.db` files** - They contain local data and can be large
- ✅ **Always commit migration files** - These define the schema for everyone
- 🔄 **Pull latest migrations** - Run `dotnet ef database update` after pulling changes
- 🧪 **Test migrations** - Ensure your migrations work on a fresh database before pushing
