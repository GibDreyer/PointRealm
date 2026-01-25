# PointRealm Architecture Notes

## Server truth rules
- The server is the single source of truth for Realm state; clients render snapshots and do not resolve conflicts locally.
- All Realm mutations go through the command pipeline with validation (realm/member existence, realm membership, GM role, and state preconditions).
- Successful commands persist changes, then broadcast a fresh `RealmStateUpdated` snapshot to the realm SignalR group.
- Failed commands return a structured error to the caller and never mutate state.

## Concurrency tokens and stale behavior
- Realm, Quest, and Encounter include optimistic concurrency tokens (`Version` and `QuestLogVersion` on Realm).
- All mutation commands require the client to submit the last-known token for the targeted aggregate.
- If a concurrency conflict is detected, the server returns:
  - `errorCode: STALE_STATE`
  - message: “Your realm view is out of date. Refreshing prophecy…”
  - `realmCode` and `serverNow`
- On stale errors, the server immediately sends a fresh `RealmStateUpdated` snapshot to the caller so the UI can resync.

## Snapshot secrecy guarantees
- Before reveal, vote values are never included in snapshots. Only `hasVoted` flags are sent per member.
- `shouldHideVoteCounts` is included to prevent clients from deriving “X of Y” vote counts when hidden.
- After reveal, snapshots include full votes, distribution, and sealed outcomes when present.
