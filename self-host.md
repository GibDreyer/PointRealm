# Self-hosting PointRealm

This guide walks through running PointRealm with Docker, including the optional Cloudflare Tunnel.

## Prerequisites

- Docker Desktop or Docker Engine + Docker Compose v2.

## Build and run

1. From the repo root, build and start the service:

   ```bash
   docker compose up --build
   ```

2. Open the application at:

   ```
   http://localhost:8080
   ```

The server serves the client build from `wwwroot`, and the database lives in the `./data` directory.

## Optional: Cloudflare Tunnel

If you want to expose PointRealm via Cloudflare Tunnel:

1. Create a tunnel and copy its token from Cloudflare.
2. Start the tunnel service with the profile enabled:

   ```bash
   CLOUDFLARED_TUNNEL_TOKEN=your-token-here docker compose --profile cloudflared up --build
   ```

The tunnel container depends on the `pointrealm` service and will start automatically with the profile.

For hardening guidance (DNS setup, origin access restrictions, and Access policies), see
[`ops/self-host.md`](ops/self-host.md).

## Configuration notes

- `POINTREALM_DB_PATH` defaults to `/app/data` in `docker-compose.yml` and is mounted from `./data`.
- Change the host port by editing the `ports` mapping in `docker-compose.yml`.
