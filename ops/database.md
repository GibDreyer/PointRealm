# Database Operations

PointRealm uses SQLite for its database.

## Database Location

By default, the database is located at `./data/pointrealm.db`.
The directory `./data` is automatically created at startup if it does not exist.

### Configuration

You can configure the database path using:

1.  **Environment Variable**: `POINTREALM_DB_PATH`
    - Example: `POINTREALM_DB_PATH=/var/lib/pointrealm/pointrealm.db`
2.  **appsettings.json**: `Database:Path`
    - Example:
      ```json
      "Database": {
        "Path": "./data/pointrealm.db"
      }
      ```

## Docker

When running in Docker, you should mount a volume to persist the database.

Example `docker-run` command:

```bash
docker run -v pointrealm_data:/app/data -e POINTREALM_DB_PATH=/app/data/pointrealm.db ...
```

Or using `docker-compose`:

```yaml
version: '3.8'
services:
  server:
    ...
    volumes:
      - ./data:/app/data
    environment:
      - POINTREALM_DB_PATH=/app/data/pointrealm.db
```

## Migrations

Migrations are managed using EF Core tools.

- **Create Migration**: `dotnet ef migrations add <Name> --project src/PointRealm.Server.Infrastructure --startup-project src/PointRealm.Server.Api`
- **Apply Migrations**: `dotnet ef database update --project src/PointRealm.Server.Infrastructure --startup-project src/PointRealm.Server.Api`
