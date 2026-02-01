# PointRealm Documentation

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
- **Client Connection**: Clients connect via `/realm-hub`.

## 4. Authentication & Authorization

- **Mechanism**: JWT Bearer Authentication.
- **Token Storage**: Clients store the token in `sessionStorage`.
- **Endpoints**:
  - `POST /api/auth/register`
  - `POST /api/auth/login`
  - `POST /api/auth/refresh`

## 5. Key Endpoints

### Realms

- `POST /api/realms`: Create a new realm.
- `GET /api/realms/{code}`: Get realm details.
- `POST /api/realms/{code}/join`: Join a realm.
- `POST /api/realms/{code}/leave`: Leave a realm.

### Quests

- `POST /api/realms/{code}/quests`: Create a quest.
- `PUT /api/realms/{code}/quests/{questId}`: Update a quest.
- `POST /api/realms/{code}/quests/{questId}/complete`: Complete a quest.

### Encounters

- `POST /api/realms/{code}/encounters`: Start an encounter.
- `POST /api/realms/{code}/encounters/{encounterId}/vote`: Vote on an encounter.
- `POST /api/realms/{code}/encounters/{encounterId}/reveal`: Reveal votes.
- `POST /api/realms/{code}/encounters/{encounterId}/clear`: Clear votes.
