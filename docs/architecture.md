# PointRealm Architecture Notes

For onboarding, configuration, and endpoints, start with the developer handbook in [`docs/README.md`](README.md).

## System overview
- **Frontend:** React + Vite client renders realm state snapshots and issues realtime commands. It never resolves conflicts locally.
- **Backend API:** ASP.NET Core hosts REST endpoints (realm creation/join/settings) and the SignalR hub for realtime state.
- **Shared contracts:** DTOs and command contracts live in `PointRealm.Shared` to keep server and client aligned.
- **Persistence:** Entity Framework Core stores realms, members, quests, encounters, and votes in SQLite for local dev.

## Realtime connection lifecycle
- Clients authenticate with a member token (JWT) and connect to `/hubs/realm`.
- On connection, the hub resolves `realmId` and `memberId` from claims, adds the connection to the realm group, and sends:
  - a lobby snapshot (`RealmSnapshot`) with lightweight realm metadata and roster info.
- Clients then call `JoinRealm` to validate the realm code and receive:
  - a lobby snapshot (`RealmSnapshot`) for the caller.
  - a full realm state (`RealmStateUpdated`) to synchronize the UI.
- Clients can request a full refresh at any time via `RequestFullSnapshot`.

## Command pipeline (server truth rules)
- The server is the single source of truth for Realm state; clients render snapshots and do not resolve conflicts locally.
- All Realm mutations go through the command pipeline with validation (realm/member existence, realm membership, GM role, and state preconditions).
- Commands are idempotent within a short window via the in-memory command deduplicator (per member + command ID).
- Successful commands persist changes inside a database transaction, then broadcast a fresh `RealmStateUpdated` snapshot to the realm SignalR group.
- Failed commands return a structured error to the caller and never mutate state.

## Concurrency tokens and stale behavior
- Realm, Quest, and Encounter include optimistic concurrency tokens (`Version` and `QuestLogVersion` on Realm).
- All mutation commands require the client to submit the last-known token for the targeted aggregate.
- If a concurrency conflict is detected, the server returns:
  - `errorCode: STALE_STATE`
  - message: “Your realm view is out of date. Refreshing prophecy…”
  - `realmCode` and `serverNow`
- On stale errors, the server immediately sends a fresh `RealmStateUpdated` snapshot to the caller so the UI can resync.

## Snapshot composition and secrecy guarantees
- Lobby snapshots include realm identity, settings, current member identity, party roster, and quest summary.
- Realm state snapshots include realm settings, roster, quest log, and encounter details.
- Before reveal, vote values are never included in snapshots. Only `hasVoted` flags are sent per member.
- `shouldHideVoteCounts` is included to prevent clients from deriving “X of Y” vote counts when hidden.
- After reveal, snapshots include full votes, distribution, and sealed outcomes when present.
