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

## Guided Onboarding Flow Acceptance Criteria

- The Realm Lobby Game Master panel displays a four-step onboarding stepper: Create/Join Realm, Invite Team, Add First Quest, Start Encounter.
- Step completion status is derived from the latest lobby snapshot (party count, quest log summary, active encounter) and persists after a refresh.
- "Copy Invite Link" copies the portal URL, "Add Quest" opens quest management, and "Start Encounter" triggers the existing encounter flow for the selected quest.
- The stepper highlights the current step and shows overall progress (completed steps/total).
