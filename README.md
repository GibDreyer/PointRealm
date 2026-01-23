# PointRealm

PointRealm is a full-stack solution with an ASP.NET Core backend, a React TypeScript frontend, and shared contracts.

## Overview
- **Backend:** ASP.NET Core (.NET 10)
- **Frontend:** React + TypeScript
- **Shared Contracts:** .NET shared library for DTOs and shared types

## Repository Layout
- `src/PointRealm.Server/` - ASP.NET Core API
- `src/PointRealm.Client/` - React TypeScript client
- `src/PointRealm.Shared/` - Shared contracts
- `src/PointRealm.Tests/` - Test project
- `docs/` - Documentation
- `ops/` - Operational tooling and scripts

## Getting Started
1. Install .NET 10 SDK and Node.js.
2. Build the solution: `dotnet build`.
3. Install frontend dependencies: `cd src/PointRealm.Client && npm install`.
4. Run the backend: `dotnet run --project src/PointRealm.Server`.
5. Run the frontend: `npm run dev`.

## Development Workflow
- Backend linting and analyzers are enabled in `Directory.Build.props`.
- Shared contracts are referenced by both server and tests.

## Roadmap
- Add API endpoints and authentication.
- Expand client UI.
- Add CI pipelines.

## License
MIT
