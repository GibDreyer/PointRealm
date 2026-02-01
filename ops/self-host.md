# Self-hosting hardening notes

This document captures Cloudflare Tunnel hardening guidance for PointRealm deployments.

## Run `cloudflared` tunnel

Use a named tunnel so you can manage DNS and Access policies in the Cloudflare dashboard.

```bash
cloudflared tunnel login
cloudflared tunnel create pointrealm
```

Create a local config (avoid committing credentials):

```yaml
# /etc/cloudflared/config.yml
# Do not commit the tunnel credentials JSON or store secrets in git.

tunnel: pointrealm
credentials-file: /etc/cloudflared/pointrealm.json

ingress:
  - hostname: pointrealm.example.com
    service: http://localhost:8080
  - service: http_status:404
```

Start the tunnel:

```bash
cloudflared tunnel run pointrealm
```

When running with Docker, bind the application to localhost only and run `cloudflared` on the same host so it can reach the local service.

## Configure DNS

Point the hostname to the tunnel in Cloudflare. A typical setup uses a CNAME target managed by the tunnel:

```bash
cloudflared tunnel route dns pointrealm pointrealm.example.com
```

Confirm in the Cloudflare dashboard that the DNS record is proxied (orange cloud).

## Restrict origin access to tunnel only

Do not expose the PointRealm port to the WAN. Instead, only allow Cloudflare Tunnel to reach the origin.

- Bind the application to localhost or a private network interface (no `0.0.0.0` public binding).
- Remove any public `ports` mapping from Docker Compose; use `127.0.0.1:8080:8080` if you need local access.
- If you must allow network access beyond localhost, restrict inbound traffic to Cloudflare IP ranges at the firewall.

Example Docker Compose excerpt (local-only binding):

```yaml
services:
  pointrealm:
    ports:
      - "127.0.0.1:8080:8080"
```

## Optional: basic auth with Cloudflare Access

You can place Cloudflare Access in front of the tunnel for an extra authentication layer.

1. Create an Access application for the hostname.
2. Add an Access policy requiring email, OTP, or an identity provider.
3. Optionally enable a service token for automated access (store secrets outside git).

Example Access policy (conceptual):

```text
Application: pointrealm.example.com
Policy: Allow
Include: Emails ending with @example.com
Session duration: 8h
```
