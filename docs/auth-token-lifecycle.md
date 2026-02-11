# Auth Token Lifecycle (Phase 1 Hardening)

## Access token lifetime

- User access tokens are short-lived JWTs (default: **30 minutes**).
- The server returns `accessToken` and `expiresAt` for every login/register/refresh response.

## Client storage model

- Auth data is stored as an auth session envelope: `{ token, expiresAt, persist }`.
- `remember me = false` stores auth state in `sessionStorage`.
- `remember me = true` stores auth state in `localStorage`.
- Expired sessions are removed automatically before token reuse.

## Refresh behavior

- Client schedules proactive refresh ~2 minutes before expiration.
- Client may also refresh immediately on startup if token is close to expiration.
- Refresh endpoint: `POST /api/v1/auth/refresh`.
- Refresh accepts either Identity cookie auth or Bearer auth.

## Revocation/refresh failure UX

- If refresh or authenticated profile calls return `401`, client clears auth state.
- Login page displays explicit notice (e.g., session expired/revoked) and prompts re-authentication.

## SignalR query token handling

- SignalR access tokens in query are accepted **only** for `/hubs/realm`.
- Query-token path is restricted to WebSocket/SSE transport negotiation.
- Header-based bearer auth takes precedence if present.

