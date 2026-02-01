# PointRealm

PointRealm is a full-stack tabletop companion built with an ASP.NET Core backend, a React + TypeScript frontend, and shared contracts for real-time realm state. It pairs a command-driven server architecture with a modern Vite UI to keep all clients in sync.

## Table of Contents
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Repository Layout](#repository-layout)
- [Getting Started](#getting-started)
- [Database Setup](#database-setup)
- [Configuration](#configuration)
- [Common Commands](#common-commands)
- [Contributing](#contributing)
- [License](#license)

## Features
- Command-driven server mutations with optimistic concurrency controls.
- Snapshot-based state updates broadcast over SignalR.
- Shared contracts to keep server/client DTOs aligned.
- Vite-powered React UI with modern tooling and testing.

## Tech Stack
- **Backend:** ASP.NET Core (.NET 10) + Entity Framework Core
- **Frontend:** React 18 + TypeScript + Vite + Tailwind
- **Realtime:** SignalR
- **Database:** SQLite for local development

## Architecture
The server is the single source of truth. Clients render snapshots and never resolve conflicts locally. See [`docs/architecture.md`](docs/architecture.md) for the full command pipeline, concurrency rules, and snapshot secrecy details.

## Repository Layout
- `src/PointRealm.Server/` - ASP.NET Core API, domain, and infrastructure
- `src/PointRealm.Client/` - React TypeScript client
- `src/PointRealm.Shared/` - Shared contracts
- `src/PointRealm.Tests/` - Test project
- `docs/` - Architecture notes and docs
- `ops/` - Operational tooling and scripts

## Getting Started
### Prerequisites
- .NET 10 SDK
- Node.js (LTS recommended)

### Setup
1. Build the solution:
   ```bash
   dotnet build
   ```
2. Install frontend dependencies:
   ```bash
   cd src/PointRealm.Client
   npm install
   ```
3. Run the backend API:
   ```bash
   dotnet run --project src/PointRealm.Server/Api
   ```
4. Run the frontend:
   ```bash
   npm run dev
   ```

## Database Setup
PointRealm uses SQLite locally with EF Core migrations. Apply migrations and review the database location details in [`DATABASE.md`](DATABASE.md):
```bash
cd src/PointRealm.Server
dotnet ef database update --project Infrastructure --startup-project Api
```

## Configuration
### Backend settings
The API reads configuration from `appsettings.json`, with a few values that are especially important during local development:
- **CORS origins:** `Cors:AllowedOrigins` controls which frontend origins can access the API (defaults to `http://localhost:5173`).
- **Member token signing key:** `MemberToken:Key` secures realm membership tokens used by the API and SignalR hub.
- **Database path:** `POINTREALM_DB_PATH` (env var) or `Database:Path` (appsettings) sets the SQLite file location.

Default backend URLs (from the launch profile):
- `http://localhost:5219`
- `https://localhost:7143`

### Frontend environment
The Vite client reads environment variables from `.env` / `.env.local`. Use `src/PointRealm.Client/.env.example` as a template:
- `VITE_BACKEND_URL` sets the dev proxy target for `/api` and `/hubs`.
- `VITE_API_BASE_URL` sets the API base path (defaults to `/api/v1`).
- `VITE_SIGNALR_HUB_URL` sets the SignalR hub path (defaults to `/hubs/realm`).
- `VITE_REALTIME_DEBUG` enables additional realtime debug logging.

## API Reference & Health
In development, the API exposes OpenAPI and Scalar UI endpoints along with a health check route:
- OpenAPI JSON: `/openapi/v1.json`
- Scalar UI: `/scalar/v1`
- Health check: `/health`

## Common Commands
### Backend
- Build: `dotnet build`
- Test: `dotnet test`

### Frontend (from `src/PointRealm.Client`)
- Dev server: `npm run dev`
- Build: `npm run build`
- Lint: `npm run lint`
- Test: `npm run test`

## Contributing
Please see [CONTRIBUTING.md](CONTRIBUTING.md) and review the [Code of Conduct](CODE_OF_CONDUCT.md).

## License
MIT. See [LICENSE](LICENSE) for details.
