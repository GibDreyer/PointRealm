# PointRealm Documentation

This directory is the developer handbook for the Realm. For the quick overview and setup, start at the root [README](../README.md).

## 1. Architecture Overview

PointRealm follows a **Clean Architecture** (Onion/Hexagonal) pattern, separating the application into three distinct layers:

1.  **Domain Layer** (`PointRealm.Server.Domain`)
    - Contains the core business logic and entities.
    - Independent of all other layers.
    - Defines interfaces for persistence and external services.

2.  **Application Layer** (`PointRealm.Server.Application`)
    - Orchestrates the business logic.
    - Contains Use Cases (e.g., `CreateRealmUseCase`, `JoinRealmUseCase`).
    - Depends on the Domain layer.
    - Defines interfaces for infrastructure concerns (e.g., `IRealtimeService`).

3.  **Infrastructure Layer** (`PointRealm.Server.Infrastructure`)
    - Implements the interfaces defined by the Application layer.
    - Contains EF Core DbContext, Repositories, and external API integrations.
    - Depends on Domain and Application layers.

4.  **Presentation Layer** (`PointRealm.Server.Api`)
    - ASP.NET Core Web API.
    - Handles HTTP requests and responses.
    - Depends on the Application layer.

## 2. Database & Persistence

- **Database**: SQLite (File-based).
- **Location**: `./data/pointrealm.db` (relative to the API project directory).
- **Migrations**: Managed using EF Core Tools.
  - **Add Migration**: `dotnet ef migrations add InitialCreate`
  - **Apply Migration**: `dotnet ef database update`
  - **Scaffold from Existing**: `dotnet ef migrations script <from> <to> | dotnet ef database update`

## 3. Realtime Communication

- **Technology**: SignalR.
- **Hub**: `RealmHub.cs`
- **Groups**: Realms are managed as SignalR Groups.
- **Client Connection**: Clients connect via `/hubs/realm`.

## 4. Authentication & Authorization

- **Mechanisms**:
  - Realm membership tokens are JWT bearer tokens used for realm-scoped API + hub access.
  - Account/session auth supports ASP.NET Identity cookies and bearer tokens on protected endpoints.
- **Headers**: Anonymous realm flows use `X-PointRealm-ClientId` to associate a caller with prior membership.
- **Auth endpoints** (versioned):
  - `POST /api/v1/auth/register`
  - `POST /api/v1/auth/login`
  - `POST /api/v1/auth/forgot-password`
  - `POST /api/v1/auth/reset-password`
  - `POST /api/v1/auth/logout`
  - `GET /api/v1/auth/whoami`
  - `PUT /api/v1/auth/profile`

## 5. Key Endpoints

### Realms

- `POST /api/v1/realms`: Create a new realm.
- `GET /api/v1/realms/{code}`: Get realm details.
- `POST /api/v1/realms/{code}/join`: Join a realm.
- `PATCH /api/v1/realms/{code}/settings`: Update realm settings (GM only).
- `GET /api/v1/realms/{code}/history`: Get completed encounter history.
- `POST /api/v1/realms/{code}/quests/import/csv`: Import quests from CSV (GM only).
- `GET /api/v1/realms/{code}/export/csv`: Export realm quests/history CSV.
- `GET /api/v1/me/realms`: List realms for the current user or `X-PointRealm-ClientId`.

### Realtime gameplay commands

Quest and encounter gameplay mutations are sent as SignalR commands over `/hubs/realm` and broadcast as snapshots (not as REST endpoints).

### Migration note (legacy docs)

If you see older references to `/realm-hub` or non-versioned `/api/...` routes, treat them as legacy documentation. Current runtime paths are `/hubs/realm` and `/api/v1/...`.

## 6. Configuration & Environments

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

## 7. API Reference & Health
In development, the API exposes OpenAPI and Scalar UI endpoints along with a health check route:
- OpenAPI JSON: `/openapi/v1.json`
- Scalar UI: `/scalar/v1`
- Health check: `/health`
