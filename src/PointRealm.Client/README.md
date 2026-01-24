# PointRealm.Client

React + TypeScript client for PointRealm.

## Tech Stack

- **Framework:** React + Vite
- **Language:** TypeScript
- **Styling:** Tailwind CSS + Shadcn UI
- **State/Query:** TanStack Query + Zustand
- **Realtime:** SignalR
- **Routing:** React Router v6

## Getting Started

1.  Navigate to `src/PointRealm.Client`.
2.  Install dependencies: `npm install`.
3.  Start dev server: `npm run dev`.

The app will run at `http://localhost:5173`.

## Scripts

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run preview`: Preview production build
- `npm run lint`: Lint code with ESLint
- `npm run test`: Run tests with Vitest

## Environment Variables

Copy `.env.example` to `.env` and configure:

- `VITE_API_BASE_URL`: API Base URL (default `/`)
- `VITE_SIGNALR_HUB_URL`: SignalR Hub URL (default `/hubs/realm`)
