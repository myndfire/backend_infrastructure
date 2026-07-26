# Redis (Messaging)

Redis 7 (Alpine) for lightweight messaging and task brokering.

## Prerequisites

- Docker
- Docker Compose v2

## Setup

Start the service:

```bash
docker compose up -d
```

## Verification

Check service status:

```bash
docker compose ps
```

Ping Redis:

```bash
redis-cli ping
```

Expected output:

```
PONG
```

## Usage

| Item | Value |
|------|-------|
| Host | `localhost` |
| Port | `6379` |
| Persistence | AOF (`appendonly yes`) |
| Volume | `redismq_data` |

Connect with `redis-cli`:

```bash
redis-cli -p 6379
```

## Configuration

No environment variables are required. Edit `docker-compose.yml` directly if you need to change command flags (e.g., add `requirepass` or tune maxmemory policy).

## How This Differs from `caching/redis`

Both directories run Redis 7 Alpine, but they use **different Docker volumes** so they do not collide:

| Directory | Volume Name | Purpose |
|-----------|-------------|---------|
| `caching/redis` | `redis_cache_data` | Application caching |
| `messaging/redis` | `redismq_data` | Messaging / task broker |

You can run both simultaneously if your architecture needs separate cache and message stores.

## Security Notes

> ⚠️ **No authentication is enabled by default**, and the port is bound to `0.0.0.0:6379`. This is acceptable for local development on a trusted machine only.
>
> Before exposing Redis to any network:
> - Set `requirepass` or enable Redis ACLs.
> - Bind to `127.0.0.1` instead of `0.0.0.0`.
> - Consider using a TLS tunnel for remote access.

## Stop and Remove Data

```bash
docker compose down
```

Wipe the volume:

```bash
docker compose down -v
```
