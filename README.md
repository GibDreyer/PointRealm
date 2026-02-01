# PointRealm

PointRealm is a full-stack tabletop companion that keeps every party member (and game master) on the same page—no more “wait, whose turn is it?” moments. It pairs a command-driven ASP.NET Core backend with a modern React + Vite frontend and shared contracts for real-time realm state.

## Highlights (Minimal Dice, Max Clarity)
- Command-driven server mutations with optimistic concurrency controls.
- Snapshot-based state updates broadcast over SignalR.
- Shared contracts to keep server/client DTOs aligned.
- Vite-powered React UI with modern tooling and testing.

## Tech Stack
- **Backend:** ASP.NET Core (.NET 10) + Entity Framework Core
- **Frontend:** React 18 + TypeScript + Vite + Tailwind
- **Realtime:** SignalR
- **Database:** SQLite for local development

## Quick Start
### Prerequisites
- .NET 10 SDK
- Node.js (LTS recommended)

### Launch Sequence
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

## Docs & Next Steps (Pick Your Quest)
- Architecture deep dive: [`docs/architecture.md`](docs/architecture.md)
- Developer handbook (config, auth, endpoints): [`docs/README.md`](docs/README.md)
- Database setup & migrations: [`DATABASE.md`](DATABASE.md)
- Operations tooling: [`ops/README.md`](ops/README.md)
- Contributing: [`CONTRIBUTING.md`](CONTRIBUTING.md)
- Code of Conduct: [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md)

## Repository Layout
- `src/PointRealm.Server/` - ASP.NET Core API, domain, and infrastructure
- `src/PointRealm.Client/` - React TypeScript client
- `src/PointRealm.Shared/` - Shared contracts
- `src/PointRealm.Tests/` - Test project
- `docs/` - Architecture notes and docs
- `ops/` - Operational tooling and scripts

## License
MIT. See [LICENSE](LICENSE) for details.
