# PointRealm Realtime Client

This folder provides a realm-scoped SignalR client wrapper that integrates with the Zustand store and UI theme.

## Usage

```ts
import { createRealmClient } from '@/realtime';

const client = createRealmClient();
await client.connect({
  realmCode,
  memberToken,
  clientId,
});

client.on('realmStateUpdated', (snapshot) => {
  // Apply to store or render directly
});

await client.selectRune('5');
```

## App Integration

- `RealtimeProvider` wires the client into the app store and ToastSystem.
- `useRealm` connects to the current realm and exposes typed actions.
- `ConnectionStatusBanner` provides the themed reconnect banner.

## Notes

- The client is realm-scoped and idempotent; repeated `connect()` calls do not duplicate handlers.
- Reconnect triggers a resync by invoking `RequestFullSnapshot()` (or falls back to `JoinRealm`).
- Token refresh uses the realm join REST endpoint; tokens are stored in `sessionStorage`.
